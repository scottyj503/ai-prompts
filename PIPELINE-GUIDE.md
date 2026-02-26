# Feature Analysis Pipeline — How-To Guide

A step-by-step guide for running the 5-step feature analysis pipeline that takes a Confluence spec page and turns it into Jira stories with full gap analysis.

## What is the pipeline?

The pipeline is a sequence of 5 slash commands that progressively analyze a feature spec:

```
Confluence Page
      │
      ▼
Step 1: /extract-critical-path        → critical-path-extract.md
      │
      ▼
Step 2: /extract-feature-designs       → feature-designs-extract.md + design-specs/
      │
      ▼
Step 3: /feature-gap-analysis          → gap-report.md
      │
      ▼
Step 4: /industry-standards-review     → industry-review.md
      │
      ▼
Step 5: /create-jira-stories           → Jira epic + stories + subtasks + dependency links
```

Each step reads the output of the previous step. You review and adjust between steps.

## Before you start

### 1. Set up a working directory

Create a dedicated directory for your analysis run. All pipeline outputs go here.

```bash
mkdir -p ~/code/my-project/feature-name
cd ~/code/my-project/feature-name
```

### 2. Set up the repos/ directory

**This is critical.** Step 3 (gap analysis) scans your actual codebase to compare what exists against what the spec requires. It needs local checkouts of all relevant repositories.

```bash
mkdir repos
cd repos
git clone git@github.com:your-org/service-a.git
git clone git@github.com:your-org/service-b.git
git clone git@github.com:your-org/shared-lib.git
git clone git@github.com:your-org/frontend.git
git clone git@github.com:your-org/appsync-api.git
# etc.
cd ..
```

**Tip:** Clone the specific branch you want to analyze against (usually `main`).

### 3. Create REPO_SUMMARY.md

Create a `repos/REPO_SUMMARY.md` that describes the architecture, each repo's role, how repos relate to each other, and the schemas at each layer. The gap analysis agent reads this first to understand where to look for what.

**Why this matters:**
- Without it, the agent has to guess which repo handles which concern
- With it, the agent knows exactly where to look for entities, schemas, resolvers, UI components, and infrastructure
- Schema documentation tells the agent what data already exists vs. what's missing
- Dependency maps prevent the agent from missing cross-repo impacts
- It dramatically improves scan accuracy and reduces false gaps

**What to include:**

1. **Architecture overview** — A diagram showing how the layers connect (UI → API gateway → resolvers → services → data stores)
2. **Per-repo details** — Type, purpose, data store, dependencies, who calls it, key paths
3. **Dependency map** — How repos call each other (REST, Maven, GraphQL, events)
4. **Schema inventory** — Every schema file across all repos and what it defines
5. **Schema flow** — Which schema is the source of truth, which are copies, and any known drift
6. **JSON schemas** — DynamoDB entity definitions with key patterns, conditional validation rules, and conventions
7. **Enum sync** — Enums that must be kept in sync across layers
8. **Cross-domain connections** — Shared external dependencies, cross-BC events
9. **Key patterns and conventions** — Naming, auth, ID formats, testing strategy

**Example per-repo entry:**

```markdown
### my-service-svc — Domain Service

| | |
|---|---|
| **Type** | Java 21 / Quarkus 3.20 / AWS Lambda (REST) |
| **Purpose** | Primary data service for catalogs, instances, and pricing |
| **Data store** | DynamoDB single-table (`my-service-{env}`) with 4 GSIs |
| **Depends on** | `my-commons-lib` (Maven), calls `pricing-svc` (REST) |
| **Called by** | `my-resolver-fun` |
| **Schemas** | `schema/catalog-schema-v2.2.json`, `schema/instance-schema-v2.1.json` |
| **OpenAPI** | `openapi/openapi.yaml` — REST contract with DTOs |
| **Key paths** | `src/main/java/com/myco/service/`, `schema/`, `openapi/` |
```

**Example schema inventory section:**

```markdown
## Schemas & How They Relate

### Schema Inventory

| Schema file | Format | Role |
|---|---|---|
| `my-appsync-aps/terraform/schema.graphql` | GraphQL SDL | **Source of truth** — domain GraphQL API |
| `my-resolver-fun/schema.graphql` | GraphQL SDL | Local copy for resolver codegen |
| `my-frontend-uix/schema.graphql` | GraphQL SDL | Local copy for UI codegen |
| `my-service-svc/schema/catalog-schema-v2.2.json` | JSON Schema | DynamoDB entity definition — catalogs |
| `my-service-svc/schema/instance-schema-v2.1.json` | JSON Schema | DynamoDB entity definition — instances |
| `my-service-svc/openapi/openapi.yaml` | OpenAPI 3.1 | REST API contract |

### JSON Schemas (DynamoDB Entity Definitions)

The `schema/` directories contain JSON Schema (draft-07) files that define DynamoDB item shapes —
the lowest and most authoritative data layer. Include:
- Schema version
- All fields with types and constraints
- DynamoDB key patterns (PK, SK, GSI keys)
- Conditional validation rules (allOf/if/then — e.g., "CORE status requires coreValue")
- Conventions (monetary values in minor units, timestamp formats, ID formats)
```

**Example dependency map section:**

```markdown
## Dependency Map

```
                    ┌──────────────────┐
                    │  my-commons-lib  │  (shared Java library)
                    └──────┬────────┬──┘
               Maven dep   │        │   Maven dep
            ┌──────────────┘        └──────────────┐
            ▼                                       ▼
 ┌──────────────────┐                  ┌────────────────────┐
 │  my-service-svc  │◄── REST ────────▶│  my-orders-svc     │
 │  (DynamoDB)      │                  │  (DynamoDB)         │
 └────────┬─────────┘                  └───────────┬─────────┘
          │ REST                                   │ REST
          └──────────┐       ┌─────────────────────┘
                     ▼       ▼
              ┌──────────────────┐
              │  my-resolver-fun │
              └────────┬─────────┘
                       │
                       ▼
              ┌──────────────────┐
              │  my-appsync-aps  │  (GraphQL API gateway)
              └────────┬─────────┘
                       │ GraphQL
                       ▼
              ┌──────────────────┐
              │  my-frontend-uix │  (React microfrontend)
              └──────────────────┘
```
```

**The more detail you provide, the better the gap analysis will be.** A thorough REPO_SUMMARY typically runs 400–600 lines and takes 30–60 minutes to write — but it pays for itself many times over in scan accuracy. You can also ask Claude to help generate it by pointing it at your repos.

### 4. Environment variables

Required for Steps 1, 2, and 5:

```bash
export JIRA_USER_EMAIL="your-email@company.com"
export JIRA_API_TOKEN="your-atlassian-api-token"
export JIRA_BASE_URL="your-company.atlassian.net"
```

## Running the pipeline

### Step 1: Extract Critical Path

Reads a Confluence spec page and extracts features, acceptance criteria, field tables, state transitions, and Figma links.

```
/extract-critical-path <page-id-or-url>
```

**Input:** Confluence page ID, URL, or title
**Output:** `critical-path-extract.md`

**What to review:**
- Are all features captured?
- Are any features out of scope that should be marked?
- Are Figma links correct?

---

### Step 2: Extract Feature Designs

Reads the Figma links from Step 1 and extracts design frames, components, and layout specs.

```
/extract-feature-designs
```

**Input:** `critical-path-extract.md` (auto-detected)
**Output:** `feature-designs-extract.md` + `design-specs/` directory with JSON specs per feature

**What to review:**
- Did it find the right Figma frames?
- Are features mapped to the correct design files?

**Note:** Requires Figma API access. If Figma links aren't in the spec, this step produces minimal output — that's fine, Step 3 will work without designs.

---

### Step 3: Feature Gap Analysis

The heavy-lifting step. Scans the repos against the extracted requirements and designs to identify what exists, what's missing, and what needs to be built.

```
/feature-gap-analysis --feature-code=CODE
```

**Parameters:**
- `--feature-code=CODE` (required): Short uppercase prefix for story naming (e.g., `CORE`, `PRICE`, `INV`)
- `--repos=./repos` (optional, default shown)
- `--input-features=./critical-path-extract.md` (optional)
- `--input-designs=./feature-designs-extract.md` (optional)

**Input:** Step 1 output + Step 2 output + `repos/` directory + `repos/REPO_SUMMARY.md`
**Output:** `gap-report.md`

**What the gap report contains:**
- Scan summary: what exists in code, what doesn't
- Per-feature stories with acceptance criteria
- Per-story subtasks with layer tags (`[LIB]`, `[SVC]`, `[BFF]`, `[FE]`, `[INFRA]`, `[NFC]`)
- Existing code references (file paths, line numbers)
- Figma frame links per subtask
- Dependency graph (what blocks what)
- Cross-team dependencies
- Event contracts

**What to review:**
- Are the "what exists" findings accurate?
- Are gaps real or false positives?
- Is the story decomposition reasonable?
- Are cross-team dependencies identified?
- Does the critical path make sense?

**This is the most important review step.** The gap report becomes the input for both the industry review and Jira story creation. Get it right here.

---

### Step 4: Industry Standards Review

Compares the gap report against industry standards and best practices for the domain.

```
/industry-standards-review
```

**Input:** `gap-report.md` (auto-detected)
**Output:** `industry-review.md`

**What it checks:**
- `[COMPLIANCE]` — Regulatory or industry standard requirements
- `[GAP]` — Missing best practices
- `[OVERENG]` — Over-engineering concerns
- `[TERM]` — Terminology alignment with industry
- `[BESTPRAC]` — Best practice recommendations
- `[OK]` — Things that look good

**What to review:**
- Are compliance findings real for your domain?
- Are best practice recommendations worth adopting?
- Any over-engineering warnings to heed?

**This step is optional** but recommended. You can skip it and go directly to Step 5.

---

### Step 5: Create Jira Stories

Creates a Jira epic with stories, subtasks, and dependency links from the gap report.

```
/create-jira-stories --initiative=PROJ-123
```

**Parameters:**
- `--initiative=KEY` (required): Existing Jira initiative — the epic will be parented here
- `--project=KEY` (optional, default: `PARTS`)
- `--dry-run` (optional): Generate JSON to `/tmp/jira-stories/` without posting to Jira

**Input:** `gap-report.md`
**Output:** Live Jira issues (or JSON files with `--dry-run`)

**What it creates:**
- 1 Epic (child of the initiative)
- N Stories (children of the epic)
- N Subtasks (children of their stories)
- Blocks/Is-Blocked-By links between stories

**Recommendation:** Run with `--dry-run` first to review the JSON before creating live issues.

---

## Directory structure after a full run

```
my-feature-analysis/
├── repos/                           # Git checkouts (you create this)
│   ├── REPO_SUMMARY.md              # Architecture overview (you create this)
│   ├── my-commons-lib/
│   ├── my-service-svc/
│   ├── my-resolver-fun/
│   ├── my-appsync-aps/
│   └── my-frontend-uix/
├── critical-path-extract.md         # Step 1 output
├── feature-designs-extract.md       # Step 2 output
├── design-specs/                    # Step 2 output (Figma JSON per feature)
│   ├── feature-a/
│   │   ├── index.json
│   │   └── nodes.json
│   └── feature-b/
│       ├── index.json
│       └── nodes.json
├── gap-report.md                    # Step 3 output
└── industry-review.md               # Step 4 output (optional)
```

## Tips

### Running multiple iterations

If you need to re-run a step (e.g., after updating the spec or repos):
- Steps are idempotent — re-running overwrites the previous output
- Archive previous outputs if you want to compare: `mkdir prev-attempts && mv *.md prev-attempts/`

### Scoping the analysis

- The `--feature-code` parameter on Step 3 sets the naming convention for all stories (e.g., `CORE-A`, `CORE-B`)
- If your spec covers multiple features that should be separate epics, consider running the pipeline once per feature group with different working directories

### Getting better gap analysis results

1. **Keep repos up to date** — `cd repos/my-repo && git pull` before running Step 3
2. **Write a thorough REPO_SUMMARY.md** — the agent uses this to know where to search
3. **Include all relevant repos** — even if you think a repo isn't affected, include it so the agent can confirm
4. **Review Step 1 output carefully** — garbage in, garbage out. If the critical path extract misses a feature, the gap report won't cover it

### Using outputs beyond Jira

The gap report and industry review are useful documents on their own:
- Share `gap-report.md` with the team for sprint planning
- Use the dependency graph for sequencing work
- Use cross-team dependencies to start conversations early
- The "what exists" section is a useful code archaeology reference

## Supplemental documents

After running the pipeline, you may want to create additional documents for stakeholders:

- **Plain-language overview** — For PMs, POs, and non-engineers who need context on the feature
- **Engineering narrative** — For engineers who need to understand data models, event flows, and implementation patterns
- **Open questions doc** — Track architectural decisions and cross-team dependencies that need resolution before implementation

These aren't automated — create them by asking Claude to synthesize the gap report into the format you need.
