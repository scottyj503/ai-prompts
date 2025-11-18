---
description: Fetch Jira issue details using REST API
argument-hint: [issue-key]
allowed-tools: Bash(printenv:*), Bash(curl:*)
---

Fetch the Jira issue details for issue key: $ARGUMENTS

Use the environment variables (JIRA_USER_EMAIL, JIRA_API_TOKEN, JIRA_BASE_URL) to construct and execute a curl command to the Jira REST API endpoint `/rest/api/3/issue/{issueKey}` with fields: summary, description, status, issuetype, priority, assignee, reporter, created, updated.

Display the results in a readable format.