import { type Rule, unresolvedPlaceholderRule } from "@/rules/ruleEngine";
import { RULES } from "@/rules/rules";

export type RulePackKey = "core" | "definitions" | "crossrefs" | "clarity";

export type RulePack = {
  key: RulePackKey;
  label: string;
  rules: Rule[];
};

const CORE_RULE_IDS = [
  "R-102", // missing governing law
  "R-201",
  "R-202",
  "R-203",
  "R-204",
  "R-205",
  "R-206",
  "R-207",
  "R-208",
  "R-209",
  "R-210",
  "R-211",
  "R-212",
  "R-213",
  "R-215",
  "R-216",
  "R-217",
  "R-218",
  "R-219",
  "R-220",
  "R-701",
  "R-702",
  "R-801",
  "R-802",
  "R-901",
  "R-1001",
  "R-1101",
  "R-1201",
  "R-301",
  "R-302",
  "R-303",
  "R-304",
  "R-305",
  "R-306",
  "R-307",
  "R-308",
  "R-309",
  "R-310",
  "R-311",
];

const DEFINITIONS_RULE_IDS = ["R-501", "R-502"];

const CROSSREF_RULE_IDS = ["R-401"];

const CLARITY_RULE_IDS = ["R-601", "R-602", "R-603"];

const RULES_BY_ID: Record<string, Rule> = {};
for (const rule of RULES) {
  RULES_BY_ID[rule.id] = rule;
}

function buildPack(
  key: RulePackKey,
  label: string,
  ruleIds: string[]
): RulePack {
  const rules: Rule[] = [];

  if (key === "core") {
    // Include the unresolved placeholder rule alongside the core set.
    rules.push(unresolvedPlaceholderRule);
  }

  for (const id of ruleIds) {
    const rule = RULES_BY_ID[id];
    if (rule) {
      rules.push(rule);
    }
  }

  return { key, label, rules };
}

export const RULE_PACK_LIST: RulePack[] = [
  buildPack("core", "Core", CORE_RULE_IDS),
  buildPack("definitions", "Definitions", DEFINITIONS_RULE_IDS),
  buildPack("crossrefs", "Cross-refs", CROSSREF_RULE_IDS),
  buildPack("clarity", "Clarity", CLARITY_RULE_IDS),
];

export const RULE_PACKS: Record<RulePackKey, RulePack> = Object.fromEntries(
  RULE_PACK_LIST.map((pack) => [pack.key, pack])
) as Record<RulePackKey, RulePack>;
