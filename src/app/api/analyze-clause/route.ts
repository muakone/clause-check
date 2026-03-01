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

    const prompt = `You are an expert commercial contract lawyer reviewing a single clause.

Analyse the following clause and identify genuine legal and drafting risks. Focus on:
- Unfair or imbalanced obligations between the parties
- Vague, undefined or open-ended terms that create uncertainty
- Missing protections or safeguards (e.g. caps, carve-outs, notice requirements)
- Unilateral powers or discretions given to one party
- Waiver of rights or remedies
- Unusual or onerous obligations
- Potential enforceability issues

Return a JSON array of findings. Each finding must have exactly these fields:
- "title": short label for the issue (max 7 words)
- "severity": "high", "medium", or "low"
- "why": specific explanation of the risk referencing the actual clause language (2-3 sentences)
- "suggestion": concrete fix or safeguard to add (1-2 sentences)
- "matchedText": the exact phrase or wording in the clause that triggers this finding (max 100 chars)

Rules:
- Return 1 to 5 findings only
- Only flag genuine, substantive risks — not trivial stylistic issues
- Reference actual words from the clause in your findings
- If the clause appears balanced and well-drafted, return an empty array []
- Return ONLY a valid JSON array with no markdown, code fences, or extra text

Clause to analyse:
${text.slice(0, 4000)}`;

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
    console.error("Clause analysis error:", msg);
    return NextResponse.json(
      { error: `Clause analysis failed: ${msg}` },
      { status: 500 }
    );
  }
}
