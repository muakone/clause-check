export type Severity = "low" | "medium" | "high";

export type RuleCategory =
  | "structural-completeness"
  | "commercial-risk"
  | "drafting-clarity"
  | "cross-reference-integrity";

export type Finding = {
  id: string;
  severity: Severity;
  ruleId: string;
  ruleTitle: string;
  category?: RuleCategory;
  why: string;
  suggestion: string;
  matchedText: string;
  locationLabel?: string;
  start?: number;
  end?: number;
};

export const mockLoanDocumentText = `
THIS LOAN AGREEMENT (the "Agreement") is made between LENDER BANK (the "Lender") and SAMPLE BORROWER LTD (the "Borrower").

1. LOAN AMOUNT AND DRAWDOWN
The Lender agrees to make available to the Borrower a term loan facility in the aggregate principal amount of [●] (the "Loan"). The exact amount and currency shall be inserted prior to execution.

2. INTEREST AND PAYMENT DATES
2.1 The Loan shall bear interest at a rate of 6.5% per annum, calculated on the basis of a 365-day year.
2.2 Interest shall be payable on each Interest Payment Date.
2.3 The Lender may, acting in its sole and absolute discretion, vary the Interest Payment Date by giving not less than five (5) Business Days' notice to the Borrower. Any such variation shall be binding on the Borrower.

3. AMENDMENTS
3.1 No amendment of this Agreement shall be effective unless in writing and signed by both parties.
3.2 Notwithstanding clause 3.1, the Lender may amend this Agreement by written notice to the Borrower in order to correct any manifest error.
3.3 The parties agree that the provisions of clause 14.9 (Non-Existent Clause) shall apply to any amendment made under this clause 3, even though such clause does not exist in this Agreement.

4. DEFINED TERMS
4.1 "Business Day" means a day (other than a Saturday or Sunday) on which banks are open for general business in London.
4.2 The Borrower shall ensure that all payments due under this Agreement are received by the Lender no later than 11:00 a.m. (London time) on each Business Day.
`;

export const mockFindings: Finding[] = [
  {
    id: "F-001",
    severity: "high",
    ruleId: "R-101",
    ruleTitle: "Unresolved commercial placeholder",
    category: "commercial-risk",
    why: "The principal amount of the Loan is expressed using a placeholder ([●]) rather than a specific figure, which is risky if not resolved before signing.",
    suggestion:
      "Replace the placeholder with a clearly specified amount and currency, and ensure all parties approve the final figure before execution.",
    matchedText: 'in the aggregate principal amount of [●] (the "Loan")',
    locationLabel: "Clause 1 — Loan Amount and Drawdown",
  },
  {
    id: "F-002",
    severity: "medium",
    ruleId: "R-214",
    ruleTitle: "Reference to non-existent clause",
    category: "cross-reference-integrity",
    why: 'The Agreement purports to apply the provisions of "clause 14.9 (Non-Existent Clause)" even though no such clause is defined elsewhere in the document.',
    suggestion:
      "Either insert the missing clause 14.9 with appropriate wording or remove the reference entirely and, if needed, cross-refer to an existing clause.",
    matchedText:
      "the provisions of clause 14.9 (Non-Existent Clause) shall apply to any amendment made under this clause 3",
    locationLabel: "Clause 3.3 — Amendments",
  },
  {
    id: "F-003",
    severity: "low",
    ruleId: "R-309",
    ruleTitle: "Defined term usage for Business Day",
    category: "drafting-clarity",
    why: "The term 'Business Day' is properly defined and used in the payment timing provision. This is a positive example but is surfaced here for illustration.",
    suggestion:
      "No change required. Ensure that all other timing-related provisions also use the defined term 'Business Day' consistently.",
    matchedText:
      'on each Business Day.\n4.1 "Business Day" means a day (other than a Saturday or Sunday) on which banks are open for general business in London.',
    locationLabel: "Clauses 4.1–4.2 — Defined Terms and Payments",
  },
];
