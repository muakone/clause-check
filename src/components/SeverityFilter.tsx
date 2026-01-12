"use client";

import * as React from "react";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

type Severity = "low" | "medium" | "high";

type SeverityFilterProps = {
  activeSeverity: Severity | "all";
  onChange: (severity: Severity | "all") => void;
};

export function SeverityFilter({
  activeSeverity,
  onChange,
}: SeverityFilterProps) {
  const handleChange = (value: string) => {
    if (
      value === "all" ||
      value === "high" ||
      value === "medium" ||
      value === "low"
    ) {
      onChange(value);
    }
  };

  return (
    <Tabs value={activeSeverity} onValueChange={handleChange}>
      <TabsList className="bg-cream/90 border border-tan/40 rounded-2xl p-1.5 text-[0.7rem] shadow-xs">
        <TabsTrigger
          value="all"
          className="rounded-xl px-3 py-1 text-xs transition-[background-color,color,transform] data-[state=active]:bg-tan/60 data-[state=active]:text-navy hover:bg-tan/30 hover:text-navy/90"
        >
          All
        </TabsTrigger>
        <TabsTrigger
          value="high"
          className="rounded-xl px-3 py-1 text-xs transition-[background-color,color,transform] data-[state=active]:bg-marker/90 data-[state=active]:text-navy hover:bg-marker/80 hover:text-navy/95"
        >
          High
        </TabsTrigger>
        <TabsTrigger
          value="medium"
          className="rounded-xl px-3 py-1 text-xs transition-[background-color,color,transform] data-[state=active]:bg-tan/80 data-[state=active]:text-navy hover:bg-tan/60 hover:text-navy/95"
        >
          Medium
        </TabsTrigger>
        <TabsTrigger
          value="low"
          className="rounded-xl px-3 py-1 text-xs transition-[background-color,color,transform] data-[state=active]:bg-dusty/85 data-[state=active]:text-cream hover:bg-dusty/70 hover:text-cream"
        >
          Low
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
