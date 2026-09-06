# Contributing

Contributions should keep the skill safe, reviewable, and explicitly prerelease until release evidence exists.

## Quick path

1. Create a focused change from `main` and preserve the skill's safety contracts.
2. Run `npm test` before requesting review.
3. Keep ordinary changes untagged. A release PR is the only path that may create a GitHub release tag after merge.

## Release PR checklist

A release PR must update all of the following together:

- `package.json` version
- `skills/mobile-agent-orchestrator/SKILL.md` metadata version
- `CHANGELOG.md` with the stable version heading and release notes

Stable releases must remove the README draft marker and replace its `<owner>` and `<tag>` installation placeholders. The package validator enforces these rules.

## Scope

GitHub tags are the distribution channel. npm publication is out of scope. See the [release guide](docs/RELEASE.md) and [security policy](SECURITY.md).
