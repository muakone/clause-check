import { type Severity, type Finding, type RuleCategory } from "@/lib/mockData";
import { type Rule, missingGoverningLawRule } from "@/rules/ruleEngine";

type RequiredSectionConfig = {
  ruleId: string;
  title: string;
  severity: Severity;
  sectionLabel: string;
  pattern: RegExp;
};

type PlaceholderPatternConfig = {
  ruleId: string;
  title: string;
  severity: Severity;
  category: RuleCategory;
  pattern: RegExp;
  placeholderLabel: string;
};

type Sentence = {
  text: string;
  start: number;
  end: number;
};

type DefinitionOccurrence = {
  index: number;
  matchedText: string;
};

type DefinitionInfo = {
  term: string;
  occurrences: DefinitionOccurrence[];
};

const REQUIRED_SECTIONS_CONFIG: RequiredSectionConfig[] = [
  {
    ruleId: "R-201",
    title: "Missing 'Interpretation' section",
    severity: "medium",
    sectionLabel: "Interpretation",
    pattern: /\bInterpretation\b/i,
  },
  {
    ruleId: "R-202",
    title: "Missing 'Definitions' section",
    severity: "medium",
    sectionLabel: "Definitions",
    pattern: /\bDefinitions?\b/i,
  },
  {
    ruleId: "R-203",
    title: "Missing 'Conditions Precedent' section",
    severity: "high",
    sectionLabel: "Conditions Precedent",
    pattern: /\bConditions? Precedent\b/i,
  },
  {
    ruleId: "R-204",
    title: "Missing 'Payment Terms' section",
    severity: "high",
    sectionLabel: "Payment Terms",
    pattern: /\bPayment Terms?\b/i,
  },
  {
    ruleId: "R-207",
    title: "Missing 'Fees' section",
    severity: "medium",
    sectionLabel: "Fees",
    pattern: /\bFees?\b/i,
  },
  {
    ruleId: "R-208",
    title: "Missing 'Representations and Warranties' section",
    severity: "high",
    sectionLabel: "Representations and Warranties",
    pattern: /\bRepresentations? and Warranties\b/i,
  },
  {
    ruleId: "R-209",
    title: "Missing 'Covenants' section",
    severity: "medium",
    sectionLabel: "Covenants",
    pattern: /\bCovenants\b/i,
  },
  {
    ruleId: "R-210",
    title: "Missing 'Events of Default' section",
    severity: "high",
    sectionLabel: "Events of Default",
    pattern: /\bEvents? of Default\b/i,
  },
  {
    ruleId: "R-211",
    title: "Missing 'Governing Law' section",
    severity: "high",
    sectionLabel: "Governing Law",
    pattern: /\bGoverning Law\b/i,
  },
  {
    ruleId: "R-212",
    title: "Missing 'Notices' section",
    severity: "medium",
    sectionLabel: "Notices",
    pattern: /\bNotices\b/i,
  },
  {
    ruleId: "R-213",
    title: "Missing 'Assignment and Transfer' section",
    severity: "medium",
    sectionLabel: "Assignment and Transfer",
    pattern: /\bAssignment and Transfer\b/i,
  },
  {
    ruleId: "R-215",
    title: "Missing 'Indemnity' section",
    severity: "medium",
    sectionLabel: "Indemnity",
    pattern: /\bIndemnity\b/i,
  },
  {
    ruleId: "R-216",
    title: "Missing 'Costs and Expenses' section",
    severity: "medium",
    sectionLabel: "Costs and Expenses",
    pattern: /\bCosts? and Expenses\b/i,
  },
  {
    ruleId: "R-217",
    title: "Missing 'Confidentiality' section",
    severity: "medium",
    sectionLabel: "Confidentiality",
    pattern: /\bConfidentiality\b/i,
  },
  {
    ruleId: "R-218",
    title: "Missing 'Liability' section",
    severity: "medium",
    sectionLabel: "Liability",
    pattern: /\bLiabilit(?:y|ies)\b/i,
  },
  {
    ruleId: "R-219",
    title: "Missing 'Jurisdiction' section",
    severity: "medium",
    sectionLabel: "Jurisdiction",
    pattern: /\bJurisdiction\b/i,
  },
  {
    ruleId: "R-220",
    title: "Missing 'Termination' section",
    severity: "high",
    sectionLabel: "Termination",
    pattern: /\bTermination\b/i,
  },
];

const PLACEHOLDER_PATTERNS: PlaceholderPatternConfig[] = [
  {
    ruleId: "R-301",
    title: "Unresolved [●] placeholder",
    severity: "high",
    category: "commercial-risk",
    pattern: /\[\s*●\s*\]/g,
    placeholderLabel: "[●]",
  },
  {
    ruleId: "R-302",
    title: "TBD placeholder",
    severity: "high",
    category: "commercial-risk",
    pattern: /\bTBD\b/gi,
    placeholderLabel: "TBD",
  },
  {
    ruleId: "R-303",
    title: "TO BE INSERTED placeholder",
    severity: "high",
    category: "commercial-risk",
    pattern: /\bTO BE INSERTED\b/gi,
    placeholderLabel: "TO BE INSERTED",
  },
  {
    ruleId: "R-304",
    title: "TO BE AGREED placeholder",
    severity: "high",
    category: "commercial-risk",
    pattern: /\bTO BE AGREED\b/gi,
    placeholderLabel: "TO BE AGREED",
  },
  {
    ruleId: "R-305",
    title: "INSERT ... placeholder",
    severity: "medium",
    category: "commercial-risk",
    pattern: /\bINSERT\b[^.]{0,80}/gi,
    placeholderLabel: "INSERT ...",
  },
  {
    ruleId: "R-306",
    title: "Angle bracket placeholder",
    severity: "medium",
    category: "commercial-risk",
    pattern: /<<[^>]+>>/g,
    placeholderLabel: "<<...>>",
  },
  {
    ruleId: "R-307",
    title: "Underscore line placeholder",
    severity: "medium",
    category: "commercial-risk",
    pattern: /_{5,}/g,
    placeholderLabel: "________",
  },
  {
    ruleId: "R-308",
    title: "XXX placeholder",
    severity: "medium",
    category: "commercial-risk",
    pattern: /\bX{3,}\b/gi,
    placeholderLabel: "XXX",
  },
  {
    ruleId: "R-309",
    title: "TO COME placeholder",
    severity: "medium",
    category: "commercial-risk",
    pattern: /\bTO COME\b/gi,
    placeholderLabel: "TO COME",
  },
  {
    ruleId: "R-310",
    title: "DRAFTING NOTE marker",
    severity: "low",
    category: "drafting-clarity",
    pattern: /\bDRAFT(?:ING)? NOTE\b/gi,
    placeholderLabel: "DRAFTING NOTE",
  },
  {
    ruleId: "R-311",
    title: "Instructional bracket placeholder",
    severity: "medium",
    category: "commercial-risk",
    pattern: /\[[^\]]*to be (?:completed|inserted|agreed)[^\]]*\]/gi,
    placeholderLabel: "[to be completed]",
  },
];

const CLAUSE_OR_SECTION_REF = /\b(clause|section)\s+(\d+(?:\.\d+)*)\b/gi;
const SCHEDULE_REF = /\bSchedule\s+(\d+)\b/gi;

const COMMON_CAPITALISED_WORDS = new Set<string>([
  "agreement",
  "party",
  "parties",
  "clause",
  "section",
  "schedule",
  "annex",
  "appendix",
  "business",
  "day",
  "date",
  "month",
  "year",
  "company",
  "subsidiary",
  "group",
  "person",
  "this",
  "that",
  "these",
  "those",
  "any",
  "each",
  "other",
]);

// --- Financial covenant and risk-focused rules ---

const FINANCIAL_COVENANT_TERMS = [
  "Leverage Ratio",
  "Interest Cover",
  "Interest Coverage Ratio",
  "DSCR",
  "Debt Service Coverage Ratio",
];

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function createRequiredSectionRules(configs: RequiredSectionConfig[]): Rule[] {
  return configs.map((config) => ({
    id: config.ruleId,
    title: config.title,
    severity: config.severity,
    category: "structural-completeness",
    run: (text: string): Finding[] => {
      if (!text) return [];

      const pattern = new RegExp(config.pattern.source, config.pattern.flags);
      if (pattern.test(text)) {
        return [];
      }

      const finding: Finding = {
        id: config.ruleId + "-1",
        severity: config.severity,
        ruleId: config.ruleId,
        ruleTitle: config.title,
        why:
          "The document does not appear to contain a clearly labeled '" +
          config.sectionLabel +
          "' section, which is typically expected in a well-structured agreement.",
        suggestion:
          "Add a '" +
          config.sectionLabel +
          "' section with appropriate wording or confirm that its content is clearly covered elsewhere in the document.",
        matchedText: config.sectionLabel,
        locationLabel: "Whole document",
        start: 0,
        end: 0,
      };

      return [finding];
    },
  }));
}

function createPlaceholderRules(configs: PlaceholderPatternConfig[]): Rule[] {
  return configs.map((config) => ({
    id: config.ruleId,
    title: config.title,
    severity: config.severity,
    category: config.category,
    run: (text: string): Finding[] => {
      if (!text) return [];

      const findings: Finding[] = [];
      const regex = new RegExp(config.pattern.source, config.pattern.flags);
      let match: RegExpExecArray | null;
      let counter = 1;

      while ((match = regex.exec(text)) !== null) {
        const matchedText = match[0];
        const startIndex = match.index;
        const endIndex = startIndex + matchedText.length;

        findings.push({
          id: config.ruleId + "-" + counter,
          severity: config.severity,
          ruleId: config.ruleId,
          ruleTitle: config.title,
          why:
            "The document contains a placeholder ('" +
            config.placeholderLabel +
            "') that should be replaced with final, agreed wording before execution.",
          suggestion:
            "Replace this placeholder with the final agreed detail (for example, amounts, dates, party names, or bespoke drafting), or remove it if no longer required.",
          matchedText,
          locationLabel: undefined,
          start: startIndex,
          end: endIndex,
        });

        counter += 1;
      }

      return findings;
    },
  }));
}

function getSentences(text: string): Sentence[] {
  const sentences: Sentence[] = [];
  if (!text) return sentences;

  const regex = /[^.?!]+[.?!]/g;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    const raw = match[0];
    const trimmed = raw.trim();
    if (!trimmed) continue;

    const start = match.index;
    const end = match.index + raw.length;
    sentences.push({ text: trimmed, start, end });
  }

  return sentences;
}

function extractDefinitions(text: string): Map<string, DefinitionInfo> {
  const map = new Map<string, DefinitionInfo>();
  if (!text) return map;

  const regex = /["“](.+?)["”]\s+means\b/gi;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    const term = match[1] ? match[1].trim() : "";
    if (!term) continue;

    const key = term.toLowerCase();
    const existing = map.get(key) || { term, occurrences: [] };
    existing.occurrences.push({ index: match.index, matchedText: match[0] });
    map.set(key, existing);
  }

  return map;
}

function createCrossReferenceRule(): Rule {
  return {
    id: "R-401",
    title: "Broken cross-references",
    severity: "medium",
    category: "cross-reference-integrity",
    run: (text: string): Finding[] => {
      if (!text) return [];

      const findings: Finding[] = [];
      let counter = 1;

      const clauseOrSectionRegex = new RegExp(
        CLAUSE_OR_SECTION_REF.source,
        CLAUSE_OR_SECTION_REF.flags
      );
      let match: RegExpExecArray | null;

      while ((match = clauseOrSectionRegex.exec(text)) !== null) {
        const label = match[1];
        const number = match[2];
        const refText = match[0];

        const headingPattern = new RegExp(
          "(^|\\n)\\s*(?:" + label + "\\s+)?" + escapeRegExp(number) + "\\b",
          "i"
        );

        if (!headingPattern.test(text)) {
          const startIndex = match.index;
          const endIndex = startIndex + refText.length;

          findings.push({
            id: "R-401-" + counter,
            severity: "medium",
            ruleId: "R-401",
            ruleTitle: "Reference to non-existent clause or section",
            why:
              "The document refers to " +
              label +
              " " +
              number +
              ", but no corresponding heading or clause number could be found. This may indicate a broken or outdated cross-reference.",
            suggestion:
              "Either insert a clause or section numbered " +
              number +
              ", or update this reference to point to the correct provision.",
            matchedText: refText,
            locationLabel: label + " " + number + " reference",
            start: startIndex,
            end: endIndex,
          });

          counter += 1;
        }
      }

      const scheduleRegex = new RegExp(SCHEDULE_REF.source, SCHEDULE_REF.flags);
      while ((match = scheduleRegex.exec(text)) !== null) {
        const number = match[1];
        const refText = match[0];

        const headingPattern = new RegExp(
          "(^|\\n)\\s*SCHEDULE\\s+" + escapeRegExp(number) + "\\b",
          "i"
        );

        if (!headingPattern.test(text)) {
          const startIndex = match.index;
          const endIndex = startIndex + refText.length;

          findings.push({
            id: "R-401-" + counter,
            severity: "medium",
            ruleId: "R-401",
            ruleTitle: "Reference to non-existent schedule",
            why:
              "The document refers to Schedule " +
              number +
              ", but no corresponding schedule heading could be found. This may indicate a broken or outdated cross-reference.",
            suggestion:
              "Either insert a schedule numbered " +
              number +
              ", or update this reference to point to the correct schedule.",
            matchedText: refText,
            locationLabel: "Schedule " + number + " reference",
            start: startIndex,
            end: endIndex,
          });

          counter += 1;
        }
      }

      return findings;
    },
  };
}

function createDuplicateDefinitionsRule(): Rule {
  return {
    id: "R-501",
    title: "Duplicate defined terms",
    severity: "medium",
    category: "drafting-clarity",
    run: (text: string): Finding[] => {
      const definitions = extractDefinitions(text);
      const findings: Finding[] = [];
      let counter = 1;

      definitions.forEach((info) => {
        if (info.occurrences.length > 1) {
          const second = info.occurrences[1] || info.occurrences[0];
          const startIndex = second.index;
          const endIndex = second.index + second.matchedText.length;

          findings.push({
            id: "R-501-" + counter,
            severity: "medium",
            ruleId: "R-501",
            ruleTitle: "Duplicate defined term",
            why:
              'The term "' +
              info.term +
              '" appears to be defined more than once in the document. Multiple definitions of the same term can create ambiguity.',
            suggestion:
              "Consolidate the definitions of this term into a single, clear definition and remove any redundant or inconsistent duplicates.",
            matchedText: '"' + info.term + '" means',
            locationLabel: "Definitions section",
            start: startIndex,
            end: endIndex,
          });

          counter += 1;
        }
      });

      return findings;
    },
  };
}

function createUndefinedCapitalisedTermsRule(): Rule {
  return {
    id: "R-502",
    title: "Capitalised terms used but not defined",
    severity: "low",
    category: "drafting-clarity",
    run: (text: string): Finding[] => {
      if (!text) return [];

      const definitions = extractDefinitions(text);
      const definedKeys = new Set<string>();
      definitions.forEach((info, key) => {
        definedKeys.add(key);
      });

      const usage: {
        [key: string]: {
          count: number;
          example: string;
          index: number;
        };
      } = {};

      const regex = /\b[A-Z][a-zA-Z]+\b/g;
      let match: RegExpExecArray | null;

      while ((match = regex.exec(text)) !== null) {
        const word = match[0];
        const key = word.toLowerCase();

        if (COMMON_CAPITALISED_WORDS.has(key)) continue;
        if (definedKeys.has(key)) continue;

        const existing = usage[key];
        if (existing) {
          existing.count += 1;
        } else {
          usage[key] = {
            count: 1,
            example: word,
            index: match.index,
          };
        }
      }

      const findings: Finding[] = [];
      let counter = 1;

      Object.keys(usage).forEach((key) => {
        const info = usage[key];
        if (info.count >= 3) {
          const startIndex = info.index;
          const endIndex = info.index + info.example.length;

          findings.push({
            id: "R-502-" + counter,
            severity: "low",
            ruleId: "R-502",
            ruleTitle: "Capitalised term used but not defined",
            why:
              'The capitalised term "' +
              info.example +
              '" appears repeatedly in the document (approximately ' +
              info.count +
              " times) but does not have a clear definition. This may cause uncertainty over its precise meaning.",
            suggestion:
              "Either add a formal definition for this term in the definitions section or use lower-case language if no special defined meaning is intended.",
            matchedText: info.example,
            locationLabel: "Repeated undefined capitalised term",
            start: startIndex,
            end: endIndex,
          });

          counter += 1;
        }
      });

      return findings;
    },
  };
}

function createLongSentenceRule(): Rule {
  return {
    id: "R-601",
    title: "Very long sentences",
    severity: "low",
    category: "drafting-clarity",
    run: (text: string): Finding[] => {
      const sentences = getSentences(text);
      const findings: Finding[] = [];
      let counter = 1;

      sentences.forEach((sentence) => {
        const words = sentence.text.split(/\s+/).filter(Boolean);
        if (words.length > 45) {
          findings.push({
            id: "R-601-" + counter,
            severity: "low",
            ruleId: "R-601",
            ruleTitle: "Very long sentence",
            why:
              "This sentence is very long (approximately " +
              words.length +
              " words), which can make it hard to read and interpret.",
            suggestion:
              "Consider breaking this sentence into shorter sentences or using sub-paragraphs to improve clarity.",
            matchedText: sentence.text,
            locationLabel: "Long sentence",
            start: sentence.start,
            end: sentence.end,
          });

          counter += 1;
        }
      });

      return findings;
    },
  };
}

function createConditionalPhraseDensityRule(): Rule {
  const phrases = ["provided that", "subject to", "notwithstanding"];

  return {
    id: "R-602",
    title: "Heavy use of conditional phrases",
    severity: "medium",
    category: "drafting-clarity",
    run: (text: string): Finding[] => {
      const sentences = getSentences(text);
      const findings: Finding[] = [];
      let counter = 1;

      sentences.forEach((sentence) => {
        const lowered = sentence.text.toLowerCase();
        let total = 0;

        phrases.forEach((phrase) => {
          let index = -1;
          while ((index = lowered.indexOf(phrase, index + 1)) !== -1) {
            total += 1;
          }
        });

        if (total >= 3) {
          findings.push({
            id: "R-602-" + counter,
            severity: "medium",
            ruleId: "R-602",
            ruleTitle: "Sentence with many conditional phrases",
            why: "This sentence contains several conditional phrases (for example, 'provided that', 'subject to', 'notwithstanding'), which can make the operative effect difficult to follow.",
            suggestion:
              "Consider simplifying the structure, moving some conditions into separate sub-paragraphs, or using clearer signposting for each condition.",
            matchedText: sentence.text,
            locationLabel: "Complex conditional sentence",
            start: sentence.start,
            end: sentence.end,
          });

          counter += 1;
        }
      });

      return findings;
    },
  };
}

function createSoleAndAbsoluteDiscretionRule(): Rule {
  const pattern = /sole and absolute discretion/gi;

  return {
    id: "R-603",
    title: "'Sole and absolute discretion' phrasing",
    severity: "low",
    category: "commercial-risk",
    run: (text: string): Finding[] => {
      if (!text) return [];

      const findings: Finding[] = [];
      const regex = new RegExp(pattern.source, pattern.flags);
      let match: RegExpExecArray | null;
      let counter = 1;

      while ((match = regex.exec(text)) !== null) {
        const matchedText = match[0];
        const startIndex = match.index;
        const endIndex = startIndex + matchedText.length;

        findings.push({
          id: "R-603-" + counter,
          severity: "low",
          ruleId: "R-603",
          ruleTitle: "'Sole and absolute discretion' phrasing",
          why: "The phrase 'sole and absolute discretion' is very one-sided and may be viewed as aggressive or unreasonable depending on the context.",
          suggestion:
            "Consider whether a softer formulation (for example, 'reasonable discretion' or adding objective criteria) would be more appropriate, or confirm that this level of discretion is a deliberate risk allocation.",
          matchedText,
          locationLabel: "Discretion clause",
          start: startIndex,
          end: endIndex,
        });

        counter += 1;
      }

      return findings;
    },
  };
}

// --- New rules: unilateral amendments, financial covenants, sanctions/AML, benchmark fallback, payments, negative pledge ---

const unilateralAmendmentRule: Rule = {
  id: "R-1201",
  title: "Unilateral amendment without counterparty consent",
  severity: "high",
  category: "commercial-risk",
  run: (text: string): Finding[] => {
    if (!text) return [];

    const sentences = getSentences(text);
    const findings: Finding[] = [];
    let counter = 1;

    const amendmentRegex =
      /(amend|amendment|vary|variation|replace|modif(?:y|ication))/i;
    const unilateralRiskRegex =
      /unilaterally|without\s+the?\s+consent|for any reason or no reason|sole( and absolute)? discretion/i;

    sentences.forEach((sentence) => {
      const lowered = sentence.text.toLowerCase();
      if (!amendmentRegex.test(lowered)) return;
      if (!unilateralRiskRegex.test(lowered)) return;

      findings.push({
        id: `R-1201-${counter}`,
        severity: "high",
        ruleId: "R-1201",
        ruleTitle: "Unilateral amendment without counterparty consent",
        category: "commercial-risk",
        why: "This clause appears to allow one party to amend, vary or replace provisions of the Agreement unilaterally or without the other party's consent, which is a highly one-sided allocation of risk.",
        suggestion:
          "Consider requiring mutual written agreement for amendments, or at least limiting any unilateral amendment right to narrow, objectively defined circumstances (for example, to correct manifest errors or to comply with mandatory law).",
        matchedText: sentence.text,
        locationLabel: "Amendment / variation clause",
        start: sentence.start,
        end: sentence.end,
      });

      counter += 1;
    });

    return findings;
  },
};

const financialCovenantRules: Rule[] = [
  {
    id: "R-702",
    title: "Financial covenant testing frequency unclear",
    severity: "medium",
    category: "drafting-clarity",
    run: (text: string): Finding[] => {
      if (!text) return [];

      const lowered = text.toLowerCase();
      const hasCovenantTerm = FINANCIAL_COVENANT_TERMS.some((term) =>
        lowered.includes(term.toLowerCase())
      );
      if (!hasCovenantTerm) return [];

      const hasTestingLanguage = /tested|testing|test dates?/i.test(text);
      const hasFrequency =
        /quarterly|semi-annual|semiannual|annually|annual/i.test(text);

      if (hasTestingLanguage && hasFrequency) return [];

      const firstTerm = FINANCIAL_COVENANT_TERMS.find((term) =>
        text.includes(term)
      );
      const idx = firstTerm ? text.indexOf(firstTerm) : 0;
      const startIndex = idx >= 0 ? idx : 0;
      const endIndex = firstTerm
        ? startIndex + firstTerm.length
        : Math.min(startIndex + 20, text.length);

      const finding: Finding = {
        id: "R-702-1",
        severity: "medium",
        ruleId: "R-702",
        ruleTitle: "Financial covenant testing frequency unclear",
        why: "The agreement refers to one or more financial covenants but does not clearly specify how often they are tested (for example, quarterly on a rolling 12‑month basis).",
        suggestion:
          "Add clear testing mechanics for each financial covenant, including the test dates (e.g. quarterly), the testing period (e.g. rolling 12 months) and who performs the calculation.",
        matchedText: firstTerm ?? "Financial covenant",
        locationLabel: "Financial covenants",
        start: startIndex,
        end: endIndex,
      };

      return [finding];
    },
  },
];

const sanctionsAndAmlRules: Rule[] = [
  {
    id: "R-801",
    title: "Sanctions definitions missing",
    severity: "high",
    category: "commercial-risk",
    run: (text: string): Finding[] => {
      if (!text) return [];

      const hasSanctionsConcept = /sanction|ofac|eu sanctions/i.test(text);
      const hasSanctionedPerson = /"Sanctioned Person"/i.test(text);
      const hasSanctionedCountry = /"Sanctioned Country"/i.test(text);

      if (!hasSanctionsConcept) return [];
      if (hasSanctionedPerson && hasSanctionedCountry) return [];

      const match = /sanction/i.exec(text);
      const startIndex = match ? match.index : 0;
      const endIndex = match ? startIndex + match[0].length : 0;

      const finding: Finding = {
        id: "R-801-1",
        severity: "high",
        ruleId: "R-801",
        ruleTitle: "Sanctions definitions missing",
        why: "The agreement refers to sanctions concepts but does not clearly define 'Sanctioned Person' and/or 'Sanctioned Country', which can create uncertainty for compliance and enforcement.",
        suggestion:
          "Add precise definitions of 'Sanctioned Person' and 'Sanctioned Country' (or equivalent terms) and ensure they are used consistently in the sanctions undertakings and events of default.",
        matchedText: match ? match[0] : "sanctions",
        locationLabel: "Sanctions wording",
        start: startIndex,
        end: endIndex,
      };

      return [finding];
    },
  },
  {
    id: "R-802",
    title: "Use of proceeds sanctions carve-out missing",
    severity: "medium",
    category: "commercial-risk",
    run: (text: string): Finding[] => {
      if (!text) return [];

      const hasPurpose = /\bPurpose\b/i.test(text);
      const hasSanctionsReference = /sanction|ofac|eu sanctions/i.test(text);

      if (!hasPurpose || hasSanctionsReference) return [];

      const match = /\bPurpose\b/i.exec(text);
      const startIndex = match ? match.index : 0;
      const endIndex = match ? startIndex + match[0].length : 0;

      const finding: Finding = {
        id: "R-802-1",
        severity: "medium",
        ruleId: "R-802",
        ruleTitle: "Use of proceeds sanctions carve-out missing",
        why: "The Purpose clause does not clearly state that proceeds may not be used in breach of applicable sanctions regimes (for example, OFAC or EU sanctions).",
        suggestion:
          "Consider adding language to the Purpose or use of proceeds clauses confirming that no proceeds will be used in violation of applicable sanctions laws.",
        matchedText: match ? match[0] : "Purpose",
        locationLabel: "Purpose clause",
        start: startIndex,
        end: endIndex,
      };

      return [finding];
    },
  },
];

const benchmarkFallbackRules: Rule[] = [
  {
    id: "R-901",
    title: "Benchmark replacement mechanics missing",
    severity: "medium",
    category: "structural-completeness",
    run: (text: string): Finding[] => {
      if (!text) return [];

      const hasScreenRate = /Screen Rate/i.test(text);
      const hasReferenceRate = /SONIA|SOFR|LIBOR|base rate/i.test(text);
      if (!hasScreenRate && !hasReferenceRate) return [];

      const hasFallback =
        /Replacement of Screen Rate|Benchmark Replacement/i.test(text);
      if (hasFallback) return [];

      const match = /Screen Rate|SONIA|SOFR|LIBOR/i.exec(text);
      const startIndex = match ? match.index : 0;
      const endIndex = match ? startIndex + match[0].length : 0;

      const finding: Finding = {
        id: "R-901-1",
        severity: "medium",
        ruleId: "R-901",
        ruleTitle: "Benchmark replacement mechanics missing",
        why: "The agreement references a screen or benchmark rate but does not include clear 'Replacement of Screen Rate' or similar mechanics in case that rate becomes unavailable.",
        suggestion:
          "Add benchmark fallback provisions (for example, a 'Replacement of Screen Rate' or 'Benchmark Replacement' clause) consistent with current market practice.",
        matchedText: match ? match[0] : "benchmark rate",
        locationLabel: "Benchmark rate",
        start: startIndex,
        end: endIndex,
      };

      return [finding];
    },
  },
];

const paymentConventionRules: Rule[] = [
  {
    id: "R-1001",
    title: "Business Day convention missing",
    severity: "medium",
    category: "structural-completeness",
    run: (text: string): Finding[] => {
      if (!text) return [];

      const hasBusinessDay = /Business Day/i.test(text);
      if (!hasBusinessDay) return [];

      const hasConvention =
        /Business Day Convention|following Business Day|preceding Business Day/i.test(
          text
        );
      if (hasConvention) return [];

      const match = /Business Day/i.exec(text);
      const startIndex = match ? match.index : 0;
      const endIndex = match ? startIndex + match[0].length : 0;

      const finding: Finding = {
        id: "R-1001-1",
        severity: "medium",
        ruleId: "R-1001",
        ruleTitle: "Business Day convention missing",
        why: "The agreement defines 'Business Day' but does not clearly state how payment dates are adjusted when they fall on a non‑Business Day (for example, Following or Preceding Business Day conventions).",
        suggestion:
          "Add a Business Day convention explaining how payment and interest calculation dates move when they fall on a non‑Business Day.",
        matchedText: match ? match[0] : "Business Day",
        locationLabel: "Business Day definition / payments",
        start: startIndex,
        end: endIndex,
      };

      return [finding];
    },
  },
];

const negativePledgeRules: Rule[] = [
  {
    id: "R-1101",
    title: "Negative pledge may not cover group",
    severity: "medium",
    category: "commercial-risk",
    run: (text: string): Finding[] => {
      if (!text) return [];

      const hasNegativePledgeHeading = /Negative Pledge/i.test(text);
      const hasCoreRestriction =
        /shall not\s+(create|grant)\s+any\s+Security/i.test(text);
      if (!hasNegativePledgeHeading && !hasCoreRestriction) return [];

      const hasGroupScope = /Subsidiar|Group\b/i.test(text);
      if (hasGroupScope) return [];

      const match =
        /Negative Pledge/i.exec(text) ||
        /shall not\s+(create|grant)\s+any\s+Security/i.exec(text);
      const startIndex = match ? match.index : 0;
      const endIndex = match ? startIndex + match[0].length : 0;

      const finding: Finding = {
        id: "R-1101-1",
        severity: "medium",
        ruleId: "R-1101",
        ruleTitle: "Negative pledge may not cover group",
        why: "The negative pledge wording appears to restrict only one party and does not clearly extend to its subsidiaries or group entities, which may allow asset leakage to other creditors.",
        suggestion:
          "Consider extending the negative pledge (or adding separate undertakings) so that it clearly covers the restricted party and its subsidiaries/group, subject to agreed exceptions.",
        matchedText: match
          ? match[0]
          : "Negative pledge / Security restriction",
        locationLabel: "Negative pledge / Security undertakings",
        start: startIndex,
        end: endIndex,
      };

      return [finding];
    },
  },
];

const requiredSectionRules = createRequiredSectionRules(
  REQUIRED_SECTIONS_CONFIG
);
const placeholderRules = createPlaceholderRules(PLACEHOLDER_PATTERNS);
const crossReferenceRule = createCrossReferenceRule();
const duplicateDefinitionsRule = createDuplicateDefinitionsRule();
const undefinedCapitalisedTermsRule = createUndefinedCapitalisedTermsRule();
const longSentenceRule = createLongSentenceRule();
const conditionalPhraseDensityRule = createConditionalPhraseDensityRule();
const soleAndAbsoluteDiscretionRule = createSoleAndAbsoluteDiscretionRule();

export const RULES: Rule[] = [
  // Existing bespoke rule from earlier implementation
  missingGoverningLawRule,
  unilateralAmendmentRule,
  // Config-driven families
  ...requiredSectionRules,
  ...placeholderRules,
  crossReferenceRule,
  duplicateDefinitionsRule,
  undefinedCapitalisedTermsRule,
  longSentenceRule,
  conditionalPhraseDensityRule,
  soleAndAbsoluteDiscretionRule,
  ...financialCovenantRules,
  ...sanctionsAndAmlRules,
  ...benchmarkFallbackRules,
  ...paymentConventionRules,
  ...negativePledgeRules,
];
