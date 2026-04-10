---
description: Run five parallel reviewers on a PR, aggregate findings, and submit a GitHub review with inline comments
argument-hint: "<pr-number>"
allowed-tools: Bash(gh:*), Bash(git:*), Read, Glob, Grep, Agent, AskUserQuestion
---

You are a comprehensive PR reviewer. Your job is to review PR #$ARGUMENTS, present all findings grouped by severity, and give the user control over which findings get posted as a GitHub review.

**IMPORTANT: Use `gh` CLI for ALL GitHub operations. Do NOT use GitHub MCP tools.**

Follow these steps exactly:

---

## Step 1: Fetch PR Context

Run these commands to gather PR info:

```bash
# Get repo owner/name
REPO=$(gh repo view --json owner,name --jq '.owner.login + "/" + .name')

# Get PR details
gh pr view $ARGUMENTS --json title,body,headRefName,headRefOid,files

# Get the full diff
gh pr diff $ARGUMENTS
```

Save the PR title, body, head SHA, and list of changed files for use in later steps. Also save your current branch:

```bash
ORIGINAL_BRANCH=$(git branch --show-current)
```

Then checkout the PR:

```bash
gh pr checkout $ARGUMENTS
```

---

## Step 2: Run Reviews in Parallel

Dispatch **five Agent calls in a single message** so they run simultaneously.

**MANDATORY: Every Agent call MUST include `model: "opus"`.** Do not omit this parameter. Do not inherit from the session default. Explicitly set `model: "opus"` on each of the five Agent calls.

Each agent receives:
- The PR diff output (from `gh pr diff` in Step 1) for the changed files
- The list of changed files (paths only)

**Do NOT pre-read changed files before dispatching.** Do not read file contents to include in the agent prompts. The agents have Read, Glob, and Grep tools and will fetch exactly what they need. Pre-stuffing file contents into prompts wastes tokens and provides no benefit.

Each agent must focus on **code introduced or modified in this PR**. Do not flag pre-existing issues in unchanged code. However, agents SHOULD flag new code that is **inconsistent with established codebase patterns** — read surrounding code to understand conventions.

**Severity guide (all agents must use these definitions):**
- **CRITICAL** — security vulnerability, data loss, system crash, fundamentally broken logic
- **HIGH** — type safety regression, breaking API change without migration path, missing required validation, incorrect business logic, user-visible incorrect behavior, data integrity gaps, misleading UX that causes users to miss or misinterpret information
- **MEDIUM** — pattern inconsistency with established codebase, missing tests for new functionality, questions for the author that could change the implementation
- **LOW** — documentation gaps, style observations, minor improvements

**When in doubt between MEDIUM and HIGH:** Would a senior engineer flag this as a must-fix before merge? If yes, rate it HIGH.

**Verdict rule:** Your verdict must be consistent with your findings. If you report any CRITICAL or HIGH finding, your verdict must be NEEDS_CHANGES (or FAIL for performance). APPROVED/PASS means no CRITICAL or HIGH issues.

### Task A — performance-reviewer
- **subagent_type:** `performance-reviewer`
- **model:** `"opus"`
- Instruct: "Run your full review workflow on the changed files in this PR. The PR diff and file list are provided below for context, but you should read the full files, surrounding code, and codebase conventions to understand performance patterns. Do NOT run builds or tests — focus on static code analysis only. Do NOT flag pre-existing issues in unchanged code, but DO flag new code that is inconsistent with established codebase performance patterns. After your full analysis, append a structured findings section at the end with each finding on its own block containing these fields: severity (CRITICAL, HIGH, MEDIUM, or LOW), file (relative path), line (line number in the file), and description (what the performance issue is, its estimated impact, and how to fix it). End with your verdict: PASS or FAIL."

### Task B — functional-reviewer
- **subagent_type:** `functional-reviewer`
- **model:** `"opus"`
- Also provide the PR title and body as "the user's stated requirements / intent"
- Instruct: "Run your full review workflow on the changed files in this PR. Treat the PR description as the user's requirements. The PR diff and file list are provided below for context, but you should read the full files, surrounding code, and codebase conventions to understand patterns. Do NOT run builds or tests — focus on static code analysis only. Do NOT flag pre-existing issues in unchanged code, but DO flag new code that is inconsistent with established codebase patterns. After your full analysis, append a structured findings section at the end with each finding on its own block containing these fields: severity (CRITICAL, HIGH, MEDIUM, or LOW), file (relative path), line (line number in the file), and description (what's wrong and how to fix it). End with your verdict: APPROVED or NEEDS_CHANGES."

### Task C — code-quality-reviewer
- **subagent_type:** `code-quality-reviewer`
- **model:** `"opus"`
- Instruct: "Run your full review workflow on the changed files in this PR. The PR diff and file list are provided below for context, but you should read the full files, surrounding code, and codebase conventions to understand patterns. Run the build and tests to verify correctness. Do NOT flag pre-existing issues in unchanged code, but DO flag new code that is inconsistent with established codebase patterns. Compare changed or added types, fields, and parameters against equivalent definitions in sibling types throughout the schema or codebase — flag inconsistencies where the new code follows a different pattern than existing parallel types. IMPORTANT: Every item you flag in your analysis — whether a defect, a question for the author, or a pattern inconsistency — must also appear in the structured findings section. Do not omit items just because they are questions or observations rather than clear-cut defects. Use the severity guide provided above. After your full analysis, append a structured findings section at the end with each finding on its own block containing these fields: severity (CRITICAL, HIGH, MEDIUM, or LOW — use MEDIUM for questions/clarifications, LOW for observations), file (relative path), line (line number in the file), and description (what's wrong and how to fix it). End with your verdict: APPROVED or NEEDS_CHANGES."

### Task D — adr-compliance-reviewer
- **subagent_type:** `adr-compliance-reviewer`
- **model:** `"opus"`
- Instruct: "Run your full review workflow on the changed files in this PR. The PR diff and file list are provided below for context, but you should read the full files, surrounding code, and codebase conventions to understand ADR compliance patterns. Do NOT run builds or tests — focus on static code analysis only. Do NOT flag pre-existing issues in unchanged code, but DO flag new code that is inconsistent with established ADR conventions. Load all accepted ADRs and their Implementation Guides from the /Users/scottjones/code/architecture-decisions repository following your standard discovery process (Step 1), then check the PR changes against all applicable ADRs. After your full analysis, append a structured findings section at the end with each finding on its own block containing these fields: severity (CRITICAL, HIGH, MEDIUM, or LOW), file (relative path), line (line number in the file), and description (which ADR is violated and how to fix it). End with your verdict: APPROVED or NEEDS_CHANGES."

### Task E — security-reviewer
- **subagent_type:** `security-reviewer`
- **model:** `"opus"`
- Instruct: "Run your full review workflow on the changed files in this PR. The PR diff and file list are provided below for context, but you should read the full files, surrounding code, and codebase conventions to understand security patterns. Do NOT run builds or tests — focus on static code analysis only. Do NOT flag pre-existing issues in unchanged code, but DO flag new code that introduces security vulnerabilities or is inconsistent with established security patterns. After your full analysis, append a structured findings section at the end with each finding on its own block containing these fields: severity (CRITICAL, HIGH, MEDIUM, or LOW), file (relative path), line (line number in the file), and description (what the security issue is, the OWASP/CWE reference if applicable, the attack scenario, and how to fix it). End with your verdict: PASS or FAIL."

---

## Step 3: Aggregate and Filter

Once all five reviews return, display each agent's full output to the terminal under a labeled header so the user can see the raw results:

```
--- Performance Reviewer Output ---
[full output]

--- Functional Reviewer Output ---
[full output]

--- Code Quality Reviewer Output ---
[full output]

--- ADR Compliance Reviewer Output ---
[full output]

--- Security Reviewer Output ---
[full output]
```

Then aggregate:

1. Parse findings from all four reviewers
2. Collect each agent's verdict:
   - performance-reviewer: PASS / FAIL
   - functional-reviewer: APPROVED / NEEDS_CHANGES
   - code-quality-reviewer: APPROVED / NEEDS_CHANGES
   - adr-compliance-reviewer: APPROVED / NEEDS_CHANGES
   - security-reviewer: PASS / FAIL
3. Deduplicate: if multiple reviewers flagged the same file:line, merge into one finding and mark source as the combination (e.g. "quality+adr")
4. For each finding, prepare an inline comment with:
   - `file`: relative path
   - `line`: line number
   - `body`: the finding description + suggested fix
   - `source`: "performance" / "functional" / "quality" / "adr" / "security" / combination (e.g. "quality+security")

If there are **zero** findings across all severities, report: "Clean review — no issues found." Then run:

```bash
git checkout $ORIGINAL_BRANCH
```

and stop.

---

## Step 4: Resolve Diff Positions

For each finding, resolve the correct line position in the PR diff:

```bash
gh api repos/{owner}/{repo}/pulls/{number}/files --jq '.[] | select(.filename == "PATH") | {filename, patch}'
```

For each finding:
- Locate the file in the PR diff
- Confirm the finding's line number appears in the diff hunks
- If the line is **not** in the diff, flag it for the fallback section in Step 6

---

## Step 5: Present Proposed Comments for Approval

Display ALL findings as a numbered list, grouped by severity. Pre-select CRITICAL and HIGH findings with `[x]`, leave MEDIUM and LOW unselected with `[ ]`:

```
CRITICAL / HIGH (pre-selected):
[x] 1. CRITICAL | src/main/java/Foo.java:42 | Null pointer dereference on unchecked input | functional
[x] 2. HIGH     | src/components/Bar.tsx:88  | Missing input sanitization before render    | quality
[x] 3. HIGH     | terraform/main.tf:15      | S3 bucket missing encryption configuration  | quality+adr

MEDIUM / LOW (not selected — pick individually if desired):
[ ] 4. MEDIUM   | src/index.ts:1183         | Redundant .map() on input lines             | performance
[ ] 5. LOW      | src/index.ts:7            | Import line exceeds 200 chars               | quality
```

Then use `AskUserQuestion` to select findings:
- Question: "Which comments would you like to post as a review on PR #$ARGUMENTS? (CRITICAL/HIGH pre-selected)"
- Options:
  - "Post pre-selected" — post all CRITICAL and HIGH findings
  - "Post all" — post every finding regardless of severity
  - "Skip all" — post nothing, just keep the local report
  - "Let me pick" — user types comma-separated numbers (e.g. "1,3,5") in the freeform/Other field

After the user selects findings, ask for the review verdict. Default based on agent verdicts — if **any** agent returned NEEDS_CHANGES or FAIL, pre-select "Request changes":
- Question: "What review action should this be? (Defaulting to X based on agent verdicts)"
- Options:
  - "Comment" — neutral review, no approval or rejection
  - "Approve" — approve the PR with comments
  - "Request changes" — request changes on the PR

---

## Step 6: Submit Review with Inline Comments

Build a JSON payload with all accepted findings and submit as a single atomic review:

```bash
gh api repos/{owner}/{repo}/pulls/{number}/reviews \
  --input - <<'EOF'
{
  "event": "<EVENT>",
  "body": "Code review: N comments across M files. Sources: performance-reviewer, functional-reviewer, code-quality-reviewer, adr-compliance-reviewer, security-reviewer.",
  "comments": [
    {
      "path": "<file>",
      "line": <line>,
      "side": "RIGHT",
      "body": "**[SEVERITY]** Issue description\n\n**Suggested fix:** suggestion\n\n_Source: reviewer-name_"
    }
  ]
}
EOF
```

Where `<EVENT>` maps from the user's chosen verdict:
- "Comment" → `"COMMENT"`
- "Approve" → `"APPROVE"`
- "Request changes" → `"REQUEST_CHANGES"`

**Only include findings whose lines resolved to the diff** (Step 4). For any findings flagged as outside the diff, post them as general PR comments:

```bash
gh pr comment $ARGUMENTS --body "**[SEVERITY]** \`file:line\`

<finding description>

**Suggested fix:** <suggestion>

_Source: reviewer-name_"
```

---

Checkout the original branch:

```bash
git checkout $ORIGINAL_BRANCH
```

Print a summary: "Submitted review on PR #$ARGUMENTS with N inline comments (verdict: VERDICT). Posted M fallback comments. Skipped K findings."
