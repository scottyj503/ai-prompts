---
description: Move a set of Jira tickets to all environments (QA→STAGE→PROD→DEMO) via Harness — analyze readiness with the release-readiness-reviewer agent, confirm the plan, then promote/deploy each repo and run Terraform, with human approval gates; finish by commenting + closing the tickets and announcing in #parts_qa.
argument-hint: "<TICKET-KEY> [TICKET-KEY ...] (e.g. PARTS-1192 PARTS-1194)"
allowed-tools: Task, AskUserQuestion, TaskCreate, TaskUpdate, Monitor, TaskStop, mcp__harness-mcp-v2__harness_execute, mcp__harness-mcp-v2__harness_get, mcp__harness-mcp-v2__harness_list, mcp__harness-mcp-v2__harness_diagnose, mcp__plugin_slack_slack__slack_send_message, Bash(printenv:*), Bash(curl:*), Bash(gh:*), Bash(jq:*), Bash(python3:*)
---

Move these Jira tickets to all environments: $ARGUMENTS

You are the **release orchestrator** for Fullbay Parts/Vendor. The flow is **plan → confirm → execute**, with the human acking the real approval gates in Harness. Deploys are production-affecting and irreversible-ish — never skip the confirmation gate, never auto-approve a Blue/Green or Terraform gate on the user's behalf.

> A Port.io-based, single-stack, auto-approve alternative exists (`deployment-pipeline-orchestrator` agent). This command is the **multi-repo, ticket-driven, human-gated** path via the Harness MCP. Use that one only if the user explicitly wants single-stack auto-shipit.

## Phase 0 — Preflight

1. Verify env: `JIRA_USER_EMAIL`, `JIRA_API_TOKEN`, `JIRA_BASE_URL`, `HARNESS_API_KEY` (`printenv`). If any missing, stop and say so.
2. `gh auth status` implicitly available; Harness account `1k0Den-2QXm65nIlj1loyg`.
3. Confirm the resolved ticket list with the user if `$ARGUMENTS` is ambiguous (e.g. an umbrella key — fetch children).

## Phase 1 — Analyze (delegate, read-only)

Launch the **release-readiness-reviewer** agent (Task tool) with the ticket keys. It returns a verified plan: per-ticket PENDING vs ALREADY-LIVE, per-repo deploy mechanism + master HEAD SHA + prod SHA, **bundle warnings**, **Terraform steps**, and a recommended sequence.

Do not re-do its heavy analysis in the main thread — just consume the plan.

## Phase 2 — Present plan + gate

Show the plan as a table. Surface the two failure modes loudly:
- **Already-deployed tickets** → recommend comment + close only, no deploy.
- **Bundle risk** → shipping a repo's master HEAD also ships any other tickets in `deployed…master`. List them; flag dependency/tooling refreshes, infra bumps, MF/schema changes.

Then `AskUserQuestion` to choose scope (ship all / backend-only / hold / drop a repo) before any execution. Honor the answer.

## Phase 3 — Execute (per the approved plan)

Track steps with TaskCreate/TaskUpdate. **Pass `confirm: true` on every `harness_execute`** — the MCP otherwise returns a spurious `"Operation cancelled by user"`; if you still see it, just retry with `confirm: true`.

Resolve org/project: org `prt` (or `ven`), project = repo name with `-`→`_`.

### 3a. Code repos (Lambda `*-svc`/`*-fun`, frontend `*-uix`) — promote → stage → prod

For each repo, **at master HEAD SHA** from the plan:

1. **promote_build** — `inputs: {short_sha: "<HEAD>"}`.
   > Artifacts are **per-SHA**. master HEAD's QA artifact must be promoted before stage/prod or `deploy_stage` 404s on `stage.zip`/`sherpa.yml`. This is the #1 cause of a failed first stage run — always promote first.
2. **deploy_stage** — inputs:
   - Lambda (`*-svc`/`*-fun`): `{short_sha, serviceInputs:"", pull_request_id:"", prelive:"true"}`
   - Frontend (`*-uix`): `{short_sha, serviceInputs:"", pull_request_id:""}` (no `prelive`)
   - **Flake:** `*-svc` stage has an `integration_tests` stage that often lands `InterventionWaiting` while the `deploy` stage itself is green. Confirm via `harness_diagnose` that `deploy`=Success, then ask the user to mark the failing step **Failure Ignored** in the Harness UI. The pipeline goes terminal as `IgnoreFailed` — that's expected; proceed.
3. **deploy_prod** — same inputs as stage.
   - Lambda: Blue/Green with **two approval gates** (Add 10% → Switch All Traffic). The user approves both in the UI. **DEMO deploys automatically** inside this pipeline.
   - Frontend: single deploy stage, **no gates**; DEMO via the UIX demo step inside prod.

Promotes can run in parallel across repos. Within a repo, promote→stage→prod is strictly serial.

### 3b. AppSync `*-aps` (Terraform) — separate step, per workspace

`terraform_plan_apply` is its own pipeline with **its own approval gate**, run **per workspace**: `stage`, then `prod`, then `demo` (serial — one approval at a time).
- inputs: `{short_sha: "<HEAD>", workspace: "stage|prod|demo", branch_or_sha: "master"}`
- **Sequence:** run aps **prod** Terraform only **after** the backend Lambdas (svc/fun) are live in prod, so AppSync never advertises a mutation whose resolver isn't deployed yet.
- `sherpa.yml`-only infra changes are NOT Terraform — they already shipped with the Lambda deploy. Don't run Terraform for those.

### Monitoring

Use **Monitor** (or Bash poll loops) on the Harness gateway status API. Keep scripts **zsh-portable** (no `declare -A`) and treat `*Waiting*`/`Running`/`NotStarted`/`Queued` as non-terminal, `Success|Failed|Aborted|Expired|IgnoreFailed` as terminal. Surface the execution link for each run so the user can approve gates:
`https://app.harness.io/ng/account/1k0Den-2QXm65nIlj1loyg/all/orgs/<ORG>/projects/<PROJ>/pipelines/<PIPELINE>/deployments/<EXEC_ID>/pipeline`

Status poll:
```bash
curl -s -H "x-api-key: $HARNESS_API_KEY" \
  "https://app.harness.io/gateway/pipeline/api/pipelines/execution/v2/<EXEC>?accountIdentifier=1k0Den-2QXm65nIlj1loyg&orgIdentifier=<ORG>&projectIdentifier=<PROJ>" \
  | python3 -c "import sys,json;print(json.load(sys.stdin)['data']['pipelineExecutionSummary']['status'])"
```

## Phase 4 — Close out Jira + announce

After every deploy in scope is terminal-Success (and Terraform applied):

1. **Comment** each ticket with a deployment matrix (ADF JSON via `POST /rest/api/3/issue/<KEY>/comment`): repo/PR rows × QA/STAGE/PROD/DEMO, the SHAs shipped, bundle note, and "no Terraform / TF applied stage·prod·demo" as applicable. For an **already-live** ticket, note it shipped earlier and was verified, no deploy needed.
2. **Transition to Closed.** PARTS transition id = `3`. For other projects, look up via `GET /rest/api/3/issue/<KEY>/transitions`. Verify with a status GET.
3. **Announce in #parts_qa** (`C0223R69K0W`, private — use the ID) tagging Alex Hurtado (`<@U02FCEY4HJP>`), canonical format:
   ```
   <@U02FCEY4HJP> I have deployed the following to all environments. The particulars are noted in the Stories:
   • <https://fullbay.atlassian.net/browse/KEY|KEY>
   ```
   Include already-live tickets with a one-line "already live, verified + closed" note.

## Phase 5 — Final summary

Report: per-ticket comment id + Closed status; per-repo SHA shipped and mechanism (Blue/Green / CloudFront / TF stage·prod·demo); any bundle that rode along (so owners know their work is now live); the Slack link. Flag recurring issues worth a ticket (e.g. the `*-svc` integration_tests flake).

## Hard rules

- Confirm before the first deploy; never auto-approve Blue/Green or Terraform gates.
- `confirm: true` on all `harness_execute`.
- Promote before stage (per-SHA artifacts).
- Terraform is a separate `terraform_plan_apply` step, per workspace, gated; only for real HCL/`terraform/` changes.
- `*-commons-lib` is never deployed directly; it's baked into consumer builds.
- Don't claim "deployed to all envs" until prod (and DEMO, and any TF workspaces) are actually Success.
