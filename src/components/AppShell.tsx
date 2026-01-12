"use client";

import * as React from "react";

import { TopBar } from "./TopBar";
import { DocumentViewer } from "./DocumentViewer";
import { FindingsPanel } from "./FindingsPanel";
import { FindingDetailSheet } from "./FindingDetailSheet";
import {
  mockLoanDocumentText,
  type Finding,
  type Severity,
} from "@/lib/mockData";
import { extractDocx } from "@/utils/extractDocx";
import { extractPdf } from "@/utils/extractPdf";
import { runRules } from "@/rules/ruleEngine";
import { RULE_PACKS, type RulePackKey } from "@/rules/packs";

export function AppShell() {
  const [selectedFinding, setSelectedFinding] = React.useState<Finding | null>(
    null
  );
  const [openSheet, setOpenSheet] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [activeSeverity, setActiveSeverity] = React.useState<Severity | "all">(
    "all"
  );
  const [documentText, setDocumentText] =
    React.useState<string>(mockLoanDocumentText);
  const [selectedPack, setSelectedPack] = React.useState<RulePackKey>("core");
  const [findings, setFindings] = React.useState<Finding[]>([]);
  const [uploadError, setUploadError] = React.useState<string | null>(null);
  const [isUploading, setIsUploading] = React.useState(false);
  const [resolvedFindingIds, setResolvedFindingIds] = React.useState<string[]>(
    []
  );

  const handleSelectFinding = React.useCallback((finding: Finding) => {
    setSelectedFinding(finding);
    setOpenSheet(true);
  }, []);

  const handleUpload = React.useCallback(
    async (file: File) => {
      if (!file) return;

      setUploadError(null);
      const name = file.name.toLowerCase();
      const isDocx = name.endsWith(".docx");
      const isPdf = name.endsWith(".pdf");

      if (!isDocx && !isPdf) {
        setUploadError("Please upload a .docx or .pdf file.");
        return;
      }

      setIsUploading(true);

      try {
        const text = isDocx ? await extractDocx(file) : await extractPdf(file);
        const safeText = text || "";

        setDocumentText(safeText || mockLoanDocumentText);

        const pack = RULE_PACKS[selectedPack];
        const rules = pack?.rules ?? [];
        const results = runRules(safeText, rules);
        setFindings(results);
        setResolvedFindingIds([]);
      } catch (error) {
        console.error("Failed to read document", error);
        setUploadError(
          "We couldn’t read that document. Please try another .docx or .pdf file."
        );
      } finally {
        setIsUploading(false);
      }
    },
    [selectedPack]
  );

  const handleRunChecks = React.useCallback(() => {
    const pack = RULE_PACKS[selectedPack];
    const rules = pack?.rules ?? [];
    const results = runRules(documentText, rules);
    setFindings(results);
  }, [documentText, selectedPack]);

  const handleMarkFindingReviewed = React.useCallback((id: string) => {
    setResolvedFindingIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
    setSelectedFinding((current) =>
      current && current.id === id ? null : current
    );
    setOpenSheet(false);
  }, []);

  const handleExportReport = React.useCallback(() => {
    const total = findings.length;
    const high = findings.filter((f) => f.severity === "high").length;
    const medium = findings.filter((f) => f.severity === "medium").length;
    const low = findings.filter((f) => f.severity === "low").length;

    if (typeof window === "undefined") return;

    const opened = window.open("", "_blank");
    if (!opened) {
      console.error("Unable to open report window");
      return;
    }

    const escapeHtml = (value: string) =>
      value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");

    const rows = findings
      .map((f) => {
        return `
          <tr>
            <td style="padding:4px 8px; border-bottom:1px solid #ddd; font-size:11px; white-space:nowrap;">${escapeHtml(
              f.severity.toUpperCase()
            )}</td>
            <td style="padding:4px 8px; border-bottom:1px solid #ddd; font-size:11px; white-space:nowrap;">${escapeHtml(
              f.ruleId
            )}</td>
            <td style="padding:4px 8px; border-bottom:1px solid #ddd; font-size:11px;">${escapeHtml(
              f.ruleTitle
            )}</td>
            <td style="padding:4px 8px; border-bottom:1px solid #ddd; font-size:11px;">${escapeHtml(
              f.locationLabel ?? ""
            )}</td>
          </tr>
          <tr>
            <td></td>
            <td></td>
            <td colspan="2" style="padding:4px 8px 8px; border-bottom:1px solid #eee; font-size:10px; color:#333;">${escapeHtml(
              f.why
            )}</td>
          </tr>`;
      })
      .join("");

    const html = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>ClauseCheck Findings Report</title>
    <style>
      body { font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; color: #111827; padding: 24px; }
      h1 { font-size: 20px; margin-bottom: 4px; }
      h2 { font-size: 14px; margin-top: 18px; margin-bottom: 6px; }
      table { border-collapse: collapse; width: 100%; margin-top: 8px; }
      th { text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.12em; color: #6b7280; padding: 4px 8px; border-bottom: 1px solid #d1d5db; }
    </style>
  </head>
  <body>
    <h1>ClauseCheck findings report</h1>
    <p style="font-size:11px; color:#4b5563;">Pack: ${escapeHtml(
      RULE_PACKS[selectedPack]?.label ?? selectedPack
    )} · Generated: ${new Date().toLocaleString()}</p>
    <h2>Summary</h2>
    <p style="font-size:11px;">Total findings: <strong>${total}</strong> (High: ${high}, Medium: ${medium}, Low: ${low})</p>
    <h2>Details</h2>
    <table>
      <thead>
        <tr>
          <th>Severity</th>
          <th>Rule</th>
          <th>Title</th>
          <th>Location</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>
    <script>window.onload = function() { window.print(); };</script>
  </body>
</html>`;

    opened.document.open();
    opened.document.write(html);
    opened.document.close();
  }, [findings, selectedPack]);

  const visibleFindings = React.useMemo(
    () => findings.filter((f) => !resolvedFindingIds.includes(f.id)),
    [findings, resolvedFindingIds]
  );

  return (
    <div className="min-h-screen bg-cream text-navy flex flex-col">
      <TopBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onUpload={handleUpload}
        uploadError={uploadError}
        isUploading={isUploading}
        selectedPack={selectedPack}
        onSelectedPackChange={setSelectedPack}
        onRunChecks={handleRunChecks}
      />

      <main className="flex-1 px-4 pb-6 pt-3 sm:px-6">
        <div className="mx-auto grid max-w-6xl gap-5 md:grid-cols-[2fr_1fr]">
          <DocumentViewer
            documentText={documentText}
            findings={visibleFindings}
            openFinding={handleSelectFinding}
            isLoading={isUploading}
          />

          <FindingsPanel
            findings={visibleFindings}
            activeSeverity={activeSeverity}
            searchQuery={searchQuery}
            onSeverityChange={setActiveSeverity}
            onSelectFinding={handleSelectFinding}
            onExportReport={handleExportReport}
          />
        </div>
      </main>

      <FindingDetailSheet
        finding={selectedFinding}
        open={openSheet}
        onOpenChange={setOpenSheet}
        onMarkReviewed={handleMarkFindingReviewed}
      />
    </div>
  );
}
