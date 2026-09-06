---
name: mobile-agent-orchestrator
description: "Trigger: mobile agent setup, mobile orchestrator, Moshi, Mosh, Tailscale, remote Pi. Guide a human through a safe persistent mobile AI-agent installation."
license: Apache-2.0
metadata:
  author: egdev6
  version: "0.1.0"
---

## Activation Contract

Use for human-supervised installation of a persistent mobile AI-agent environment. Support only macOS native or Windows 11 with WSL2 (Windows lifecycle, WSL Linux execution). Detect state read-only before change. On Windows native without WSL, stop and guide WSL2; never offer degraded native Windows.

## Hard Rules

Never request or persist private keys, pairing tokens, sign-in URLs, QR contents, or credentials. Use device-local pairing or hidden terminal input; QR data is temporary secret material. Never open public SSH or router ports. For full Mosh, run Tailscale exactly once: on macOS or WSL, never Windows and WSL together. Disable Tailscale SSH with Moshi/OpenSSH key auth. Inspect remote installers before execution or prefer signed package managers.

Ask one question only when detection leaves a real decision or authorization. Obtain explicit approval before elevated installs, firewall/auth changes, cloud pairing, scheduled tasks, reboot, or destructive rollback. Configure firewall restrictions before enabling services, preserve local recovery, and validate SSH syntax before restart. Do not claim live processes, Herdr/tmux, or systemd survive physical reboot; persisted Pi JSONL sessions may resume from disk.

## Decision Gates

| Detected condition | Required action |
| --- | --- |
| Unsupported platform or missing WSL2 | Stop with the supported-path guidance. |
| Existing service, key, firewall, or Tailscale state | Present read-only evidence and ask whether to preserve, repair, or stop. |
| Installation, pairing, hardening, task, or reboot needed | Explain impact, rollback, and request the single required approval. |
| Key choice | Ask Easy Pair versus manual Ed25519; harden only after a tested key. |
| Moshi setup | Ask minimal versus full privacy consent, then integrations and notifications separately. |

## Execution Steps

1. Follow the platform matrix and record only non-sensitive state.
2. Establish permissions, rollback, local recovery, and network exposure boundaries.
3. Install and verify OpenSSH, Tailscale, mobile clients, Moshi, `moshi-hook`, Mosh, and Herdr or tmux using the guided reference.
4. Test key authentication before optional strict SSH hardening; keep Tailscale SSH off.
5. Configure the approved lifecycle path, privacy level, integrations, notifications, and Pi JSONL checkpoint/resume procedure.
6. Run disconnect and approved reboot recovery verification. Mark cold-boot behavior pending evidence in this draft.

## Output Contract

Report platform, detected state, approvals granted or declined, mutations performed, non-sensitive verification evidence, rollback path, and pending recovery evidence. State exactly why a step stopped. Never report a reboot or service-survival claim without observed evidence.

## References

- [Platform matrix](references/platform-matrix.md)
- [Guided install](references/guided-install.md)
- [Verification and recovery](references/verification-and-recovery.md)
