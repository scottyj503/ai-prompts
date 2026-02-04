---
description: Fetch Confluence page content using REST API
argument-hint: <page-id|url|title> [--prompt="instructions"]
allowed-tools: Bash(printenv:*), Bash(curl:*)
---

Fetch the Confluence page for: $ARGUMENTS

## Parameters

Parse `$ARGUMENTS` for:
- **Page identifier** (required): Can be one of:
  - **Page ID**: Numeric ID (e.g., `12345678`)
  - **URL**: Full Confluence page URL (extract page ID from it)
  - **Title**: Page title in quotes (searches across all spaces)
- **--prompt="..."** (optional): Instructions for analyzing/processing the page content

## Environment Variables

Use the following environment variables:
- `JIRA_USER_EMAIL` - Atlassian account email
- `JIRA_API_TOKEN` - Atlassian API token
- `JIRA_BASE_URL` - Atlassian instance URL (may not include `https://` prefix)

## Authentication

Use a Base64-encoded Authorization header (same pattern as Jira):

```bash
AUTH_HEADER="Authorization: Basic $(printf '%s:%s' "$JIRA_USER_EMAIL" "$JIRA_API_TOKEN" | base64)"
```

## Fetching the Page

**If Page ID is provided:**
```bash
curl -sL -H "$AUTH_HEADER" -H "Content-Type: application/json" \
  "https://${JIRA_BASE_URL}/wiki/rest/api/content/{pageId}?expand=body.storage,version,space,history.createdBy"
```

**If URL is provided:**
Extract the page ID from the URL (typically in the path or as a parameter) and use the above endpoint.

**If Title is provided:**
Search across all spaces using CQL:
```bash
curl -sL -H "$AUTH_HEADER" -H "Content-Type: application/json" \
  "https://${JIRA_BASE_URL}/wiki/rest/api/content/search?cql=title=\"{pageTitle}\"&expand=body.storage,version,space,history.createdBy"
```

If multiple pages match the title, list them and ask which one to retrieve.

## Default Output Format

Display the page with:
- **Title**: Page title
- **Space**: Space name and key
- **Author**: Created by (display name)
- **Body**: Page content (convert from Confluence storage format to readable markdown)

Format the body content by:
1. Stripping Confluence-specific markup/macros
2. Converting to readable markdown
3. Preserving headings, lists, tables, and code blocks

## Conditional Analysis

If `--prompt` is provided, after displaying the page content:
1. Analyze the page content according to the provided instructions
2. Present your analysis in a clear, structured format
3. Include specific references to sections of the page where relevant

Example: `--prompt="summarize the critical path"` would produce a focused summary of critical path information from the page.
