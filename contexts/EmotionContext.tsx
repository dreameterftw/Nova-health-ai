"use client";

import React, { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";

export type EmotionState = {
  stress: number;
  sadness: number;
  fatigue: number;
  joy: number;
  dominant: string;
  capturedAt?: Date;
  isCritical?: boolean;
};

interface EmotionContextType {
  emotion: EmotionState | null;
  history: EmotionState[];
  isCapturing: boolean;
  setIsCapturing: (val: boolean) => void;
  updateEmotion: (dominant: string | null, confidence: number) => void;
  clearEmotion: () => void;
  getLatestEmotion: () => EmotionState | null;
}

const EmotionContext = createContext<EmotionContextType | null>(null);

export function EmotionProvider({ children }: { children: ReactNode }) {
  const [emotion, setEmotion] = useState<EmotionState | null>(null);
  const [history, setHistory] = useState<EmotionState[]>([]);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  // Load from storage
  useEffect(() => {
    const savedEmotion = localStorage.getItem("nova_last_emotion");
    const savedHistory = localStorage.getItem("nova_emotion_history");
    
    if (savedEmotion) {
      try {
        const parsed = JSON.parse(savedEmotion);
        if (parsed && typeof parsed === "object") {
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setEmotion({ 
            ...parsed, 
            capturedAt: parsed.capturedAt ? new Date(parsed.capturedAt) : undefined 
          });
        }
      } catch (e) { 
        if (process.env.NODE_ENV === 'development') {
          console.error("Error parsing emotion state:", e);
        }
      }
    }
    if (savedHistory) {
      try {
        const parsed = JSON.parse(savedHistory);
        if (Array.isArray(parsed)) {
          setHistory(parsed.map((e: any) => {
            if (!e) return null;
            return { ...e, capturedAt: e.capturedAt ? new Date(e.capturedAt) : new Date() };
          }).filter(Boolean));
        }
      } catch (e) { 
        if (process.env.NODE_ENV === 'development') {
          console.error("Error parsing emotion history:", e);
        }
      }
    }
    setIsHydrated(true);
  }, []);

  // Save to storage
  useEffect(() => {
    if (isHydrated) {
      localStorage.setItem("nova_last_emotion", JSON.stringify(emotion));
      localStorage.setItem("nova_emotion_history", JSON.stringify(history));
    }
  }, [emotion, history, isHydrated]);

  const updateEmotion = useCallback((dominant: string | null, confidence: number) => {
    // Handle null emotion
    if (!dominant) return;
    
    // Map raw emotions to app state
    const normalizedConf = confidence / 100;
    
    const newState: EmotionState = {
      dominant,
      joy: dominant === 'happy' || dominant === 'surprised' ? normalizedConf : normalizedConf * 0.2,
      stress: dominant === 'angry' || dominant === 'fearful' ? normalizedConf : normalizedConf * 0.1,
      sadness: dominant === 'sad' || dominant === 'disgusted' ? normalizedConf : normalizedConf * 0.1,
      fatigue: dominant === 'neutral' ? normalizedConf * 0.4 : normalizedConf * 0.2,
      capturedAt: new Date(),
      isCritical: (dominant === 'angry' || dominant === 'sad' || dominant === 'fearful') && confidence > 85
    };

    setEmotion(newState);
    setHistory((prev) => [...prev.slice(-19), newState]); // Keep last 20
  }, []);

  const clearEmotion = useCallback(() => setEmotion(null), []);
  const getLatestEmotion = useCallback(() => emotion, [emotion]);

  return (
    <EmotionContext.Provider value={{ emotion, history, isCapturing, setIsCapturing, updateEmotion, clearEmotion, getLatestEmotion }}>
      {children}
    </EmotionContext.Provider>
  );
}

export function useEmotion() {
  const ctx = useContext(EmotionContext);
  if (!ctx) throw new Error("useEmotion must be used within EmotionProvider");
  return ctx;
}
