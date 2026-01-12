"use client";

import * as React from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";

import { SeverityFilter } from "./SeverityFilter";
import { type Finding, type Severity, type RuleCategory } from "@/lib/mockData";

type FindingsPanelProps = {
  findings: Finding[];
  activeSeverity: Severity | "all";
  searchQuery: string;
  onSeverityChange: (severity: Severity | "all") => void;
  onSelectFinding: (finding: Finding) => void;
  onExportReport: () => void;
};

function severityLabel(severity: Severity) {
  switch (severity) {
    case "high":
      return "High";
    case "medium":
      return "Medium";
    case "low":
      return "Low";
  }
}

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

export function FindingsPanel({
  findings,
  activeSeverity,
  searchQuery,
  onSeverityChange,
  onSelectFinding,
  onExportReport,
}: FindingsPanelProps) {
  const { highCount, mediumCount, lowCount } = React.useMemo(() => {
    let high = 0;
    let medium = 0;
    let low = 0;

    findings.forEach((finding) => {
      if (finding.severity === "high") high += 1;
      else if (finding.severity === "medium") medium += 1;
      else if (finding.severity === "low") low += 1;
    });

    return { highCount: high, mediumCount: medium, lowCount: low };
  }, [findings]);

  const filteredFindings = React.useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return findings.filter((finding) => {
      const matchesSeverity =
        activeSeverity === "all" || finding.severity === activeSeverity;

      if (!normalizedQuery) return matchesSeverity;

      const haystack = (
        finding.ruleId +
        " " +
        finding.ruleTitle +
        " " +
        finding.why +
        " " +
        finding.matchedText +
        " " +
        (finding.locationLabel ?? "")
      ).toLowerCase();

      const matchesQuery = haystack.includes(normalizedQuery);

      return matchesSeverity && matchesQuery;
    });
  }, [findings, activeSeverity, searchQuery]);

  return (
    <Card className="flex flex-col rounded-2xl border-tan/40 bg-cream/95 shadow-md max-h-[calc(100vh-6rem)]">
      <CardHeader className="pb-2 pt-3 sm:pb-3 sm:pt-4">
        <CardTitle className="font-serif text-[1.1rem] font-semibold tracking-tight">
          Findings
        </CardTitle>
        <CardDescription className="mt-1 flex items-center justify-between gap-2 text-[0.7rem] uppercase tracking-[0.25em] text-dusty">
          <span className="truncate">Review results</span>
          <span className="font-sans text-[0.7rem] text-navy/70">
            {filteredFindings.length} of {findings.length} shown
          </span>
        </CardDescription>
        <div className="mt-2 flex items-center justify-between gap-2">
          <div className="flex flex-wrap gap-2 text-[0.7rem] text-navy/80">
            <span>High: {highCount}</span>
            <span>Medium: {mediumCount}</span>
            <span>Low: {lowCount}</span>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-full border-tan/60 bg-cream/80 px-3 py-1 text-[0.7rem] font-medium text-navy hover:bg-tan/20"
            onClick={onExportReport}
          >
            Export report
          </Button>
        </div>
        <div className="mt-3">
          <SeverityFilter
            activeSeverity={activeSeverity}
            onChange={onSeverityChange}
          />
        </div>
      </CardHeader>

      <CardContent className="flex min-h-0 flex-1 pt-1">
        <ScrollArea className="h-full w-full pr-2">
          <div className="divide-y divide-tan/30 text-sm">
            {filteredFindings.map((finding) => (
              <button
                key={finding.id}
                type="button"
                onClick={() => onSelectFinding(finding)}
                className="flex w-full flex-col items-stretch gap-1 py-3 text-left transition-[background-color,box-shadow,transform] hover:bg-tan/10 hover:shadow-sm hover:-translate-y-[0.5px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy/70 focus-visible:ring-offset-2 focus-visible:ring-offset-cream"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex flex-col gap-1">
                    <div className="font-serif text-[0.95rem] font-semibold leading-snug">
                      {finding.ruleTitle}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-[0.65rem] uppercase tracking-[0.25em] text-dusty">
                      {finding.locationLabel && (
                        <span className="truncate">
                          {finding.locationLabel}
                        </span>
                      )}
                      {categoryLabel(finding.category) && (
                        <span className="rounded-full border border-tan/50 bg-cream/80 px-2 py-[0.05rem] text-[0.6rem] font-semibold normal-case tracking-[0.12em] text-navy/80">
                          {categoryLabel(finding.category)}
                        </span>
                      )}
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className={
                      "ml-2 rounded-full px-2 py-0.5 text-[0.65rem] font-semibold" +
                      " " +
                      severityBadgeClasses(finding.severity)
                    }
                  >
                    {severityLabel(finding.severity)}
                  </Badge>
                </div>
                <p className="mt-1 line-clamp-2 text-[0.8rem] leading-snug text-navy/85">
                  {finding.why}
                </p>
                <Separator className="mt-3 border-tan/15" />
              </button>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
