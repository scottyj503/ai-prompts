---
description: Extract Critical Path features and Figma links from a Confluence spec page
argument-hint: <page-id|url|title> [--output=./critical-path-extract.md]
allowed-tools: Bash(printenv:*), Bash(curl:*)
---

Extract Critical Path features and Figma links from: $ARGUMENTS

## Parameters

Parse `$ARGUMENTS` for:
- **Page identifier** (required): Can be one of:
  - **Page ID**: Numeric ID (e.g., `12345678`)
  - **URL**: Full Confluence page URL (extract page ID from it)
  - **Title**: Page title in quotes (searches across all spaces)
- **--output=PATH** (optional): Output file path. Default: `./critical-path-extract.md`

## Environment Variables

Use the following environment variables:
- `JIRA_USER_EMAIL` - Atlassian account email
- `JIRA_API_TOKEN` - Atlassian API token
- `JIRA_BASE_URL` - Atlassian instance URL (may not include `https://` prefix)

## Authentication

Use a Base64-encoded Authorization header:

```bash
AUTH_HEADER="Authorization: Basic $(printf '%s:%s' "$JIRA_USER_EMAIL" "$JIRA_API_TOKEN" | base64)"
```

## Step 1: Fetch the Confluence Page

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

## Step 2: Convert to Markdown

Convert the Confluence storage format body to readable markdown:
1. Strip Confluence-specific markup/macros
2. Convert to readable markdown
3. Preserve headings, lists, tables, code blocks, and links

## Step 3: Extract Figma Links

Scan the full page content for Figma links. Look for:
- Links in an "Official Mock ups" or "Official Mockups" section (typically near the top)
- Any `figma.com` URLs anywhere in the page
- Link text / labels associated with each Figma URL

Collect each into a list with: mockup name (from link text), Figma URL.

## Step 4: Extract Features

Identify feature boundaries in the content. Features are typically demarcated by:
- Headings (H2/H3) that name a feature area
- Sections marked **P1M1**, **Critical Path**, or similar priority labels
- Logical groupings of acceptance criteria, field definitions, or state transitions

For each feature, extract:
- **Feature name** (from the heading or first line)
- **JIRA reference** (any `PARTS-NNN` pattern found in context)
- **Priority** (`P1M1` / `Critical Path` / `Standard` — based on explicit labels or section placement)
- **Acceptance criteria** (bulleted items, "AC:" prefixes, numbered requirements)
- **Field definitions** (tables with field name, type, required, default, constraint columns)
- **State transitions** (tables or lists showing from → to → trigger patterns)

## Step 5: Associate Figma Links to Features

Best-effort mapping of Figma mockups to features:
- Match by name similarity between mockup labels and feature names
- Match by proximity (mockup link appears within or adjacent to a feature section)
- If a mockup clearly covers multiple features, list all related features
- If no clear association exists, mark as "See all"

This mapping is approximate. Note any ambiguity.

## Step 6: Write Output File

Write the structured markdown to the output path (default `./critical-path-extract.md`). Use this format:

```markdown
# Critical Path Extract: {Page Title}

**Source:** Confluence page {id} — {page title}
**Extracted:** {today's date}
**Features:** {count}
**Figma Links:** {count}

---

## Figma Mockups

| # | Mockup Name | Figma URL | Related Features |
|---|-------------|-----------|-----------------|
| 1 | {name or link text} | {url} | {best-effort feature list, or "See all"} |

> Note: Figma-to-feature mapping is best-effort. One mockup may cover multiple features.

---

## Features

### 1. {Feature Name}

- **JIRA:** {PARTS-NNN if referenced, or "Not assigned"}
- **Priority:** {P1M1 / Critical Path / Standard}
- **Figma:** {associated link(s) or "None identified"}

**Acceptance Criteria:**
- {criterion 1}
- {criterion 2}

**Fields:** (if field definitions present)

| Field | Type | Required | Default | Constraint |
|-------|------|----------|---------|------------|
| ... | ... | ... | ... | ... |

**State Transitions:** (if present)

| From | To | Trigger |
|------|----|---------|
| ... | ... | ... |

---
```

Repeat the feature block for each extracted feature, numbered sequentially.

Omit the **Fields** and **State Transitions** sub-sections entirely if none were found for a given feature (do not include empty tables).

## Step 7: Present Summary

After writing the file, display a summary to the user:

```
## Extraction Complete

- **Page:** {title} (ID: {id})
- **Output:** {output path}
- **Features extracted:** {count}
- **Figma links found:** {count}
- **Ambiguous mappings:** {count or "None"}

### Features Found:
1. {Feature Name} — {priority} — {JIRA ref or "No JIRA"}
2. ...

### Next Steps:
- Review the output file and correct any misattributed Figma mappings
- Run `/extract-feature-designs` to process the Figma links into design specs
```
