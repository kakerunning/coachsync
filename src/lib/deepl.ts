// DeepL translation wrapper. Handles the free/pro API URL split and language
// code normalisation. Server-side only — never import in client components.

// Maps the app's ISO 639-1 language codes to DeepL's uppercase language codes.
// Only languages supported by both the app UI and the DeepL API are listed here;
// unsupported codes fall back to uppercased passthrough in the translate route.
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

  // DeepL free-tier keys end with ":fx" and must use a different subdomain from pro keys.
  // Mixing them causes 403 errors, so we detect the tier from the key suffix.
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
      text: [text],       // DeepL accepts a batch array; we always send one string
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
