"use client";

import { getChatLanguage, type ChatLanguageCode } from "@/lib/chatLanguages";

/** Strip markdown and emoji-heavy text for natural speech */
export function textForSpeech(markdown: string): string {
  return markdown
    .replace(/```[\s\S]*?```/g, "")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/^#+\s+/gm, "")
    .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, "")
    .replace(/\n{2,}/g, ". ")
    .replace(/\n/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

export function pickVoiceForLanguage(
  voices: SpeechSynthesisVoice[],
  languageCode: ChatLanguageCode
): SpeechSynthesisVoice | null {
  if (!voices.length) return null;

  const lang = getChatLanguage(languageCode);
  const locale = languageCode === "auto" ? "en-IN" : lang.speechLocale;
  const base = locale.split("-")[0];

  const ranked = voices.filter((v) => v.lang.startsWith(base) || v.lang.startsWith(locale));
  const preferred = ranked.find((v) => v.lang === locale)
    || ranked.find((v) => v.lang.startsWith(locale))
    || ranked.find((v) => v.default)
    || ranked[0];

  return preferred ?? voices.find((v) => v.lang.startsWith("en")) ?? voices[0];
}

export function speakText(
  text: string,
  languageCode: ChatLanguageCode,
  onEnd?: () => void
): SpeechSynthesisUtterance | null {
  if (typeof window === "undefined" || !window.speechSynthesis) return null;

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(textForSpeech(text));
  const voices = window.speechSynthesis.getVoices();
  const voice = pickVoiceForLanguage(voices, languageCode);

  if (voice) utterance.voice = voice;
  utterance.lang = languageCode === "auto" ? "en-IN" : getChatLanguage(languageCode).speechLocale;
  utterance.rate = 0.95;
  utterance.pitch = 1;

  if (onEnd) utterance.onend = onEnd;

  window.speechSynthesis.speak(utterance);
  return utterance;
}

export function stopSpeech(): void {
  if (typeof window !== "undefined" && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
}

export function isSpeechSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}
