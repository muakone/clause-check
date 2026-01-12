import { type Finding, type Severity } from "@/lib/mockData";
import { type RuleCategory } from "@/lib/mockData";

export type Rule = {
  id: string;
  title: string;
  severity: Severity;
  category?: RuleCategory;
  run: (text: string) => Finding[];
};

export function runRules(text: string, rules: Rule[]): Finding[] {
  return rules.reduce<Finding[]>((all, rule) => {
    const results = rule.run(text);
    if (Array.isArray(results) && results.length > 0) {
      all.push(...results);
    }
    return all;
  }, []);
}

export const unresolvedPlaceholderRule: Rule = {
  id: "R-101",
  title: "Unresolved commercial placeholder",
  severity: "high",
  category: "commercial-risk",
  run: (text: string): Finding[] => {
    if (!text) return [];

    const placeholder = "[●]";
    const positions: { start: number; end: number }[] = [];

    let searchStart = 0;
    let index: number;

    while ((index = text.indexOf(placeholder, searchStart)) !== -1) {
      positions.push({ start: index, end: index + placeholder.length });
      searchStart = index + placeholder.length;
    }

    if (positions.length === 0) {
      return [];
    }

    const first = positions[0];
    const count = positions.length;

    const finding: Finding = {
      id: "R-101-1",
      severity: "high",
      ruleId: "R-101",
      ruleTitle: "Unresolved commercial placeholder",
      category: "commercial-risk",
      why:
        count === 1
          ? "The document contains an unresolved commercial placeholder '[●]', which should be replaced with an agreed figure or term before signing."
          : `The document contains an unresolved commercial placeholder '[●]' which appears ${count} times; each occurrence should be replaced with an agreed figure or term before signing.`,
      suggestion:
        "Replace each '[●]' with the final agreed amount, date, or term and ensure all parties review and approve the completed provisions before execution.",
      matchedText: placeholder,
      locationLabel:
        count === 1 ? undefined : `Appears ${count} times in the document`,
      start: first.start,
      end: first.end,
    };

    return [finding];
  },
};

export const missingGoverningLawRule: Rule = {
  id: "R-102",
  title: "Missing governing law clause",
  severity: "medium",
  category: "structural-completeness",
  run: (text: string): Finding[] => {
    if (!text) return [];

    const lowered = text.toLowerCase();
    if (lowered.includes("governing law")) {
      return [];
    }

    const finding: Finding = {
      id: "R-102-1",
      severity: "medium",
      ruleId: "R-102",
      ruleTitle: "Missing governing law clause",
      why: "The document does not contain a governing law clause, leaving uncertainty about which jurisdiction's laws apply to the agreement.",
      suggestion:
        "Add a clear governing law clause specifying the jurisdiction (for example, 'This Agreement is governed by and construed in accordance with the laws of [Jurisdiction]').",
      matchedText: "Governing law",
      locationLabel: undefined,
      start: 0,
      end: 0,
    };

    return [finding];
  },
};

export const defaultRules: Rule[] = [
  unresolvedPlaceholderRule,
  missingGoverningLawRule,
];
