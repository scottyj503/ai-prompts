---
description: Post a comment to a JIRA issue via REST API using an ADF JSON file
argument-hint: "[issue-key] [--body-file=path]"
allowed-tools: Bash(printenv:*), Bash(curl:*), Bash(cat:*), Read
---

Post a comment to JIRA issue: $ARGUMENTS

## Input Parsing

Parse the arguments to extract:
- **Issue key**: The JIRA issue key (e.g., `PARTS-400`)
- **Body file path**: The path to a JSON file containing the ADF comment body (specified via `--body-file=path`)

If `--body-file` is not provided, check if a file exists at `/tmp/{issue-key}-comment.json`. If neither is available, report an error.

## Authentication

Use the environment variables (JIRA_USER_EMAIL, JIRA_API_TOKEN, JIRA_BASE_URL) with Base64-encoded Basic auth.

**Important:** The JIRA_BASE_URL may not include the `https://` protocol prefix. Always construct the URL as `https://${JIRA_BASE_URL}/...`.

## Post Comment

```bash
AUTH_HEADER="Authorization: Basic $(printf '%s:%s' "$JIRA_USER_EMAIL" "$JIRA_API_TOKEN" | base64)"
curl -sL -X POST \
  -H "$AUTH_HEADER" \
  -H "Content-Type: application/json" \
  --data @{body-file-path} \
  "https://${JIRA_BASE_URL}/rest/api/3/issue/{issueKey}/comment"
```

## Expected ADF Body Format

The body file must contain valid ADF (Atlassian Document Format) JSON:

```json
{
  "body": {
    "type": "doc",
    "version": 1,
    "content": [
      {
        "type": "paragraph",
        "content": [
          {"type": "text", "text": "Comment text here"}
        ]
      }
    ]
  }
}
```

## Output

On success, display:
- Comment URL: `https://{JIRA_BASE_URL}/browse/{issueKey}?focusedId={commentId}`
- Creation timestamp from the API response
- Confirmation message: "Comment posted to {issueKey}"

On failure, display:
- The error response from the JIRA API
- Suggestion to verify environment variables are set (`JIRA_USER_EMAIL`, `JIRA_API_TOKEN`, `JIRA_BASE_URL`)
- Suggestion to validate the ADF JSON with `jq . {body-file-path}`
