import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { translateText, DEEPL_LANG_MAP } from "@/lib/deepl";

type ApiResponse<T> = { data: T | null; error: string | null; meta: null };

export async function POST(
  req: NextRequest
): Promise<NextResponse<ApiResponse<{ translatedText: string; detectedSourceLang: string }>>> {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ data: null, error: "Unauthorized", meta: null }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ data: null, error: "Invalid JSON body", meta: null }, { status: 400 });
  }

  const { text, targetLang } = (body ?? {}) as Record<string, unknown>;

  if (!text || typeof text !== "string" || !text.trim()) {
    return NextResponse.json({ data: null, error: "text is required", meta: null }, { status: 400 });
  }

  if (!targetLang || typeof targetLang !== "string") {
    return NextResponse.json({ data: null, error: "targetLang is required", meta: null }, { status: 400 });
  }

  // Accept either app lang code ("ja") or DeepL code ("JA")
  const deeplLang = DEEPL_LANG_MAP[targetLang.toLowerCase()] ?? targetLang.toUpperCase();

  try {
    const result = await translateText(text, deeplLang);
    return NextResponse.json({ data: result, error: null, meta: null });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Translation failed";
    return NextResponse.json({ data: null, error: message, meta: null }, { status: 500 });
  }
}
