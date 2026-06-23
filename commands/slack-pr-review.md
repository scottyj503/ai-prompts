---
description: Post a PR review request to the #peo-hrz-parts Slack channel in the canonical PARTS format
argument-hint: "<pr-url> <one-line-summary>"
allowed-tools: mcp__plugin_slack_slack__slack_send_message, Bash(gh pr view:*), AskUserQuestion
---

Post a PR review request to the `#peo-hrz-parts` Slack channel: $ARGUMENTS

## Channel

- **Name:** `#peo-hrz-parts`
- **ID:** `C0A4X6JJ2D9` (use the ID, not the human-readable name, when calling the Slack MCP tool)

## Input Parsing

Parse `$ARGUMENTS` to extract:
- **PR URL** — the full GitHub PR URL (e.g., `https://github.com/fullbay/prt-main-uix/pull/232`)
- **Summary** — a short one-line summary describing what the PR does (e.g., `clear checkboxes on refresh/navigation`)

Derive the **repo name** from the PR URL's third path segment (e.g., `prt-main-uix` from the URL above).

If either the PR URL or the summary is missing or ambiguous, use `AskUserQuestion` to ask for the missing piece before posting. Do not guess.

If only a PR URL is provided with no summary, optionally run `gh pr view <pr-url> --json title` and offer the PR title (lowercased, trailing punctuation stripped) as a suggested summary via `AskUserQuestion` — but the user always confirms the final wording.

## Message Format (canonical — match exactly)

```
[PR](<pr-url>) for `<repo>` to <summary in lowercase, no trailing period> :thank_you:
```

Rules:
- `PR` is the markdown link text — Slack auto-renders it as a clickable "PR" link. Do **not** paste the raw URL.
- The repo name is wrapped in backticks.
- The summary continues the "to <action>" pattern, stays in lowercase, and has no trailing period.
- The emoji is `:thank_you:` (Fullbay custom emoji) — do **not** substitute `:pray:`, `:bow:`, or any other lookalike.

Concrete examples:

```
[PR](https://github.com/fullbay/prt-main-uix/pull/232) for `prt-main-uix` to hide number input arrow steppers :thank_you:
[PR](https://github.com/fullbay/prt-main-uix/pull/239) for `prt-main-uix` to persist receive/return toast across form remount :thank_you:
[PR](https://github.com/fullbay/prt-main-uix/pull/247) for `prt-main-uix` to clear checkboxes on refresh/navigation :thank_you:
```

## Post the Message

Call `mcp__plugin_slack_slack__slack_send_message` with:
- `channel_id`: `C0A4X6JJ2D9`
- `text`: the formatted message above
- One message per PR, no thread.

## Output

On success:
- Confirm the post landed and show the exact message text that was sent.
- Include the channel name (`#peo-hrz-parts`) so the user knows where it went.

On failure:
- Surface the error from the Slack MCP tool verbatim.
- Suggest verifying the Slack MCP is connected and the channel ID is correct.
