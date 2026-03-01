"use client";

import * as React from "react";

import { TopBar } from "./TopBar";
import { DocumentViewer } from "./DocumentViewer";
import { FindingsPanel } from "./FindingsPanel";
import { FindingDetailSheet } from "./FindingDetailSheet";
import { type Finding, type Severity } from "@/lib/mockData";
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
  const [documentText, setDocumentText] = React.useState<string | null>(null);
  const [selectedPack, setSelectedPack] = React.useState<RulePackKey>("core");
  const [findings, setFindings] = React.useState<Finding[]>([]);
  const [uploadError, setUploadError] = React.useState<string | null>(null);
  const [isUploading, setIsUploading] = React.useState(false);
  const [isAiAnalyzing, setIsAiAnalyzing] = React.useState(false);
  const [aiError, setAiError] = React.useState<string | null>(null);
  const [aiCount, setAiCount] = React.useState<number | null>(null);
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

        if (!safeText.trim()) {
          setUploadError(
            "We couldn’t read any text from that document. Please try another .docx or .pdf file."
          );
          setDocumentText(null);
          setFindings([]);
          setResolvedFindingIds([]);
          return;
        }

        setDocumentText(safeText);
        setAiError(null);
        setAiCount(null);

        const pack = RULE_PACKS[selectedPack];
        const rules = pack?.rules ?? [];
        const results = runRules(safeText, rules);
        setFindings(results);
        setResolvedFindingIds([]);

        // Fire AI analysis in background — merges findings as they arrive
        setIsAiAnalyzing(true);
        fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: safeText }),
        })
          .then(async (r) => {
            const body = await r.json();
            if (!r.ok) throw new Error((body as { error?: string }).error ?? "AI analysis failed");
            return body as { findings: unknown[] };
          })
          .then(({ findings: aiRaw }) => {
            if (!Array.isArray(aiRaw)) return;
            const aiFindings: Finding[] = aiRaw.map((f, i) => {
              const item = f as Record<string, unknown>;
              return {
                id: `AI-${i + 1}`,
                severity: (item.severity as Finding["severity"]) ?? "medium",
                ruleId: `AI-${i + 1}`,
                ruleTitle: (item.title as string) ?? "AI Finding",
                category: item.category as Finding["category"],
                why: (item.why as string) ?? "",
                suggestion: (item.suggestion as string) ?? "",
                matchedText: (item.matchedText as string) ?? "",
                locationLabel: item.locationLabel as string | undefined,
              };
            });
            setFindings((prev) => [...prev, ...aiFindings]);
            setAiCount(aiFindings.length);
          })
          .catch((err: unknown) => {
            const msg = err instanceof Error ? err.message : "AI analysis failed";
            setAiError(msg);
          })
          .finally(() => setIsAiAnalyzing(false));
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        console.error("Failed to read document", msg);
        setUploadError(msg);
      } finally {
        setIsUploading(false);
      }
    },
    [selectedPack]
  );

  const handleRunChecks = React.useCallback(() => {
    if (!documentText) return;

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
    <title>chequeck Findings Report</title>
    <style>
      body { font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; color: #111827; padding: 24px; }
      h1 { font-size: 20px; margin-bottom: 4px; }
      h2 { font-size: 14px; margin-top: 18px; margin-bottom: 6px; }
      table { border-collapse: collapse; width: 100%; margin-top: 8px; }
      th { text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.12em; color: #6b7280; padding: 4px 8px; border-bottom: 1px solid #d1d5db; }
    </style>
  </head>
  <body>
    <h1>chequeck findings report</h1>
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

  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const handleFileInputChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      void handleUpload(file);
    }
    // allow re-uploading the same file
    event.target.value = "";
  };

  const triggerUpload = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="min-h-screen bg-cream text-navy flex flex-col">
      <TopBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        uploadError={uploadError}
        isUploading={isUploading}
        selectedPack={selectedPack}
        onSelectedPackChange={setSelectedPack}
        onRunChecks={handleRunChecks}
      />

      <input
        ref={fileInputRef}
        type="file"
        accept=".docx,.pdf"
        className="hidden"
        data-main-uploader="true"
        onChange={handleFileInputChange}
      />

      {/* AI status banner */}
      {isAiAnalyzing && (
        <div className="border-b border-navy/20 bg-navy px-4 py-2 sm:px-6">
          <div className="mx-auto flex max-w-6xl items-center gap-3">
            <span className="h-3 w-3 animate-spin rounded-full border-2 border-cream border-t-transparent" />
            <span className="text-[0.8rem] font-medium text-cream">
              Analysing document for additional risks…
            </span>
          </div>
        </div>
      )}
      {aiError && !isAiAnalyzing && (
        <div className="border-b border-red-300 bg-red-50 px-4 py-2 sm:px-6">
          <div className="mx-auto max-w-6xl text-[0.75rem] text-red-700">
            AI analysis failed — {aiError}
          </div>
        </div>
      )}
      {aiCount !== null && !isAiAnalyzing && !aiError && (
        <div className="border-b border-navy/20 bg-navy/8 px-4 py-2 sm:px-6">
          <div className="mx-auto max-w-6xl text-[0.75rem] font-medium text-navy">
            AI found {aiCount} additional finding{aiCount !== 1 ? "s" : ""} — look for the{" "}
            <span className="inline-flex items-center rounded-full border border-navy bg-navy px-1.5 py-0 text-[0.6rem] font-bold text-cream">
              AI
            </span>{" "}
            badge in the list.
          </div>
        </div>
      )}

      <main className="flex-1 px-4 pb-6 pt-3 sm:px-6">
        <div className="mx-auto grid max-w-6xl gap-5 md:grid-cols-[2fr_1fr]">
          <DocumentViewer
            documentText={documentText}
            findings={visibleFindings}
            openFinding={handleSelectFinding}
            isLoading={isUploading}
            onUploadClick={triggerUpload}
          />

          <FindingsPanel
            findings={visibleFindings}
            activeSeverity={activeSeverity}
            searchQuery={searchQuery}
            onSeverityChange={setActiveSeverity}
            onSelectFinding={handleSelectFinding}
            onExportReport={handleExportReport}
            isAiAnalyzing={isAiAnalyzing}
            aiError={aiError}
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
