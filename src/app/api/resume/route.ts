import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const MAX_BYTES = 5 * 1024 * 1024;
const MAX_TEXT_CHARS = 8000;

async function extractText(buffer: Buffer, fileName: string): Promise<string> {
  const ext = fileName.split(".").pop()?.toLowerCase() ?? "";

  if (ext === "pdf") {
    const { PDFParse } = await import("pdf-parse");
    const parser = new PDFParse({ data: buffer });
    const result = await parser.getText();
    return result.text;
  }

  if (ext === "docx" || ext === "doc") {
    const mammoth = await import("mammoth");
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }

  if (ext === "txt") {
    return buffer.toString("utf-8");
  }

  throw new Error("unsupported_format");
}

export async function POST(req: NextRequest) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Не авторизован" }, { status: 401 });

  const contentLength = Number(req.headers.get("content-length") ?? 0);
  if (contentLength > MAX_BYTES) {
    return NextResponse.json(
      { error: "Файл слишком большой. Максимальный размер — 5 МБ." },
      { status: 413 },
    );
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Не удалось прочитать файл." }, { status: 400 });
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Файл не передан." }, { status: 400 });
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: "Файл слишком большой. Максимальный размер — 5 МБ." },
      { status: 413 },
    );
  }

  const fileName = file.name;
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  let resumeText: string | null = null;
  let extractionError: string | null = null;

  try {
    const raw = await extractText(buffer, fileName);
    resumeText = raw.slice(0, MAX_TEXT_CHARS).trim() || null;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[resume] extraction failed:", msg, err);
    if (msg === "unsupported_format") {
      extractionError = "Не удалось прочитать файл. Поддерживаются форматы: PDF, DOCX, TXT.";
    } else {
      extractionError = `Ошибка извлечения текста: ${msg}`;
    }
  }

  await prisma.profile.update({
    where: { userId },
    data: { resumeFileName: fileName, resumeText },
  });

  if (extractionError) {
    return NextResponse.json({ ok: true, fileName, resumeText: null, warning: extractionError });
  }

  return NextResponse.json({ ok: true, fileName, resumeText: resumeText ? "extracted" : null });
}
