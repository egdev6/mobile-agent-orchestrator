# Guided install

Proceed in order. Lines labelled **Read-only** discover state. Lines labelled **Mutation** require the stated approval immediately before execution. Do not combine independent approvals or ask about a decision already resolved by detection.

## 1. Network and OpenSSH baseline

**Read-only:** identify installed tools and listeners without exposing configuration secrets.

```bash
command -v ssh sshd tailscale mosh tmux
```

Then run exactly one matching read-only listener check:

```bash
# Linux or WSL.
ss -lnt
```

```bash
# macOS; lsof is stock and needs no additional package.
lsof -nP -iTCP -sTCP:LISTEN
```

If OpenSSH server installation is needed, explain the signed package-manager source, required elevation, service effect, rollback package/service action, and local recovery path. Ask for approval, then use the current platform package documentation rather than an uninspected remote installer. Do not enable a listener until its firewall rule is constrained to the private overlay interface or equivalent private source range. Never add router forwarding or a public-IP rule.

Before any SSH restart, validate the generated configuration with the platform's documented syntax check, retain the current connected session, and test a second connection. A failed validation or missing recovery path stops the flow.

## 2. Tailscale placement and mobile clients

**Read-only:** confirm whether Tailscale is installed, signed in, running, and whether its SSH feature is enabled.

```bash
tailscale status
tailscale netcheck
```

If unavailable, prefer the current signed vendor package path. Inspect any downloaded installer before execution. Ask approval before sign-in, pairing, or changing network state. For full Mosh, choose exactly one placement: macOS on the native target, or WSL on the Windows route. Detect and resolve a concurrent Windows-and-WSL placement before proceeding.

After the overlay connection works, disable Tailscale SSH for the Moshi/OpenSSH key-auth route and verify the resulting state. Install and sign in to the official Tailscale Android or iOS app only with consent. Device authentication, URLs, and QR codes remain on the device; treat a QR code as a temporary secret and never transcribe it.

## 3. Key choice and SSH hardening

Ask one question: **Easy Pair or manual Ed25519 key?** Describe the available local pairing mechanism only if it is detected; otherwise select manual key setup.

For manual setup, generate and keep the private key on the approved client device. The public-key command is safe to show; its output is not to be copied into chat:

```bash
# Mutation after approval; choose a device-local path and passphrase prompt.
ssh-keygen -t ed25519 -a 64 -f <private-key-path> -C "mobile-agent"

# Read-only test after public-key installation by an out-of-chat method.
ssh -o BatchMode=yes -o PreferredAuthentications=publickey <account>@<private-overlay-name> true
```

Do not disable password or interactive authentication until this test succeeds from the intended mobile route and a local recovery path exists. Then ask a separate approval for strict hardening. Apply only documented OpenSSH settings, validate syntax before reload, reload rather than blindly restart when supported, and retest the key connection before closing the existing session.

## 4. Moshi, `moshi-hook`, Mosh, and terminal host

Use current official Moshi and `moshi-hook` documentation. First detect whether each component exists and whether the maintainer supplies a signed package-manager release. Do not execute an opaque curl-pipe-shell installer; inspect a downloaded script before execution. Ask for installation approval separately from cloud pairing approval.

Ask one privacy question: **minimal or full Moshi consent?** Minimal enables only the pairing and session capability necessary for the chosen route. Full additionally enables only the current official features the human explicitly accepts. Present data handling and revocation evidence from current official documentation before either choice.

Ask separately which detected integrations to enable and whether notifications are wanted. Offer only discovered integrations plus **none**; do not invent providers. Ask before granting each integration permission or sending a test notification.

Install Mosh from a signed package source after approval and use the private-overlay name for connection testing:

```bash
# Read-only: confirm local clients and server availability.
mosh --version
tmux -V

# Interactive test; does not place a key or token in chat.
mosh --ssh="ssh -o PreferredAuthentications=publickey" <account>@<private-overlay-name>
```

Choose Herdr when installed and supported by current documentation; otherwise use tmux. A typical tmux session command is:

```bash
tmux new-session -As mobile-agent
```

Neither Herdr nor tmux preserves live processes across physical reboot. Only persisted Pi JSONL sessions may resume from disk.

## 5. Lifecycle, checkpoints, and notifications

On the Windows route, follow the approved WSL systemd, linger, and Windows keepalive sequence in the platform matrix. On macOS, require current official lifecycle evidence before creating a persistent service. Never state that the service will survive reboot until it has passed the recovery verification.

Ask whether to enable session checkpoints only after the chosen session host is working. Configure checkpoints to store only supported Pi JSONL sessions on local disk; they may resume from disk, but all live processes die on reboot. Record the Pi JSONL session resume command or UI route without recording session contents. Enable approved notifications last and verify with a non-sensitive test event.
