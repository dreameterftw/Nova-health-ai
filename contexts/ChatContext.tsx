"use client";

import React, {
  createContext, useContext, useState, useCallback,
  useEffect, useRef, type ReactNode,
} from "react";
import { useAuth } from "./AuthContext";
import type { EmotionState } from "./EmotionContext";
import { fetchUserActivityData, fetchMedicationSchedules, fetchMedicationLogs } from "@/lib/activityStore";
import {
  buildUserActivityContext, buildWelcomeMessage,
  type UserActivityContext,
} from "@/lib/userContext";
import { DEFAULT_CHAT_LANGUAGE, type ChatLanguageCode } from "@/lib/chatLanguages";
import {
  fetchHealthMemory, saveHealthMemory,
  buildHealthMemoryFromActivity, type HealthMemoryGraph,
} from "@/lib/healthMemory";

export type MessageRole = "user" | "assistant";

export type Message = {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: Date;
  emotion?: string;
  feedback?: 1 | -1;
};

export type CrisisSeverity = "low" | "moderate" | "high" | "critical";

export interface CrisisAlert {
  id: string;
  messageContent: string;
  keywords: string[];
  severity: CrisisSeverity;
  timestamp: Date;
  acknowledged: boolean;
}

export type EarlyWarningState = {
  level: "none" | "yellow" | "orange" | "red";
  reasons: string[];
  updatedAt: string;
};

interface ChatContextType {
  messages: Message[];
  isTyping: boolean;
  crisisAlert: CrisisAlert | null;
  earlyWarning: EarlyWarningState | null;
  chatLanguage: ChatLanguageCode;
  setChatLanguage: (code: ChatLanguageCode) => void;
  sendMessage: (content: string, emotion?: EmotionState | null) => Promise<void>;
  clearChat: () => void;
  submitFeedback: (messageId: string, feedback: 1 | -1) => void;
  dismissCrisis: () => void;
  uploadDocument: (file: File, metadata?: Record<string, string>) => Promise<void>;
  refreshUserContext: () => Promise<void>;
  healthMemory: HealthMemoryGraph | null;
}

const ChatContext = createContext<ChatContextType | null>(null);
const CHAT_HISTORY_PREFIX = "nova_chat_history";
const CHAT_LANGUAGE_KEY = "nova_chat_language";

// ── Crisis detection — user messages only ─────────────────────────────────────
const CRISIS_KEYWORDS: Record<CrisisSeverity, string[]> = {
  critical: ["suicide", "kill myself", "end my life", "want to die", "take my life", "end it all"],
  high: ["self harm", "hurt myself", "hopeless", "no reason to live", "better off dead", "can't go on"],
  moderate: ["depressed", "worthless", "nobody cares", "give up", "feel like a burden", "no hope"],
  low: ["feeling down", "really sad", "struggling a lot", "completely overwhelmed", "not okay"],
};

const NEGATIONS = ["not ", "never ", "no ", "don't ", "dont "];

function detectCrisis(text: string): { severity: CrisisSeverity; keywords: string[] } | null {
  const lower = text.toLowerCase();
  for (const [level, words] of Object.entries(CRISIS_KEYWORDS)) {
    const found = words.filter(w => {
      if (!lower.includes(w)) return false;
      return !NEGATIONS.some(neg => lower.includes(neg + w));
    });
    if (found.length > 0) return { severity: level as CrisisSeverity, keywords: found };
  }
  return null;
}

function createWelcomeMessage(content: string): Message {
  return { id: "welcome", role: "assistant", content, timestamp: new Date() };
}

function countUserExchanges(msgs: Message[]): number {
  return msgs.filter(m => m.role === "user" && m.id !== "welcome").length;
}

function getChatStorageKey(userId?: string) {
  return userId ? `${CHAT_HISTORY_PREFIX}:${userId}` : CHAT_HISTORY_PREFIX;
}

function loadLocalMessages(userId?: string): Message[] | null {
  try {
    const saved = localStorage.getItem(getChatStorageKey(userId));
    if (!saved) return null;
    const parsed = JSON.parse(saved);
    return parsed.map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) }));
  } catch { return null; }
}

function saveLocalMessages(messages: Message[], userId?: string) {
  try {
    localStorage.setItem(getChatStorageKey(userId), JSON.stringify(messages));
  } catch { }
}

// ADDED — strip undefined fields for Firestore
function cleanForFirestore(obj: Record<string, any>): Record<string, any> {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined));
}

// ADDED — build history slice, always excluding welcome and capping at 20
function buildHistorySlice(messages: Message[]) {
  return messages
    .filter(m => m.id !== "welcome" && m.role !== undefined)
    .slice(-20)
    .map(m => ({ role: m.role, content: m.content }));
}

export function ChatProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [crisisAlert, setCrisisAlert] = useState<CrisisAlert | null>(null);
  const [earlyWarning, setEarlyWarning] = useState<EarlyWarningState | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const [userContext, setUserContext] = useState<UserActivityContext | null>(null);
  const [chatLanguage, setChatLanguageState] = useState<ChatLanguageCode>(DEFAULT_CHAT_LANGUAGE);
  const [healthMemory, setHealthMemory] = useState<HealthMemoryGraph | null>(null);
  const welcomeBuiltRef = useRef(false);
  // ADDED — rate-limit guard
  const sendingRef = useRef(false);
  // ADDED — track last activity data hash to avoid redundant memory rebuilds
  const lastActivityHashRef = useRef<string>("");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(CHAT_LANGUAGE_KEY) as ChatLanguageCode | null;
      if (saved) setChatLanguageState(saved);
    } catch { }
  }, []);

  const setChatLanguage = useCallback((code: ChatLanguageCode) => {
    setChatLanguageState(code);
    try { localStorage.setItem(CHAT_LANGUAGE_KEY, code); } catch { }
  }, []);

  // ADDED — load medication context alongside other activity data
  const loadFullActivityContext = useCallback(async (userId: string, messageCount: number) => {
    const [data, schedules, medLogs] = await Promise.all([
      fetchUserActivityData(userId),
      fetchMedicationSchedules(userId).catch(() => []),
      fetchMedicationLogs(userId, 30).catch(() => []),
    ]);

    const ctx = buildUserActivityContext(user, {
      messageCount,
      moodLogs: data.moodLogs,
      journalEntries: data.journalEntries,
      vaultSummaries: data.vaultSummaries,
      healthPulseLogs: data.healthPulseLogs,
      medicationSchedules: schedules,
      medicationLogs: medLogs,
    });

    // ADDED — simple hash to skip redundant memory rebuilds
    const hash = JSON.stringify({
      moods: data.moodLogs.slice(0, 3).map(m => m.date + m.score),
      pulses: data.healthPulseLogs.slice(0, 3).map(p => p.date + p.wellnessScore),
    });

    return { data, ctx, hash };
  }, [user]);

  // Load user activity context on mount
  useEffect(() => {
    if (!user?.id) {
      setUserContext(null);
      setHealthMemory(null);
      return;
    }
    let cancelled = false;

    loadFullActivityContext(user.id, 0).then(async ({ data, ctx, hash }) => {
      if (cancelled) return;
      setUserContext(ctx);

      if (hash !== lastActivityHashRef.current) {
        lastActivityHashRef.current = hash;
        const existingMemory = await fetchHealthMemory(user.id);
        if (cancelled) return;
        const updatedMemory = buildHealthMemoryFromActivity(existingMemory, {
          moodLogs: data.moodLogs,
          pulseLogs: data.healthPulseLogs,
          vaultSummaries: data.vaultSummaries,
          userMedications: user.medications,
        });
        setHealthMemory(updatedMemory);
        saveHealthMemory(updatedMemory).catch(() => { });
      }
    });

    return () => { cancelled = true; };
  }, [user?.id]);

  // Early warning on mount
  useEffect(() => {
    if (!user?.id) { setEarlyWarning(null); return; }
    let cancelled = false;
    (async () => {
      try {
        const { auth } = await import("@/lib/firebase");
        const token = await auth.currentUser?.getIdToken();
        if (!token) return;
        const res = await fetch("/api/early-warning", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok || cancelled) return;
        const json = await res.json();
        if (!cancelled) setEarlyWarning(json.earlyWarning ?? null);
      } catch { }
    })();
    return () => { cancelled = true; };
  }, [user?.id]);

  const buildWelcome = useCallback(
    (historyCount: number, language: ChatLanguageCode = chatLanguage) => {
      const ctx = userContext
        ? { ...userContext, messageCount: historyCount, isReturning: historyCount > 0 }
        : buildUserActivityContext(user, { messageCount: historyCount });
      return createWelcomeMessage(buildWelcomeMessage(user?.name, ctx, language));
    },
    [user, userContext, chatLanguage]
  );

  // Initial load and Firestore listener
  useEffect(() => {
    let unsubscribe: () => void = () => { };
    welcomeBuiltRef.current = false;

    const applyWelcome = (history: Message[]) => {
      if (history.length > 0) {
        setMessages(history);
        setUserContext(prev =>
          prev
            ? { ...prev, messageCount: countUserExchanges(history), isReturning: countUserExchanges(history) > 0 }
            : prev
        );
      } else if (!welcomeBuiltRef.current) {
        welcomeBuiltRef.current = true;
        setMessages([buildWelcome(0)]);
      }
      setIsHydrated(true);
    };

    const setupConversation = async () => {
      if (user?.isAuthenticated && user?.id) {
        try {
          const { collection, query, orderBy, onSnapshot } = await import("firebase/firestore");
          const { db } = await import("@/lib/firebase");
          const q = query(collection(db, "users", user.id, "messages"), orderBy("timestamp", "asc"));
          unsubscribe = onSnapshot(q, snapshot => {
            const history = snapshot.docs.map(doc => ({
              ...doc.data(), id: doc.id,
              timestamp: doc.data().timestamp?.toDate() || new Date(),
            })) as Message[];
            applyWelcome(history);
          }, () => {
            applyWelcome(loadLocalMessages(user.id) ?? []);
          });
        } catch {
          applyWelcome(loadLocalMessages(user.id) ?? []);
        }
      } else {
        applyWelcome(loadLocalMessages() ?? []);
      }
    };

    setupConversation();
    return () => unsubscribe();
  }, [user?.id, user?.isAuthenticated, buildWelcome]);

  // Re-personalise welcome when context or language changes (empty chats only)
  useEffect(() => {
    if (!userContext || !isHydrated) return;
    setMessages(prev => prev.some(m => m.role === "user") ? prev : [buildWelcome(0)]);
  }, [userContext, isHydrated, buildWelcome]);

  useEffect(() => {
    if (!isHydrated) return;
    setMessages(prev => prev.some(m => m.role === "user") ? prev : [buildWelcome(0, chatLanguage)]);
  }, [chatLanguage, isHydrated, buildWelcome]);

  // Persist messages locally
  useEffect(() => {
    if (!isHydrated || messages.length === 0) return;
    saveLocalMessages(messages, user?.id);
  }, [messages, isHydrated, user?.id]);

  const refreshUserContext = useCallback(async () => {
    if (!user?.id) return;
    try {
      const { data, ctx, hash } = await loadFullActivityContext(user.id, countUserExchanges(messages));
      setUserContext(ctx);

      // ADDED — skip memory rebuild if data hasn't changed
      if (hash !== lastActivityHashRef.current) {
        lastActivityHashRef.current = hash;
        const existingMemory = await fetchHealthMemory(user.id);
        const updatedMemory = buildHealthMemoryFromActivity(existingMemory, {
          moodLogs: data.moodLogs,
          pulseLogs: data.healthPulseLogs,
          vaultSummaries: data.vaultSummaries,
          userMedications: user.medications,
        });
        setHealthMemory(updatedMemory);
        saveHealthMemory(updatedMemory).catch(() => { });
      }

      const { auth } = await import("@/lib/firebase");
      const token = await auth.currentUser?.getIdToken();
      if (token) {
        const res = await fetch("/api/early-warning", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const json = await res.json();
          setEarlyWarning(json.earlyWarning ?? null);
        }
      }
    } catch { }
  }, [user, messages, loadFullActivityContext]);

  const sendMessage = useCallback(async (content: string, emotion?: EmotionState | null) => {
    // ADDED — rate limit: ignore if already sending
    if (sendingRef.current || isTyping) return;
    sendingRef.current = true;

    const userMsgId = `msg-${Date.now()}`;
    const userMsg: Message = {
      id: userMsgId,
      role: "user",
      content,
      timestamp: new Date(),
      emotion: emotion?.dominant,
    };

    setMessages(prev => [...prev, userMsg]);
    setIsTyping(true);

    // ADDED — crisis detection on user messages only (not NOVA responses)
    const crisis = detectCrisis(content);
    if (crisis) {
      setCrisisAlert({
        id: Date.now().toString(),
        messageContent: content,
        keywords: crisis.keywords,
        severity: crisis.severity,
        timestamp: new Date(),
        acknowledged: false,
      });
    }

    const novaMsgId = `nova-${Date.now()}`;

    try {
      const { auth } = await import("@/lib/firebase");
      const authToken = await auth.currentUser?.getIdToken();

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/x-ndjson",
          // ADDED — token only in header, not duplicated in body
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
        body: JSON.stringify({
          messages: [
            // ADDED — use helper that always excludes welcome and caps at 20
            ...buildHistorySlice(messages),
            { role: "user", content },
          ],
          currentEmotion: emotion,
          userProfile: { name: user?.name },
          userContext: userContext
            ? { ...userContext, messageCount: countUserExchanges(messages), isReturning: countUserExchanges(messages) > 0 }
            : undefined,
          exchangeCount: countUserExchanges(messages),
          language: chatLanguage,
          healthMemory: healthMemory ?? undefined,
          // ADDED — authToken removed from body
        }),
      });

      if (!response.ok) throw new Error("NOVA returned an unexpected response.");

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullResponse = "";
      let pending = "";

      // Place empty bubble immediately
      setMessages(prev => [...prev, {
        id: novaMsgId, role: "assistant", content: "", timestamp: new Date(),
      }]);

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          pending += decoder.decode(value, { stream: true });
          const lines = pending.split("\n");
          pending = lines.pop() || "";
          for (const line of lines) {
            if (!line.trim()) continue;
            try {
              const json = JSON.parse(line);
              if (json.message?.content) {
                fullResponse += json.message.content;
                setMessages(prev =>
                  prev.map(m => m.id === novaMsgId ? { ...m, content: fullResponse } : m)
                );
              }
            } catch { }
          }
        }
        // Flush remaining
        if (pending.trim()) {
          try {
            const json = JSON.parse(pending);
            if (json.message?.content) {
              fullResponse += json.message.content;
            }
          } catch { }
        }
      }

      // ADDED — clean up empty bubble if stream produced nothing
      if (!fullResponse) {
        setMessages(prev => prev.filter(m => m.id !== novaMsgId));
        setMessages(prev => [...prev, {
          id: novaMsgId,
          role: "assistant",
          content: "I'm processing that. One moment…",
          timestamp: new Date(),
        }]);
      } else {
        setMessages(prev =>
          prev.map(m => m.id === novaMsgId ? { ...m, content: fullResponse } : m)
        );
      }

      const novaMsg: Message = {
        id: novaMsgId,
        role: "assistant",
        content: fullResponse || "I'm processing that. One moment…",
        timestamp: new Date(),
      };

      // Firestore sync
      if (user?.isAuthenticated) {
        try {
          const { collection, addDoc, serverTimestamp } = await import("firebase/firestore");
          const { db } = await import("@/lib/firebase");
          const chatRef = collection(db, "users", user.id, "messages");
          await Promise.all([
            addDoc(chatRef, cleanForFirestore({ ...userMsg, timestamp: serverTimestamp() })),
            addDoc(chatRef, cleanForFirestore({ ...novaMsg, timestamp: serverTimestamp() })),
          ]);
        } catch {
          saveLocalMessages([...messages, userMsg, novaMsg], user.id);
        }
      }
    } catch {
      // ADDED — remove the empty bubble on error before adding error message
      setMessages(prev => [
        ...prev.filter(m => m.id !== novaMsgId),
        {
          id: `nova-err-${Date.now()}`,
          role: "assistant",
          content: "I could not complete that response just now. Please try again in a moment.",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsTyping(false);
      // ADDED — release rate limit
      sendingRef.current = false;
    }
  }, [messages, user, userContext, chatLanguage, healthMemory, isTyping]);

  // ADDED — submitFeedback persists to Firestore
  const submitFeedback = useCallback((messageId: string, feedback: 1 | -1) => {
    setMessages(prev => prev.map(m => m.id === messageId ? { ...m, feedback } : m));

    if (!user?.isAuthenticated || !user?.id) return;
    (async () => {
      try {
        const { doc, updateDoc } = await import("firebase/firestore");
        const { db } = await import("@/lib/firebase");
        await updateDoc(doc(db, "users", user.id, "messages", messageId), { feedback });
      } catch { }
    })();
  }, [user]);

  // ADDED — clearChat awaits all deletes properly
  const clearChat = useCallback(async () => {
    if (user?.isAuthenticated && user?.id) {
      try {
        const { collection, getDocs, deleteDoc, doc, writeBatch } = await import("firebase/firestore");
        const { db } = await import("@/lib/firebase");
        const snapshot = await getDocs(collection(db, "users", user.id, "messages"));
        if (snapshot.docs.length > 0) {
          const batch = writeBatch(db);
          snapshot.docs.forEach(d => batch.delete(doc(db, "users", user.id, "messages", d.id)));
          await batch.commit();
        }
      } catch { }
    }
    setMessages([buildWelcome(0)]);
    welcomeBuiltRef.current = true;
    setCrisisAlert(null);
    try { localStorage.removeItem(getChatStorageKey(user?.id)); } catch { }
  }, [user, buildWelcome]);

  const dismissCrisis = useCallback(() => {
    setCrisisAlert(prev => prev ? { ...prev, acknowledged: true } : null);
  }, []);

  const uploadDocument = useCallback(async (file: File, metadata?: Record<string, string>) => {
    setIsTyping(true);
    try {
      const { auth } = await import("@/lib/firebase");
      const firebaseUser = auth.currentUser;
      if (!firebaseUser) throw new Error("Please sign in before uploading documents.");

      const token = await firebaseUser.getIdToken();
      const formData = new FormData();
      formData.append("file", file);
      formData.append("fileName", file.name);
      formData.append("type", metadata?.type || "medical-document");

      const res = await fetch("/api/vault/upload", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!res.ok) throw new Error(await res.text());
      const uploaded = await res.json();
      if (uploaded.error) throw new Error(uploaded.error);

      const findings = Array.isArray(uploaded.result?.findings)
        ? uploaded.result.findings.map((f: string) => `- ${f}`).join("\n")
        : "- No specific findings returned.";
      const recommendations = Array.isArray(uploaded.result?.recommendations)
        ? uploaded.result.recommendations.map((r: string) => `- ${r}`).join("\n")
        : "- Review with your clinician.";

      setMessages(prev => [...prev, {
        id: `doc-${Date.now()}`,
        role: "assistant",
        content: `I uploaded **${file.name}** to your secure vault and ran NOVA's medical document analysis.\n\n**${uploaded.result?.type || "Clinical Document Review"}** (${uploaded.result?.riskLevel || "low"} risk)\n\nFindings:\n${findings}\n\nRecommendations:\n${recommendations}`,
        timestamp: new Date(),
      }]);
    } catch (error) {
      setMessages(prev => [...prev, {
        id: `doc-err-${Date.now()}`,
        role: "assistant",
        content: `I couldn't upload or analyze **${file.name}**.\n\nError: ${error instanceof Error ? error.message : "Unknown error"}`,
        timestamp: new Date(),
      }]);
    } finally {
      setIsTyping(false);
    }
  }, []);

  if (!isHydrated) return null;

  return (
    <ChatContext.Provider value={{
      messages, isTyping, crisisAlert, earlyWarning,
      chatLanguage, setChatLanguage,
      sendMessage, clearChat, submitFeedback, dismissCrisis,
      uploadDocument, refreshUserContext, healthMemory,
    }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error("useChat must be used within ChatProvider");
  return ctx;
}