# Defect Classes — Red-Team Checklist

Recurring defect classes that fix rounds tend to introduce. Reviewers dispatched by
`/review1` (functional and data-side-effects) check every diff against each class below.
Fixers: re-read your diff against this list before declaring done.

The heuristics were ported from srhoton/dotfiles PR #53. The **History** lines are
placeholders: record the first Fullbay incident that confirms each class, and append new
classes when a review round confirms one not listed here. Keep entries short:
detection heuristic + the historical example that earned the entry.

## fail-open-default
**Heuristic:** a routing/guard/filter branch whose `else`/default path ALLOWS. Trace every
new conditional to its default arm; a match-failure must deny, queue, or error — never pass through.
**History:** _none recorded yet — add the first Fullbay incident that confirms this class._

## unconditioned-overwrite
**Heuristic:** any write (DDB `PutItem`/`UpdateItem`, file write, status field assignment)
without a condition expression or preceding read-compare. Ask: what does this clobber when
the record is newer/different than assumed?
**History:** _none recorded yet._

## serializer-allowlist-drop
**Heuristic:** a new field added to a type/record that passes through any allow-list
serializer, mapper, or JSON schema. Grep for the serializer's field list; the new field
must be added there in the SAME diff or it is silently dropped.
**History:** _none recorded yet._

## stale-literal
**Heuristic:** counters, version strings, expected-count assertions, and copied literals
near the changed code. Diff-adjacent literals that encode "how many" or "which version"
must be re-derived, not trusted.
**History:** _none recorded yet._

## vacuous-assertion
**Heuristic:** a new/changed test that cannot fail: asserts on its own stub, checks
non-null on something structurally non-null, or stubs invert the shipped config. Prove it by
reverting the fix (file copy, never `git checkout`) — the test must fail without the fix.
**History:** _none recorded yet._

## lockfile-pm-mismatch
**Heuristic:** any diff touching `pnpm-lock.yaml`/`package-lock.json`/`yarn.lock`. Verify the
repo's pinned package-manager version (`mise.toml`/`.tool-versions`/`packageManager` field) was
used and `overrides`/`resolutions` survived; validate with a frozen install (`--frozen-lockfile`).
**History:** _none recorded yet._

## unverified-404-deletion
**Heuristic:** code that treats a 404/NotFound as proof of absence and proceeds to delete,
create, or skip. A 404 can be auth failure, wrong endpoint, eventual consistency, or wrong ID
format — require a positive existence check before destructive follow-ups.
**History:** _none recorded yet._

## warn-log-amplification
**Heuristic:** a log statement added inside a loop, retry, or per-record path. Estimate
emissions at production cardinality (records × retries); per-item warns on a million-record
migration are an ops incident, not observability.
**History:** _none recorded yet._
