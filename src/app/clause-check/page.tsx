"use client";

import * as React from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "../../components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Severity } from "@/lib/mockData";
import { AppNav } from "@/components/AppNav";

// Clause-level finding model (no start/end positions, tailored for manual checks).
export type ClauseFinding = {
  id: string;
  severity: Severity; // "low" | "medium" | "high"
  ruleTitle: string;
  category: "Discretion" | "Ambiguity" | "Safeguards" | "Waiver";
  why: string;
  suggestion: string;
  matchedText: string;
};

// Internal rule definition for manual clause checks.
type ClauseRule = {
  id: string;
  title: string;
  severity: Severity;
  category: ClauseFinding["category"];
  pattern: RegExp;
  buildFinding: (m: RegExpExecArray, text: string) => Omit<ClauseFinding, "id">;
  // Optional per-clause custom check for more complex patterns.
  customCheck?: (text: string) => Omit<ClauseFinding, "id"> | null;
};

function createClauseRules(): ClauseRule[] {
  const rules: ClauseRule[] = [];

  // Unilateral discretion (HIGH)
  rules.push({
    id: "C-001",
    title: "Unilateral discretion",
    severity: "high",
    category: "Discretion",
    pattern:
      /(sole discretion|absolute discretion|in its discretion|for any reason|without reason|as it sees fit)/gi,
    buildFinding: (match): Omit<ClauseFinding, "id"> => {
      const trigger = match[0];
      return {
        severity: "high",
        ruleTitle: "Unilateral discretion",
        category: "Discretion",
        matchedText: trigger,
        why: "This clause contains unilateral discretion wording (for example, 'sole discretion' or similar), which gives one party very broad decision-making power.",
        suggestion:
          "Consider narrowing this discretion (for example, to 'reasonable discretion') or adding objective criteria and safeguards so decisions are more balanced and predictable.",
      };
    },
  });

  // Undefined commercial terms / ambiguity (MEDIUM)
  rules.push({
    id: "C-002",
    title: "Undefined commercial terms",
    severity: "medium",
    category: "Ambiguity",
    pattern:
      /(to be determined|from time to time|as notified|as may be set|as decided)/gi,
    buildFinding: (match): Omit<ClauseFinding, "id"> => {
      const trigger = match[0];
      return {
        severity: "medium",
        ruleTitle: "Undefined commercial terms",
        category: "Ambiguity",
        matchedText: trigger,
        why: "This clause uses open-ended commercial wording (for example, 'to be determined' or similar), which may leave important terms unclear or changeable without clear limits.",
        suggestion:
          "Where possible, replace this wording with concrete numbers, dates or objective mechanics (for example, a defined process or schedule) so parties understand the commercial deal.",
      };
    },
  });

  // Waiver of rights (HIGH)
  rules.push({
    id: "C-003",
    title: "Broad waiver of rights",
    severity: "high",
    category: "Waiver",
    pattern:
      /(irrevocably waives|not subject to challenge|waives any right|no right to dispute)/gi,
    buildFinding: (match): Omit<ClauseFinding, "id"> => {
      const trigger = match[0];
      return {
        severity: "high",
        ruleTitle: "Broad waiver of rights",
        category: "Waiver",
        matchedText: trigger,
        why: "This clause contains broad waiver wording (for example, 'irrevocably waives' or 'waives any right'), which may prevent a party from challenging the clause or enforcing statutory protections.",
        suggestion:
          "Consider narrowing the waiver, clarifying which rights are waived, and confirming that mandatory protections under applicable law remain unaffected.",
      };
    },
  });

  // Unilateral amendment (HIGH)
  rules.push({
    id: "C-004",
    title: "Unilateral amendment",
    severity: "high",
    category: "Safeguards",
    pattern:
      /(may amend unilaterally|without consent|without approval|by notice only)/gi,
    buildFinding: (match): Omit<ClauseFinding, "id"> => {
      const trigger = match[0];
      return {
        severity: "high",
        ruleTitle: "Unilateral amendment",
        category: "Safeguards",
        matchedText: trigger,
        why: "This clause appears to allow one party to amend terms unilaterally (for example, 'without consent' or 'by notice only'), which can undermine certainty for the other party.",
        suggestion:
          "Consider requiring mutual written agreement for amendments, or limiting any unilateral amendment right to narrow, objectively defined scenarios (such as correcting obvious errors or implementing mandatory legal changes).",
      };
    },
  });

  // One-sided acceleration / on-demand repayment (HIGH)
  rules.push({
    id: "C-005",
    title: "On-demand / immediate repayment",
    severity: "high",
    category: "Safeguards",
    pattern:
      /(repayable on demand|at any time|immediate repayment|for any reason or no reason)/gi,
    buildFinding: (match): Omit<ClauseFinding, "id"> => {
      const trigger = match[0];
      return {
        severity: "high",
        ruleTitle: "On-demand / immediate repayment",
        category: "Safeguards",
        matchedText: trigger,
        why: "This clause suggests one party may demand immediate performance or repayment at will (for example, 'repayable on demand' or similar), which can create significant operational and financial risk for the other party.",
        suggestion:
          "Consider tying acceleration to defined Events of Default or objective triggers instead of unrestricted on-demand rights.",
      };
    },
  });

  // Unilateral amendment without consent (HIGH, per-clause)
  rules.push({
    id: "C-006",
    title: "Unilateral amendment without consent",
    severity: "high",
    category: "Safeguards",
    // Base pattern is not used directly (handled via customCheck), but kept for consistency.
    pattern: /may\s+(?:amend|vary|modify|replace)/gi,
    buildFinding: (match): Omit<ClauseFinding, "id"> => {
      const trigger = match[0];
      return {
        severity: "high",
        ruleTitle: "Unilateral amendment without consent",
        category: "Safeguards",
        matchedText: trigger,
        why: "This clause appears to allow one party to amend terms without the counterparty's consent, which concentrates governance power and can materially change the deal.",
        suggestion:
          "Require amendments to be agreed in writing by both parties, or limit any unilateral amendment right to narrow administrative updates (for example, correcting manifest errors or implementing mandatory legal changes).",
      };
    },
    customCheck: (text: string): Omit<ClauseFinding, "id"> | null => {
      const verbRegex = /may\s+(?:amend|vary|modify|replace)/i;
      const noticeRegex = /by written notice|by notice|upon notice/i;
      const consentRegex =
        /agreed in writing by both parties|signed by both parties|with the consent of the (?:other party|counterparty|parties)/i;

      const verbMatch = verbRegex.exec(text);
      const noticeMatch = noticeRegex.exec(text);

      // Require both an amendment verb and a notice mechanic, and the absence of mutual-consent wording.
      if (!verbMatch || !noticeMatch || consentRegex.test(text)) {
        return null;
      }

      const candidates: string[] = [];
      if (verbMatch[0]) candidates.push(verbMatch[0]);
      if (noticeMatch[0]) candidates.push(noticeMatch[0]);

      const matchedText =
        candidates.length > 0
          ? candidates.reduce((shortest, current) =>
              !shortest || current.length < shortest.length ? current : shortest
            )
          : "may amend";

      return {
        severity: "high",
        ruleTitle: "Unilateral amendment without consent",
        category: "Safeguards",
        matchedText,
        why: "This clause allows one party to amend or vary terms by notice alone, without the other party's express consent. That creates governance risk because key economics or protections could be changed unilaterally.",
        suggestion:
          "Require amendments to be documented as a written agreement signed by both parties, or restrict any unilateral amendment right to narrow, objectively defined administrative updates.",
      };
    },
  });

  return rules;
}

const CLAUSE_RULES = createClauseRules();

function runClauseChecks(text: string): ClauseFinding[] {
  const findings: ClauseFinding[] = [];
  const normalized = text || "";
  if (!normalized.trim()) return findings;

  let counter = 1;

  for (const rule of CLAUSE_RULES) {
    // Custom per-clause checks run once against the whole text.
    if (rule.customCheck) {
      const base = rule.customCheck(normalized);
      if (base) {
        findings.push({
          id: `${rule.id}-${counter++}`,
          ...base,
        });
      }
      continue;
    }

    const regex = new RegExp(rule.pattern.source, rule.pattern.flags);
    let match: RegExpExecArray | null;

    while ((match = regex.exec(normalized)) !== null) {
      const base = rule.buildFinding(match, normalized);
      findings.push({
        id: `${rule.id}-${counter++}`,
        ...base,
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

export default function ManualClauseCheckPage() {
  const [clauseText, setClauseText] = React.useState("");
  const [findings, setFindings] = React.useState<ClauseFinding[]>([]);
  const [hasRun, setHasRun] = React.useState(false);

  const handleRunChecks = () => {
    const trimmed = clauseText.trim();
    if (!trimmed) {
      setFindings([]);
      setHasRun(true);
      return;
    }

    const results = runClauseChecks(trimmed);
    setFindings(results);
    setHasRun(true);
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
        <div className="mx-auto flex max-w-3xl flex-col gap-6">
          <header className="space-y-1">
            <h1 className="font-serif text-2xl font-semibold tracking-tight">
              Manual Clause Check
            </h1>
            <p className="max-w-2xl text-sm text-navy/80">
              Paste a clause to run drafting risk checks (not legal advice).
            </p>
          </header>

          <Card className="rounded-2xl border-tan/40 bg-cream/95 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="font-serif text-[1.05rem] font-semibold tracking-tight">
                Clause text
              </CardTitle>
              <CardDescription className="mt-1 text-xs uppercase tracking-[0.25em] text-dusty">
                Single clause or short passage
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 text-sm">
              <Textarea
                value={clauseText}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setClauseText(e.target.value)
                }
                placeholder="Paste a clause here (e.g. amendment, waiver, discretion, termination)..."
                rows={8}
                className="min-h-40 resize-y rounded-2xl border-dusty/40 bg-cream/95 text-sm text-navy placeholder:text-dusty/70"
              />
              <div className="flex justify-end">
                <Button
                  type="button"
                  className="rounded-full bg-navy px-4 py-2 text-sm font-medium text-cream hover:bg-navy/90"
                  onClick={handleRunChecks}
                >
                  Run clause checks
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="flex min-h-45 flex-col rounded-2xl border-tan/40 bg-cream/95 shadow-md">
            <CardHeader className="pb-2 pt-3 sm:pb-3 sm:pt-4">
              <CardTitle className="font-serif text-[1.05rem] font-semibold tracking-tight">
                Clause findings
              </CardTitle>
              <CardDescription className="mt-1 flex items-center justify-between gap-2 text-[0.7rem] uppercase tracking-[0.25em] text-dusty">
                <span className="truncate">Deterministic checks</span>
                <span className="font-sans text-[0.7rem] text-navy/70">
                  {findings.length} finding{findings.length === 1 ? "" : "s"}
                </span>
              </CardDescription>
            </CardHeader>
            <CardContent className="flex min-h-0 flex-1 pt-1">
              {!hasRun ? (
                <div className="flex w-full items-center justify-center px-4 py-8 text-center text-sm text-navy/60">
                  Paste a clause and run the checks to see results here.
                </div>
              ) : findings.length === 0 ? (
                <div className="flex w-full items-center justify-center px-4 py-8 text-center text-sm text-navy/70">
                  No issues detected by these checks (review still recommended).
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
                            <div className="flex flex-wrap items-center gap-2 text-[0.7rem] uppercase tracking-[0.25em] text-dusty">
                              <span>{finding.category}</span>
                            </div>
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

                        <div className="space-y-2 text-[0.8rem] leading-snug text-navy/90">
                          <div>
                            <span className="font-semibold">Why flagged: </span>
                            {finding.why}
                          </div>
                          <div>
                            <span className="font-semibold">Suggestion: </span>
                            {finding.suggestion}
                          </div>
                          <div>
                            <span className="font-semibold">
                              Trigger phrase:{" "}
                            </span>
                            <code className="rounded bg-cream/80 px-1 py-px font-mono text-[0.75rem]">
                              {finding.matchedText}
                            </code>
                          </div>
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
