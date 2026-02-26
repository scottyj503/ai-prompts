---
description: Post a GitHub PR review with inline comments from prior code review recommendations
argument-hint: "[--omit=1,2,...] [--approve | --request-changes | --comment]"
allowed-tools: Bash(gh:*), Bash(git:*), Read, Glob, Grep
---

Post a GitHub PR review with inline comments based on the code review recommendations from this conversation.

Arguments: $ARGUMENTS

## Step 1: Parse Arguments

Parse `$ARGUMENTS` for:
- **`--omit=N,N,...`** (optional): Comma-separated recommendation numbers to skip
- **`--approve`**: Submit as an approval
- **`--request-changes`**: Submit requesting changes
- **`--comment`** (default): Submit as a comment-only review

If no action flag is provided, default to `--comment`.
If multiple action flags are provided, use the last one.

## Step 2: Locate Recommendations

Look back through the current conversation for the **numbered recommendations table** produced by a prior `/codereview` run. The table has this format:

```
| # | Priority | Issue | File | Action |
|---|----------|-------|------|--------|
| 1 | **Must** | ... | `path/to/file.ts` | ... |
| 2 | **Should** | ... | `path/to/file.ts` | ... |
```

Extract each recommendation's:
- **Number** (`#` column)
- **Priority** (Must / Should / Consider / Optional)
- **Issue** (description of the problem)
- **File** (the file path from the `File` column)
- **Action** (the suggested fix)

If no recommendations table is found in the conversation, stop and tell the user to run `/codereview <pr-number>` first.

## Step 3: Filter Recommendations

Remove any recommendations whose numbers appear in the `--omit` list. Report which recommendations are being posted and which were omitted.

## Step 4: Identify the PR

1. First, check if a PR number was referenced in the conversation (e.g., from the `/codereview` invocation)
2. If not found, fall back to detecting it from the current branch:
   ```bash
   gh pr view --json number --jq '.number'
   ```

Also get the repo owner and name:
```bash
gh repo view --json owner,name --jq '[.owner.login, .name] | join("/")'
```

## Step 5: Resolve File Positions

For each recommendation, you need to determine the correct position for the inline comment. Use the PR diff to find the right line:

```bash
gh api repos/{owner}/{repo}/pulls/{pr_number} --jq '.head.sha'
```

For each file in the recommendations, get the diff to find the appropriate line numbers:
```bash
gh api repos/{owner}/{repo}/pulls/{pr_number}/files --jq '.[] | select(.filename == "PATH") | {filename, patch}'
```

For each recommendation:
- Find the file in the PR diff
- Identify the most relevant line in the diff that relates to the recommendation's issue
- Use `line` (the line number in the file) and `side: "RIGHT"` for the comment positioning

## Step 6: Create and Submit the Review

Use `ToolSearch` to load the GitHub MCP tools needed:
1. Search for `github pending review` to load the review tools

Then execute these steps in order:

### 6a. Create a pending review
Use `mcp__github__create_pending_pull_request_review` with:
- `owner` and `repo` from Step 4
- `pullNumber` — the PR number

### 6b. Add inline comments
For each non-omitted recommendation, use `mcp__github__add_pull_request_review_comment_to_pending_review` with:
- `owner`, `repo`, `pullNumber`
- `path` — the file from the recommendation
- `line` — the resolved line number from Step 5
- `side` — `"RIGHT"`
- `body` — Format the comment as:
  ```
  **[Priority]:** Issue description

  **Suggestion:** Action/fix description
  ```

Add comments sequentially (each depends on the pending review existing).

### 6c. Submit the review
Use `mcp__github__submit_pending_pull_request_review` with:
- `owner`, `repo`, `pullNumber`
- `event` — map the action flag:
  - `--approve` → `"APPROVE"`
  - `--request-changes` → `"REQUEST_CHANGES"`
  - `--comment` → `"COMMENT"`
- `body` — A brief summary, e.g.: "Code review: N comments across M files. Priorities: X must-fix, Y should-fix, Z suggestions."

## Step 7: Report Results

After submitting, display:
- The review action taken (approved / requested changes / commented)
- Number of inline comments posted
- Which recommendations were included and which were omitted
- A link to the PR for verification
