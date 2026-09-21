# Issue #10: Unchanged Package Versions Are Ordinary Merges

## Objective

Make the release workflow distinguish a package metadata change from a package version change before attempting strict release-transition validation.

## Problem and rationale

The workflow currently routes every `package.json` diff through `assertReleaseTransition`. A metadata-only change with the same version therefore fails as `0.1.0 -> 0.1.0`, even though it is an ordinary merge and must not create a tag.

## Authorized scope

- `.github/workflows/tag-release.yml`
- `scripts/detect-release.mjs`
- `tests/detect-release.test.mjs`
- `odd/tasks/issue-10-release-detection.md`

Do not alter merged-PR provenance, ancestry checks, annotated-tag creation, tag idempotency/conflict protection, npm publication, or unrelated package validation.

## Constraints and decisions

- Generated technical artifacts remain in English.
- Keep `assertReleaseTransition` as the strict validator for an actual release transition.
- Compare base/current version values before attempting release validation.
- An identical valid version returns `should_tag=false` and creates no tag.
- A valid stable increase returns `should_tag=true` with the current version.
- Invalid, lower, prerelease, or build-metadata transitions remain rejected when release validation is attempted.
- Preserve the existing explicit no-tag behavior for prerelease package versions in the workflow.
- Keep current package validation before release detection so an unchanged invalid package version cannot bypass package validation.
- Keep the detector pure and testable outside workflow YAML.
- Use package-relative repository paths and Node's built-in test runner.
- Delivery strategy: `ask-on-risk`; this fix is expected to stay below the 400-line review heuristic.
- TDD mode: no explicit project TDD configuration was found; use ordinary checks and record observed results.

## Acceptance criteria

- [x] A metadata-only `package.json` change with an unchanged valid version is classified as an ordinary merge and produces no tag.
- [x] A valid stable version increase follows the existing validated tag path.
- [x] Equal, lower, invalid, prerelease, and build-metadata release transitions are rejected when strict release validation is invoked.
- [x] Merged-PR provenance checks remain unchanged.
- [x] Annotated-tag idempotency and conflict protection remain unchanged.
- [x] Release detection has automated tests outside workflow YAML.
- [x] `npm test` succeeds.
- [x] `node --test tests/detect-release.test.mjs` succeeds.

## Task checklist

### T1 — Extract release detection

- [x] Add a pure `detectReleaseTransition(baseVersion, currentVersion)` helper.
- [x] Return an ordinary-merge result for identical valid versions.
- [x] Delegate actual release validation to the existing strict transition helper.
- [x] Add a CLI output contract suitable for `$GITHUB_OUTPUT`.

### T2 — Integrate the workflow

- [x] Replace the inline strict-transition call with the detector command.
- [x] Preserve provenance, ancestry, validation, prerelease, and tag-job behavior.
- [x] Emit `should_tag=false` for unchanged versions and no `version` tag output.
- [x] Emit `should_tag=true` and the version only for valid stable increases.

### T3 — Add regression tests

- [x] Test unchanged valid versions as ordinary merges.
- [x] Test valid stable increases as taggable.
- [x] Test equal/lower/invalid/prerelease/build-metadata strict rejection.

### T4 — Verify and record evidence

- [x] Run `npm test`.
- [x] Run `node --test tests/detect-release.test.mjs`.
- [x] Run `git diff --check`.
- [x] Confirm provenance and tag-creation workflow sections are unchanged except for release detection integration.
- [x] Update this document with observed results.

### T5 — Close the work unit

- [x] Review the diff and authored line count.
- [x] Create one Conventional Commit containing the detector, workflow integration, and tests.
- [x] Record the commit identity here.

## Progress and evidence

- Branch: `fix/issue-10-release-detection`
- Base: `main` at `9561127`
- Maintainer issue: #10 has `status:approved` and `type:chore`.
- Reproduction on base: `node scripts/validate-package.mjs --release-transition 0.1.0 0.1.0` exits 1 with the strict-increase error.
- Verification: `npm test` passed (`Package validation passed.`); `node --test tests/detect-release.test.mjs` passed (7 tests); `git diff --check` passed. The workflow diff changes only release-detection integration; provenance and tag-job sections remain unchanged.
- Parent readback: unchanged versions retain the workflow's default `should_tag=false` output; only valid releases append detector outputs, avoiding duplicate output keys.
- Diff review: implementation diff contained 192 authored insertions/deletions across four intended files and passed `git diff --cached --check`.
- Commit: `df32b99` (`fix(release): skip unchanged package versions`).

## Next step

Implementation, verification, and the work-unit commit are complete. The branch is ready for the user-owned PR decision.
