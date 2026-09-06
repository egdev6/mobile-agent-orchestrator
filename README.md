# Mobile Agent Orchestrator

A Pi package that guides a human and an agent through a safe, persistent mobile AI-agent setup. It favors private-overlay access, explicit approvals, and recovery evidence over fast but fragile setup.

> **Status: draft.** Cold-boot behavior is pending evidence; this package does not claim a completed publication or a verified reboot-survival result.

## Supported matrix

| Target | Status | Model |
| --- | --- | --- |
| macOS native | Supported | Native lifecycle host and execution environment |
| Windows 11 + WSL2 | Supported | Windows owns lifecycle; WSL runs Linux services and agents |
| Windows native without WSL | Unsupported | Stop and install WSL2 first |

## Quick path

1. Review this repository before installation; skills can direct system changes.
2. Try the local checkout: `pi install /path/to/mobile-agent-orchestrator`.
3. After a maintainer publishes a tagged remote, install it with `pi install git:github.com/<owner>/mobile-agent-orchestrator@<tag>`.
4. In Pi, invoke the `mobile-agent-orchestrator` skill and answer only the detected decision gates.

The skill keeps its detailed, platform-specific flow in `skills/mobile-agent-orchestrator/references/`.

## Privacy and safety

Never put private keys, pairing tokens, sign-in URLs, QR contents, or credentials in chat, shell history, or repository files. Pair on the device or use hidden terminal input. Do not expose SSH through a public IP or router forwarding rule. For the full-Mosh route, run Tailscale in exactly one place: macOS, or WSL—not both Windows and WSL.

## What the guide covers

- Platform preflight, permissions, rollback, firewall boundaries, and OpenSSH hardening.
- Tailscale on the execution target and on Android/iOS, with Tailscale SSH disabled.
- Moshi, `moshi-hook`, Mosh, Herdr or tmux, selected integrations, notifications, and checkpoints.
- Windows WSL boot keepalive plus systemd linger, macOS lifecycle evidence, and disconnect/reboot recovery checks.

## License

Apache-2.0. See [LICENSE](LICENSE).
