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
import { extractPdf } from "@/utils/extractPdf";
import type { Severity } from "@/lib/mockData";
import { AppNav } from "@/components/AppNav";

export type ComparisonFinding = {
  id: string;
  severity: Severity;
  ruleTitle: string;
  why: string;
  suggestion: string;
  baselineSnippet?: string;
  newSnippet?: string;
};

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

async function extractFile(file: File): Promise<string> {
  const name = file.name.toLowerCase();
  if (name.endsWith(".pdf")) return extractPdf(file);
  return extractDocx(file);
}

function isValidFile(file: File): boolean {
  const name = file.name.toLowerCase();
  return name.endsWith(".docx") || name.endsWith(".pdf");
}

export default function ComparePage() {
  const [baselineName, setBaselineName] = React.useState<string | null>(null);
  const [newName, setNewName] = React.useState<string | null>(null);
  const [baselineText, setBaselineText] = React.useState("");
  const [newText, setNewText] = React.useState("");
  const [isLoadingBaseline, setIsLoadingBaseline] = React.useState(false);
  const [isLoadingNew, setIsLoadingNew] = React.useState(false);
  const [isComparing, setIsComparing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [findings, setFindings] = React.useState<ComparisonFinding[]>([]);
  const [hasCompared, setHasCompared] = React.useState(false);

  const baselineInputRef = React.useRef<HTMLInputElement | null>(null);
  const newInputRef = React.useRef<HTMLInputElement | null>(null);

  const handleBaselineChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);
    if (!isValidFile(file)) {
      setError("Please upload a .docx or .pdf file for the baseline.");
      return;
    }

    setIsLoadingBaseline(true);
    try {
      const text = await extractFile(file);
      setBaselineText(text || "");
      setBaselineName(file.name);
      setFindings([]);
      setHasCompared(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to read baseline file";
      setError(msg);
    } finally {
      setIsLoadingBaseline(false);
      event.target.value = "";
    }
  };

  const handleNewChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);
    if (!isValidFile(file)) {
      setError("Please upload a .docx or .pdf for the new agreement.");
      return;
    }

    setIsLoadingNew(true);
    try {
      const text = await extractFile(file);
      setNewText(text || "");
      setNewName(file.name);
      setFindings([]);
      setHasCompared(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to read new file";
      setError(msg);
    } finally {
      setIsLoadingNew(false);
      event.target.value = "";
    }
  };

  const handleCompare = async () => {
    setError(null);

    if (!baselineText || !newText) {
      setError("Please upload both documents before comparing.");
      return;
    }

    setIsComparing(true);
    setFindings([]);

    try {
      const response = await fetch("/api/compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ baselineText, newText }),
      });

      const body = await response.json();
      if (!response.ok) {
        throw new Error((body as { error?: string }).error ?? "Comparison failed");
      }

      const raw = (body as { findings: unknown[] }).findings;
      if (!Array.isArray(raw)) {
        setFindings([]);
        setHasCompared(true);
        return;
      }

      const mapped: ComparisonFinding[] = raw.map((f, i) => {
        const item = f as Record<string, unknown>;
        return {
          id: `CF-${i + 1}`,
          severity: (item.severity as Severity) ?? "medium",
          ruleTitle: (item.ruleTitle as string) ?? "Change detected",
          why: (item.why as string) ?? "",
          suggestion: (item.suggestion as string) ?? "",
          baselineSnippet: (item.baselineSnippet as string) ?? undefined,
          newSnippet: (item.newSnippet as string) ?? undefined,
        };
      });

      setFindings(mapped);
      setHasCompared(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Comparison failed";
      setError(msg);
    } finally {
      setIsComparing(false);
    }
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
              Agreement clause review
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
              Upload two versions of an agreement. AI reads both in full
              and surfaces the meaningful differences — clause changes, removed
              protections, new risks.
            </p>
          </header>

          {error && (
            <div className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800">
              {error}
            </div>
          )}

          {/* Upload cards */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="rounded-2xl border-tan/40 bg-cream/95 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="font-serif text-[1.1rem] font-semibold tracking-tight">
                  Baseline Agreement
                </CardTitle>
                <CardDescription className="mt-1 text-xs uppercase tracking-[0.25em] text-dusty">
                  Original / reference document
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-3 text-sm">
                <input
                  ref={baselineInputRef}
                  type="file"
                  accept=".docx,.pdf"
                  className="hidden"
                  onChange={handleBaselineChange}
                />
                <Button
                  type="button"
                  variant="outline"
                  className="w-full justify-center rounded-full border-dusty/60 bg-cream/80 text-sm text-navy hover:bg-tan/20"
                  onClick={() => baselineInputRef.current?.click()}
                  disabled={isLoadingBaseline}
                >
                  {isLoadingBaseline
                    ? "Loading…"
                    : baselineName
                    ? "Replace file"
                    : "Upload .docx or .pdf"}
                </Button>
                {baselineName && (
                  <p className="truncate text-xs text-navy/70">
                    Loaded: <span className="font-medium">{baselineName}</span>
                    <span className="ml-2 text-navy/40">
                      ({baselineText.length.toLocaleString()} chars)
                    </span>
                  </p>
                )}
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-tan/40 bg-cream/95 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="font-serif text-[1.1rem] font-semibold tracking-tight">
                  New / Amended Agreement
                </CardTitle>
                <CardDescription className="mt-1 text-xs uppercase tracking-[0.25em] text-dusty">
                  Latest draft to compare
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-3 text-sm">
                <input
                  ref={newInputRef}
                  type="file"
                  accept=".docx,.pdf"
                  className="hidden"
                  onChange={handleNewChange}
                />
                <Button
                  type="button"
                  variant="outline"
                  className="w-full justify-center rounded-full border-dusty/60 bg-cream/80 text-sm text-navy hover:bg-tan/20"
                  onClick={() => newInputRef.current?.click()}
                  disabled={isLoadingNew}
                >
                  {isLoadingNew
                    ? "Loading…"
                    : newName
                    ? "Replace file"
                    : "Upload .docx or .pdf"}
                </Button>
                {newName && (
                  <p className="truncate text-xs text-navy/70">
                    Loaded: <span className="font-medium">{newName}</span>
                    <span className="ml-2 text-navy/40">
                      ({newText.length.toLocaleString()} chars)
                    </span>
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Compare button */}
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-navy/70">
              AI reads both documents in full and identifies the specific
              differences that matter legally.
            </p>
            <Button
              type="button"
              className="rounded-full bg-navy px-5 py-2 text-sm font-medium text-cream hover:bg-navy/90 disabled:opacity-60"
              onClick={handleCompare}
              disabled={!baselineText || !newText || isComparing}
            >
              {isComparing ? (
                <span className="flex items-center gap-2">
                  <span className="h-3 w-3 animate-spin rounded-full border-2 border-cream border-t-transparent" />
                  Comparing…
                </span>
              ) : (
                "Compare Documents"
              )}
            </Button>
          </div>

          {/* Side-by-side full document text */}
          {(baselineText || newText) && (
            <div className="grid gap-4 md:grid-cols-2">
              <Card className="rounded-2xl border-tan/40 bg-cream/95 shadow-sm">
                <CardHeader className="pb-2 pt-3">
                  <CardTitle className="text-[0.75rem] font-semibold uppercase tracking-[0.2em] text-dusty">
                    Baseline — full text
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <ScrollArea className="h-72 rounded-xl border border-tan/30 bg-cream/60 p-3">
                    <pre className="whitespace-pre-wrap font-mono text-[0.7rem] leading-relaxed text-navy/85">
                      {baselineText || "No document loaded yet."}
                    </pre>
                  </ScrollArea>
                </CardContent>
              </Card>

              <Card className="rounded-2xl border-tan/40 bg-cream/95 shadow-sm">
                <CardHeader className="pb-2 pt-3">
                  <CardTitle className="text-[0.75rem] font-semibold uppercase tracking-[0.2em] text-dusty">
                    New / Amended — full text
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <ScrollArea className="h-72 rounded-xl border border-tan/30 bg-cream/60 p-3">
                    <pre className="whitespace-pre-wrap font-mono text-[0.7rem] leading-relaxed text-navy/85">
                      {newText || "No document loaded yet."}
                    </pre>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Findings */}
          <Card className="flex min-h-50 flex-col rounded-2xl border-tan/40 bg-cream/95 shadow-md">
            <CardHeader className="pb-2 pt-3 sm:pb-3 sm:pt-4">
              <CardTitle className="font-serif text-[1.05rem] font-semibold tracking-tight">
                Comparison findings
              </CardTitle>
              <CardDescription className="mt-1 flex items-center justify-between gap-2 text-[0.7rem] uppercase tracking-[0.25em] text-dusty">
                <span className="flex items-center gap-2">
                  <span className="truncate">AI-powered differences</span>
                  <span className="rounded-full border border-navy bg-navy px-2 py-[0.05rem] text-[0.6rem] font-bold normal-case tracking-[0.12em] text-cream">
                    AI
                  </span>
                </span>
                <span className="font-sans text-[0.7rem] text-navy/70">
                  {findings.length} finding{findings.length === 1 ? "" : "s"}
                </span>
              </CardDescription>
            </CardHeader>
            <CardContent className="flex min-h-0 flex-1 pt-1">
              {isComparing ? (
                <div className="flex w-full items-center justify-center gap-3 py-10 text-sm text-navy/60">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-navy/40 border-t-navy" />
                  Analysing differences…
                </div>
              ) : findings.length === 0 ? (
                <div className="flex w-full items-center justify-center px-4 py-8 text-center text-sm text-navy/60">
                  {hasCompared
                    ? "No meaningful differences found between the two documents."
                    : "Upload both documents and click Compare Documents to see AI-powered differences here."}
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
                              "ml-2 shrink-0 rounded-full px-2 py-0.5 text-[0.65rem] font-semibold " +
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
                              Baseline
                            </div>
                            <div className="rounded-xl border border-tan/30 bg-cream/80 p-2">
                              {finding.baselineSnippet ? (
                                <pre className="whitespace-pre-wrap font-mono text-[0.7rem] leading-relaxed text-navy/90">
                                  {finding.baselineSnippet}
                                </pre>
                              ) : (
                                <span className="text-[0.75rem] italic text-navy/40">
                                  Not present in baseline
                                </span>
                              )}
                            </div>
                          </div>
                          <div>
                            <div className="mb-1 text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-dusty">
                              New / Amended
                            </div>
                            <div className="rounded-xl border border-tan/30 bg-cream/80 p-2">
                              {finding.newSnippet ? (
                                <pre className="whitespace-pre-wrap font-mono text-[0.7rem] leading-relaxed text-navy/90">
                                  {finding.newSnippet}
                                </pre>
                              ) : (
                                <span className="text-[0.75rem] italic text-navy/40">
                                  Removed in new version
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="mt-3 text-[0.75rem] text-navy/80">
                          <span className="font-semibold">Suggested review: </span>
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
