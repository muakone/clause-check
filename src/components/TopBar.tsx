"use client";

import * as React from "react";
import { UploadCloud, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RULE_PACK_LIST, type RulePackKey } from "@/rules/packs";
import { AppNav } from "./AppNav";

type TopBarProps = {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  uploadError?: string | null;
  isUploading: boolean;
  selectedPack: RulePackKey;
  onSelectedPackChange: (key: RulePackKey) => void;
  onRunChecks: () => void;
};

export function TopBar({
  searchQuery,
  onSearchChange,
  uploadError,
  isUploading,
  selectedPack,
  onSelectedPackChange,
  onRunChecks,
}: TopBarProps) {
  const handleButtonClick = () => {
    const uploader = document.querySelector<HTMLElement>(
      "input[type='file'][data-main-uploader='true']"
    );
    uploader?.click();
  };

  return (
    <header className="border-b border-tan/40 bg-cream/95 backdrop-blur-sm">
      <div className="mx-auto max-w-6xl px-4 py-3 sm:px-6 sm:py-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-col gap-1">
            <span className="font-serif text-[1.6rem] font-semibold leading-tight tracking-tight">
              chequeck
            </span>
            <span className="text-[0.7rem] font-sans uppercase tracking-[0.3em] text-dusty">
              Agreement clause review
            </span>
          </div>

          <div className="w-full sm:w-auto flex justify-start sm:justify-end">
            <AppNav />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <Tabs
            value={selectedPack}
            onValueChange={(value) =>
              onSelectedPackChange(value as RulePackKey)
            }
            className="hidden md:flex max-w-sm items-center justify-center"
          >
            <TabsList className="inline-flex items-center gap-1 rounded-2xl bg-tan/20 px-1 py-0.5">
              {RULE_PACK_LIST.map((pack) => (
                <TabsTrigger
                  key={pack.key}
                  value={pack.key}
                  className="px-3 py-1 text-[0.65rem] uppercase tracking-[0.18em] text-navy/80 data-[state=active]:bg-cream data-[state=active]:text-navy"
                >
                  {pack.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          <Button
            variant="default"
            className="hidden sm:inline-flex rounded-2xl bg-navy px-4 py-2 text-xs font-semibold text-cream shadow-sm hover:bg-navy/90 focus-visible:ring-2 focus-visible:ring-navy/70 focus-visible:ring-offset-2 focus-visible:ring-offset-cream"
            onClick={onRunChecks}
          >
            Run checks
          </Button>

          <Button
            variant="outline"
            className="rounded-2xl border-tan/60 bg-tan/20 px-4 py-2 text-sm font-medium text-navy shadow-sm transition-colors hover:bg-tan/30 hover:border-tan/80 focus-visible:ring-2 focus-visible:ring-navy/70 focus-visible:ring-offset-2 focus-visible:ring-offset-cream disabled:opacity-70 disabled:cursor-not-allowed"
            onClick={handleButtonClick}
            disabled={isUploading}
          >
            <UploadCloud className="mr-2 h-4 w-4" />
            {isUploading ? "Uploading\t" : "Upload"}
          </Button>

          <div className="relative w-40 xs:w-48 sm:w-64 md:w-72 max-w-full flex-1 min-w-[10rem]">
            <span className="pointer-events-none absolute inset-y-0 left-2 flex items-center text-dusty">
              <Search className="h-4 w-4" />
            </span>
            <Input
              type="search"
              placeholder="Search clauses and findings"
              value={searchQuery}
              onChange={(event) => onSearchChange(event.target.value)}
              className="rounded-2xl border-tan/60 bg-cream/90 pl-8 text-sm text-navy placeholder:text-dusty shadow-sm transition-[border-color,box-shadow,background-color] focus-visible:border-navy focus-visible:bg-cream"
            />
          </div>
        </div>
      </div>
      {uploadError && (
        <div className="mx-auto max-w-6xl px-4 pb-2 text-xs text-red-700 sm:px-6">
          {uploadError}
        </div>
      )}
    </header>
  );
}
