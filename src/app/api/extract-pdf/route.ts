import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const base64 = Buffer.from(bytes).toString("base64");

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const result = await model.generateContent([
      {
        inlineData: {
          mimeType: "application/pdf",
          data: base64,
        },
      },
      "Extract all the text from this PDF document. Return only the raw text content, preserving the structure (headings, numbered clauses, paragraphs) as accurately as possible. Do not add any commentary or explanation.",
    ]);

    const text = result.response.text().trim();
    if (!text) {
      return NextResponse.json(
        { error: "No text could be extracted from this PDF" },
        { status: 422 }
      );
    }

    return NextResponse.json({ text });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("PDF extraction error:", msg);
    return NextResponse.json(
      { error: `Failed to extract PDF text: ${msg}` },
      { status: 500 }
    );
  }
}
