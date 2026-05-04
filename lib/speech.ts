"use client";

type SpeakOptions = {
  lang?: "vi-VN" | "en-US";
};

const PREFERRED_ENGLISH_VOICE_KEYWORDS = [
  "google us english",
  "microsoft aria",
  "microsoft jenny",
  "microsoft guy",
  "microsoft davis",
  "microsoft christopher",
  "microsoft libby",
  "microsoft ava",
  "microsoft andrew",
  "samantha",
  "daniel",
  "alex",
];

const PREFERRED_VIETNAMESE_VOICE_KEYWORDS = [
  "vi-vn",
  "vietnam",
  "việt",
];

function findPreferredVoice(
  voices: SpeechSynthesisVoice[],
  keywords: string[]
) {
  for (const keyword of keywords) {
    const matchedVoice = voices.find((voice) => {
      const haystack = `${voice.name} ${voice.lang}`.toLowerCase();
      return haystack.includes(keyword);
    });

    if (matchedVoice) {
      return matchedVoice;
    }
  }

  return null;
}

function pickVoice(voices: SpeechSynthesisVoice[], lang: string) {
  const normalizedLang = lang.toLowerCase();
  const matchingLangVoices = voices.filter((voice) =>
    voice.lang.toLowerCase().startsWith(normalizedLang.slice(0, 2))
  );

  if (lang === "en-US") {
    return (
      findPreferredVoice(matchingLangVoices, PREFERRED_ENGLISH_VOICE_KEYWORDS) ??
      findPreferredVoice(voices, PREFERRED_ENGLISH_VOICE_KEYWORDS) ??
      matchingLangVoices[0] ??
      voices.find((voice) => voice.name.toLowerCase().includes("english")) ??
      null
    );
  }

  if (lang === "vi-VN") {
    return (
      findPreferredVoice(
        matchingLangVoices,
        PREFERRED_VIETNAMESE_VOICE_KEYWORDS
      ) ??
      findPreferredVoice(voices, PREFERRED_VIETNAMESE_VOICE_KEYWORDS) ??
      matchingLangVoices[0] ??
      voices.find((voice) => voice.name.toLowerCase().includes("vietnam")) ??
      null
    );
  }

  return (
    matchingLangVoices[0] ??
    null
  );
}

function waitForVoices(): Promise<SpeechSynthesisVoice[]> {
  return new Promise((resolve) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      resolve([]);
      return;
    }

    const voices = window.speechSynthesis.getVoices();

    if (voices.length > 0) {
      resolve(voices);
      return;
    }

    const timeout = window.setTimeout(() => {
      window.speechSynthesis.onvoiceschanged = null;
      resolve(window.speechSynthesis.getVoices());
    }, 500);

    window.speechSynthesis.onvoiceschanged = () => {
      window.clearTimeout(timeout);
      window.speechSynthesis.onvoiceschanged = null;
      resolve(window.speechSynthesis.getVoices());
    };
  });
}

export async function speakText(text: string, options: SpeakOptions = {}) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    return;
  }

  const cleanText = text.trim();
  const lang = options.lang ?? "vi-VN";

  if (!cleanText) {
    return;
  }

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(cleanText);
  const voices = await waitForVoices();
  const voice = pickVoice(voices, lang);

  utterance.lang = lang;
  utterance.rate = 0.95;
  utterance.pitch = 1;
  utterance.volume = 1;

  if (voice) {
    utterance.voice = voice;
  }

  window.speechSynthesis.speak(utterance);
}

function numberToEnglish(value: number): string {
  const words: Record<number, string> = {
    0: "Zero",
    1: "One",
    2: "Two",
    3: "Three",
    4: "Four",
    5: "Five",
    6: "Six",
    7: "Seven",
    8: "Eight",
    9: "Nine",
    10: "Ten",
    11: "Eleven",
    12: "Twelve",
  };

  return words[value] ?? String(value);
}

export function zoneToSpeechText(zone: string): string {
  const cleanZone = zone.trim();
  const match = /^z\s*(\d+)/i.exec(cleanZone);

  if (!match) {
    return cleanZone;
  }

  return numberToEnglish(Number(match[1]));
}

export function buildZoneSpeechText(zone: string): string {
  return zoneToSpeechText(zone);
}
