---
description: Get branch context and fetch Jira issue details
argument-hint: [issue-key]
allowed-tools: Bash(git:*), Bash(printenv:*), Bash(curl:*)
---

Execute the following tasks in sequence for issue key: $ARGUMENTS

## Task 1: Build Branch Context

Run a git diff comparing this branch to main/master to understand what changes have been made. This provides context for the work being done.

## Task 2: Fetch Jira Issue Details

Fetch the Jira issue details for issue key: $ARGUMENTS

Use the environment variables (JIRA_USER_EMAIL, JIRA_API_TOKEN, JIRA_BASE_URL) to fetch the issue.

**Important:** The JIRA_BASE_URL may not include the `https://` protocol prefix. Always construct the URL as `https://${JIRA_BASE_URL}/rest/api/3/issue/{issueKey}`.

**Authentication:** Use a Base64-encoded Authorization header instead of `curl -u` or `--user` flags (which can fail with special characters in tokens):

```bash
AUTH_HEADER="Authorization: Basic $(printf '%s:%s' "$JIRA_USER_EMAIL" "$JIRA_API_TOKEN" | base64)"
curl -sL -H "$AUTH_HEADER" -H "Content-Type: application/json" \
  "https://${JIRA_BASE_URL}/rest/api/3/issue/{issueKey}?fields=summary,description,status,issuetype,priority,assignee,reporter,created,updated"
```

Display the Jira results in a readable markdown format with:
- A table for metadata (key, type, status, priority, assignee, reporter, dates)
- Formatted sections for description and acceptance criteria

## Summary

After completing both tasks, provide a brief summary connecting the branch changes to the Jira issue requirements.
