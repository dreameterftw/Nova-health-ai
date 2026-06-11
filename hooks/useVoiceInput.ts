import { useState, useCallback, useRef, useEffect } from "react";
import { getChatLanguage, type ChatLanguageCode } from "@/lib/chatLanguages";

/**
 * Hook for voice input using Web Speech API (Speech Recognition)
 * Converts user speech to text that can be sent as a chat message
 */
export function useVoiceInput(languageCode: ChatLanguageCode) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [isSupportedDevice, setIsSupportedDevice] = useState(false);
  const recognitionRef = useRef<any>(null);
  const interimTranscriptRef = useRef("");

  // Initialize speech recognition
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setIsSupportedDevice(false);
      return;
    }

    setIsSupportedDevice(true);
    const recognition = new SpeechRecognition();

    // Set language
    const lang = getChatLanguage(languageCode);
    const speechLang = languageCode === "auto" ? "en-IN" : lang.speechLocale;
    recognition.lang = speechLang;

    // Configuration
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    // On result
    recognition.onresult = (event: any) => {
      interimTranscriptRef.current = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;

        if (event.results[i].isFinal) {
          setTranscript((prev) => prev + transcript);
        } else {
          interimTranscriptRef.current += transcript;
        }
      }
    };

    // On error
    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      setIsListening(false);
    };

    // On end
    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, [languageCode]);

  const startListening = useCallback(() => {
    if (!recognitionRef.current || !isSupportedDevice) return;

    interimTranscriptRef.current = "";
    setTranscript("");
    setIsListening(true);

    try {
      recognitionRef.current.start();
    } catch (e) {
      // Already listening
      setIsListening(true);
    }
  }, [isSupportedDevice]);

  const stopListening = useCallback(() => {
    if (!recognitionRef.current) return;
    recognitionRef.current.abort();
    setIsListening(false);
  }, []);

  const getFullTranscript = useCallback(() => {
    return transcript + interimTranscriptRef.current;
  }, [transcript]);

  const resetTranscript = useCallback(() => {
    setTranscript("");
    interimTranscriptRef.current = "";
  }, []);

  return {
    isListening,
    transcript,
    getFullTranscript,
    resetTranscript,
    startListening,
    stopListening,
    isSupportedDevice,
    interimTranscript: interimTranscriptRef.current,
  };
}
