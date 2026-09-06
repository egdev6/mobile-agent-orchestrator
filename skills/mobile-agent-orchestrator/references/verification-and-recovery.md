# Verification and recovery

Collect non-sensitive evidence after every approved mutation. A command failing because a component is absent is a finding, not permission to install or change it.

## Verification sequence

1. **Private network:** confirm the selected target is present on the overlay and no public port or router forwarding was created.
2. **SSH:** test public-key authentication in a second session before closing the recovery session. Confirm Tailscale SSH remains disabled for this route.
3. **Mosh:** establish a mobile-route session, briefly disconnect the client network, reconnect, and record whether Mosh reconnects as expected.
4. **Host:** confirm Herdr or tmux behavior, checkpoint creation, selected integration authorization, and notification delivery without recording contents.
5. **Lifecycle:** only after explicit reboot approval, test the documented start and Pi JSONL session resume path.

Useful read-only checks:

```bash
# Overlay evidence.
tailscale status
tailscale netcheck
```

Run exactly one matching read-only listener check:

```bash
# Linux or WSL.
ss -lnt
```

```bash
# macOS; lsof is stock and needs no additional package.
lsof -nP -iTCP -sTCP:LISTEN
```

```bash
# SSH configuration and non-interactive key-auth test.
sshd -T
ssh -o BatchMode=yes -o PreferredAuthentications=publickey <account>@<private-overlay-name> true

# Service and user-linger evidence on a systemd Linux target.
systemctl --user --no-pager status <service-name>
loginctl show-user "$USER" -p Linger
```

Interpret listener output with the firewall and overlay policy; a listening port is not by itself evidence of public exposure. Confirm that no public address, router forwarding rule, or broad firewall exception was introduced. If current platform tooling cannot prove this, stop and request local network evidence rather than assuming safety.

## Recovery decision tree

| Failure | Safe response |
| --- | --- |
| Key test fails after hardening | Keep the existing session open; restore the last known-good authentication setting through the local recovery path; validate before reload. |
| SSH syntax validation fails | Do not reload or restart; correct or restore the staged configuration while the existing session remains available. |
| Tailscale appears on both Windows and WSL | Stop the full-Mosh route; preserve one reachable path; request approval to remove or stop one placement. |
| Mosh does not reconnect | Keep SSH recovery available; inspect overlay and SSH evidence first; do not expose a public port as a workaround. |
| Keepalive, linger, or lifecycle fails | Collect service/task status and current official documentation; do not claim persistence. |
| Reboot loses a live terminal process | Treat as expected; resume only persisted Pi JSONL sessions from disk and restart required processes through the approved lifecycle path. |

## Reboot gate

Before reboot, ask explicit approval and state that all live processes will die. Verify a local recovery path, the key-auth path, rollback instructions, and the Windows task or macOS lifecycle evidence first. After reboot, check the actual startup state, re-establish private-overlay SSH and Mosh, then resume persisted Pi JSONL sessions from disk if available.

**Draft evidence status:** cold-boot and post-reboot behavior remain pending until a human observes and records this sequence on the selected supported target. Do not mark the installation reboot-verified before that evidence exists.

## Rollback

Rollback only the approved mutation that caused the failure: disable the newly created service or task, restore the saved SSH configuration, remove the narrow firewall rule if it was newly added, or sign out/remove the newly added client according to current vendor documentation. Do not delete keys, sessions, or unrelated configuration as a generic rollback step. Any destructive rollback requires a fresh explicit approval.
