"use client";

import React, { createContext, useContext, useState, useCallback, useEffect, useRef, type ReactNode } from "react";
import { useAuth } from "./AuthContext";
import type { EmotionState } from "./EmotionContext";
import { fetchUserActivityData } from "@/lib/activityStore";
import {
  buildUserActivityContext,
  buildWelcomeMessage,
  type UserActivityContext,
} from "@/lib/userContext";
import {
  DEFAULT_CHAT_LANGUAGE,
  type ChatLanguageCode,
} from "@/lib/chatLanguages";

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

interface ChatContextType {
  messages: Message[];
  isTyping: boolean;
  crisisAlert: CrisisAlert | null;
  chatLanguage: ChatLanguageCode;
  setChatLanguage: (code: ChatLanguageCode) => void;
  sendMessage: (content: string, emotion?: EmotionState | null) => Promise<void>;
  clearChat: () => void;
  submitFeedback: (messageId: string, feedback: 1 | -1) => void;
  dismissCrisis: () => void;
  uploadDocument: (file: File, metadata?: Record<string, string>) => Promise<void>;
}

const ChatContext = createContext<ChatContextType | null>(null);
const CHAT_HISTORY_PREFIX = "nova_chat_history";
const CHAT_LANGUAGE_KEY = "nova_chat_language";

// ── Crisis detection (Client-side for instant safety) ──────────────────────────
const CRISIS_KEYWORDS: Record<CrisisSeverity, string[]> = {
  critical: ["suicide", "kill myself", "end my life", "want to die", "take my life", "end it all"],
  high:     ["self harm", "hurt myself", "hopeless", "no reason to live", "better off dead", "can't go on"],
  moderate: ["depressed", "worthless", "nobody cares", "give up", "feel like a burden", "no hope"],
  low:      ["feeling down", "really sad", "struggling a lot", "completely overwhelmed", "not okay"],
};

function detectCrisis(text: string): { severity: CrisisSeverity; keywords: string[] } | null {
  const lower = text.toLowerCase();
  
  // Simple negation filter to prevent false positives like "I am not feeling hopeless" 
  // though we still want to be cautious.
  const negations = ["not ", "never ", "no ", "don't ", "dont "];
  
  for (const [level, words] of Object.entries(CRISIS_KEYWORDS)) {
    const found = words.filter((w) => {
      // Check if word exists in text
      if (!lower.includes(w)) return false;
      
      // Check if it's immediately preceded by a negation
      const hasNegation = negations.some(neg => lower.includes(neg + w));
      if (hasNegation) return false;

      return true;
    });
    if (found.length > 0) return { severity: level as CrisisSeverity, keywords: found };
  }
  return null;
}

function createWelcomeMessage(content: string): Message {
  return {
    id: "welcome",
    role: "assistant",
    content,
    timestamp: new Date(),
  };
}

function countUserExchanges(msgs: Message[]): number {
  return msgs.filter((m) => m.role === "user" && m.id !== "welcome").length;
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
  } catch {
    return null;
  }
}

function saveLocalMessages(messages: Message[], userId?: string) {
  try {
    localStorage.setItem(getChatStorageKey(userId), JSON.stringify(messages));
  } catch {
    // Best-effort local backup only.
  }
}

export function ChatProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [crisisAlert, setCrisisAlert] = useState<CrisisAlert | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const [userContext, setUserContext] = useState<UserActivityContext | null>(null);
  const [chatLanguage, setChatLanguageState] = useState<ChatLanguageCode>(DEFAULT_CHAT_LANGUAGE);
  const welcomeBuiltRef = useRef(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(CHAT_LANGUAGE_KEY) as ChatLanguageCode | null;
      if (saved) setChatLanguageState(saved);
    } catch {
      // ignore
    }
  }, []);

  const setChatLanguage = useCallback((code: ChatLanguageCode) => {
    setChatLanguageState(code);
    try {
      localStorage.setItem(CHAT_LANGUAGE_KEY, code);
    } catch {
      // ignore
    }
  }, []);

  // Load user activity context (mood, journals, vault) for awareness
  useEffect(() => {
    if (!user?.id) {
      setUserContext(null);
      return;
    }

    let cancelled = false;
    fetchUserActivityData(user.id).then((data) => {
      if (cancelled) return;
      setUserContext(
        buildUserActivityContext(user, {
          messageCount: 0,
          ...data,
        })
      );
    });

    return () => {
      cancelled = true;
    };
  }, [user]);

  const buildWelcome = useCallback(
    (historyCount: number, language: ChatLanguageCode = chatLanguage) => {
      const ctx = userContext
        ? { ...userContext, messageCount: historyCount, isReturning: historyCount > 0 }
        : buildUserActivityContext(user, { messageCount: historyCount });
      return createWelcomeMessage(buildWelcomeMessage(user?.name, ctx, language));
    },
    [user, userContext, chatLanguage]
  );

  // 1. Initial Load & Real-time Subscription (Firestore OR LocalStorage)
  useEffect(() => {
    let unsubscribe: () => void = () => {};
    welcomeBuiltRef.current = false;

    const applyWelcome = (history: Message[]) => {
      if (history.length > 0) {
        setMessages(history);
        setUserContext((prev) =>
          prev
            ? {
                ...prev,
                messageCount: countUserExchanges(history),
                isReturning: countUserExchanges(history) > 0,
              }
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

          const q = query(
            collection(db, "users", user.id, "messages"),
            orderBy("timestamp", "asc")
          );

          unsubscribe = onSnapshot(q, (snapshot) => {
            const history = snapshot.docs.map(doc => ({
              ...doc.data(),
              id: doc.id,
              timestamp: doc.data().timestamp?.toDate() || new Date()
            })) as Message[];

            applyWelcome(history);
          }, () => {
            const localMessages = loadLocalMessages(user.id);
            applyWelcome(localMessages?.length ? localMessages : []);
          });
        } catch {
          const localMessages = loadLocalMessages(user.id);
          applyWelcome(localMessages?.length ? localMessages : []);
        }
      } else {
        const localMessages = loadLocalMessages();
        applyWelcome(localMessages?.length ? localMessages : []);
      }
    };

    setupConversation();
    return () => unsubscribe();
  }, [user?.id, user?.isAuthenticated, buildWelcome]);

  // Personalize welcome once activity context loads (empty chats only)
  useEffect(() => {
    if (!userContext || !isHydrated) return;
    setMessages((prev) => {
      if (prev.some((m) => m.role === "user")) return prev;
      return [buildWelcome(0)];
    });
  }, [userContext, isHydrated, buildWelcome]);

  // Rebuild welcome when language changes (empty chats only)
  useEffect(() => {
    if (!isHydrated) return;
    setMessages((prev) => {
      if (prev.some((m) => m.role === "user")) return prev;
      return [buildWelcome(0, chatLanguage)];
    });
  }, [chatLanguage, isHydrated, buildWelcome]);

  // 2. Persistent Saving
  useEffect(() => {
    if (!isHydrated || messages.length === 0) return;

    saveLocalMessages(messages, user?.id);
  }, [messages, isHydrated, user?.id]);

  const sendMessage = useCallback(async (content: string, emotion?: EmotionState | null) => {
    const userMsgId = `msg-${Date.now()}`;
    const userMsg: Message = {
      id: userMsgId,
      role: "user",
      content,
      timestamp: new Date(),
      emotion: emotion?.dominant,
    };
    
    setMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);

    // Safety First: Instant Crisis Alert
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

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Accept": "application/x-ndjson"
        },
        body: JSON.stringify({
          messages: [
            ...messages
              .filter((m) => m.id !== "welcome")
              .slice(-20)
              .map((m) => ({ role: m.role, content: m.content })),
            { role: "user", content: content },
          ],
          currentEmotion: emotion,
          userProfile: { name: user?.name },
          userContext: userContext
            ? {
                ...userContext,
                messageCount: countUserExchanges(messages),
                isReturning: countUserExchanges(messages) > 0,
              }
            : undefined,
          exchangeCount: countUserExchanges(messages),
          language: chatLanguage,
        })
      });

      if (!response.ok) {
        throw new Error("NOVA Intelligence returned an unexpected response.");
      }

      // Handle streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullResponse = "";
      let pending = "";
      const novaMsgId = `nova-${Date.now()}`;

      setMessages((prev) => [...prev, {
        id: novaMsgId,
        role: "assistant",
        content: "",
        timestamp: new Date(),
      }]);

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          pending += decoder.decode(value, { stream: true });
          const lines = pending.split('\n');
          pending = lines.pop() || "";
          
          for (const line of lines) {
            if (!line.trim()) continue;
            try {
              const json = JSON.parse(line);
              if (json.message?.content) {
                fullResponse += json.message.content;
                setMessages((prev) => prev.map((m) => (
                  m.id === novaMsgId ? { ...m, content: fullResponse } : m
                )));
              }
            } catch (e) {
              // Skip invalid JSON lines
            }
          }
        }

        if (pending.trim()) {
          try {
            const json = JSON.parse(pending);
            if (json.message?.content) {
              fullResponse += json.message.content;
              setMessages((prev) => prev.map((m) => (
                m.id === novaMsgId ? { ...m, content: fullResponse } : m
              )));
            }
          } catch (e) {
            // Ignore trailing non-JSON fragments.
          }
        }
      }

      const responseContent = fullResponse || "I'm processing that. One moment...";
      
      const novaMsg: Message = {
        id: novaMsgId,
        role: "assistant",
        content: responseContent,
        timestamp: new Date(),
      };

      if (!fullResponse) {
        setMessages((prev) => prev.map((m) => (
          m.id === novaMsgId ? novaMsg : m
        )));
      }

      // Firestore Sync if Auth'd
      if (user?.isAuthenticated) {
        try {
          const { collection, addDoc, serverTimestamp } = await import("firebase/firestore");
          const { db } = await import("@/lib/firebase");
          const chatRef = collection(db, "users", user.id, "messages");
          
          // Remove undefined fields for Firestore
          const cleanUserMsg = Object.fromEntries(
            Object.entries({ ...userMsg, timestamp: serverTimestamp() })
              .filter(([_, v]) => v !== undefined)
          );
          const cleanNovaMsg = Object.fromEntries(
            Object.entries({ ...novaMsg, timestamp: serverTimestamp() })
              .filter(([_, v]) => v !== undefined)
          );
          
          await Promise.all([
            addDoc(chatRef, cleanUserMsg),
            addDoc(chatRef, cleanNovaMsg)
          ]);
        } catch {
          saveLocalMessages([...messages, userMsg, novaMsg], user.id);
        }
      }
    } catch (error) {
      const errorMsg: Message = {
        id: `nova-err-${Date.now()}`,
        role: "assistant",
        content: "I could not complete that response just now. Please try again in a moment.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  }, [messages, user, userContext, chatLanguage]);

  const clearChat = useCallback(async () => {
    if (user?.isAuthenticated) {
      try {
        const { collection, getDocs, deleteDoc, doc } = await import("firebase/firestore");
        const { db } = await import("@/lib/firebase");
        const chatRef = collection(db, "users", user.id, "messages");
        const snapshot = await getDocs(chatRef);
        snapshot.docs.forEach((d) => deleteDoc(doc(db, "users", user.id, "messages", d.id)));
      } catch (e) {
        // Local clear still succeeds if cloud history is temporarily unavailable.
      }
    }
    
    setMessages([buildWelcome(0)]);
    welcomeBuiltRef.current = true;
    setCrisisAlert(null);
    localStorage.removeItem(getChatStorageKey(user?.id));
  }, [user, buildWelcome]);

  const submitFeedback = useCallback((messageId: string, feedback: 1 | -1) => {
    setMessages((prev) => prev.map((m) => (m.id === messageId ? { ...m, feedback } : m)));
    // In production, sync feedback to Firestore here
  }, []);

  const dismissCrisis = useCallback(() => {
    setCrisisAlert((prev) => (prev ? { ...prev, acknowledged: true } : null));
  }, []);

  const uploadDocument = useCallback(async (file: File, metadata?: Record<string, string>) => {
    setIsTyping(true);
    try {
      const { auth } = await import("@/lib/firebase");
      const firebaseUser = auth.currentUser;

      if (!firebaseUser) {
        throw new Error("Please sign in before uploading medical documents to the vault.");
      }

      const token = await firebaseUser.getIdToken();
      const formData = new FormData();
      formData.append("file", file);
      formData.append("fileName", file.name);
      formData.append("type", metadata?.type || "medical-document");

      const response = await fetch("/api/vault/upload", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Upload failed: ${errorText}`);
      }

      const uploaded = await response.json();
      if (uploaded.error) throw new Error(uploaded.error);

      const findings = Array.isArray(uploaded.result?.findings)
        ? uploaded.result.findings.map((finding: string) => `- ${finding}`).join("\n")
        : "- No specific findings returned.";
      const recommendations = Array.isArray(uploaded.result?.recommendations)
        ? uploaded.result.recommendations.map((item: string) => `- ${item}`).join("\n")
        : "- Review the document with your clinician.";

      const notice: Message = {
        id: `doc-${Date.now()}`,
        role: "assistant",
        content: `I uploaded **${file.name}** to your secure vault and ran NOVA's medical document analysis.\n\n**${uploaded.result?.type || "Clinical Document Review"}** (${uploaded.result?.riskLevel || "low"} risk)\n\nFindings:\n${findings}\n\nRecommendations:\n${recommendations}`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, notice]);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown upload error";
      setMessages((prev) => [...prev, {
        id: `doc-err-${Date.now()}`,
        role: "assistant",
        content: `I couldn't upload or analyze **${file.name}**.\n\nError: ${message}`,
        timestamp: new Date(),
      }]);
    } finally {
      setIsTyping(false);
    }
  }, []);

  if (!isHydrated) return null;

  return (
    <ChatContext.Provider value={{ messages, isTyping, crisisAlert, chatLanguage, setChatLanguage, sendMessage, clearChat, submitFeedback, dismissCrisis, uploadDocument }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error("useChat must be used within ChatProvider");
  return ctx;
}
