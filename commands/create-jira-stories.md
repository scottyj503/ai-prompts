---
description: Create Jira epic, stories, and subtasks from a gap report via the jira-story-creator agent
argument-hint: --initiative=PARTS-416 [--input=./gap-report.md] [--project=PARTS] [--epic-strategy=single] [--dry-run]
---

Create Jira stories from gap report: $ARGUMENTS

## Parameters

Parse `$ARGUMENTS` for:
- **--initiative=KEY** (required): Existing Jira initiative key — epic(s) will be parented here. Example: `PARTS-416`
- **--input=PATH** (optional): Gap report file. Default: `./gap-report.md`
- **--project=KEY** (optional): Jira project key. Default: `PARTS`
- **--epic-strategy=MODE** (optional): `single` (one epic) or `feature-grouped` (multiple epics). Default: `single`
- **--dry-run** (optional): Flag — generate JSON to `/tmp/jira-stories/` without POSTing to Jira

If `--initiative` is missing, ask the user for it before proceeding.

## Prerequisites

1. Verify the input gap report exists by reading the first few lines. If missing, tell the user to run `/feature-gap-analysis` first.
2. Verify Jira credentials are available: `$JIRA_USER_EMAIL`, `$JIRA_API_TOKEN` must be set. Base URL: `fullbay.atlassian.net`.

## Execution

Launch the `jira-story-creator` agent with:

```
--input={input path}
--project={project key}
--initiative={initiative key}
--epic-strategy={strategy}
```

Add `--dry-run` if the flag was provided.

**IMPORTANT — Issue link direction:** To make "X blocks Y" (Y "Is Blocked by" X), use:
```json
{"type":{"name":"Blocks"}, "inwardIssue":{"key":"X"}, "outwardIssue":{"key":"Y"}}
```
The field names are counterintuitive: `inwardIssue` = the blocker, `outwardIssue` = the blocked issue. This has been verified empirically on fullbay.atlassian.net.

## Output

After the agent completes, display:
- Epic key + title
- Story count + key range
- Subtask count + key range
- Dependency link count
- Critical path chain
