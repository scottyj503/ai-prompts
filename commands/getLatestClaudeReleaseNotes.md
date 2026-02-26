---
description: Fetch the latest Claude Code release notes from GitHub
argument-hint: "[version] (optional)"
allowed-tools: WebSearch, WebFetch
---

Fetch Claude Code release notes from GitHub.

## Parameters

Parse `$ARGUMENTS` for:
- **Version** (optional): A specific version number (e.g., `2.1.44`)
- If no arguments are provided, fetch the **latest** release

## Fetching Release Notes

Use `WebFetch` to retrieve the GitHub releases page:

```
URL: https://github.com/anthropics/claude-code/releases
Prompt: Extract the release notes including version number, release date, and all changes listed.
```

**If a specific version is provided in `$ARGUMENTS`:**
- First try fetching the specific release tag page: `https://github.com/anthropics/claude-code/releases/tag/%40anthropic-ai%2Fclaude-code%40$ARGUMENTS`
- If that fails, fetch the main releases page and search for the matching version

**If no arguments are provided:**
- Fetch the main releases page and extract only the **most recent** release

## Output Format

Present the results as:

### Claude Code vX.Y.Z — YYYY-MM-DD

**Changes:**
- Bulleted list of all changes/fixes/features from the release

[View full release on GitHub](https://github.com/anthropics/claude-code/releases)

## Error Handling

- If the specified version is not found, inform the user and list the 3 most recent versions available
- If the page cannot be fetched, suggest the user visit the releases page directly
