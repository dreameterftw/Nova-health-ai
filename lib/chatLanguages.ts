export type ChatLanguageCode =
  | "auto"
  | "en"
  | "hi"
  | "ta"
  | "te"
  | "bn"
  | "mr"
  | "kn"
  | "ml"
  | "gu"
  | "pa";

export type ChatLanguage = {
  code: ChatLanguageCode;
  label: string;
  nativeLabel: string;
  /** BCP-47 tag for speech synthesis */
  speechLocale: string;
};

export const CHAT_LANGUAGES: ChatLanguage[] = [
  { code: "auto", label: "Auto-detect", nativeLabel: "Auto", speechLocale: "en-IN" },
  { code: "en", label: "English", nativeLabel: "English", speechLocale: "en-IN" },
  { code: "hi", label: "Hindi", nativeLabel: "हिन्दी", speechLocale: "hi-IN" },
  { code: "ta", label: "Tamil", nativeLabel: "தமிழ்", speechLocale: "ta-IN" },
  { code: "te", label: "Telugu", nativeLabel: "తెలుగు", speechLocale: "te-IN" },
  { code: "bn", label: "Bengali", nativeLabel: "বাংলা", speechLocale: "bn-IN" },
  { code: "mr", label: "Marathi", nativeLabel: "मराठी", speechLocale: "mr-IN" },
  { code: "kn", label: "Kannada", nativeLabel: "ಕನ್ನಡ", speechLocale: "kn-IN" },
  { code: "ml", label: "Malayalam", nativeLabel: "മലയാളം", speechLocale: "ml-IN" },
  { code: "gu", label: "Gujarati", nativeLabel: "ગુજરાતી", speechLocale: "gu-IN" },
  { code: "pa", label: "Punjabi", nativeLabel: "ਪੰਜਾਬੀ", speechLocale: "pa-IN" },
];

export const DEFAULT_CHAT_LANGUAGE: ChatLanguageCode = "auto";

export function getChatLanguage(code: ChatLanguageCode): ChatLanguage {
  return CHAT_LANGUAGES.find((l) => l.code === code) ?? CHAT_LANGUAGES[0];
}

export function getLanguagePromptInstruction(code: ChatLanguageCode): string {
  if (code === "auto") {
    return `LANGUAGE — CRITICAL:
Detect the language the user writes in and respond ENTIRELY in that same language.
- If the user writes in Hindi, respond in Hindi. If Tamil, respond in Tamil. Match their language naturally.
- If the user mixes languages (common in India), mirror their style comfortably.
- Default to English only if the user's language is unclear.
- Keep wellness guidance culturally grounded in the Indian context.
- Emergency numbers (112, 108, etc.) stay as digits.`;
  }

  const lang = getChatLanguage(code);
  return `LANGUAGE — CRITICAL:
The user selected ${lang.label} (${lang.nativeLabel}) for this conversation.
- ALWAYS respond ENTIRELY in ${lang.label}, using warm, natural, culturally appropriate phrasing.
- Even if the user occasionally uses English words, keep your full replies in ${lang.label} unless they explicitly ask to switch languages.
- Keep wellness guidance grounded in the Indian context where relevant.
- Emergency numbers (112, 108, iCall 9152987821, AASRA 9820466627) stay as digits.`;
}

type WelcomeStrings = {
  greeting: (name: string, timeGreeting: string) => string;
  safeSpace: string;
  awareness: (list: string) => string;
  closing: string;
};

const WELCOME_I18N: Partial<Record<ChatLanguageCode, WelcomeStrings>> = {
  en: {
    greeting: (name, timeGreeting) => `${timeGreeting}, ${name}. I'm NOVA — your private wellness companion.`,
    safeSpace: "This is a calm, judgment-free space. There's no rush here, and you don't need to have anything figured out before we talk.",
    awareness: (list) => `I'm quietly aware that ${list} — but only share what feels right, in your own time.`,
    closing: "Whenever you're ready, I'm here to listen. What's on your mind today?",
  },
  hi: {
    greeting: (name, timeGreeting) => `${timeGreeting}, ${name}. मैं NOVA हूँ — आपका निजी wellness साथी।`,
    safeSpace: "यह एक शांत, बिना किसी judgment के स्थान है। यहाँ कोई जल्दबाज़ी नहीं है — बात करने से पहले आपको सब कुछ समझने की ज़रूरत नहीं।",
    awareness: (list) => `मुझे धीरे से पता है कि ${list} — लेकिन जो सही लगे, अपनी रफ़्तार से साझा करें।`,
    closing: "जब भी आप तैयार हों, मैं सुनने के लिए यहाँ हूँ। आज आपके मन में क्या है?",
  },
  ta: {
    greeting: (name, timeGreeting) => `${timeGreeting}, ${name}. நான் NOVA — உங்கள் தனிப்பட்ட wellness துணை.`,
    safeSpace: "இது அமைதியான, திணிப்பில்லாத இடம். இங்கே அவசரம் இல்லை — பேசுவதற்கு முன் எல்லாம் தெரிந்திருக்க வேண்டிய அவசியம் இல்லை.",
    awareness: (list) => `${list} என்பது எனக்கு அமைதியாகத் தெரியும் — ஆனால் உங்களுக்கு சரியானதை, உங்கள் வேகத்தில் பகிருங்கள்.`,
    closing: "நீங்கள் தயாராகும்போது, நான் கேட்க இங்கே இருக்கிறேன். இன்று உங்கள் மனதில் என்ன?",
  },
  te: {
    greeting: (name, timeGreeting) => `${timeGreeting}, ${name}. నేను NOVA — మీ ప్రైవేట్ wellness సహచరుడిని.`,
    safeSpace: "ఇది ప్రశాంతమైన, నిర్ణయం లేని స్థలం. ఇక్కడ తొందర లేదు — మాట్లాడే ముందు అన్నీ తెలియాల్సిన అవసరం లేదు.",
    awareness: (list) => `${list} అని నాకు నిశ్శబ్దంగా తెలుసు — కానీ మీకు సరైనది, మీ వేగంలో పంచుకోండి.`,
    closing: "మీరు సిద్ధంగా ఉన్నప్పుడు, నేను వినడానికి ఇక్కడ ఉన్నాను. ఈ రోజు మీ మనసులో ఏముంది?",
  },
  bn: {
    greeting: (name, timeGreeting) => `${timeGreeting}, ${name}. আমি NOVA — আপনার ব্যক্তিগত wellness সঙ্গী।`,
    safeSpace: "এটি একটি শান্ত, বিচারহীন জায়গা। এখানে কোনো তাড়াহুড়ো নেই — কথা বলার আগে সব বুঝতে হবে না।",
    awareness: (list) => `আমি নীরবে জানি যে ${list} — তবে যা ঠিক মনে হয়, আপনার মতো করে শেয়ার করুন।`,
    closing: "যখনই প্রস্তুত, আমি শোনার জন্য আছি। আজ আপনার মনে কী?",
  },
  mr: {
    greeting: (name, timeGreeting) => `${timeGreeting}, ${name}. मी NOVA आहे — तुमचा खाजगी wellness सोबती.`,
    safeSpace: "हे एक शांत, निर्णय न करणारे स्थान आहे. इथे घाई नाही — बोलण्यापूर्वी सर्व काही समजून घेण्याची गरज नाही.",
    awareness: (list) => `मला quietly माहित आहे की ${list} — पण जे योग्य वाटेल ते, तुमच्या वेगाने सांगा.`,
    closing: "जेव्हा तुम्ही तयार असाल, मी ऐकण्यासाठी इथे आहे. आज तुमच्या मनात काय आहे?",
  },
};

export function getTimeGreeting(code: ChatLanguageCode): string {
  const h = new Date().getHours();
  const en = h < 5 ? "Good night" : h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : h < 20 ? "Good evening" : "Good night";

  if (code === "hi") {
    return h < 5 ? "शुभ रात्रि" : h < 12 ? "सुप्रभात" : h < 17 ? "नमस्कार" : h < 20 ? "शुभ संध्या" : "शुभ रात्रि";
  }
  if (code === "ta") {
    return h < 12 ? "காலை வணக்கம்" : h < 17 ? "வணக்கம்" : "மாலை வணக்கம்";
  }
  if (code === "te") {
    return h < 12 ? "శుభోదయం" : h < 17 ? "నమస్కారం" : "శుభ సాయంత్రం";
  }
  if (code === "bn") {
    return h < 12 ? "শুভ সকাল" : h < 17 ? "নমস্কার" : "শুভ সন্ধ্যা";
  }
  if (code === "mr") {
    return h < 12 ? "शुभ प्रभात" : h < 17 ? "नमस्कार" : "शुभ संध्याकाळ";
  }
  return en;
}

export function getWelcomeStrings(code: ChatLanguageCode): WelcomeStrings {
  if (code === "auto") return WELCOME_I18N.en!;
  return WELCOME_I18N[code] ?? WELCOME_I18N.en!;
}
