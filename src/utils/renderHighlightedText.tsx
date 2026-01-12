import * as React from "react";

import { type Finding, type Severity } from "@/lib/mockData";

function getMarkClassName(severity: Severity): string {
  switch (severity) {
    case "high":
      return "cursor-pointer rounded-[0.2rem] bg-marker/70 px-1 py-0.5 font-semibold text-navy underline-offset-2";
    case "medium":
      return "cursor-pointer rounded-[0.2rem] bg-tan/60 px-1 py-0.5 font-semibold text-navy underline-offset-2";
    case "low":
      return "cursor-pointer rounded-[0.2rem] bg-dusty/50 px-1 py-0.5 font-semibold text-cream underline-offset-2";
    default:
      return "cursor-pointer rounded-[0.2rem] bg-marker/70 px-1 py-0.5 font-semibold text-navy underline-offset-2";
  }
}

function getSearchMarkClassName(isActive: boolean): string {
  // Softer, neutral highlight using the existing dusty tone,
  // distinct from the marker/tan severity backgrounds.
  return isActive
    ? "rounded-[0.2rem] bg-dusty/30 px-1 py-0.5 text-navy ring-1 ring-dusty/70"
    : "rounded-[0.2rem] bg-dusty/20 px-1 py-0.5 text-navy";
}

export function renderHighlightedText(
  text: string,
  findings: Finding[],
  onSelectFinding: (finding: Finding) => void,
  searchMatches?: { start: number; end: number }[],
  activeSearchIndex: number = 0
): React.ReactNode {
  if (!text) return null;

  type FindingMatch = { start: number; end: number; finding: Finding };

  const findingMatches: FindingMatch[] = [];

  for (const finding of findings) {
    const { start, end } = finding;

    if (
      typeof start !== "number" ||
      typeof end !== "number" ||
      !Number.isFinite(start) ||
      !Number.isFinite(end) ||
      end <= start ||
      start < 0 ||
      end > text.length
    ) {
      continue;
    }

    findingMatches.push({ start, end, finding });
  }

  findingMatches.sort((a, b) => a.start - b.start);

  const searchRanges: { start: number; end: number }[] = [];
  if (searchMatches && searchMatches.length > 0) {
    for (const m of searchMatches) {
      if (
        typeof m.start !== "number" ||
        typeof m.end !== "number" ||
        !Number.isFinite(m.start) ||
        !Number.isFinite(m.end) ||
        m.end <= m.start ||
        m.start < 0 ||
        m.end > text.length
      ) {
        continue;
      }
      searchRanges.push({ start: m.start, end: m.end });
    }
    searchRanges.sort((a, b) => a.start - b.start);
  }

  if (!findingMatches.length && !searchRanges.length) {
    return text;
  }

  // Collect all boundary positions from finding and search ranges
  const boundaries = new Set<number>();
  boundaries.add(0);
  boundaries.add(text.length);

  for (const m of findingMatches) {
    boundaries.add(m.start);
    boundaries.add(m.end);
  }
  for (const m of searchRanges) {
    boundaries.add(m.start);
    boundaries.add(m.end);
  }

  const sortedBounds = Array.from(boundaries).sort((a, b) => a - b);

  const nodes: React.ReactNode[] = [];

  for (let i = 0; i < sortedBounds.length - 1; i++) {
    const segStart = sortedBounds[i];
    const segEnd = sortedBounds[i + 1];

    if (segStart === segEnd) continue;

    const segmentText = text.slice(segStart, segEnd);

    const findingMatch = findingMatches.find(
      (m) => segStart >= m.start && segStart < m.end
    );

    let searchIndex = -1;
    let hasSearch = false;
    if (searchRanges.length) {
      for (let j = 0; j < searchRanges.length; j++) {
        const m = searchRanges[j];
        if (segStart >= m.start && segStart < m.end) {
          searchIndex = j;
          hasSearch = true;
          break;
        }
      }
    }

    const isActiveSearch = hasSearch && searchIndex === activeSearchIndex;

    if (!findingMatch && !hasSearch) {
      nodes.push(<span key={`t-${segStart}`}>{segmentText}</span>);
      continue;
    }

    // If this segment is part of a search match but not a finding,
    // use the dedicated search highlight style.
    if (!findingMatch && hasSearch) {
      nodes.push(
        <mark
          key={`s-${segStart}`}
          className={getSearchMarkClassName(isActiveSearch)}
          data-search-index={searchIndex}
        >
          {segmentText}
        </mark>
      );
      continue;
    }

    // If both a finding and a search match apply, prioritise the
    // search colour but keep the finding click behaviour.
    if (findingMatch && hasSearch) {
      nodes.push(
        <mark
          key={`fs-${segStart}`}
          className={getSearchMarkClassName(isActiveSearch)}
          data-search-index={searchIndex}
          onClick={() => onSelectFinding(findingMatch.finding)}
        >
          {segmentText}
        </mark>
      );
      continue;
    }

    // Finding-only highlight (original behaviour).
    if (findingMatch) {
      nodes.push(
        <mark
          key={`f-${segStart}`}
          className={getMarkClassName(findingMatch.finding.severity)}
          onClick={() => onSelectFinding(findingMatch.finding)}
        >
          {segmentText}
        </mark>
      );
    }
  }

  return nodes;
}
