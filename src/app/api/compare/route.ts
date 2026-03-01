import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(request: NextRequest) {
  try {
    const { baselineText, newText } = await request.json();

    if (!baselineText || !newText) {
      return NextResponse.json(
        { error: "Both baselineText and newText are required" },
        { status: 400 }
      );
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `You are an expert commercial agreement lawyer doing a redline / comparison review.

You are given two versions of an agreement:
- BASELINE: the original / reference version
- NEW: the new or amended version

Your job is to identify the specific, meaningful differences between the two documents. Focus on:
- Clauses that have been added, removed, or changed in substance
- Changes to defined terms or their definitions
- Changes to party obligations, rights, or risk allocation
- Changes to governing law, jurisdiction, or dispute resolution
- Changes to payment terms, timelines, or thresholds
- Any new risks or protections introduced in the new version

Return a JSON array of findings. Each finding must have exactly these fields:
- "ruleTitle": short label for the type of change (max 8 words)
- "severity": "high", "medium", or "low" — based on legal/commercial impact
- "why": specific explanation of what changed and why it matters (2-3 sentences, reference actual clause numbers or text)
- "suggestion": what to review or action to take (1-2 sentences)
- "baselineSnippet": the relevant excerpt from the BASELINE document (max 200 chars, the actual text)
- "newSnippet": the relevant excerpt from the NEW document (max 200 chars, the actual text) — or null if something was removed

Rules:
- Return 3 to 10 findings
- Only flag genuinely meaningful differences — not cosmetic whitespace or formatting changes
- Each finding must reference actual content from the documents, not generic observations
- If the documents appear identical, return an empty array []
- Return ONLY a valid JSON array with no markdown, code fences, or extra text

BASELINE DOCUMENT (first ${Math.min(8000, baselineText.length)} chars):
${baselineText.slice(0, 8000)}

NEW DOCUMENT (first ${Math.min(8000, newText.length)} chars):
${newText.slice(0, 8000)}`;

    const result = await model.generateContent(prompt);
    const raw = result.response.text().trim();

    const cleaned = raw
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

    let findings: unknown[] = [];
    try {
      const parsed = JSON.parse(cleaned);
      findings = Array.isArray(parsed) ? parsed : [];
    } catch {
      findings = [];
    }

    return NextResponse.json({ findings });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("Compare error:", msg);
    return NextResponse.json(
      { error: `Comparison failed: ${msg}` },
      { status: 500 }
    );
  }
}
