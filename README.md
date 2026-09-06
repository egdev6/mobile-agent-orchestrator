<a id="readme-top"></a>

<div align="center">
  <a href="https://github.com/egdev6/mobile-agent-orchestrator">
    <h1>Mobile Agent Orchestrator</h1>
  </a>

  <img width="3469" height="1198" alt="moshi" src="https://github.com/user-attachments/assets/aa5ed0b7-bd0c-4612-a3fd-58876c4eccab" />

  <p>A guided Pi skill for a private, recoverable mobile AI-agent environment.</p>

  <p>
    <a href="https://github.com/egdev6/mobile-agent-orchestrator/actions/workflows/ci.yml"><img src="https://img.shields.io/github/actions/workflow/status/egdev6/mobile-agent-orchestrator/ci.yml?branch=main&amp;label=package%20CI&amp;style=for-the-badge" alt="Package CI"></a>
    <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-green?style=for-the-badge" alt="MIT License"></a>
    <a href="https://pi.dev"><img src="https://img.shields.io/badge/Pi-package-7c3aed?style=for-the-badge" alt="Pi package"></a>
    <img src="https://img.shields.io/badge/status-v0.1.0-brightgreen?style=for-the-badge" alt="Stable v0.1.0 status">
  </p>
</div>

---

> **Status: stable v0.1.0.** Git tags—not npm publication—are the distribution channel. Review the source before installation: a Pi skill can guide system and network changes.
>
> **Operational-evidence caveat.** Independently recorded cold-boot and live runtime evidence is not published for v0.1.0. Validate lifecycle and recovery on your target; this release does not claim observed macOS, WSL2, reboot, or mobile-client behavior.

<details>
  <summary>Table of Contents</summary>
  <ol>
    <li><a href="#prerequisites">Prerequisites</a></li>
    <li><a href="#installation">Installation</a></li>
    <li><a href="#usage">Usage</a></li>
    <li><a href="#architecture">Architecture</a></li>
    <li><a href="#features">Features</a></li>
    <li><a href="#runtime-stack">Runtime Stack</a></li>
    <li><a href="#safety-boundaries">Safety Boundaries</a></li>
    <li><a href="#verification-and-recovery">Verification and Recovery</a></li>
    <li><a href="#contributing-and-contact">Contributing and Contact</a></li>
    <li><a href="#license">License</a></li>
  </ol>
</details>

---

## Built With

<div align="center">
  <a href="https://pi.dev"><img src="https://img.shields.io/badge/Pi-Coding%20Agent-7c3aed" alt="Pi Coding Agent"></a>
  <a href="https://agentskills.io"><img src="https://img.shields.io/badge/Agent%20Skills-compatible-0f766e" alt="Agent Skills"></a>
  <a href="https://nodejs.org"><img src="https://img.shields.io/badge/Node.js-ESM-339933" alt="Node.js ESM"></a>
  <a href="https://www.npmjs.com"><img src="https://img.shields.io/badge/npm-package%20validation-CB3837" alt="npm"></a>
  <a href="https://github.com/features/actions"><img src="https://img.shields.io/badge/GitHub-Actions-2088FF" alt="GitHub Actions"></a>
</div>

---

## Prerequisites

| Requirement | Why it matters |
| --- | --- |
| A working [Pi Coding Agent][pi] installation | Pi packages and skills can instruct an agent to make system changes. Review the source if you need to assess its system-change guidance. |
| **macOS native** | Supported native lifecycle and execution target. |
| **Windows 11 with WSL2** | Supported split model: Windows owns startup; the selected WSL distribution runs Linux services and agents. |
| Windows native without WSL2 | **Unsupported.** Stop and install WSL2 before using this workflow. |

The guided workflow discovers its runtime state before proposing changes. It installs runtime components only after the relevant approval; they are not bundled as npm dependencies.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Installation

### Recommended: install stable v0.1.0 from Git

```bash
pi install git:github.com/egdev6/mobile-agent-orchestrator@v0.1.0
```

Git tags—not npm publication—are this project's distribution channel. The release tag is created by automation after a validated release pull request merges; see the [release guide][release-guide] for the release conditions.

### Source-review or development option: install from a local checkout

1. Review this repository, especially the [skill][skill] and its on-demand references.
2. Install the reviewed local package:

   ```bash
   pi install /absolute/path/to/mobile-agent-orchestrator
   ```

3. Start Pi from your normal working directory.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Usage

Use the skill from an active Pi session:

```text
/skill:mobile-agent-orchestrator
```

A matching natural-language request, such as “set up a private mobile Pi environment with Tailscale and Mosh,” can also load the skill. Follow the guided path rather than running an installation recipe out of order:

1. **Detect:** allow read-only platform and state checks; unsupported or unclear targets stop safely.
2. **Decide:** answer only real decision gates, including Tailscale placement, key setup, Moshi privacy, integrations, and notifications.
3. **Approve:** explicitly authorize each privileged, network, service, firewall, pairing, lifecycle, or reboot mutation before it happens.
4. **Verify:** collect non-sensitive checkpoints after each approved mutation and use the [recovery guide][verification-recovery] when a check fails.

The skill is a human-supervised orchestrator, not an unattended installer. Platform detail lives in the [platform matrix][platform-matrix] and [guided install][guided-install] reference so the core workflow stays concise.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Architecture

```text
mobile-agent-orchestrator/
├── package.json
│   └── pi.skills: ./skills ──> Pi package discovery
├── skills/mobile-agent-orchestrator/
│   ├── SKILL.md ────────────> activation contract, decision gates, safe orchestration
│   └── references/ ─────────> loaded on demand: platform, installation, recovery
├── scripts/validate-package.mjs
│   └── Node.js ESM validator ──> metadata, package contents, local Markdown links
└── .github/workflows/
    ├── ci.yml ──────────────> npm test on pull requests and main
    └── tag-release.yml ─────> validated, merged-PR-only stable Git tags
```

Pi discovers the package's `skills/` directory through the `pi.skills` manifest. The `SKILL.md` file uses Agent Skills-compatible Markdown and YAML frontmatter; its references are deliberately loaded only when the workflow needs their detail. The validator and GitHub Actions verify the package and gate future tags, but they do not certify a live remote-agent deployment.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Features

| Area | What the skill guides |
| --- | --- |
| Platform routing | macOS native or Windows 11 + WSL2 detection, with a safe stop for unsupported Windows-native paths. |
| Private access | Tailscale overlay placement, constrained OpenSSH exposure, and mobile-client pairing without copying secrets into chat. |
| Session continuity | Mosh with Moshi and `moshi-hook`, plus Herdr when supported or tmux as the fallback terminal host. |
| Lifecycle planning | Supported WSL systemd, linger, and Windows-startup considerations; macOS mechanisms only after current official documentation and local evidence. |
| Human control | Read-only discovery, one real decision at a time, explicit approval before sensitive changes, and local recovery preserved. |
| Evidence and rollback | Non-sensitive verification checkpoints, disconnect and approved reboot checks, and mutation-scoped rollback guidance. |

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Runtime Stack

The package implementation and the remote environment it orchestrates are separate layers.

| Layer | Components | Responsibility |
| --- | --- | --- |
| **Package implementation** | Pi package manifest, Agent Skills-compatible Markdown/YAML frontmatter, Node.js ESM validator, npm, GitHub Actions | Discovers the skill, validates package metadata and contents, and runs CI/release checks. |
| **Orchestrated runtime** | Tailscale, OpenSSH, Mosh, Moshi/`moshi-hook`, Herdr or tmux | Provides the private mobile connection and persistent-session workflow on the selected target. |
| **Platform lifecycle** | Windows 11 + WSL2 systemd/linger/startup mechanisms, or macOS lifecycle mechanisms | Starts only the specifically approved services using current platform documentation. |

Tailscale, OpenSSH, Mosh, Moshi, `moshi-hook`, Herdr, tmux, and platform lifecycle tooling are **runtime dependencies installed by the guided workflow**. They are not package-bundled npm dependencies, and their exact installation route is chosen from current signed vendor or platform documentation after approval.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Safety Boundaries

- Never open public SSH access or add router port forwarding; constrain any listener before enabling it.
- Keep Tailscale SSH disabled for the Moshi/OpenSSH key-authentication route.
- For the full-Mosh Windows route, run Tailscale in exactly one location: **WSL**, not Windows and WSL together. On macOS, use macOS as the single location.
- Do not place private keys, pairing tokens, sign-in URLs, QR data, or credentials in chat, shell history, or repository files. QR data is temporary secret material.
- Require explicit approval before privileged installation, authentication or firewall changes, cloud pairing, service/task creation, reboot, or destructive rollback.
- Preserve a local recovery path, validate SSH configuration before reload, test a second key-authenticated session, and record non-sensitive rollback evidence.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Verification and Recovery

After each approved mutation, the workflow captures non-sensitive evidence for the private overlay, key-authenticated SSH, Mosh reconnection, session host, checkpoints, integrations, and notifications. A missing component or failed check is a finding—not authorization to make another change.

Before an approved reboot, the guide states that live processes will die, confirms recovery and rollback paths, then checks the actual post-reboot state. Herdr and tmux do not preserve live processes across a physical reboot; supported Pi JSONL sessions may resume from local disk. Independently recorded cold-boot and live runtime evidence is not published for v0.1.0, so validate lifecycle and recovery on your target.

Read the full [verification and recovery guide][verification-recovery] before applying lifecycle or rollback changes.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Contributing and Contact

- [Contributing][contributing] — focused changes, test expectations, and release-PR rules.
- [Release guide][release-guide] — Git-tag distribution and stable-release guardrails.
- [Security policy][security] — report vulnerabilities privately; never include secrets in an issue.
- [Issue tracker][issues] — report non-sensitive bugs and feature requests.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## License

Distributed under the [MIT License][license].

<p align="right">(<a href="#readme-top">back to top</a>)</p>

[pi]: https://pi.dev
[skill]: skills/mobile-agent-orchestrator/SKILL.md
[platform-matrix]: skills/mobile-agent-orchestrator/references/platform-matrix.md
[guided-install]: skills/mobile-agent-orchestrator/references/guided-install.md
[verification-recovery]: skills/mobile-agent-orchestrator/references/verification-and-recovery.md
[contributing]: CONTRIBUTING.md
[release-guide]: docs/RELEASE.md
[security]: SECURITY.md
[license]: LICENSE
[issues]: https://github.com/egdev6/mobile-agent-orchestrator/issues
