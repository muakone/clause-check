"use client";

import * as React from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { extractDocx } from "@/utils/extractDocx";
import type { Severity } from "@/lib/mockData";
import { AppNav } from "@/components/AppNav";

// Comparison finding model for document-vs-document checks.
export type ComparisonFinding = {
  id: string;
  severity: Severity; // "low" | "medium" | "high"
  ruleTitle: string;
  why: string;
  suggestion: string;
  baselineSnippet?: string;
  newSnippet?: string;
};

function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

// Split text into rough "paragraphs" based on blank lines and
// return the first paragraph containing the keyword regex.
function extractParagraphWithKeyword(
  text: string,
  keyword: RegExp
): string | null {
  if (!text) return null;

  const paragraphs = text.split(/\n\s*\n/g);
  for (const para of paragraphs) {
    if (keyword.test(para)) {
      return para.trim();
    }
  }
  return null;
}

// Extract simple clause headings like "Clause 3.1" or "3.1" at
// the start of a line.
function extractClauseHeadings(text: string): Map<string, string> {
  const result = new Map<string, string>();
  const lines = text.split(/\r?\n/);
  const headingRegex = /^\s*(?:Clause\s+)?(\d+(?:\.\d+)*)\b/i;

  for (const line of lines) {
    const match = headingRegex.exec(line);
    if (match) {
      const number = match[1];
      if (number && !result.has(number)) {
        result.set(number, line.trim());
      }
    }
  }

  return result;
}

// Extract defined terms of the form "Term" means ... up to end of line.
function extractDefinitions(text: string): Map<string, string> {
  const result = new Map<string, string>();
  if (!text) return result;

  const regex = /["“](.+?)["”]\s+means\b[^\n]*/gi;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    const term = match[1] ? match[1].trim() : "";
    if (!term) continue;
    const key = term.toLowerCase();
    const snippet = match[0].trim();
    if (!result.has(key)) {
      result.set(key, snippet);
    }
  }

  return result;
}

function hasUnilateralRiskLanguage(text: string): boolean {
  if (!text) return false;
  const pattern =
    /sole and absolute discretion|sole discretion|unilaterally|for any reason or no reason/i;
  return pattern.test(text);
}

function compareDocuments(
  baselineText: string,
  newText: string
): ComparisonFinding[] {
  const findings: ComparisonFinding[] = [];
  let counter = 1;

  const addFinding = (finding: Omit<ComparisonFinding, "id">) => {
    findings.push({ ...finding, id: `CF-${counter++}` });
  };

  // 1) Governing law mismatch
  const baselineGov = extractParagraphWithKeyword(
    baselineText,
    /governing law/i
  );
  const newGov = extractParagraphWithKeyword(newText, /governing law/i);

  if (baselineGov && newGov) {
    if (normalizeWhitespace(baselineGov) !== normalizeWhitespace(newGov)) {
      addFinding({
        severity: "high",
        ruleTitle: "Governing law mismatch",
        why: "Both documents contain a governing law provision, but the wording appears to differ between the baseline and the new agreement.",
        suggestion:
          "Confirm which governing law and formulation should apply, then ensure the final agreement set uses a single, consistent governing law clause.",
        baselineSnippet: baselineGov,
        newSnippet: newGov,
      });
    }
  }

  // 2) Interest clause mismatch
  const baselineInterest = extractParagraphWithKeyword(
    baselineText,
    /interest/i
  );
  const newInterest = extractParagraphWithKeyword(newText, /interest/i);

  if (baselineInterest && newInterest) {
    if (
      normalizeWhitespace(baselineInterest) !== normalizeWhitespace(newInterest)
    ) {
      addFinding({
        severity: "medium",
        ruleTitle: "Interest clause mismatch",
        why: "Both documents contain an interest clause, but the wording appears to differ between the baseline and the new agreement.",
        suggestion:
          "Review the interest provisions side by side (rate, day count, payment dates, margin, default interest) and confirm that any differences are intentional and appropriate.",
        baselineSnippet: baselineInterest,
        newSnippet: newInterest,
      });
    }
  }

  // 3) Unilateral amendment power introduced
  const baselineUnilateral = hasUnilateralRiskLanguage(baselineText);
  const newUnilateral = hasUnilateralRiskLanguage(newText);

  if (!baselineUnilateral && newUnilateral) {
    const newPara = extractParagraphWithKeyword(
      newText,
      /sole and absolute discretion|sole discretion|unilaterally|for any reason or no reason/i
    );

    addFinding({
      severity: "high",
      ruleTitle: "Unilateral amendment / discretion introduced",
      why: "The new agreement appears to introduce language giving one party unilateral discretion or amendment power (for example, 'sole discretion' or 'unilaterally'), which was not present in the baseline document.",
      suggestion:
        "Confirm whether this new unilateral power is deliberate. If not, consider reverting to the baseline wording or tightening the clause so that changes require mutual agreement.",
      baselineSnippet: baselineUnilateral
        ? "Baseline already contained unilateral language."
        : undefined,
      newSnippet:
        newPara ?? "Unilateral / sole discretion language in new agreement.",
    });
  }

  // 4) Clause removed
  const baselineHeadings = extractClauseHeadings(baselineText);
  const newHeadings = extractClauseHeadings(newText);

  for (const [number, line] of baselineHeadings.entries()) {
    if (!newHeadings.has(number)) {
      addFinding({
        severity: "medium",
        ruleTitle: "Clause removed in new agreement",
        why: `A clause heading from the baseline agreement (Clause ${number}) does not appear in the new agreement. This may indicate that a provision has been removed between versions.`,
        suggestion:
          "Confirm whether the removal of this clause is intended. If the risk allocation or protections are still needed, consider reintroducing or relocating the relevant wording in the new agreement.",
        baselineSnippet: line,
        newSnippet: undefined,
      });
    }
  }

  // 5) Defined term inconsistency
  const baselineDefs = extractDefinitions(baselineText);
  const newDefs = extractDefinitions(newText);

  // Terms that exist only in baseline
  for (const [key, snippet] of baselineDefs.entries()) {
    if (!newDefs.has(key)) {
      addFinding({
        severity: "medium",
        ruleTitle: "Defined term missing in new agreement",
        why: "A defined term in the baseline agreement does not appear to be defined in the new agreement, which may create gaps or inconsistencies if the concept is still used.",
        suggestion:
          "Check whether this term is still needed in the new agreement. If it is, add a corresponding definition; if not, consider removing any remaining references to it.",
        baselineSnippet: snippet,
        newSnippet: undefined,
      });
    }
  }

  // Terms that exist only in new
  for (const [key, snippet] of newDefs.entries()) {
    if (!baselineDefs.has(key)) {
      addFinding({
        severity: "low",
        ruleTitle: "New defined term not present in baseline",
        why: "The new agreement contains a defined term that does not appear in the baseline agreement. This may reflect an intentional change in structure or risk allocation.",
        suggestion:
          "Confirm that the introduction of this new defined term (and any related provisions) is intentional and consistent with the overall deal structure.",
        baselineSnippet: undefined,
        newSnippet: snippet,
      });
    }
  }

  return findings;
}

function severityBadgeClasses(severity: Severity): string {
  switch (severity) {
    case "high":
      return "bg-marker text-navy border-marker/80";
    case "medium":
      return "bg-tan/80 text-navy border-tan/80";
    case "low":
    default:
      return "bg-dusty/80 text-cream border-dusty/80";
  }
}

export default function ComparePage() {
  const [baselineName, setBaselineName] = React.useState<string | null>(null);
  const [newName, setNewName] = React.useState<string | null>(null);
  const [baselineText, setBaselineText] = React.useState("");
  const [newText, setNewText] = React.useState("");
  const [isLoadingBaseline, setIsLoadingBaseline] = React.useState(false);
  const [isLoadingNew, setIsLoadingNew] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [findings, setFindings] = React.useState<ComparisonFinding[]>([]);

  const baselineInputRef = React.useRef<HTMLInputElement | null>(null);
  const newInputRef = React.useRef<HTMLInputElement | null>(null);

  const handleSelectBaseline = () => {
    baselineInputRef.current?.click();
  };

  const handleSelectNew = () => {
    newInputRef.current?.click();
  };

  const handleBaselineChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);
    if (!file.name.toLowerCase().endsWith(".docx")) {
      setError("Please upload a .docx file for the baseline agreement.");
      return;
    }

    setIsLoadingBaseline(true);
    try {
      const text = await extractDocx(file);
      setBaselineText(text || "");
      setBaselineName(file.name);
    } catch (err) {
      console.error("Failed to read baseline .docx", err);
      setError("We couldn't read the baseline .docx file. Please try another.");
    } finally {
      setIsLoadingBaseline(false);
      // Allow re-selecting the same file if needed
      event.target.value = "";
    }
  };

  const handleNewChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);
    if (!file.name.toLowerCase().endsWith(".docx")) {
      setError("Please upload a .docx file for the new / amended agreement.");
      return;
    }

    setIsLoadingNew(true);
    try {
      const text = await extractDocx(file);
      setNewText(text || "");
      setNewName(file.name);
    } catch (err) {
      console.error("Failed to read new .docx", err);
      setError("We couldn't read the new .docx file. Please try another.");
    } finally {
      setIsLoadingNew(false);
      event.target.value = "";
    }
  };

  const handleCompare = () => {
    setError(null);

    if (!baselineText || !newText) {
      setError(
        "Please upload both the baseline and new agreements before comparing."
      );
      return;
    }

    const results = compareDocuments(baselineText, newText);
    setFindings(results);
  };

  return (
    <div className="min-h-screen bg-cream text-navy flex flex-col">
      <header className="border-b border-tan/40 bg-cream/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6 sm:py-4">
          <div className="flex flex-col gap-1">
            <span className="font-serif text-[1.6rem] font-semibold leading-tight tracking-tight">
              chequeck
            </span>
            <span className="text-[0.7rem] font-sans uppercase tracking-[0.3em] text-dusty">
              Loan clause review
            </span>
          </div>

          <AppNav />
        </div>
      </header>

      <main className="flex-1 px-4 py-6 sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-col gap-6">
          <header className="space-y-1">
            <h1 className="font-serif text-2xl font-semibold tracking-tight">
              Document Comparison
            </h1>
            <p className="max-w-2xl text-sm text-navy/80">
              Compare a baseline loan agreement against a new or amended version
              to spot structural and drafting differences in a deterministic
              way.
            </p>
          </header>

          {error && (
            <div className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800">
              {error}
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <Card className="rounded-2xl border-tan/40 bg-cream/95 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="font-serif text-[1.1rem] font-semibold tracking-tight">
                  Baseline Agreement (.docx)
                </CardTitle>
                <CardDescription className="mt-1 text-xs uppercase tracking-[0.25em] text-dusty">
                  Original / reference document
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-3 text-sm">
                <input
                  ref={baselineInputRef}
                  type="file"
                  accept=".docx"
                  className="hidden"
                  onChange={handleBaselineChange}
                />
                <Button
                  type="button"
                  variant="outline"
                  className="w-full justify-center rounded-full border-dusty/60 bg-cream/80 text-sm text-navy hover:bg-tan/20"
                  onClick={handleSelectBaseline}
                  disabled={isLoadingBaseline}
                >
                  {isLoadingBaseline ? "Loading baseline…" : "Upload .docx"}
                </Button>
                {baselineName && (
                  <p className="truncate text-xs text-navy/70">
                    Loaded: <span className="font-medium">{baselineName}</span>
                  </p>
                )}
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-tan/40 bg-cream/95 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="font-serif text-[1.1rem] font-semibold tracking-tight">
                  New / Amended Agreement (.docx)
                </CardTitle>
                <CardDescription className="mt-1 text-xs uppercase tracking-[0.25em] text-dusty">
                  Latest draft to compare
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-3 text-sm">
                <input
                  ref={newInputRef}
                  type="file"
                  accept=".docx"
                  className="hidden"
                  onChange={handleNewChange}
                />
                <Button
                  type="button"
                  variant="outline"
                  className="w-full justify-center rounded-full border-dusty/60 bg-cream/80 text-sm text-navy hover:bg-tan/20"
                  onClick={handleSelectNew}
                  disabled={isLoadingNew}
                >
                  {isLoadingNew ? "Loading new agreement…" : "Upload .docx"}
                </Button>
                {newName && (
                  <p className="truncate text-xs text-navy/70">
                    Loaded: <span className="font-medium">{newName}</span>
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-navy/70">
              When both documents are loaded, run a deterministic comparison on
              key clauses and defined terms.
            </p>
            <Button
              type="button"
              className="rounded-full bg-navy px-4 py-2 text-sm font-medium text-cream hover:bg-navy/90"
              onClick={handleCompare}
              disabled={!baselineText || !newText}
            >
              Compare Documents
            </Button>
          </div>

          <Card className="flex min-h-50 flex-col rounded-2xl border-tan/40 bg-cream/95 shadow-md">
            <CardHeader className="pb-2 pt-3 sm:pb-3 sm:pt-4">
              <CardTitle className="font-serif text-[1.05rem] font-semibold tracking-tight">
                Comparison findings
              </CardTitle>
              <CardDescription className="mt-1 flex items-center justify-between gap-2 text-[0.7rem] uppercase tracking-[0.25em] text-dusty">
                <span className="truncate">Deterministic differences</span>
                <span className="font-sans text-[0.7rem] text-navy/70">
                  {findings.length} finding{findings.length === 1 ? "" : "s"}
                </span>
              </CardDescription>
            </CardHeader>
            <CardContent className="flex min-h-0 flex-1 pt-1">
              {findings.length === 0 ? (
                <div className="flex w-full items-center justify-center px-4 py-8 text-center text-sm text-navy/60">
                  Upload both documents and run a comparison to see structured
                  differences here.
                </div>
              ) : (
                <ScrollArea className="h-full w-full pr-3">
                  <div className="space-y-4 text-sm">
                    {findings.map((finding) => (
                      <div
                        key={finding.id}
                        className="rounded-2xl border border-tan/30 bg-cream px-3 py-3 shadow-sm"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex flex-col gap-1">
                            <div className="font-serif text-[0.95rem] font-semibold leading-snug">
                              {finding.ruleTitle}
                            </div>
                            <p className="text-[0.8rem] leading-snug text-navy/85">
                              {finding.why}
                            </p>
                          </div>
                          <Badge
                            variant="outline"
                            className={
                              "ml-2 rounded-full px-2 py-0.5 text-[0.65rem] font-semibold " +
                              severityBadgeClasses(finding.severity)
                            }
                          >
                            {finding.severity.toUpperCase()}
                          </Badge>
                        </div>

                        <Separator className="my-3 border-tan/20" />

                        <div className="grid gap-3 md:grid-cols-2">
                          <div>
                            <div className="mb-1 text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-dusty">
                              Baseline agreement
                            </div>
                            <div className="rounded-xl border border-tan/30 bg-cream/80 p-2 text-[0.75rem] leading-relaxed text-navy/90">
                              {finding.baselineSnippet ? (
                                <pre className="whitespace-pre-wrap font-mono text-[0.7rem]">
                                  {finding.baselineSnippet}
                                </pre>
                              ) : (
                                <span className="text-navy/50">
                                  No specific baseline snippet for this finding.
                                </span>
                              )}
                            </div>
                          </div>
                          <div>
                            <div className="mb-1 text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-dusty">
                              New / amended agreement
                            </div>
                            <div className="rounded-xl border border-tan/30 bg-cream/80 p-2 text-[0.75rem] leading-relaxed text-navy/90">
                              {finding.newSnippet ? (
                                <pre className="whitespace-pre-wrap font-mono text-[0.7rem]">
                                  {finding.newSnippet}
                                </pre>
                              ) : (
                                <span className="text-navy/50">
                                  No specific new snippet for this finding.
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="mt-3 text-[0.75rem] text-navy/80">
                          <span className="font-semibold">
                            Suggested review:{" "}
                          </span>
                          {finding.suggestion}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
