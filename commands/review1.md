---
description: Run six parallel reviewers on a PR via the review1-fanout Workflow, adversarially verify CRITICAL/HIGH findings, and submit a GitHub review with inline comments
argument-hint: "<pr-number> [--out <path>] [--no-post]"
allowed-tools: Bash(gh:*), Bash(git:*), Bash(date:*), Bash(mkdir:*), Read, Write, Glob, Grep, Workflow, AskUserQuestion
---

You are a comprehensive PR reviewer. Your job is to review the PR named in `$ARGUMENTS`, present all findings grouped by severity, optionally write the full review to a markdown file, and give the user control over which findings get posted as a GitHub review.

**Arguments.** Parse `$ARGUMENTS` as: the PR number (required, first token), then optional flags.
- `--out <path>` — write the complete review report to this path after Step 3 (see Step 3.5). If `<path>` is an existing directory, write `<path>/review-PR<number>.md` inside it. A relative path resolves against the current working directory. Parent directories are created if missing.
- `--no-post` — stop after Step 3.5. Do not resolve diff positions, do not ask which comments to post, do not touch GitHub. Use for reviewing your own PRs into a file that another process consumes. Requires `--out`; if given without it, say so and stop before running any reviewers.

Wherever the steps below say `PR #<number>`, use the parsed PR number, never the raw `$ARGUMENTS` string.

**IMPORTANT: Use `gh` CLI for ALL GitHub operations. Do NOT use GitHub MCP tools.**

**Workflow-only.** Step 2 requires the **Workflow** tool. If it is not available in this session, print exactly one line — `Workflow tool unavailable in this session — run /review instead.` — and stop. Do not fall back to dispatching agents by hand.

Follow these steps exactly:

---

## Step 1: Fetch PR Context

Run these commands to gather PR info:

```bash
# Get repo owner/name
REPO=$(gh repo view --json owner,name --jq '.owner.login + "/" + .name')

# Get PR details
gh pr view <number> --json title,body,headRefName,headRefOid,files

# Save the full diff to a file — it is passed to the workflow BY PATH, never inline
gh pr diff <number> > /tmp/review1-PR<number>.diff
```

Save the PR title, body, head SHA, and list of changed files for use in later steps. Do not read the diff file into context; the reviewers read it themselves. Then checkout the PR and record the absolute repo root:

```bash
gh pr checkout <number>
git rev-parse --show-toplevel
```

**Do NOT pre-read changed files.** The reviewers have Read, Glob, and Grep tools and fetch exactly what they need. Pre-stuffing file contents wastes tokens and provides no benefit.

---

## Step 2: Run Reviews via the review1-fanout Workflow

Invoke the **Workflow** tool with the saved orchestration script. This slash command IS the user's explicit opt-in to run it.

- `scriptPath`: `/Users/scottjones/.claude/workflows/review1-fanout.js`
- `args` (a JSON object, not a string):
  - `repoRoot`: the absolute repo root from Step 1
  - `files`: the changed-file list from Step 1 (paths relative to the repo root)
  - `intent`: the PR title and body, as "the user's stated requirements"
  - `diffPath`: `/tmp/review1-PR<number>.diff` — the file written in Step 1. A path, not the diff text.
  - `skepticModel` (optional): only if the user asked for a specific model for the Verify phase. Omit by default — skeptics inherit the session model so different models can be compared across runs.
  - `skepticEffort` (optional): same rule, for reasoning effort.

**Every arg must be a literal value you actually have.** Never pass a placeholder such as `"<diff>"` or `"see Step 1"` — the script interpolates args verbatim into agent prompts, so a placeholder becomes a confusing instruction to six reviewers and the run is wasted. If a value is missing, go back and get it before invoking the workflow.

The workflow runs six specialist reviewers in parallel — functional, code-quality, performance, security, adr-compliance, data-side-effects — each returning schema-validated findings, dedupes them by file:line, checks the diff against the defect-class checklist at `~/.claude/knowledge/defect-classes.md`, then sends each CRITICAL/HIGH finding (up to 10) to one skeptic agent that returns CONFIRMED, REFUTED, or DOWNGRADE.

It returns `{ actionable, informational, refuted, reviewersSkipped, verify }`:

- `actionable` — CRITICAL/HIGH findings that survived verification. Each carries `verified: true` with a `verification` reason, or `verified: false` meaning the skeptic errored or the finding was beyond the verify cap. Treat unverified ones with extra suspicion, but do not drop them.
- `informational` — MEDIUM/LOW findings. Entries with `downgradedFrom` were CRITICAL/HIGH findings a skeptic judged real but minor; `downgradeReason` says why.
- `refuted` — findings disproved with cited evidence. Never propose them as PR comments. Always show them so the user can spot-check the refutation.
- `reviewersSkipped` — reviewers that returned nothing (skipped or errored). If non-empty, say so in the report.
- `verify` — the cap, how many findings passed through unverified beyond it, and which skeptic model/effort ran.

If the Workflow call itself errors, report the error and stop. Do not retry with hand-dispatched agents.

---

## Step 3: Display

Display ALL findings from the returned structure:

```
## Actionable Findings (CRITICAL/HIGH)
[1] CRITICAL | src/main/java/Foo.java:42 | Null pointer dereference on unchecked input | functional+quality | verified
[2] HIGH     | terraform/main.tf:15      | S3 bucket missing encryption configuration  | security           | UNVERIFIED (beyond cap)

## Informational Findings (MEDIUM/LOW)
[3] MEDIUM   | src/index.ts:1183         | Redundant .map() on input lines             | performance
[4] MEDIUM   | src/model/User.java:12    | Status write lacks condition expression     | data-side-effects  | downgraded from HIGH: <downgradeReason>

## Refuted by verification (do not post — spot-check)
[R1] HIGH    | src/service/Bar.java:88   | <original description>                      | adr                | <refutation>
```

Rules:
- The **Refuted** section is mandatory. If nothing was refuted, print the header followed by `none`.
- If `reviewersSkipped` is non-empty, print `Reviewers that returned nothing: <list>` above the tables.
- Print one line with the verify summary: cap, unverified-beyond-cap count, and skeptic model/effort.
- Print the verification reason for each verified actionable finding beneath its row.

If there are **zero** findings across all severities (actionable and informational both empty), report: "Clean review — no issues found." Show the refuted section anyway, then continue to Step 3.5 if `--out` was given (an empty review is still a record), and stop after it.

---

## Step 3.5: Write the Review Report (only when `--out` was given)

Write one markdown file at the resolved path using the `Write` tool. Get the timestamp with `date -u +%Y-%m-%dT%H:%MZ`. The file is read by both people and downstream processes, so keep the structure exact: YAML frontmatter for machine consumption, then sections in this order.

**The file always contains every finding** — all actionable, all informational, all refuted — in full, with no truncation, regardless of severity and regardless of what the user later selects for posting in Step 5. Selection affects only what reaches GitHub; the file is the complete record of the run.

```markdown
---
pr: <number>
repo: <owner/repo>
title: "<PR title>"
head_sha: <headRefOid>
branch: <headRefName>
reviewed_at: <timestamp>
command: /review1
reviewers: [functional, quality, performance, security, adr, data-side-effects]
reviewers_skipped: [<from reviewersSkipped, or empty>]
verify: { cap: <n>, unverified_beyond_cap: <n>, skeptic: "<verify.skeptic>" }
counts: { actionable: <n>, informational: <n>, downgraded: <n>, refuted: <n> }
posted: pending
---

# PR Review — <owner/repo> #<number>: <PR title>

Files reviewed (<n>):
- <each changed file>

## Summary

| Bucket | Count |
|---|---|
| Actionable (CRITICAL/HIGH, verified) | <n> |
| Actionable (CRITICAL/HIGH, unverified) | <n> |
| Informational (MEDIUM/LOW) | <n, of which n downgraded> |
| Refuted by verification | <n> |

<If reviewers_skipped is non-empty: one line naming them.>

## Actionable Findings

### A1. CRITICAL — `<file>:<line>` — <source>
**Finding:** <full description, including the suggested fix as written by the reviewer>
**Verification:** VERIFIED — <full verification reason>
<or> **Verification:** UNVERIFIED — <"skeptic errored" | "beyond verify cap">

### A2. HIGH — ...

## Informational Findings

### I1. MEDIUM — `<file>:<line>` — <source>
**Finding:** <full description>
<If downgraded:> **Downgraded from <severity>:** <full downgradeReason>

## Refuted by Verification (not actionable — spot-check)

### R1. <original severity> — `<file>:<line>` — <source>
**Original finding:** <full description>
**Refutation:** <full refutation>

<If none: the single word "none".>

## Posting Record

Not posted.
```

Number findings A1…, I1…, R1… in the order displayed in Step 3, so the numbers in this file match the numbers in the terminal and in the Step 5 selection list.

After writing, print the absolute path on its own line.

**If `--no-post` was given, stop here.** Print: "Review written to <path>. Not posted (--no-post)."

---

## Step 4: Resolve Diff Positions

For each actionable and informational finding, resolve the correct line position in the PR diff:

```bash
gh api repos/{owner}/{repo}/pulls/{number}/files --jq '.[] | select(.filename == "PATH") | {filename, patch}'
```

For each finding:
- Locate the file in the PR diff
- Confirm the finding's line number appears in the diff hunks
- If the line is **not** in the diff, flag it for the fallback section in Step 6

Refuted findings are never resolved or posted.

---

## Step 5: Present Proposed Comments for Approval

Display actionable and informational findings as a numbered list, grouped by severity. Pre-select CRITICAL, HIGH, and MEDIUM findings with `[x]`; leave LOW unselected with `[ ]`. MEDIUM is pre-selected because, per the severity guide, it covers pattern inconsistencies, missing tests, and author questions — the comments a human reviewer would leave. Note that MEDIUM findings are not skeptic-verified; mark them so the user can weigh that.

```
CRITICAL / HIGH (pre-selected, verified unless marked):
[x] 1. CRITICAL | src/main/java/Foo.java:42 | Null pointer dereference on unchecked input | functional
[x] 2. HIGH     | terraform/main.tf:15      | S3 bucket missing encryption configuration  | quality+security | UNVERIFIED (beyond cap)

MEDIUM (pre-selected, not verified):
[x] 3. MEDIUM   | src/index.ts:1183         | Redundant .map() on input lines             | performance
[x] 4. MEDIUM   | src/model/User.java:12    | Status write lacks condition expression     | data-side-effects (downgraded from HIGH)

LOW (not selected — pick individually if desired):
[ ] 5. LOW      | src/index.ts:7            | Import line exceeds 200 chars               | quality
```

Then use `AskUserQuestion` to select findings:
- Question: "Which comments would you like to post as a review on PR #<number>? (CRITICAL/HIGH/MEDIUM pre-selected)"
- Options:
  - "Post pre-selected" — post all CRITICAL, HIGH, and MEDIUM findings
  - "Post all" — post every finding including LOW
  - "Skip all" — post nothing, just keep the local report
  - "Let me pick" — user types comma-separated numbers (e.g. "1,3,5") in the freeform/Other field

After the user selects findings, ask for the review action. **Default to "Comment" regardless of findings.** Findings come from agents and carry a false-positive rate even after verification; a comment states the evidence and leaves the developer room to fix or refute, whereas "Request changes" blocks merge and asserts certainty on the reviewer's behalf. Escalation is the human's call.

If any actionable finding is CRITICAL **and** `verified: true`, print one line before the question so the choice is informed: `Note: N verified CRITICAL finding(s) — consider "Request changes".` Do not change the default.

- Question: "What review action should this be? (Default: Comment)"
- Options:
  - "Comment" — neutral review, no approval or rejection (default)
  - "Approve" — approve the PR with comments
  - "Request changes" — request changes on the PR

---

## Step 6: Submit Review with Inline Comments

Build a JSON payload with all accepted findings and submit as a single atomic review:

```bash
gh api repos/{owner}/{repo}/pulls/{number}/reviews \
  --input - <<'JSON'
{
  "event": "<EVENT>",
  "body": "Code review: N comments across M files. Sources: functional, code-quality, performance, security, adr-compliance, data-side-effects reviewers; CRITICAL/HIGH findings adversarially verified.",
  "comments": [
    {
      "path": "<file>",
      "line": <line>,
      "side": "RIGHT",
      "body": "**[SEVERITY]** Issue description\n\n**Suggested fix:** suggestion\n\n_Source: reviewer-name_"
    }
  ]
}
JSON
```

Where `<EVENT>` maps from the user's chosen verdict:
- "Comment" → `"COMMENT"`
- "Approve" → `"APPROVE"`
- "Request changes" → `"REQUEST_CHANGES"`

For a verified actionable finding, append `_Verified: <verification reason>_` to the comment body. For a downgraded finding, append `_Downgraded from <severity>: <downgradeReason>_`.

**Only include findings whose lines resolved to the diff** (Step 4). For any findings flagged as outside the diff, post them as general PR comments:

```bash
gh pr comment <number> --body "**[SEVERITY]** \`file:line\`

<finding description>

**Suggested fix:** <suggestion>

_Source: reviewer-name_"
```

---

Print a summary: "Submitted review on PR #<number> with N inline comments (verdict: VERDICT). Posted M fallback comments. Skipped K findings. R findings refuted by verification (not posted)."

**If `--out` was given**, update the report file to record what happened: replace `posted: pending` in the frontmatter with `posted: <COMMENT|APPROVE|REQUEST_CHANGES|skipped>`, and replace the `## Posting Record` body with the review URL (from the `gh api` response's `html_url`), the verdict, and the list of finding numbers (A1, I3, …) that were posted inline, posted as fallback comments, or skipped. If the user chose "Skip all", record `posted: skipped` and "Not posted — user skipped."
