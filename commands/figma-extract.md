---
description: Extract Figma design specs for offline analysis with Claude Code
argument-hint: <figma-url> [--output-dir ./design-specs] [--no-raw] [--no-images] [--all-frames]
allowed-tools: Bash(python3:*), Bash(printenv:*), Bash(ls:*), Bash(wc:*)
---

Extract design specs from a Figma file for analysis: $ARGUMENTS

## Prerequisites

Check that `FIGMA_API_TOKEN` is set:

```bash
printenv FIGMA_API_TOKEN | wc -c
```

If the token is not set (0 bytes), stop and tell the user to set `FIGMA_API_TOKEN` before continuing.

## Parse Arguments

The first positional argument is always the Figma URL or file key. Remaining arguments are passed through to the script as-is.

If no arguments are provided, ask the user for a Figma URL using AskUserQuestion.

**Default flags when not specified by the user:**
- `--no-raw` — skip the raw file JSON by default (can be 1GB+); the per-frame specs are self-contained
- `--no-images` is NOT set by default (images are useful for Claude to reference)

If the user did not explicitly pass `--no-raw` or `--output-dir`, add `--no-raw` automatically.

## Run Extraction

```bash
python3 /Users/scottjones/code/scottyj503/scripts/figma_extract.py {url} {flags}
```

## After Extraction

1. List the output directory to confirm what was created
2. Read the generated `index.json` to get the frame list
3. Present a summary to the user:
   - File name and frame count
   - List of extracted frames (name, type)
   - Which output files were generated
   - The output directory path
4. Ask the user what they want to do next using AskUserQuestion:
   - **Analyze a specific frame** — "Which frame should I analyze?" then read that frame's spec JSON (and PNG if available) and provide implementation guidance
   - **Review the full design system** — read styles.json, components.json, and design_tokens.json to map out the design system
   - **Generate component code** — ask which frame, then generate a React component from the spec
   - **Just the extraction** — done, the user will use the files on their own
