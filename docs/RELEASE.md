# Release Guide

GitHub tags are this project's distribution channel. npm publication is out of scope.

## Release path

1. Open a dedicated release PR. Ordinary merges to `main` never create a tag.
2. Update `package.json` and `skills/mobile-agent-orchestrator/SKILL.md` to the same stable version.
3. Add a matching stable-version heading and release notes to `CHANGELOG.md`.
4. Remove the README draft marker and replace the `vX.Y.Z` future-install placeholder with the published stable tag. The validator also rejects legacy `<owner>` and `<tag>` placeholders.
5. Run `npm test`, review the release PR, and merge it into `main`.

After the merge, the workflow uses GitHub's pull-request association API to prove that `GITHUB_SHA` belongs to a merged pull request targeting `main`. It then validates the merged revision, confirms that `package.json` has a real stable-version change from the pushed base, and creates one annotated tag object and its immutable `vX.Y.Z` ref through the GitHub API.

## Guardrails

- Prerelease versions such as `0.1.0-dev.0` are never tagged.
- A rerun is a successful no-op only when the existing ref targets an annotated tag object whose peeled commit is the merged SHA; lightweight or conflicting tags fail rather than being replaced.
- The workflow creates annotated tag objects and refs through the GitHub API; it does not use `git push` to create tags.
- The workflow does not itself prevent direct pushes to `main`; branch protection is configured externally. Direct pushes cannot create a release tag because the workflow fails closed without proven merged-pull-request provenance.
- Do not create a tag manually for this workflow; tags are immutable release records.

## Verification

Use `npm test` to validate metadata, skill packaging, local Markdown links, the npm dry-run file list, and stable-release requirements. This foundation does not claim a published tag or completed operational validation.
