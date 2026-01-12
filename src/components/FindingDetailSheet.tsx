"use client";

import * as React from "react";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { type Finding, type Severity, type RuleCategory } from "@/lib/mockData";

type FindingDetailSheetProps = {
  finding: Finding | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMarkReviewed?: (findingId: string) => void;
};

function severityBadgeClasses(severity: Severity) {
  switch (severity) {
    case "high":
      return "bg-marker text-navy border-marker/80";
    case "medium":
      return "bg-tan/80 text-navy border-tan/80";
    case "low":
      return "bg-dusty/80 text-cream border-dusty/80";
  }
}

function categoryLabel(category: RuleCategory | undefined): string | null {
  switch (category) {
    case "structural-completeness":
      return "Structural completeness";
    case "commercial-risk":
      return "Commercial risk";
    case "drafting-clarity":
      return "Drafting clarity";
    case "cross-reference-integrity":
      return "Cross-reference integrity";
    default:
      return null;
  }
}

export function FindingDetailSheet({
  finding,
  open,
  onOpenChange,
  onMarkReviewed,
}: FindingDetailSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex h-full w-full max-w-md flex-col gap-0 border-l border-tan/40 bg-cream/98 text-navy shadow-lg"
      >
        {finding ? (
          <>
            <SheetHeader className="gap-2 px-4 pb-2 pt-4">
              <SheetTitle className="font-serif text-[1.1rem] font-semibold leading-snug">
                {finding.ruleTitle}
              </SheetTitle>
              <SheetDescription className="mt-1 flex flex-wrap items-center gap-2 text-[0.7rem] text-dusty">
                <Badge
                  variant="outline"
                  className={
                    "rounded-full px-2 py-0.5 text-[0.65rem] font-semibold" +
                    " " +
                    severityBadgeClasses(finding.severity)
                  }
                >
                  {finding.severity.toUpperCase()} severity
                </Badge>
                {categoryLabel(finding.category) && (
                  <span className="rounded-full border border-tan/50 bg-cream/80 px-2 py-[0.05rem] text-[0.6rem] font-semibold uppercase tracking-[0.18em] text-navy/80">
                    {categoryLabel(finding.category)}
                  </span>
                )}
                <span className="text-[0.7rem] uppercase tracking-[0.25em]">
                  {finding.locationLabel}
                </span>
                <span className="text-[0.7rem] text-dusty/80">
                  Rule {finding.ruleId}
                </span>
              </SheetDescription>
            </SheetHeader>

            <div className="flex-1 space-y-5 overflow-y-auto px-4 pb-5 pt-1 text-sm">
              <section className="space-y-1.5">
                <h3 className="font-serif text-[0.7rem] uppercase tracking-[0.3em] text-dusty">
                  Why this was flagged
                </h3>
                <p className="text-[0.9rem] leading-relaxed text-navy/90">
                  {finding.why}
                </p>
              </section>

              <Separator className="border-tan/30" />

              <section className="space-y-1.5">
                <h3 className="font-serif text-[0.7rem] uppercase tracking-[0.3em] text-dusty">
                  Suggested edit (placeholder)
                </h3>
                <p className="text-[0.9rem] leading-relaxed text-navy/90">
                  {finding.suggestion}
                </p>
              </section>

              <Separator className="border-tan/30" />

              <section className="space-y-1.5">
                <h3 className="font-serif text-[0.7rem] uppercase tracking-[0.3em] text-dusty">
                  Matched snippet
                </h3>
                <div className="rounded-2xl border border-dusty/40 bg-cream p-3 text-xs leading-relaxed shadow-sm">
                  <p className="font-mono text-[0.75rem] leading-relaxed text-navy/95">
                    {finding.matchedText}
                  </p>
                </div>
              </section>
            </div>

            <SheetFooter className="gap-2 border-t border-tan/30 bg-cream/96 px-4 pb-4 pt-3">
              <div className="flex w-full flex-col gap-2 sm:flex-row">
                <Button
                  variant="outline"
                  className="w-full rounded-2xl border-dusty/70 bg-dusty/10 text-sm text-navy transition-colors hover:bg-dusty/20 focus-visible:ring-2 focus-visible:ring-navy/70 focus-visible:ring-offset-2 focus-visible:ring-offset-cream"
                  onClick={() => {
                    if (finding && onMarkReviewed) {
                      onMarkReviewed(finding.id);
                    }
                    onOpenChange(false);
                  }}
                >
                  Mark as reviewed
                </Button>
                <Button
                  className="w-full rounded-2xl bg-navy text-cream text-sm transition-colors hover:bg-navy/90 focus-visible:ring-2 focus-visible:ring-cream/90 focus-visible:ring-offset-2 focus-visible:ring-offset-navy"
                  onClick={() => onOpenChange(false)}
                >
                  Close
                </Button>
              </div>
            </SheetFooter>
          </>
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 px-4 text-center text-sm text-dusty">
            <p className="font-serif text-base font-semibold text-navy">
              No finding selected
            </p>
            <p>
              Choose a clause from the document or from the findings list to see
              details here.
            </p>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
