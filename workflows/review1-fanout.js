export const meta = {
  name: 'review1-fanout',
  description: 'Six specialist reviewers in parallel, dedup by file:line, then one skeptic per CRITICAL/HIGH finding (confirm / refute / downgrade)',
  phases: [
    { title: 'Recheck', detail: 'follow-up only: one agent per prior finding decides RESOLVED or OPEN' },
    { title: 'Review', detail: 'six specialist reviewers over the changed files' },
    { title: 'Verify', detail: 'one skeptic per CRITICAL/HIGH finding: confirm, refute, or downgrade' },
  ],
}

// Invoked by ~/.claude/commands/review1.md (Step 2). Ported from srhoton/dotfiles PR #53.
//
// args: {
//   repoRoot: string,        absolute path of the checked-out repo
//   files: string[],         changed-file paths relative to repoRoot (the reviewers' ENTIRE scope)
//   intent: string,          PR title + body ("the user's stated requirements")
//   diffPath?: string,       absolute path to a file holding `gh pr diff` output; reviewers are told to read it.
//                            (A path, not the diff text — large text must never travel through tool-call args.)
//   skepticModel?: string,   model override for Verify-phase skeptics; omit to inherit the session model
//   skepticEffort?: string,  effort override for skeptics ('low'|'medium'|'high'|'xhigh'|'max'); omit to inherit
//   scopeNote?: string,      replaces the default scope-bounds paragraph
//   priorFindings?: [{ id, severity, file, line, description }]
//                            follow-up mode: findings from an earlier run of this workflow on the same PR.
//                            Each gets a Recheck agent (RESOLVED | OPEN) and `files` should be only the
//                            files changed since that run. New findings are still reviewed and verified.
// }
const { repoRoot, files, intent, diffPath, skepticModel, skepticEffort } = args
const priorFindings = Array.isArray(args.priorFindings) ? args.priorFindings : []
if (!repoRoot || !Array.isArray(files) || !intent) {
  throw new Error('review1-fanout: args.repoRoot (string), args.files (string[]) and args.intent (string) are required')
}

const KNOWLEDGE = '~/.claude/knowledge/defect-classes.md'
const CONVENTIONS = '~/.claude/knowledge/conventions.md'
const ADR_ROOT = '/Users/scottjones/code/architecture-decisions'

const scopeNote = args.scopeNote ||
  'SCOPE BOUNDS: (1) the repo root and the changed-file list above are your ENTIRE scope; ' +
  '(2) do not explore sibling repos or spawn further agents; ' +
  '(3) if evidence outside that scope seems needed, report the gap as a LOW finding instead of expanding scope.'

const SEVERITY_GUIDE =
  'SEVERITY GUIDE (use these definitions exactly):\n' +
  '- CRITICAL: security vulnerability, data loss, system crash, fundamentally broken logic\n' +
  '- HIGH: type safety regression, breaking API change without migration path, missing required validation, ' +
  'incorrect business logic, user-visible incorrect behavior, data integrity gaps, misleading UX that causes users ' +
  'to miss or misinterpret information\n' +
  '- MEDIUM: pattern inconsistency with established codebase, missing tests for new functionality, questions for ' +
  'the author that could change the implementation\n' +
  '- LOW: documentation gaps, style observations, minor improvements\n' +
  'When in doubt between MEDIUM and HIGH: would a senior engineer flag this as a must-fix before merge? If yes, HIGH.\n\n'

const FOCUS_RULES =
  'Focus on code introduced or modified in this change. Do NOT flag pre-existing issues in unchanged code, but DO ' +
  'flag new code that is inconsistent with established codebase patterns — read the full changed files and their ' +
  'surrounding code to understand conventions. Use your Read/Glob/Grep tools to fetch exactly what you need.\n\n'

const STATIC_ONLY = 'Do NOT run builds or tests — static code analysis only.\n\n'
const RUN_BUILD = 'Run the build and tests to verify correctness before reviewing.\n\n'

const FINDINGS_SCHEMA = {
  type: 'object',
  required: ['findings'],
  properties: {
    findings: {
      type: 'array',
      items: {
        type: 'object',
        required: ['severity', 'file', 'line', 'description'],
        properties: {
          severity: { type: 'string', enum: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] },
          file: { type: 'string', description: 'path relative to the repo root' },
          line: { type: 'integer', description: 'line number in the file (use 1 for file-level findings)' },
          description: { type: 'string', description: "what's wrong and how to fix it" },
        },
      },
    },
  },
}

const VERDICT_SCHEMA = {
  type: 'object',
  required: ['verdict', 'reason'],
  properties: {
    verdict: {
      type: 'string',
      enum: ['CONFIRMED', 'REFUTED', 'DOWNGRADE'],
      description: 'CONFIRMED = real, reachable, and at the reported severity; REFUTED = not real / unreachable / already guarded / misread; DOWNGRADE = real but not CRITICAL/HIGH',
    },
    reason: { type: 'string', description: 'file:line evidence from the code supporting the verdict' },
  },
}

// Skeptic and Recheck agents share the same model/effort overrides (both inherit the session by default).
function skepticOptsFor() {
  const o = {}
  if (skepticModel) o.model = skepticModel
  if (skepticEffort) o.effort = skepticEffort
  return o
}

const header =
  `Repo root: ${repoRoot}\n` +
  `Changed files (your ENTIRE review scope):\n${files.map(f => `- ${f}`).join('\n')}\n\n` +
  `${scopeNote}\n\n` +
  SEVERITY_GUIDE + FOCUS_RULES +
  `TEAM CONVENTIONS: read ${CONVENTIONS} before rating anything. It lists team conventions that look like ` +
  'inconsistencies from the code alone (e.g. QAC/Xray test tags) and fixes the severity for each. Where it ' +
  'assigns a severity, use that severity — do not re-derive it from neighboring code.\n\n' +
  (diffPath
    ? `The PR diff is saved at ${diffPath} — read it FIRST to see exactly which lines changed, then read the full ` +
      'changed files and surrounding code for context. The diff tells you what to review; the files tell you whether it is right.\n\n'
    : 'No diff file was provided. Run `git diff` against the base branch inside the repo root to see exactly which lines ' +
      'changed before reading the full files.\n\n')

const checklistNote =
  `Additionally check the diff against EVERY defect class in ${KNOWLEDGE} ` +
  '(read that file first) — these are historically recurring fix-round defects.\n\n'

const REVIEWERS = [
  {
    key: 'functional',
    agentType: 'functional-reviewer',
    prompt: header + STATIC_ONLY +
      `The user's stated requirements / intent (treat the PR description as the requirements):\n${intent}\n\n` +
      checklistNote +
      'Run your full review workflow on ONLY the changed files listed above for functional correctness against the stated intent.',
  },
  {
    key: 'quality',
    agentType: 'code-quality-reviewer',
    prompt: header + RUN_BUILD +
      'Run your full review workflow on ONLY the changed files listed above for code quality issues. ' +
      'Compare changed or added types, fields, and parameters against equivalent definitions in sibling types ' +
      'throughout the schema or codebase — flag inconsistencies where the new code follows a different pattern than ' +
      'existing parallel types. Every item you would flag in your analysis — defect, question for the author, or ' +
      'pattern inconsistency — must appear as a finding (MEDIUM for questions/clarifications, LOW for observations).',
  },
  {
    key: 'performance',
    agentType: 'performance-reviewer',
    prompt: header + STATIC_ONLY +
      'Run your full review workflow on ONLY the changed files listed above for performance bottlenecks, inefficient ' +
      'algorithms, and optimization opportunities. In each description include the estimated impact and how to fix it.',
  },
  {
    key: 'security',
    agentType: 'security-reviewer',
    prompt: header + STATIC_ONLY +
      'Run your full review workflow on ONLY the changed files listed above for security vulnerabilities and code ' +
      'inconsistent with established security patterns. In each description include the OWASP/CWE reference if ' +
      'applicable, the attack scenario, and how to fix it.',
  },
  {
    key: 'adr',
    agentType: 'adr-compliance-reviewer',
    prompt: header + STATIC_ONLY +
      "Analyze ONLY the changed files listed above for compliance with Fullbay's accepted ADRs. " +
      `Load ADRs dynamically from ${ADR_ROOT} (this KB read is in scope). ` +
      'In each description, name which ADR is violated and how to fix it.',
  },
  {
    key: 'data-side-effects',
    agentType: 'data-side-effects-reviewer',
    prompt: header + STATIC_ONLY + checklistNote +
      'Review ONLY the changed files listed above for blast radius on already-persisted data: ' +
      'hash/sourceHash/checksum/idempotency-key/dedup-key/ID-derivation changes that would re-key or re-flag ' +
      'already-migrated records; unguarded status or flag overwrites; schema or version bumps whose companion ' +
      'artifacts (JSON schema files, fixtures, contracts) were not updated in the same change; and re-run/backfill ' +
      'safety. If the change touches no persistence, identity, status, or schema surface, return zero findings.',
  },
]

// ---------------------------------------------------------------------------
// Follow-up mode: re-check each prior finding against the current code before reviewing the delta.
const RECHECK_SCHEMA = {
  type: 'object',
  required: ['status', 'reason'],
  properties: {
    status: {
      type: 'string',
      enum: ['RESOLVED', 'OPEN'],
      description: 'RESOLVED = the defect is fixed in the current code; OPEN = still present (or fixed incorrectly/partially)',
    },
    reason: { type: 'string', description: 'file:line evidence in the CURRENT code supporting the status; if OPEN, say what is still wrong' },
  },
}
const RECHECK_CAP = 10
const recheck = []
if (priorFindings.length) {
  phase('Recheck')
  const toRecheck = priorFindings.slice(0, RECHECK_CAP)
  const beyondRecheckCap = priorFindings.slice(RECHECK_CAP)
  if (beyondRecheckCap.length) log(`recheck cap: ${beyondRecheckCap.length} prior finding(s) beyond ${RECHECK_CAP} carried forward as OPEN (unchecked)`)
  log(`rechecking ${toRecheck.length} prior finding(s) against the current code`)
  const rechecked = await parallel(toRecheck.map(p => () =>
    agent(
      `Repo root: ${repoRoot}\n` +
      `Files changed since the previous review:\n${files.map(f => `- ${f}`).join('\n')}\n\n` +
      `A previous review of this PR reported finding ${p.id} (${p.severity}) at ${p.file}:${p.line}:\n` +
      `  ${p.description}\n\n` +
      'The author has since pushed changes. Read the CURRENT code at and around that location (line numbers may have ' +
      'shifted — find the construct, not the number) and decide whether this specific defect is RESOLVED or still OPEN. ' +
      'A fix that addresses the symptom but not the defect, or that introduces an obvious regression at the same site, is OPEN — ' +
      'say what is still wrong. Cite file:line evidence from the current code. Stay within this repo.\n\n' +
      (diffPath ? `The diff of the changes since the previous review is at ${diffPath}.\n` : ''),
      { label: `recheck:${p.id}`, phase: 'Recheck', schema: RECHECK_SCHEMA, ...skepticOptsFor() }
    ).then(v => ({ prior: p, verdict: v }))
  ))
  for (let i = 0; i < toRecheck.length; i++) {
    const p = toRecheck[i]
    const v = rechecked[i] && rechecked[i].verdict
    recheck.push(v ? { ...p, status: v.status, reason: v.reason, checked: true }
                   : { ...p, status: 'OPEN', reason: 'recheck agent skipped or errored', checked: false })
  }
  for (const p of beyondRecheckCap) recheck.push({ ...p, status: 'OPEN', reason: 'beyond recheck cap', checked: false })
  log(`recheck: ${recheck.filter(r => r.status === 'RESOLVED').length} resolved, ${recheck.filter(r => r.status === 'OPEN').length} open`)
}

// ---------------------------------------------------------------------------
phase('Review')
// Barrier is intentional: dedup below needs the full finding set from all six reviewers.
const reviews = await parallel(REVIEWERS.map(r => () =>
  agent(r.prompt, { label: `review:${r.key}`, phase: 'Review', agentType: r.agentType, schema: FINDINGS_SCHEMA })
    .then(res => res && res.findings.map(f => ({ ...f, source: r.key })))
))
const reviewersSkipped = REVIEWERS.filter((r, i) => !reviews[i]).map(r => r.key)
if (reviewersSkipped.length) log(`reviewers returned nothing (skipped or errored): ${reviewersSkipped.join(', ')}`)

// Dedup by file:line, merging sources; keep the highest severity and the longest description.
const RANK = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 }
const byKey = new Map()
for (const f of reviews.filter(Boolean).flat()) {
  const k = `${f.file}:${f.line}`
  const prev = byKey.get(k)
  if (!prev) { byKey.set(k, { ...f, source: [f.source] }); continue }
  prev.source.push(f.source)
  if (RANK[f.severity] < RANK[prev.severity]) prev.severity = f.severity
  if (f.description.length > prev.description.length) prev.description = f.description
}
const deduped = [...byKey.values()].map(f => ({ ...f, source: [...new Set(f.source)].join('+') }))
log(`${deduped.length} unique finding(s) from ${REVIEWERS.length - reviewersSkipped.length} reviewer(s)`)

// Order: severity first, then findings more reviewers agreed on — this decides which
// CRITICAL/HIGH findings get a skeptic when the count exceeds VERIFY_CAP.
const sourceCount = f => f.source.split('+').length
const candidateActionable = deduped
  .filter(f => f.severity === 'CRITICAL' || f.severity === 'HIGH')
  .sort((a, b) => (RANK[a.severity] - RANK[b.severity]) || (sourceCount(b) - sourceCount(a)))
const informational = deduped.filter(f => f.severity === 'MEDIUM' || f.severity === 'LOW')

// ---------------------------------------------------------------------------
const VERIFY_CAP = 10
const toVerify = candidateActionable.slice(0, VERIFY_CAP)
const unverified = candidateActionable.slice(VERIFY_CAP)
if (unverified.length) log(`verify cap: ${unverified.length} CRITICAL/HIGH finding(s) beyond ${VERIFY_CAP} pass through UNVERIFIED`)

const skepticOpts = skepticOptsFor()
const skepticDesc = `model=${skepticModel || 'session'} effort=${skepticEffort || 'session'}`

const actionable = []
const refuted = []

if (toVerify.length === 0) {
  log('no CRITICAL/HIGH findings — skipping Verify phase')
} else {
  phase('Verify')
  log(`verifying ${toVerify.length} finding(s) with skeptics (${skepticDesc})`)
  const verified = await parallel(toVerify.map(f => () =>
    agent(
      `Repo root: ${repoRoot}\n` +
      `The change's stated intent (PR description):\n${intent}\n\n` +
      `A code reviewer (${f.source}) reported this ${f.severity} finding:\n` +
      `  ${f.file}:${f.line} — ${f.description}\n\n` +
      'Your job is to try to REFUTE it. Read the actual code (and its callers/config as needed, within this repo ' +
      `only) and decide whether this is a real, reachable ${f.severity}-level defect.\n` +
      'Return exactly one verdict:\n' +
      `- CONFIRMED: real, reachable, and genuinely ${f.severity} per the severity guide.\n` +
      '- REFUTED: unreachable, already guarded elsewhere, based on a misread of the code, or not a defect at all.\n' +
      '- DOWNGRADE: real, but MEDIUM/LOW in impact rather than CRITICAL/HIGH.\n' +
      'Reviewers over-report, so be skeptical — but if you cannot decide from the code, return CONFIRMED. ' +
      'Cite file:line evidence either way.\n\n' +
      SEVERITY_GUIDE,
      { label: `verify:${f.file}:${f.line}`, phase: 'Verify', schema: VERDICT_SCHEMA, ...skepticOpts }
    ).then(v => ({ finding: f, verdict: v }))
  ))

  for (let i = 0; i < toVerify.length; i++) {
    const f = toVerify[i]
    const v = verified[i] && verified[i].verdict
    if (!v) {
      // skeptic skipped or errored — keep the finding, flagged unverified
      actionable.push({ ...f, verified: false })
    } else if (v.verdict === 'REFUTED') {
      refuted.push({ ...f, refutation: v.reason })
    } else if (v.verdict === 'DOWNGRADE') {
      informational.push({ ...f, severity: 'MEDIUM', downgradedFrom: f.severity, downgradeReason: v.reason })
    } else {
      actionable.push({ ...f, verified: true, verification: v.reason })
    }
  }
}
for (const f of unverified) actionable.push({ ...f, verified: false })

const downgraded = informational.filter(f => f.downgradedFrom).length
log(`${actionable.length} actionable, ${refuted.length} refuted, ${downgraded} downgraded, ${informational.length} informational`)

// In follow-up mode, tag new findings that land on a prior finding's file:line so the caller can
// treat them as the same defect rather than a duplicate. Line numbers may have shifted, so this is a hint only.
if (priorFindings.length) {
  const priorByKey = new Map(priorFindings.map(p => [`${p.file}:${p.line}`, p.id]))
  for (const f of [...actionable, ...informational]) {
    const hit = priorByKey.get(`${f.file}:${f.line}`)
    if (hit) f.matchesPrior = hit
  }
}

return {
  actionable,
  informational,
  refuted,
  reviewersSkipped,
  verify: { cap: VERIFY_CAP, unverifiedBeyondCap: unverified.length, skeptic: skepticDesc },
  recheck,
}
