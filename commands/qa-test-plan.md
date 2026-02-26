---
description: Gather story context, branch diff, and PR changes, then launch the qa-testing-agent to create an interactive test plan
argument-hint: "[story-key] [--pr=123,456] [--instructions=\"focus on edit modal\"]"
allowed-tools: Bash(git:*), Bash(gh:*), Bash(printenv:*), Bash(curl:*)
---

Build full QA context and generate an interactive test plan for: $ARGUMENTS

Parse the arguments to extract:
- **Story key**: The JIRA issue key (e.g., `PARTS-400`) — always the first positional argument
- **PR numbers** (optional): One or more GitHub PR numbers passed via `--pr=123` or `--pr=123,456`
- **Custom instructions** (optional): Free-text instructions passed via `--instructions="..."` (e.g., `--instructions="focus on the edit modal, skip delete tests, test with admin role"`)

If `--instructions` is provided, treat it as the **highest-priority input** — it overrides default scope decisions and steers the entire test plan. Apply these instructions when:
- Deciding which ACs to focus on or skip
- Selecting the device matrix
- Generating test cases (add, remove, or reprioritize)
- Setting up execution todos

If `--instructions` is **not** provided, still ask the tester during refinement (Task 4.3) for any custom guidance before generating the plan.

## Task 1: Branch Context (Catchup)

Run a git diff comparing this branch to main/master to understand what code changes have been made on the current branch.

```bash
git diff main...HEAD
```

Summarize the changes: which files changed, what areas of the codebase are affected (components, services, tests, config).

## Task 2: Fetch JIRA Story

Fetch the JIRA issue details for the story key.

Use the environment variables (JIRA_USER_EMAIL, JIRA_API_TOKEN, JIRA_BASE_URL) to fetch the issue.

**Important:** The JIRA_BASE_URL may not include the `https://` protocol prefix. Always construct the URL as `https://${JIRA_BASE_URL}/rest/api/3/issue/{issueKey}`.

**Authentication:** Use a Base64-encoded Authorization header instead of `curl -u` or `--user` flags (which can fail with special characters in tokens):

```bash
AUTH_HEADER="Authorization: Basic $(printf '%s:%s' "$JIRA_USER_EMAIL" "$JIRA_API_TOKEN" | base64)"
curl -sL -H "$AUTH_HEADER" -H "Content-Type: application/json" \
  "https://${JIRA_BASE_URL}/rest/api/3/issue/{issueKey}?fields=summary,description,status,issuetype,priority,assignee,reporter,created,updated,comment"
```

Extract:
- Story summary and description
- Acceptance criteria
- Existing comments (dev notes, blockers, deployment status)

## Task 3: Fetch PR Changes (if --pr provided)

For each PR number provided, fetch the diff and summary:

```bash
gh pr view {pr-number} --json title,body,files,additions,deletions,changedFiles
gh pr diff {pr-number}
```

Summarize each PR: what it changes, which files are affected, and how it relates to the story's acceptance criteria.

If no `--pr` argument is provided, skip this task — the branch diff from Task 1 is sufficient.

## Task 4: Launch QA Testing Agent — Interactive Test Plan

With all context gathered, now operate as the **qa-testing-agent** to create a test plan.

### 4.1 Session Initialization (Phase 0)

- Detect tester name from `git config user.name`, confirm with the user
- Detect project context (backend, frontend, full-stack) from the working directory
- Story key is already known from the arguments

### 4.2 AC Analysis (Phase 1)

Using the JIRA story data and code changes from Tasks 1-3:

- Parse and categorize all acceptance criteria (functional, visual, translation, integration)
- **Correlate ACs against the actual code diff** — identify which ACs are directly covered by the changes, which are indirectly affected, and which are unrelated
- Identify testable vs. blocked ACs based on what the diff shows is implemented
- Check story comments for blockers or dev notes

Present the AC analysis to the tester and ask for validation.

### 4.3 Refinement Questions

Ask the tester targeted questions to refine the plan. Use AskUserQuestion for each:

- **Scope**: "Based on the changes, should we focus testing on {affected areas} or test the full feature?"
- **Mobile**: "The changes touch {components} — do we need mobile testing for this?" (apply device matrix decision logic)
- **Translation**: "New UI text was added in {files} — should we include translation testing?"
- **Blockers**: "Are there any known blockers or dependencies not yet deployed to QA?"
- **Deployment prerequisite** (blocking — must be confirmed before generating the plan):
  1. "Is your PR merged to master?" — if no, testing cannot proceed (build artifacts only publish on master merge)
  2. "What is the short SHA from the master merge commit?"
  3. "Has that SHA been deployed to QA via Harness?"
  4. "Did the Harness pipeline succeed?"
- **Custom instructions**: "Any additional instructions or focus areas? (e.g., 'test with admin role', 'ignore delete functionality', 'focus on the edit modal', 'skip happy path — I already tested that')"

The custom instructions prompt is **always asked** — it gives the tester an open-ended opportunity to steer the plan before generation. If the tester provides instructions, incorporate them into the test plan: adjust scope, add/remove test cases, reorder priorities, or add notes as appropriate.

Allow follow-up questions — the tester may have additional context or want to adjust scope.

### 4.4 Generate Test Plan (Phase 2)

Generate the test plan at `test-plans/{STORY-ID}-test-plan.md` following the qa-testing-agent's template, incorporating:

- The correlated AC-to-diff mapping (so test cases target actual changes)
- Answers from the refinement questions
- Device matrix decisions
- Known blockers from story comments

### 4.5 Create Execution Todos

Use TodoWrite to create a checklist of execution tasks:

- [ ] Confirm PR merged to master
- [ ] Deploy master SHA to QA via Harness (if not confirmed)
- [ ] Desktop testing: Chrome 1920x1080
- [ ] Mobile testing: {devices from matrix decision}
- [ ] Translation testing (if applicable)
- [ ] Screenshot capture: {target count}
- [ ] Document automated test coverage (QAC ticket, branch, commit)
- [ ] Format and post results to JIRA

## Output

Present a summary to the tester:

1. **Story overview** — key, summary, status
2. **Code changes** — what the branch/PRs modified
3. **AC coverage map** — which ACs are covered by the changes
4. **Test plan** — link to the generated file
5. **Execution todos** — the checklist for next steps
6. **Open questions** — anything still needing clarification
