---
description: Compare gap report features against industry standards and best practices for the domain
argument-hint: [--input=./gap-report.md] [--output=./industry-review.md] [--domain=auto]
allowed-tools: Bash(ls:*), Bash(wc:*), WebSearch, WebFetch
---

Review proposed feature implementation against industry standards and best practices: $ARGUMENTS

## Parameters

Parse `$ARGUMENTS` for:
- **--input=PATH** (optional): Step 3 gap report. Default: `./gap-report.md`
- **--output=PATH** (optional): Output file path. Default: `./industry-review.md`
- **--domain=SLUG** (optional): Domain context hint. Default: `auto` (inferred from gap report content). Known domains: `fleet-aftermarket-cores`, `aftermarket-pricing`. For unknown domains, uses Dynamic Derivation (see below).

## Prerequisites

1. Read the input file. If missing, tell the user to run `/feature-gap-analysis` first.
2. Identify the **domain** from the gap report title, feature names, and ACs. For example:
   - "Cores for Phase 1" → domain = `fleet-aftermarket-cores` (core charge accounting, obligation tracking, vendor returns)
   - "Pricing" → domain = `aftermarket-pricing` (price tiers, matrix pricing, cost-plus)
   - If unclear, ask the user to specify `--domain`.

## Domain Knowledge Strategy

For each domain, the agent must research real-world industry standards. Do NOT rely solely on training data — use **WebSearch** and **WebFetch** to find current authoritative sources.

### Known Domain Catalog

Each known domain has a curated research playbook. When `--domain` matches (or auto-detection resolves to) a known domain, use its targeted research targets.

<details>
<summary><strong>fleet-aftermarket-cores</strong> — Core charge accounting, obligation tracking, vendor returns</summary>

- GAAP / ASC 330 (Inventory) and ASC 450/ASC 410 (Asset Retirement Obligations) for core charge liability recognition
- Core charge accounting patterns in automotive/heavy-duty aftermarket ERP systems (e.g., Epicor, CDK, Karmak Fusion)
- MEMA (Motor & Equipment Manufacturers Association) and HDMA (Heavy Duty Manufacturers Association) standards for core return programs
- Vendor credit reconciliation norms (bill credit, debit memo, credit memo patterns)
- Core return window conventions (30/60/90 day norms, grace periods, deadline extensions)
- Write-off accounting standards (reason codes, materiality thresholds, GL account mapping)
- Obligation lifecycle patterns in fleet management systems (create → track → fulfill/expire → reconcile)
- Snapshot rate vs. current rate conventions for liability valuation (GAAP FIFO/LIFO/weighted-average)
</details>

<details>
<summary><strong>aftermarket-pricing</strong> — Price tiers, matrix pricing, cost-plus, margin management</summary>

- Price matrix conventions in aftermarket ERP systems (Epicor, CDK, Karmak Fusion, Nexpart)
- Cost-plus vs. list-minus pricing models in heavy-duty fleet aftermarket
- GAAP / ASC 606 (Revenue from Contracts with Customers) for pricing tier recognition
- Customer-specific pricing and contract pricing norms
- Price sheet management and effective-date conventions
- Vendor price file import standards (ACES/PIES data standards from Auto Care Association)
- Margin protection rules and minimum-margin conventions
- Price rounding rules by currency and jurisdiction
</details>

### Dynamic Derivation (for unlisted domains)

When the detected domain does NOT match a known catalog entry, derive research targets dynamically:

1. **Extract domain concepts** — parse the gap report title, feature names, ACs, and field tables. Identify the top 5-8 domain-specific concepts (nouns that are NOT generic software terms).
2. **Construct targeted queries** — for each concept, build research queries:
   - `"{concept}" GAAP accounting treatment` (if financial)
   - `"{concept}" ERP best practice {industry}`
   - `"{concept}" fleet management aftermarket` (Fullbay-specific)
   - `"{concept}" heavy duty parts`
   - `"{concept}" industry standard`
3. **Execute WebSearch** for each query. Fetch and read the top 2-3 results.
4. **Build research target list** — synthesize findings into a structured list similar to the known domain entries.
5. **Report derived targets** in the output's "Industry Context" section so the user can verify coverage.

### General (applies to any domain)

- OWASP security standards for the feature type (PII handling, authorization patterns)
- Accessibility (WCAG 2.1 AA) for any UI features
- Data retention / audit trail requirements for financial transactions

### Research Process

For each feature in the gap report:

1. **Identify the industry concept** — map the feature's ACs to a recognized industry practice or standard
2. **Search for authoritative sources** — use WebSearch with targeted queries adapted to the detected domain:
   - `"{industry concept}" GAAP accounting treatment` (for financial features)
   - `"{industry concept}" ERP best practice {domain industry}` (for workflow features)
   - `"{industry concept}" {domain industry} {domain segment}` (for domain-specific)
   - `"{industry concept}" heavy duty parts` (for Fullbay-specific norms)

   For example, with domain `fleet-aftermarket-cores`: `{domain industry}` = "fleet management", `{domain segment}` = "aftermarket".
   With domain `aftermarket-pricing`: `{domain industry}` = "aftermarket parts", `{domain segment}` = "pricing".
3. **Fetch and read key sources** — use WebFetch on the top 2-3 results per feature
4. **Extract the standard** — what does the industry actually do? Document the norm, not the theory.
5. **Compare** — how does the proposed implementation (from the gap report ACs + subtasks) align?

## Step 1: Build Feature Inventory

From the gap report, extract for each feature:
- Feature code + name
- Acceptance criteria (the "what we're proposing")
- Subtasks with layer details (the "how we're building it")
- Cross-team dependencies
- Blocking relationships

## Step 2: Research Industry Standards Per Feature

For each feature, research and document the applicable industry standard(s). Organize findings into these categories:

### Finding Categories

| Category | Icon | Description |
|----------|------|-------------|
| **Compliance risk** | `[COMPLIANCE]` | Proposed implementation may violate GAAP, regulatory, or legal requirements |
| **Industry gap** | `[GAP]` | Industry-standard capability is missing from the proposed implementation |
| **Over-engineering** | `[OVERENG]` | Proposed implementation exceeds what the industry typically does — adds complexity without proportional value |
| **Terminology mismatch** | `[TERM]` | Domain terminology differs from industry norms — may confuse users or integrations |
| **Best practice** | `[BESTPRAC]` | Industry best practice that would strengthen the implementation |
| **Aligned** | `[OK]` | Proposed implementation matches industry norms — no action needed |

### Severity Levels

- **Critical** — Must address before build (compliance risk, data integrity, financial correctness)
- **Recommended** — Should address, improves quality and reduces risk
- **Advisory** — Nice-to-have, may be deferred

## Step 3: Write Industry Review

Write the output file using this format:

```markdown
# Industry Standards Review: {Gap Report Title}

**Source:** {input file path}
**Domain:** {domain slug} — {domain description}
**Generated:** {date}
**Features reviewed:** {count}

---

## Executive Summary

- **Features reviewed:** {count}
- **Findings:** {total count}
  - Critical: {count}
  - Recommended: {count}
  - Advisory: {count}
- **Top compliance risks:** {1-3 sentence summary of the most important issues}
- **Overall assessment:** {1-2 sentence verdict — e.g., "Implementation is well-aligned with industry norms for {domain}. {N} compliance gaps should be addressed before build."}

---

## Industry Context: {Domain Name}

{2-4 paragraphs providing domain context. What is this feature domain? How does the industry handle it? What are the key standards? What ERP systems does this compete with? What are the typical workflows?}

**Key Standards and References:**
- {Standard 1} — {source URL if found}
- {Standard 2} — {source URL}
- ...

---

## Review by Feature

### {Feature Code}. {Feature Name}

**Industry Concept:** {what this maps to in the industry — e.g., "Liability recognition and tracking" or "Matrix pricing and margin management"}
**Proposed ACs:** {count from gap report}

#### Industry Standard

{1-3 paragraphs describing how the industry handles this capability. Be specific — cite ERP systems, GAAP sections, or industry publications where possible. This is the "what the world does" baseline.}

#### Findings

##### {n}. [{CATEGORY}] {Short description} — {Severity}

- **Industry norm:** {what the standard says or what competitors do}
- **Proposed:** {what the gap report ACs say}
- **Delta:** {specific difference}
- **Recommendation:** {actionable suggestion — add an AC, modify a subtask, remove over-engineering, or add a missing capability}
- **Impact:** {which story/subtask this affects — e.g., "{CODE}-J [SVC] subtask"}
- **Source:** {citation — GAAP section, ERP documentation, industry article, or "Industry common practice"}

##### {n+1}. [OK] {Aspect that's well-aligned}

- **Industry norm:** {brief}
- **Proposed:** {brief}
- **Verdict:** Aligned — no action needed.

---
```

Repeat for each feature. After all features, include:

```markdown
## Cross-Cutting Findings

{Findings that apply across multiple features — e.g., audit trail requirements, GL account standards, currency handling}

### {n}. [{CATEGORY}] {Cross-cutting finding} — {Severity}

- **Affects:** {list of features}
- **Industry norm:** {what's expected}
- **Proposed:** {current state across features}
- **Recommendation:** {action}

---

## Findings Summary

| # | Feature | Category | Finding | Severity | Recommendation |
|---|---------|----------|---------|----------|----------------|
| 1 | {CODE}-C | [GAP] | {short} | Critical | {short} |
| 2 | {CODE}-J | [COMPLIANCE] | {short} | Critical | {short} |
| ... |

---

## Terminology Crosswalk

{If any terminology mismatches were found, provide a mapping table}

| Gap Report Term | Industry Standard Term | Notes |
|----------------|----------------------|-------|
| {our term} | {industry term} | {context} |

---

## Recommendations Priority

### Critical (Must Address Before Build)

1. {Finding ref} — {one-line summary + affected stories}
2. ...

### Recommended (Should Address)

1. {Finding ref} — {one-line summary + affected stories}
2. ...

### Advisory (May Defer)

1. {Finding ref} — {one-line summary + affected stories}
2. ...

---

## Sources

| # | Source | URL | Used For |
|---|--------|-----|----------|
| 1 | {title} | {url} | {which findings cite this} |
| ... |
```

## Step 4: Present Summary

After writing the file, display:

```
## Industry Standards Review Complete

- **Output:** {output path}
- **Domain:** {domain}
- **Features reviewed:** {count}
- **Total findings:** {count}
  - Critical: {count}
  - Recommended: {count}
  - Advisory: {count}

### Critical Findings:
1. [{CATEGORY}] {finding} — affects {stories}
2. ...

### Key Insight:
{1-2 sentence takeaway — the single most important thing the team should know}

### Next Steps:
- Review critical findings with Tech Lead + PO
- Update gap report ACs if compliance gaps are confirmed
- Feed approved changes back to Jira via `jira-story-creator` agent
```

## Guidelines

1. **Be specific, not theoretical.** "GAAP requires X" is useful. "Consider industry best practices" is not.
2. **Cite sources.** Every finding should reference a standard, publication, or at minimum "industry common practice in {domain}."
3. **Don't over-flag.** Mark features as `[OK]` when they're aligned. The review should highlight real issues, not manufacture concerns.
4. **Respect the domain.** Fullbay operates in heavy-duty fleet aftermarket. Norms from consumer auto parts or retail may not apply. Prefer fleet/commercial vehicle/heavy-duty sources.
5. **Actionable recommendations.** Each finding should say what to do — add an AC, modify a subtask, change terminology, or explicitly accept the deviation.
6. **Don't redesign.** The review compares against standards — it doesn't propose alternative architectures. If the approach is sound but missing a detail, say "add X to the ACs," not "rewrite the feature."
7. **Financial accuracy matters most.** For financial domains, GAAP compliance for liability recognition, revenue timing, and accounting treatment are the highest-priority review areas. For non-financial domains, prioritize data integrity and workflow correctness.
