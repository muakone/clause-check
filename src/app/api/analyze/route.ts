import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json();
    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "No text provided" }, { status: 400 });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `You are an expert commercial agreement reviewer. Analyze the following agreement text and identify genuine risks, drafting issues, and concerns that a lawyer would flag.

Return a JSON array of findings. Each finding must have exactly these fields:
- "title": short descriptive title (max 8 words)
- "severity": "high", "medium", or "low"
- "category": one of "commercial-risk", "drafting-clarity", "structural-completeness", "cross-reference-integrity"
- "why": clear explanation of the risk or issue (1-2 sentences)
- "suggestion": specific actionable suggestion to fix it (1-2 sentences)
- "matchedText": the specific clause text or phrase that triggered this finding (max 120 chars)
- "locationLabel": approximate location in the document (e.g. "Clause 3 — Amendments")

Rules:
- Return 3 to 8 findings maximum
- Focus only on genuine, substantive risks — not minor stylistic preferences
- Do not repeat findings from basic structural checks (like missing sections)
- Return ONLY a valid JSON array with no markdown, code blocks, or explanatory text

Agreement text:
${text.slice(0, 14000)}`;

    const result = await model.generateContent(prompt);
    const raw = result.response.text().trim();

    // Strip markdown code fences if Gemini wraps the JSON
    const cleaned = raw
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

    let aiFindings: unknown[] = [];
    try {
      const parsed = JSON.parse(cleaned);
      aiFindings = Array.isArray(parsed) ? parsed : [];
    } catch {
      aiFindings = [];
    }

    return NextResponse.json({ findings: aiFindings });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("AI analysis error:", msg);
    return NextResponse.json(
      { error: `AI analysis failed: ${msg}` },
      { status: 500 }
    );
  }
}
