---
description: Compare Critical Path features + Figma designs against repo code to identify gaps
argument-hint: --feature-code=CODE [--input-features=./critical-path-extract.md] [--input-designs=./feature-designs-extract.md] [--repos=./repos] [--output=./gap-report.md]
allowed-tools: Bash(ls:*), Bash(wc:*), Bash(find:*)
---

Run gap analysis across Confluence specs, Figma designs, and repo code: $ARGUMENTS

## Parameters

Parse `$ARGUMENTS` for:
- **--feature-code=CODE** (required): Short uppercase prefix for story naming (e.g., `CORE`, `PRICE`, `INV`). Used in story titles as `{CODE}: {behavior}` and story headers as `{CODE}-{Letter}`. If missing, stop and ask the user to provide it.
- **--input-features=PATH** (optional): Step 1 output. Default: `./critical-path-extract.md`
- **--input-designs=PATH** (optional): Step 2 output. Default: `./feature-designs-extract.md`
- **--repos=PATH** (optional): Directory containing repo checkouts. Default: `./repos`
- **--output=PATH** (optional): Output file path. Default: `./gap-report.md`
- **--input-design-specs=PATH** (optional): Design spec JSON directory from Step 2. Default: `./design-specs`

## Prerequisites

1. Verify the input files exist by reading them. If either is missing, tell the user which pipeline step to run first.
2. Verify the repos directory exists and contains repo checkouts. Read `REPO_SUMMARY.md` from the repos directory if it exists — use it to understand the architecture and repo roles.
3. If the design-specs directory exists, index all features → frame → node-id mappings for use in Step 3h. For each subdirectory, read `index.json` to get the file key, file name, and list of frames with their node IDs.

## Architecture Context

The repos follow a layered pattern. Map each layer prefix to scan targets:

| Layer | Prefix | Repos to Scan | File Patterns |
|-------|--------|---------------|---------------|
| `[SVC]` | Service/domain | `prt-parts-svc`, `prt-purchase-orders-svc`, `prt-commons-lib` | `**/command/**`, `**/query/**`, `**/entity/**`, `**/event/**`, `**/*Handler.java`, `**/*Service.java`, `**/*Dao.java`, `**/*Resource.java` |
| `[BFF]` | AppSync/resolver | `prt-parts-fun`, `prt-main-aps` | `**/*.graphqls`, `**/schema.graphql`, `**/resolver*`, `**/*.ts` |
| `[FE]` | Frontend | `prt-main-uix` | `**/features/**`, `**/components/**`, `**/*.tsx`, `**/hooks/**`, `**/stores/**`, `**/routes*` |
| `[INFRA]` | Infrastructure | `prt-main-aps` | `**/*.tf`, `**/template.yaml` |
| `[LIB]` | Shared library | `prt-commons-lib` | `**/*Dao.java`, `**/*Enum*.java`, `**/Puid*` |

## Step 1: Load Requirements (from Step 1 output)

Read the features file and build a requirements inventory per feature:
- Feature letter + name
- Acceptance criteria (each AC is a requirement)
- Field definitions (each field is a requirement)
- State transitions (each transition is a requirement)
- Cross-team dependencies

Count total requirements per feature.

## Step 2: Load Design Expectations (from Step 2 output)

Read the designs file and build a design inventory per feature:
- Figma frames (each frame implies a UI screen to build or modify)
- Responsive breakpoints (2xl, 1xl, L, M, S, XS — each implies responsive behavior)
- Wizard steps (multi-step flows)
- Component inventories (new or modified components)
- Features without Figma (backend-only — no `[FE]` gap expected)

## Step 3: Scan Repos for Existing Code

Search each relevant repo for code related to the feature domain. Use targeted searches:

### 3a. Keyword Derivation + Scan

Derive search keywords dynamically from the Step 1 input (do NOT hardcode keywords):

1. **Field tables** — parse every field definition table from the features file. Extract each Field column name and generate:
   - camelCase variant (e.g., `coreCharge`)
   - snake_case variant (e.g., `core_charge`)
   - kebab-case variant (e.g., `core-charge`)
   - as-is (e.g., `Core Charge` → also search `CoreCharge`)
2. **AC nouns** — parse acceptance criteria text across all features. Extract recurring domain nouns that appear in 2+ features (e.g., "obligation", "dashboard", "receipt").
3. **State names** — parse state transition tables. Extract each state name (e.g., `Open`, `Returned`, `WrittenOff`) and generate camelCase/snake_case variants.
4. **Feature code** — add the `--feature-code` value in lowercase, uppercase, camelCase, and kebab-case (e.g., `core`, `CORE`, `core-dashboard`).
5. **Deduplicate** the combined keyword list.

Report the derived keyword list in the output Scan Summary section so the user can verify coverage.

Search all repos for code matching the derived keywords using the Grep tool. Note which repos and files match.

### 3b. GraphQL Schema Scan

Read the GraphQL schema from `prt-main-aps` (typically `terraform/schema.graphql` or similar):
- Look for types, queries, and mutations matching the derived keywords from Step 3a
- Look for related domain types (entities referenced by the keywords)

Also check local schema copies in `prt-parts-fun/schema.graphql` and `prt-main-uix/schema.graphql` for any divergence from the authoritative `prt-main-aps` schema.

### 3c. JSON Schema Scan

Read DynamoDB JSON schemas from the `schema/` directories in each service repo:
- `prt-purchase-orders-svc/schema/` — PO and line item schemas (e.g., `purchase-order-schema-v1.0.json`)
- `prt-parts-svc/schema/` — Parts instance schemas (e.g., `parts-instance-schema-v2.1.json`)

Also check OpenAPI specs if present:
- `prt-purchase-orders-svc/openapi/openapi.yaml` (or `.json`)
- `prt-parts-svc/openapi/openapi.yaml` (or `.json`)

For each JSON schema / OpenAPI spec:
- Search for fields matching the keyword list derived in Step 3a (both camelCase and snake_case variants)
- Note field types, constraints, required flags — these are the data contract for the persistence layer and should align with Confluence field definitions
- Flag any mismatches between JSON schema field definitions and Confluence acceptance criteria (e.g., field exists in schema but missing from spec, or spec requires a field not in schema)

### 3d. Entity/DAO Scan

Search `prt-commons-lib` for:
- Entity classes or DAO fields matching the derived keywords from Step 3a
- Related enums or status types

### 3e. Service Endpoint Scan

Search `prt-parts-svc` and `prt-purchase-orders-svc` for:
- REST endpoints matching the derived keywords from Step 3a
- CRUD endpoints for domain entities identified in the features file

### 3f. Resolver Scan

Search `prt-parts-fun` for:
- GraphQL operation handlers matching derived keywords from Step 3a
- Resolver routing for related operations

### 3g. UI Scan

Search `prt-main-uix` for:
- Components, pages, or features matching derived keywords from Step 3a
- Dashboard or list views related to the feature domain
- Wizard components or multi-step flows referenced in the features file
- Routes that include keywords from Step 3a

### 3h. Design Spec Deep Scan

If the design-specs directory was indexed in Prerequisites step 3, enrich each feature with deep design details:

For each feature that has a matching design-specs subdirectory:

1. **Read `index.json`** — get the frame list with:
   - `file_key` and `file_name` (needed for Figma URL construction)
   - Each frame's `name`, `id` (node-id), and `spec_file` path

2. **Construct Figma URLs** for each frame:
   ```
   https://www.figma.com/design/{file_key}/{file_name}?node-id={node_id with ':' replaced by '-'}
   ```
   Example: `https://www.figma.com/design/i2Kg9Utpkm9u1LkX54wStY/Parts-Record?node-id=2-2542`

3. **Read each frame's JSON** (`frames/{frame-name}.json`) and extract:
   - **Component inventory**: Top-level component names, their variants, and key props (e.g., Switch Checked/Unchecked, Input Size=Regular)
   - **Responsive breakpoints**: Distinct layout sizes found in the frame structure (look for frame names or width constraints like 2xl, 1xl, L, md, sm)
   - **Key design values**: Colors from fills/strokes (hex values), dimensions, spacing, border-radius — only capture values that differ from the existing design system
   - **Interaction patterns**: Toggles, conditional visibility, wizard steps, modal triggers

4. **Read `components.json`** (if present) for shared component definitions across frames

5. **Build a per-feature design detail map** structured as:
   ```
   {feature-slug}:
     figma_urls: [{frame_name}: {url}, ...]
     components: [{name}, {variant}, ...]
     breakpoints: [2xl, 1xl, L, md, sm]
     design_values: {key highlights only}
     interaction_patterns: [toggle, conditional-show, ...]
   ```

This map is consumed by Step 4 when writing enriched subtask descriptions.

## Step 4: Compare Sources and Identify Gaps

For each feature, compare what's required (Step 1 + Step 2) against what exists (Step 3):

### Gap Classification

| Gap Type | Description |
|----------|-------------|
| **Not implemented** | No code exists for this requirement |
| **Partially implemented** | Some code exists but is incomplete (e.g., entity exists but no endpoint) |
| **Schema missing** | GraphQL type/mutation/query not defined |
| **UI missing** | Figma shows screens but no corresponding React components |
| **Entity missing** | No DynamoDB entity/DAO for this domain concept |
| **Endpoint missing** | Backend service has no REST route for this operation |
| **Resolver missing** | No AppSync resolver handler for this operation |
| **Integration gap** | Cross-team dependency needs coordination (Repair Centre, Financials, Platform) |

### Layer Assignment

For each gap, assign the appropriate layer prefix(es):
- If shared entity classes are needed → needs `[LIB]` subtask (in prt-commons-lib)
- If business logic or persistence is needed → needs `[SVC]` subtask
- If a new API operation is needed → needs `[BFF]` subtask
- If Figma shows a screen → needs `[FE]` subtask
- If new DynamoDB tables or cloud resources are needed → needs `[INFRA]` subtask (DynamoDB, SQS, OpenSearch, EventBridge, Lambda, Terraform)
- If cross-cutting non-functional work is needed → needs `[NFC]` subtask

**Testing is NOT a standalone subtask.** Each layer subtask owns its own tests via **Test:** or **Testing Strategy:** detail lines.

**`[NFC]` is reserved for cross-cutting work that spans layers or doesn't belong to a single layer:**
- Observability: CloudWatch dashboards, alarms, X-Ray tracing, structured logging
- CI/CD: new pipeline stages, deployment config changes
- Documentation: ADRs, runbooks, API docs
- Cross-layer refactors: migrations that touch multiple layers (e.g., legacy Table → Datagrid across dashboard)
- New service wiring: connecting a new infrastructure resource to multiple consumers (e.g., wire SQS consumer to obligation handler + dashboard listener)

**`[NFC]` is NOT used for:**
- Testing (folded into each layer subtask)
- Refactors contained within a single layer (fold into that layer's subtask via **Refactor:** detail line)

### Story Grouping

Group related gaps into proposed stories. Each feature letter (C, D, E, G, H, I, J, M, N, P, Q, R) should map to one or more stories. Use the naming convention:

```
{FEATURE_CODE}: {User-visible behavior}
```

Each story should have subtasks with layer prefixes AND enriched detail lines. Use the design detail map from Step 3h and the repo scan results from Steps 3a-3g to populate layer-appropriate details under each subtask.

**Subtask ordering — list in dependency order (data flows down):**
1. `[LIB]` — shared entities/enums (no dependencies)
2. `[SVC]` — service logic + persistence (depends on LIB)
3. `[BFF]` — GraphQL schema + resolvers (depends on SVC)
4. `[FE]` — UI components + pages (depends on BFF)
5. `[INFRA]` — cloud resources (can be parallel, but list after FE)
6. `[NFC]` — cross-cutting work (observability, CI/CD, docs, cross-layer refactors) — list last, only if needed

Each layer subtask includes its own **Test:** or **Testing Strategy:** line. Single-layer refactors use a **Refactor:** detail line within that subtask.

### Cross-BC Integration

When a story requires integration with another Bounded Context (e.g., Repair Centre, Financials, Platform):

1. **Flag the story** with `cross-bc` in the output — add `- **Labels:** cross-bc` to the story block
2. **Integration pattern is event-driven.** Each BC exposes CRUD endpoints for its own domain, but cross-BC communication MUST use published events (EventBridge / SQS), not direct API calls between services.
3. **For the publishing side** (our BC): add a `**Publish:**` detail line to the relevant `[SVC]` subtask describing the event(s) to emit (event name, payload shape, trigger condition)
4. **For the consuming side** (other BC): note in `**Cross-team:**` what event the other team needs to subscribe to, and what action they take on receipt
5. **Do NOT design the other BC's consumer** — that's their team's responsibility. Our contract is the event schema.
6. **No UI component exports across BCs.** Each micro-frontend owns its own UI. Do NOT create `[FE]` subtasks that export React components for another BC to embed. Instead:
   - Our BC provides the API contract (REST endpoint or GraphQL mutation) that the other team's UI calls
   - Our BC publishes domain events that the other team's services consume
   - The other team builds their own form/page/component in their own micro-frontend
   - Document the contract in `**Cross-team:**` — e.g., "{Other Team} builds their form in their UI; calls `POST /{domain}-{action}`"

Example (service-layer event contract — illustration using cores domain):
```
- `[SVC]` Create obligation on PO bill event
  - **Consume:** `po.line.billed` event from Purchase Orders BC (already published)
  - **Publish:** `{domain}.obligation.created` event — payload: {obligationId, catalogId, vendorId, rate, quantity}
  - **Schema:** obligation-schema-v1.0.json
  - ...

- **Cross-team:** {Other Team} — subscribe to `{domain}.obligation.created` for downstream processing
- **Labels:** cross-bc
```

Example (UI owned by another BC — NO component export):
```
- `[SVC]` {Action} endpoint + domain entity update
  - **Build:** `POST /{domain}-{action}` accepting {relevant fields from ACs}
  - **Publish:** `{domain}.{action}.created` event — payload: {key entity fields}
  - ...

- **Cross-team:** {Other Team} — builds their own form in their UI; calls `POST /{domain}-{action}`; {Another Team} — subscribes to `{domain}.{action}.created` for downstream processing
- **Labels:** cross-bc
```

**Enriched subtask format — each subtask gets indented detail lines:**

```
- `[LIB]` {Summary description}
  - **Existing:** {DAO/entity classes found in 3d}
  - **Add:** {new fields, enums, or classes needed}
  - **Path:** {repo/src path}
  - **Test:** {unit tests — getters/setters, enum coverage, serialization}
  - **Patterns:** {existing test files to follow}

- `[SVC]` {Summary description}
  - **Existing:** {existing files found in 3a-3g, with notes on state — e.g., commented out, partial}
  - **Schema:** {JSON schema file} — {fields to add with types and constraints}
  - **Path:** {repo/src path for implementation}
  - **Testing Strategy:**
    - Unit: {handler/service logic, validation rules, edge cases}
    - Integration: {REST endpoint round-trip, DynamoDB persistence, event publishing}
  - **Patterns:** {existing test files to follow}

- `[BFF]` {Summary description}
  - **Existing:** {current GraphQL schema state from 3b}
  - **Extend:** {mutations/queries/types to add or modify}
  - **Path:** {repo path to schema and resolver files}
  - **Test:** {resolver mapping, input validation, error propagation}
  - **Patterns:** {existing resolver test files}

- `[FE]` {Summary description}
  - **Figma:** [{frame1 name}](url1), [{frame2 name}](url2)  ← full URLs with node-id
  - **Build:** {new component file} in {directory path}
  - **Forge:** {specific @fullbay/forge components to import — e.g., Switch, Input, Tooltip, Badge}
  - **Tokens:** {design tokens used — e.g., shadow-sm, shadow-lg, Paragraph 1/bold}
  - **Reuse:** {existing project components to import/compose}
  - **Extend:** {existing files to modify — schemas, forms, GraphQL operations}
  - **Design:** {key component variants, sizes, colors, breakpoints from 3h}
  - **Test:** {UI component tests — render, interaction, responsive behavior}
  - **Patterns:** {existing component test files}

- `[INFRA]` {Summary description}
  - **Resource:** {DynamoDB table, SQS queue, OpenSearch cluster, EventBridge rule, Lambda}
  - **Path:** {terraform or SAM template path}
  - **Test:** {integration — resource provisioning, IAM permissions}

- `[NFC]` {Summary — only for cross-cutting work}
  - **Scope:** {what this covers — observability, CI/CD, docs, cross-layer refactor, service wiring}
  - **Touches:** {list of repos/layers affected}
  - **Detail:** {specific work items}
```

**Single-layer refactors — use a `Refactor:` detail line within that layer's subtask:**
```
- `[SVC]` Add {new fields} to catalog CRUD with validation
  - **Refactor:** Extract validator base class from existing CatalogValidator before adding new field validation
  - **Schema:** {schema-file} — add {fieldName} ({type}), {fieldName} ({type, constraints})
  - ...
```

**Rules for enriched details:**
1. Only include detail lines that have real data from Steps 3a-3h. Do NOT fabricate paths or components.
2. `[FE]` subtasks MUST include **Figma:** with full clickable URLs including node-id (e.g., `https://www.figma.com/design/{fileKey}/{fileName}?node-id={nodeId}`).
3. `[FE]` subtasks MUST include **Forge:** listing specific @fullbay/forge component names from the design-specs component inventory (Step 3h).
4. `[FE]` subtasks SHOULD include **Tokens:** listing design tokens from `styles.json` if the feature uses non-default tokens.
5. `[SVC]` subtasks MUST include **Schema:** if JSON schemas were found in Step 3c.
6. `[SVC]` subtasks MUST include **Testing Strategy:** with Unit and Integration lines.
7. `[BFF]` subtasks MUST include **Existing:** noting current GraphQL schema state from Step 3b.
8. Every layer subtask (`[LIB]`, `[SVC]`, `[BFF]`, `[FE]`, `[INFRA]`) MUST include a **Test:** or **Testing Strategy:** line.
9. `[NFC]` subtasks do NOT need a **Test:** line (they are cross-cutting by nature).
10. Use **Refactor:** within a layer subtask for single-layer refactors. Only use `[NFC]` for refactors spanning multiple layers.
11. Omit any non-test detail label that has no data (e.g., skip **Reuse:** if no reusable components were identified).
12. File paths should be relative to the repo root (e.g., `src/features/Parts/ListView/Form/components/`).

## Step 5: Write Gap Report

Write the output markdown to the specified path. Use this format:

```markdown
# Gap Analysis: {title from features input file}

**Sources:**
- Confluence: {page ID and title from features input file}
- Figma: {file count} files, {frame count} frames ({file names from designs input})
- Repos: {list of repos scanned}

**Feature Code:** {FEATURE_CODE}
**Generated:** {date}

---

## Scan Summary

**Derived Keywords ({count}):** `{keyword1}`, `{keyword2}`, `{keyword3}`, ...
- From field tables: {count} keywords
- From AC nouns: {count} keywords
- From state names: {count} keywords
- From feature code: {count} keywords

---

## Executive Summary

- **Features analyzed:** {count}
- **Total requirements:** {count across all features}
- **Existing code found:** {count of requirements with partial or full implementation}
- **Gaps identified:** {count} ({critical} critical, {standard} standard)
- **Proposed stories:** {count}
- **Proposed subtasks:** {count}

---

## Gap Report by Feature

### {Letter}. {Feature Name}

**Sources:** Confluence section {letter}, Figma: {frame count} frames, Repos: {relevant repos}
**Requirements:** {count} | **Implemented:** {count} | **Gaps:** {count}

#### What Exists
- {description of existing code, if any}

#### Gaps

##### Gap {n}: {short description}
- **Source:** Confluence / Figma / both
- **Requirement:** {what the spec or design says}
- **Current state:** {what exists in code, or "Not implemented"}
- **Layer:** {[SVC] / [BFF] / [FE] / [INFRA] / [LIB]}
- **Priority:** Critical Path

##### Gap {n+1}: ...

#### Proposed Stories

**{FEATURE_CODE}: {User-visible behavior}** (where `{FEATURE_CODE}` is the `--feature-code` value)
- **Acceptance Criteria:** (from Confluence spec)
  - {AC 1}
  - {AC 2}
- **Subtasks:** (ordered by dependency: LIB → SVC → BFF → FE → INFRA → NFC)
  - `[LIB]` {shared entity/enum work}
    - **Existing:** {DAO/entity classes found}
    - **Add:** {new fields, enums, classes}
    - **Path:** {repo/src path}
    - **Test:** {unit tests}
  - `[SVC]` {service endpoint/handler}
    - **Existing:** {files found, with state notes}
    - **Schema:** {JSON schema file} — {fields to add with types}
    - **Path:** {repo/src path}
    - **Testing Strategy:**
      - Unit: {handler logic, validation}
      - Integration: {REST round-trip, persistence}
  - `[BFF]` {resolver/schema}
    - **Existing:** {current GraphQL schema state}
    - **Extend:** {mutations/queries/types to modify}
    - **Path:** {repo path}
    - **Test:** {resolver mapping, error propagation}
  - `[FE]` {UI component/page}
    - **Figma:** [{frame1}](full-url-with-node-id), [{frame2}](full-url-with-node-id)
    - **Build:** {new component} in {directory}
    - **Forge:** {specific @fullbay/forge components}
    - **Tokens:** {design tokens used}
    - **Reuse:** {existing components}
    - **Extend:** {files to modify}
    - **Design:** {variants, sizes, colors, breakpoints}
    - **Test:** {UI component render, interaction, responsive}
  - `[INFRA]` {if new resources needed}
    - **Resource:** {DynamoDB table, SQS, OpenSearch, EventBridge, Lambda}
    - **Path:** {terraform/SAM path}
    - **Test:** {integration — provisioning, IAM}
  - `[NFC]` {if cross-cutting work needed}
    - **Scope:** {observability / CI/CD / docs / cross-layer refactor / service wiring}
    - **Touches:** {repos/layers affected}
    - **Detail:** {specific work items}
- **Blocks:** {list of stories this blocks, if any}
- **Cross-team:** {dependency team, if any}

---
```

Repeat for each feature. After all features, include:

```markdown
## Cross-Team Dependency Summary

| Dependency | Features Affected | Team | Nature |
|-----------|-------------------|------|--------|
| ... | ... | ... | ... |

## Proposed Story Index

| # | Story | Feature | Subtasks | Priority | Blocks |
|---|-------|---------|----------|----------|--------|
| 1 | {FEATURE_CODE}: {title} | {letter} | {count} | Critical Path | {blocked stories} |
| ... |

## Correlation Contract

The approved version of this gap report can be converted to a correlation contract JSON
for the `jira-story-creator` agent. Run the conversion after human review.
```

## Step 6: Present Summary

After writing the file, display:

```
## Gap Analysis Complete

- **Output:** {output path}
- **Features analyzed:** {count}
- **Total gaps:** {count}
- **Proposed stories:** {count}
- **Proposed subtasks:** {count}

### Story Summary:
1. {FEATURE_CODE}: {title} — {n} subtasks — {layers}
2. ...

### Key Findings:
- {highlight 1 — e.g., "No {domain}-related code exists in any repo — this is a greenfield feature"}
- {highlight 2 — e.g., "PO service has existing logic but no {feature} field support"}
- {highlight 3}

### Next Steps:
- Review this gap report with PO + Tech Lead
- Edit/approve/reject proposed stories
- Convert approved stories to Jira via `jira-story-creator` agent
```
