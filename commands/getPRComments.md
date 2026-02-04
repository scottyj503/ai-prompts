---
description: Fetch GitHub PR comments and analyze codebase in context
argument-hint: <pr-number> [--author=<username>]
allowed-tools: Bash(gh:*), Glob, Grep, Read
---

Fetch all comments from GitHub Pull Request: $ARGUMENTS

## Parameters

Parse `$ARGUMENTS` for:
- **PR number** (required): The pull request number
- **--author=username** (optional): Filter comments by GitHub username

## Fetching Comments

Use the `gh` CLI to fetch both types of comments:

**1. PR Conversation Comments:**
```bash
gh api repos/{owner}/{repo}/issues/{pr_number}/comments
```

**2. PR Review Comments (inline code comments):**
```bash
gh api repos/{owner}/{repo}/pulls/{pr_number}/comments
```

Use `gh repo view --json owner,name` to get the current repo's owner and name.

## Output Format

Display each comment with:
- **Author**: GitHub username
- **Date**: Created timestamp
- **Type**: "Conversation" or "Review"
- **File/Line**: (for review comments only) file path and line number
- **Body**: The comment text

If `--author` is specified, filter to show only comments from that username.

Group comments chronologically and format as readable markdown.

## Codebase Analysis

After displaying the comments, analyze the codebase in the current working directory in context of the PR feedback:

1. Read relevant files mentioned in review comments
2. Assess whether the feedback has been addressed
3. Identify any outstanding issues or suggestions
4. Provide your recommendations on next steps

Present your analysis in a clear summary with actionable insights.
