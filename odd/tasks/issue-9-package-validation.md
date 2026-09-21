# Issue #9: Extensible Package Validation

## Objective

Make package validation extensible and independently testable so the published package can grow beyond the current exact seven-file tarball without weakening its publication boundary.

## Problem and rationale

`scripts/validate-package.mjs` currently embeds an exact tarball file list and runs as one package-level validation command. The multi-CLI installer will add references, runtime files, and tests, so the validator needs a named top-level allowlist plus recursive discovery of the canonical skill tree. Existing validation behavior, especially `pi.skills`, must remain enforced.

## Authorized scope

- `scripts/validate-package.mjs`
- `tests/validate-package.test.mjs`
- `package.json`
- `odd/tasks/issue-9-package-validation.md`

Do not implement installer behavior, npm publication, release workflow changes, or unrelated documentation.

## Constraints and decisions

- Generated technical artifacts remain in English.
- Preserve the existing Node built-in runtime and package validation entry point.
- Use package-relative POSIX paths for npm tarball comparisons.
- Keep an explicit allowlist for published top-level files and directories.
- Derive files below `skills/mobile-agent-orchestrator/` recursively instead of maintaining a reference-file list.
- Reject missing, duplicate, or misplaced canonical `SKILL.md` files.
- Preserve `pi.skills` destination validation.
- Do not silently broaden publication through npm defaults.
- Delivery strategy: `ask-on-risk`; this change is expected to remain below the 400-line review heuristic.
- TDD mode: no explicit project TDD configuration was found during exploration; use ordinary checks with Node's built-in test runner and record observed results.

## Acceptance criteria

- [x] Legitimate files added below `skills/mobile-agent-orchestrator/` are accepted without editing an exact tarball file list.
- [x] Unexpected published top-level paths fail validation.
- [x] Exactly one canonical `skills/mobile-agent-orchestrator/SKILL.md` exists and is validated.
- [x] Existing `pi.skills` path validation remains enforced.
- [x] Unit tests cover SemVer parsing/comparison, release transitions, frontmatter parsing, required sections, local destination decoding, tarball comparison, and the new inventory/allowlist behavior.
- [x] `npm test` runs package validation and the unit-test suite, and fails when either fails.
- [x] `npm run pack:check` succeeds.

## Task checklist

### T1 — Establish the package inventory contract

- [x] Add named canonical paths and the explicit published top-level allowlist.
- [x] Recursively discover canonical skill-tree files using package-relative POSIX paths.
- [x] Validate the canonical `SKILL.md` count and preserve existing skill content checks.
- [x] Replace the hardcoded tarball reference list with the derived inventory.

### T2 — Add unit-test coverage

- [x] Add Node's built-in test-runner entry point.
- [x] Add focused tests for all exported helpers and the inventory/allowlist contract.
- [x] Cover malformed and boundary inputs named by the issue acceptance criteria.

### T3 — Verify and record evidence

- [x] Run `npm test`.
- [x] Run `npm run pack:check`.
- [x] Confirm a nested canonical reference is accepted without validator edits.
- [x] Confirm an unexpected published top-level path is rejected by the validator tests.
- [x] Update this document with command results and the next step.

### T4 — Close the work unit

- [x] Review the diff and authored line count.
- [x] Create one Conventional Commit containing implementation and tests.
- [x] Record the commit identity here.

## Progress and evidence

- Branch: `feat/issue-9-package-validation`
- Base: `main` at `9561127`
- Maintainer update: issue #9 comment published before implementation.
- Exploration: current validator exports pure helper seams but has no test directory and hardcodes seven tarball files.
- Verification: `npm test` and `npm run pack:check` passed after implementation; unit tests cover the recursive inventory and publication boundary.
- Follow-up fix: `npm test` now uses Node's test auto-discovery (`node --test`) instead of passing `tests` as a module path; local verification passes on Node v26.9.0 and Package CI run `35366849908` passes on Node 22.
- Diff review: `git diff --check` passed; intended source, test, package, and task-document changes only.
- Commit: `ec07b3c` (`feat(package): make validation extensible`).

## Next step

Implementation, tests, and the corrective CI verification are complete. The branch is ready for the user-owned merge decision.
