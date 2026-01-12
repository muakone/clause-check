import * as mammoth from "mammoth";

export async function extractDocx(file: File): Promise<string> {
  if (!file) {
    throw new Error("No file provided");
  }

  const arrayBuffer = await file.arrayBuffer();
  const { value } = await mammoth.extractRawText({ arrayBuffer });

  return (value || "").trim();
}
