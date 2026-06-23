---
description: Mark a Jira ticket ready for QA — transition to "In QA", clear assignee, set Dev Owner to current user, and announce in #parts_qa
argument-hint: "<ticket-key> <repo> <summary>"
allowed-tools: mcp__plugin_slack_slack__slack_send_message, Bash(printenv:*), Bash(curl:*), Bash(jq:*), AskUserQuestion
---

Mark a Jira ticket ready for QA: $ARGUMENTS

This command performs **two coordinated actions**:

1. **Jira** — transition the ticket to **In QA**, set **Assignee = Unassigned**, set **Dev Owner = current user**.
2. **Slack** — post a "ready for QA" announcement to `#parts_qa` in the canonical format.

Do the Jira mutations **first**, verify them via a GET, then post to Slack — so the announcement only fires after the ticket is actually In QA.

## Input Parsing

Parse `$ARGUMENTS` as positional tokens:
- **Ticket key** — first token matching `[A-Z]+-\d+` (e.g., `PARTS-952`). May also be a Jira browse URL; extract the key from the path.
- **Repo** — second positional token (e.g., `ven-main-uix`, `prt-main-uix`).
- **Summary** — everything that remains, joined with spaces. Trim trailing period only if the rest of the punctuation looks intentional; otherwise leave as-typed.

If any of the three pieces is missing or ambiguous, use `AskUserQuestion` to ask for the missing piece. Do not guess.

## PARTS Project Constants

These are the values for PARTS-prefixed tickets. For any other project, look them up via `GET /rest/api/3/issue/<KEY>/transitions` and `GET /rest/api/3/field`.

- **In QA transition id:** `2`
- **Dev Owner custom field:** `customfield_10178`
- **Slack channel:** `#parts_qa` (id `C0223R69K0W`, **private channel** — use the ID when calling the Slack MCP)

## Authentication

Use the same env-var pattern as `/post-jira-comment`:

```bash
AUTH_HEADER="Authorization: Basic $(printf '%s:%s' "$JIRA_USER_EMAIL" "$JIRA_API_TOKEN" | base64)"
BASE="https://${JIRA_BASE_URL}"   # JIRA_BASE_URL may not include the scheme
```

## Step 1: Resolve the current user's accountId

```bash
ME=$(curl -sL -H "$AUTH_HEADER" "$BASE/rest/api/3/myself" | jq -r .accountId)
```

This is the value used for the Dev Owner write below. Don't hard-code an accountId — keep the command portable across users.

## Step 2: Jira mutations (run in parallel — they're independent)

Fire all three writes in a single message (one Bash call per write):

**Transition to In QA:**
```bash
curl -sL -X POST -H "$AUTH_HEADER" -H "Content-Type: application/json" \
  --data '{"transition":{"id":"2"}}' \
  "$BASE/rest/api/3/issue/<KEY>/transitions"
```

**Clear assignee:**
```bash
curl -sL -X PUT -H "$AUTH_HEADER" -H "Content-Type: application/json" \
  --data '{"accountId":null}' \
  "$BASE/rest/api/3/issue/<KEY>/assignee"
```

**Set Dev Owner to current user:**
```bash
curl -sL -X PUT -H "$AUTH_HEADER" -H "Content-Type: application/json" \
  --data "{\"fields\":{\"customfield_10178\":{\"accountId\":\"$ME\"}}}" \
  "$BASE/rest/api/3/issue/<KEY>"
```

## Step 3: Verify

```bash
curl -sL -H "$AUTH_HEADER" "$BASE/rest/api/3/issue/<KEY>?fields=status,assignee,customfield_10178" \
  | jq '{status: .fields.status.name, assignee: .fields.assignee, devOwner: .fields.customfield_10178.displayName}'
```

Expected:
- `status` = `"In QA"`
- `assignee` = `null`
- `devOwner` = the current user's display name

If verification fails, **stop** — do not post to Slack. Report which mutation didn't take and surface the API response.

## Step 4: Slack announcement (canonical format — match exactly)

```
[<TICKET-KEY>](<browse-url>) ready for QA in `<repo>` — <summary> :thank_you:
```

Where:
- `<browse-url>` = `https://${JIRA_BASE_URL}/browse/<TICKET-KEY>`
- The ticket key itself is the markdown link text (not the URL, not `Jira`, not the summary)
- Repo name is wrapped in **backticks**
- The em-dash `—` (U+2014) separates the "ready for QA in `<repo>`" phrase from the summary
- `:thank_you:` is the **Fullbay custom emoji** — don't substitute `:pray:` or `:bow:`. Always include the trailing colon (Slack emoji syntax).
- One message per ticket, no thread.

Concrete example:

```
[PARTS-952](https://fullbay.atlassian.net/browse/PARTS-952) ready for QA in `ven-main-uix` — render Vendor Status as an FBBadge (green for Active, gray for Inactive) on the desktop data grid instead of plain text. :thank_you:
```

Post via `mcp__plugin_slack_slack__slack_send_message`:
- `channel_id`: `C0223R69K0W`
- `text`: the formatted message above

## Output

On success, print:
- The verified Jira state (status, assignee, devOwner)
- The exact Slack message that was sent and the channel (`#parts_qa`)
- The browse URL of the ticket

On failure:
- Surface the failing API/Slack response verbatim
- Indicate which step failed (Jira transition, assignee clear, Dev Owner write, verification, or Slack post)
- For Jira failures, suggest verifying env vars (`JIRA_USER_EMAIL`, `JIRA_API_TOKEN`, `JIRA_BASE_URL`) and that the transition id `2` is still valid for the project (run `GET /rest/api/3/issue/<KEY>/transitions` to confirm)
