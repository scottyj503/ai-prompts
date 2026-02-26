---
description: Extract Figma design specs per feature from a Critical Path extract
argument-hint: [--input=./critical-path-extract.md] [--output=./feature-designs-extract.md] [--no-images]
allowed-tools: Bash(python3:*), Bash(printenv:*), Bash(ls:*), Bash(wc:*)
---

Process Figma links from a Critical Path extract into feature-organized design specs: $ARGUMENTS

## Parameters

Parse `$ARGUMENTS` for:
- **--input=PATH** (optional): Path to the Step 1 output file. Default: `./critical-path-extract.md`
- **--output=PATH** (optional): Output file path. Default: `./feature-designs-extract.md`
- **--no-images** (optional): Skip image export during Figma extraction (faster, smaller output)

## Prerequisites

1. Verify the input file exists by reading it. If missing, stop and tell the user to run `/extract-critical-path` first.

2. Check that `FIGMA_API_TOKEN` is set:
```bash
printenv FIGMA_API_TOKEN | wc -c
```
If the token is not set (0 bytes), stop and tell the user to set `FIGMA_API_TOKEN` before continuing.

## Step 1: Parse the Critical Path Extract

Read the input file and extract:
- The **Figma Mockups** table — each row has: #, Mockup Name, Figma URL, Related Features
- The **Features** list — each feature has: name, letter code, JIRA ref, priority, acceptance criteria, fields, state transitions, Figma association

Build an in-memory mapping:
```
figma_links = [
  { name: "Feature A Handoff", url: "https://...", features: ["A. Feature A"] },
  { name: "Dashboard", url: "https://...", features: ["B. Dashboard"] },
  ...
]
```

Deduplicate URLs — if the same Figma file key appears in multiple links with different `node-id` params, group them by file key so we only extract each file once (the script gets all frames from a file).

## Step 2: Extract Figma Designs

For each unique Figma file key, run the extraction script:

```bash
python3 /Users/scottjones/code/scottyj503/scripts/figma_extract.py {url} --output-dir ./design-specs/{slugified-mockup-name} --no-raw {--no-images if specified}
```

**Important notes:**
- Multiple mockup links may point to the same Figma file (different node-ids). Only extract each file once, using the first URL for that file key.
- Use `--no-raw` by default (raw file JSON can be 1GB+)
- The script creates: `index.json`, `frames/*.json`, and optionally `frames/*.png`

After each extraction, verify the output directory exists:
```bash
ls ./design-specs/{slugified-mockup-name}/
```

If a Figma extraction fails (e.g., 403, rate limit), log the error and continue with remaining URLs. Do not stop the entire pipeline for one failed extraction.

## Step 3: Read and Organize Design Data

For each successful extraction:

1. Read `index.json` to get the frame manifest (file name, pages, frame list)
2. For each frame in the manifest, read `frames/{frame-name}.json` to get component details
3. Associate frames to features using:
   - The `node-id` from the original Figma URL (if it points to a specific frame)
   - The mockup-to-feature mapping from the Critical Path extract
   - Frame name similarity to feature names (fallback)

Build a feature-centric view:
```
features = {
  "C. Part Record": {
    figma_file: "Parts-Record",
    frames: [
      { name: "Detail View", components: [...], image: "path/to/png" },
      ...
    ]
  },
  ...
}
```

## Step 4: Write Output File

Write the structured markdown to the output path (default `./feature-designs-extract.md`):

```markdown
# Feature Designs Extract: {source page title}

**Source:** {input file path}
**Extracted:** {date}
**Figma Files Processed:** {count}
**Frames Extracted:** {total count}
**Features with Designs:** {count}

---

## Design Extraction Summary

| # | Figma File | Frames | Features Covered | Status |
|---|-----------|--------|-----------------|--------|
| 1 | {file name} | {count} | {feature list} | Success / Failed / Partial |

---

## Feature Designs

### {Feature Letter}. {Feature Name}

**Figma File:** {file name}
**Figma URL:** {url}
**Frames:** {count}

#### Frames

##### {Frame Name}

- **Node ID:** {if available}
- **Components:** {count}
- **Image:** {path to PNG if extracted, or "Not extracted"}

**Component Inventory:**

| Component | Variants | Key Props |
|-----------|----------|-----------|
| {name} | {variant list} | {notable props} |

**Design Tokens Used:**
- Colors: {list}
- Typography: {list}

---
```

Repeat for each feature that has associated Figma designs. For features with no Figma association (e.g., backend-only features like "Architectural Plan"), include a brief note:

```markdown
### {Letter}. {Feature Name}

- **Figma:** None — {reason: backend-only / WO context / placeholder}
- **Design Inputs:** Acceptance criteria from Critical Path extract only
```

## Step 5: Present Summary

After writing the file, display a summary:

```
## Feature Design Extraction Complete

- **Input:** {input file path}
- **Output:** {output file path}
- **Figma files processed:** {count} ({success} succeeded, {fail} failed)
- **Total frames extracted:** {count}
- **Features with designs:** {count} of {total features}
- **Features without designs:** {count} (backend-only or cross-team)

### Design Coverage:
| Feature | Figma Coverage | Frames |
|---------|---------------|--------|
| C. Part Record | Yes — {n} frames | {frame names} |
| D. PO Lines | Yes — {n} frames | {frame names} |
| ...

### Design Spec Directories:
- ./design-specs/{name-1}/
- ./design-specs/{name-2}/
- ...

### Next Steps:
- Review extracted designs for completeness
- Run `/feature-gap-analysis` to compare designs + specs against repo code
```
