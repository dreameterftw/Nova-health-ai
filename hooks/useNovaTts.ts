"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { isSpeechSupported, speakText, stopSpeech } from "@/lib/novaTts";
import type { ChatLanguageCode } from "@/lib/chatLanguages";

const TTS_ENABLED_KEY = "nova_chat_tts_enabled";

export function useNovaTts(languageCode: ChatLanguageCode) {
  const [ttsEnabled, setTtsEnabledState] = useState(false);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const supported = isSpeechSupported();
  const languageRef = useRef(languageCode);

  languageRef.current = languageCode;

  useEffect(() => {
    try {
      const saved = localStorage.getItem(TTS_ENABLED_KEY);
      if (saved === "true") setTtsEnabledState(true);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (supported && window.speechSynthesis.getVoices().length === 0) {
      const load = () => window.speechSynthesis.getVoices();
      window.speechSynthesis.addEventListener("voiceschanged", load);
      return () => window.speechSynthesis.removeEventListener("voiceschanged", load);
    }
  }, [supported]);

  const setTtsEnabled = useCallback((enabled: boolean) => {
    setTtsEnabledState(enabled);
    try {
      localStorage.setItem(TTS_ENABLED_KEY, String(enabled));
    } catch {
      // ignore
    }
    if (!enabled) {
      stopSpeech();
      setSpeakingId(null);
    }
  }, []);

  const speakMessage = useCallback((messageId: string, content: string) => {
    if (!supported || !content.trim()) return;

    if (speakingId === messageId) {
      stopSpeech();
      setSpeakingId(null);
      return;
    }

    stopSpeech();
    setSpeakingId(messageId);
    speakText(content, languageRef.current, () => setSpeakingId(null));
  }, [supported, speakingId]);

  const stopSpeaking = useCallback(() => {
    stopSpeech();
    setSpeakingId(null);
  }, []);

  return {
    supported,
    ttsEnabled,
    setTtsEnabled,
    speakingId,
    speakMessage,
    stopSpeaking,
  };
}
