# Team Conventions — Reviewer Reference

Conventions that Fullbay code follows which are not visible from the code alone. Reviewers
dispatched by `/review1` read this before rating findings so that conventions are rated by
policy, not inferred from neighboring code. Append a section when a review round flags
something that turns out to be an intentional team convention.

Canonical source for the test-tag material below: `prt-parts-svc/.claude/rules/`
(`qac-xray-test-case-guide.md`, `piton-integration-test-patterns.md`,
`qa-testing-responsibilities.md`). That guide is the master copy for all Fullbay repos.

## QAC / Xray test tags

**What it is.** `QAC` is the Jira project for Xray test cases (Xray the Jira test-management
plugin — not AWS X-Ray). Every Piton/JUnit integration test carries `@Tag("QAC-<digits>")`
linking it to one Xray case; real IDs are 4–5 digits. The same idea appears as
`[Category("QAC-…")]` in .NET and as a `QAC-…` reference in a test name or describe block in
TypeScript.

**Placeholders.** The canonical placeholder is `@Tag("QAC-XXXX")`; `QAC-TBD` and ad-hoc
strings such as `QAC-VENDOR-UNIQUE` appear in some repos and mean the same thing: no Xray case
yet. Policy is **per repo**: prt-parts-svc's test-writer guidance (since 2026-08-25) has the
developer mint the real ticket while writing the test, while other repos still have developers
ship placeholders and QA fill them in. A reviewer cannot tell who authored the PR or which
repo's rule applies without reading that repo's `.claude/rules/`. Treat a placeholder as a
to-do, not a defect, in every repo.

**Number reuse is forbidden by the guide** ("never reuse an existing QAC number"; archived
numbers are never recycled). The one exception is a test scenario that merely moves
implementation location (e.g. legacy `src/it` → Piton `integ/`) and carries its number
forward — that is the same scenario relocated, not reuse.

**Rate as follows:**

| Observation | Severity | Why |
|---|---|---|
| New or changed test carries a placeholder tag (`QAC-XXXX`, `QAC-TBD`, or any non-numeric `QAC-…`) | **LOW** | Expected in developer PRs; a documentation gap. One finding per PR listing the tests. Mention a mint-immediately rule only if the repo under review states one in its own `.claude/rules/`. Never MEDIUM. |
| New test has no QAC tag at all where siblings have one | **LOW** | Same reasoning; the convention requires a tag of some kind. |
| An existing real QAC ID is attached to a *different* test — moved, duplicated onto a second test, or reused on a test asserting different (especially inverted) behavior | **MEDIUM** | The guide forbids reuse: the Xray case now describes the wrong test and its history/automation status is conflated. Name both the old and new test. Do not flag when the same scenario simply moved files and kept its number. |
| A change removes existing QAC (or RC/PARTS) ticket references from tests or their comments without replacing them | **MEDIUM** | Loses traceability QA relies on; usually incidental to the commit's stated purpose — say so. |
| `integ/README.md` test-count table no longer matches the test classes/methods changed in the PR | **LOW** | The guide's audit checklist requires the README to match; it is documentation. |
| Tag is a real-looking ID (`QAC-` + digits) | — | Do not flag. Reviewers cannot verify the ID against Jira and should not try. |

None of the above is CRITICAL or HIGH; QAC tags never affect runtime behavior.

## Piton environment tags (`preProd` / `prod` / `demo`)

**What it is.** Piton integration tests also carry an environment tag that decides where the
test executes: `@Tag("preProd")` runs in DEV/QA/STAGE (most tests); `@Tag("prod")` runs in
**real PROD and DEMO**; `@Tag("demo")` runs in DEMO only. A test may carry `preProd` plus one
of `prod`/`demo`. Environment tags go on the **method**, not the class, and use imported
`@Tag`, not fully-qualified `@org.junit.jupiter.api.Tag`.

**The rule that matters:** `prod` is only for tests that are pure reads with zero side effects.
A test that creates, updates, or deletes anything — even if it cleans up after itself — must be
`demo`, or it will execute against real production traffic.

**Rate as follows:**

| Observation | Severity | Why |
|---|---|---|
| New or changed test tagged `@Tag("prod")` performs any write (POST/PUT/PATCH/DELETE, or a helper that does) | **HIGH** | Will mutate real production data on every run. Cite the write call. |
| `preProd`/`prod`/`demo` tag placed at class level, or written fully qualified | **LOW** | Style rule from the patterns guide; class-level tags are known not to apply. |
| A test with no environment tag at all | **LOW** | It will not run anywhere; note it. |
