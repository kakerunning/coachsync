// DeepL language code mapping (app lang → DeepL lang code)
export const DEEPL_LANG_MAP: Record<string, string> = {
  en: "EN",
  ja: "JA",
  fr: "FR",
  de: "DE",
  es: "ES",
  zh: "ZH",
  ko: "KO",
};

export type DeepLResult = {
  translatedText: string;
  detectedSourceLang: string;
};

export async function translateText(
  text: string,
  targetLang: string // DeepL lang code e.g. "JA"
): Promise<DeepLResult> {
  const apiKey = process.env.DEEPL_API_KEY;
  if (!apiKey) throw new Error("DEEPL_API_KEY is not set");

  // Free API uses api-free.deepl.com; Pro uses api.deepl.com
  const baseUrl = apiKey.endsWith(":fx")
    ? "https://api-free.deepl.com"
    : "https://api.deepl.com";

  const res = await fetch(`${baseUrl}/v2/translate`, {
    method: "POST",
    headers: {
      Authorization: `DeepL-Auth-Key ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      text: [text],
      target_lang: targetLang,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`DeepL API error ${res.status}: ${body}`);
  }

  const data = (await res.json()) as {
    translations: { text: string; detected_source_language: string }[];
  };

  const translation = data.translations[0];
  if (!translation) throw new Error("No translation returned");

  return {
    translatedText: translation.text,
    detectedSourceLang: translation.detected_source_language,
  };
}
