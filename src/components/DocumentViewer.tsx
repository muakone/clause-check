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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { type Finding } from "@/lib/mockData";
import { renderHighlightedText } from "../utils/renderHighlightedText";

type DocumentViewerProps = {
  documentText: string | null;
  findings: Finding[];
  openFinding: (finding: Finding) => void;
  isLoading?: boolean;
  onUploadClick?: () => void;
};

export function DocumentViewer({
  documentText,
  findings,
  openFinding,
  isLoading,
  onUploadClick,
}: DocumentViewerProps) {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [matchRanges, setMatchRanges] = React.useState<
    { start: number; end: number }[]
  >([]);
  const [activeMatchIndex, setActiveMatchIndex] = React.useState(0);

  const scrollRef = React.useRef<HTMLDivElement | null>(null);

  // Compute all case-insensitive matches whenever the query or text changes.
  React.useEffect(() => {
    const q = searchQuery.trim();
    if (!q) {
      setMatchRanges([]);
      setActiveMatchIndex(0);
      return;
    }

    const loweredText = (documentText || "").toLowerCase();
    const loweredQuery = q.toLowerCase();
    const ranges: { start: number; end: number }[] = [];

    let fromIndex = 0;
    while (fromIndex < loweredText.length) {
      const idx = loweredText.indexOf(loweredQuery, fromIndex);
      if (idx === -1) break;
      ranges.push({ start: idx, end: idx + loweredQuery.length });
      fromIndex = idx + loweredQuery.length || idx + 1;
    }

    setMatchRanges(ranges);
    setActiveMatchIndex(0);
  }, [searchQuery, documentText]);

  // Scroll the active match into view when it changes.
  React.useEffect(() => {
    if (!scrollRef.current) return;
    if (!matchRanges.length) return;

    const clampedIndex = Math.max(
      0,
      Math.min(activeMatchIndex, matchRanges.length - 1)
    );
    const root = scrollRef.current;
    const target = root.querySelector<HTMLElement>(
      `[data-search-index="${clampedIndex}"]`
    );

    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [activeMatchIndex, matchRanges]);

  const contentNodes = React.useMemo(() => {
    const safeText = documentText || "";
    return renderHighlightedText(
      safeText,
      findings,
      openFinding,
      matchRanges,
      activeMatchIndex
    );
  }, [documentText, findings, openFinding, matchRanges, activeMatchIndex]);

  const totalMatches = matchRanges.length;
  const displayIndex = totalMatches ? activeMatchIndex + 1 : 0;

  const handlePrev = () => {
    if (!totalMatches) return;
    setActiveMatchIndex((prev) => (prev === 0 ? totalMatches - 1 : prev - 1));
  };

  const handleNext = () => {
    if (!totalMatches) return;
    setActiveMatchIndex((prev) => (prev === totalMatches - 1 ? 0 : prev + 1));
  };

  return (
    <Card className="flex flex-col rounded-2xl border-tan/40 bg-cream/95 shadow-md max-h-[calc(100vh-6rem)]">
      <CardHeader className="pb-2 pt-3 sm:pb-3 sm:pt-4">
        <CardTitle className="font-serif text-[1.1rem] font-semibold tracking-tight">
          Loan agreement
        </CardTitle>
        <CardDescription className="mt-1 text-[0.7rem] uppercase tracking-[0.25em] text-dusty">
          Document — highlighted text shows flagged clauses
        </CardDescription>
        <div className="mt-3 flex items-center gap-2 text-[0.75rem]">
          <Input
            value={searchQuery}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setSearchQuery(e.target.value)
            }
            placeholder="Search in document"
            className="h-8 max-w-55 rounded-full border-dusty/40 bg-cream/95 text-xs text-navy placeholder:text-dusty/70"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 rounded-full border-dusty/60 px-2 text-[0.7rem] text-navy"
            onClick={handlePrev}
            disabled={!totalMatches}
          >
            Prev
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 rounded-full border-dusty/60 px-2 text-[0.7rem] text-navy"
            onClick={handleNext}
            disabled={!totalMatches}
          >
            Next
          </Button>
          <span className="ml-1 text-[0.7rem] text-navy/70">
            {displayIndex} / {totalMatches}
          </span>
        </div>
      </CardHeader>
      <CardContent className="flex min-h-0 flex-1 pt-1">
        {isLoading ? (
          <div className="flex h-full w-full items-center justify-center text-[0.8rem] text-dusty">
            <div className="flex items-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-dusty border-t-transparent" />
              <span>
                Loading document — extracting text and running checks…
              </span>
            </div>
          </div>
        ) : !documentText ? (
          <div className="flex h-full w-full items-center justify-center px-4 py-8 text-center text-sm text-navy/70">
            <div className="space-y-3 max-w-sm">
              <h3 className="font-serif text-[1.05rem] font-semibold tracking-tight">
                Upload a document to begin
              </h3>
              <p className="text-[0.85rem] text-navy/80">
                Upload a .docx file to run checks and view highlights.
              </p>
              <Button
                type="button"
                className="rounded-full bg-navy px-4 py-2 text-sm font-medium text-cream hover:bg-navy/90"
                onClick={onUploadClick}
              >
                Upload .docx
              </Button>
            </div>
          </div>
        ) : (
          <ScrollArea className="h-full w-full pr-3">
            <div ref={scrollRef} className="h-full overflow-y-auto pr-1">
              <article className="prose prose-sm max-w-none font-sans leading-relaxed text-navy">
                <p className="text-[0.9rem] leading-relaxed whitespace-pre-wrap">
                  {contentNodes}
                </p>
              </article>
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
