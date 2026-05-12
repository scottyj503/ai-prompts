---
description: Kick off a bug-bash verification run on a list of Jira tickets using the bug-bash-runner agent (PARTS context, two-repo CWD)
argument-hint: "<TICKET-KEY> [TICKET-KEY ...] (e.g., PARTS-939 PARTS-940 PARTS-943) — or a single umbrella key (e.g., PARTS-961)"
allowed-tools: Bash(printenv:*), Bash(curl:*), Bash(git:*), Bash(lsof:*), Bash(find:*), Bash(ls:*)
---

Run a bug-bash verification phase across the following Jira ticket keys: $ARGUMENTS

Each ticket is a bug filed against the Parts micro-frontend (`prt-main-uix`) or the Vendor micro-frontend (`ven-main-uix`), expected as immediate subdirectories of the current working directory.

## Setup (do this in the foreground, before invoking the agent)

1. **Discover the candidate repos in CWD:**
   ```bash
   find . -maxdepth 2 -type d -name .git | sed 's|/.git$||'
   ```
   Expect `./prt-main-uix` and/or `./ven-main-uix`. If neither is present, ask the user where the repos live.

2. **Resolve scope.** If `$ARGUMENTS` looks like a single umbrella key (one Jira key with `Story` / `Epic` type, or one key whose children are themselves bugs), fetch its children. Otherwise treat the args as an explicit list of bug keys. Confirm the resolved list with the user before continuing.

3. **Auth setup.** Read `prt-main-uix/CLAUDE.md` for the Playwright/Descope auth pattern — it documents `pnpm test:int:auth` plus cookie injection (`DS` / `DSR`) into the MCP browser context. The same pattern applies to `ven-main-uix`. **Do not rely on saved auth state being auto-loaded** — it isn't.

4. **Port 8090 check.** Both MFs use Vite on `:8090`. Only one can hold the port at a time:
   ```bash
   lsof -iTCP:8090 -sTCP:LISTEN
   ```
   Pick the repo the first ticket needs and start `pnpm dev` from there. Switch if a later ticket needs the other repo.

## Launch the bug-bash-runner agent in triage-only mode

Hand off to the **bug-bash-runner** agent with:

- **Scope:** the resolved ticket keys
- **Mode:** triage-only (Phase 1 + pause + report) — do not proceed to Phase 2 from this command
- **MCP browser:** Playwright by default; switch to Chrome DevTools MCP if the user requests `--use-chrome-devtools`
- **Repos:** the ones discovered in CWD

The agent will:

1. **Fan out subagents** to verify independent source-only tickets in parallel; run browser-driven tickets serially on the shared MCP browser session
2. For each ticket: reproduce the bug or inspect the source for state/wiring claims, producing a structured verdict (**Confirmed**, **Not reproduced**, or **Partial / Reframe**) with concrete fix direction
3. Synthesize a single report file at the CWD root (named after the umbrella key if one was passed, otherwise `bug-bash-<date>-report.md`)
4. For tickets verified-as-fixed (the bug no longer reproduces), draft a previewed Jira batch: comment + Closed transition + Dev Owner assignment → `AskUserQuestion` to approve → apply via REST
5. Pause via `AskUserQuestion` with the confirmed-bug list and proposed next steps (e.g., "proceed to fix queue?" — separate command/invocation)

## Output

End with:

- **Report file path** at the CWD root
- **Summary table:** `TICKET | VERDICT | one-line note`
- **Confirmed bugs** (still need fixing) — the list the user asked for
- **Closed during this run** (verified-as-fixed) — with the Jira mutation that landed
- **Open questions / asks for human direction** — anything the agent couldn't decide alone
