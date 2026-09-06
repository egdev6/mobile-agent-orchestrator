# Platform matrix

Use these checks before any mutation. Record only non-sensitive results. Ask no question if the next safe action is already determined.

## Stable targets

| Detection | Route | Lifecycle boundary |
| --- | --- | --- |
| `Darwin` | macOS native | macOS owns lifecycle and execution. |
| Windows host explicitly confirmed as Windows 11 with a working WSL2 distribution | Windows 11 + WSL2 | Windows owns startup; WSL owns Linux services and agent execution. |
| Windows native without WSL2 | Stop | Guide WSL2 installation; do not configure a native-Windows substitute. |
| Other platform or unclear state | Stop | Explain that no stable target was detected. |

## Read-only preflight

Run only the checks relevant to the current shell:

```bash
# Read-only: identify the Unix execution environment.
uname -s
uname -r

# Read-only: macOS version when Darwin was detected.
sw_vers

# Read-only: identify a WSL Linux environment.
grep -Ei 'microsoft|wsl' /proc/sys/kernel/osrelease

# Read-only: run from Windows PowerShell. Stop unless Caption explicitly says Windows 11.
$os = Get-CimInstance -ClassName Win32_OperatingSystem
$os | Select-Object Caption, Version, BuildNumber
if ($os.Caption -notmatch '\bWindows 11\b') { throw "Windows 11 is required; stop this route." }

# Read-only: run from Windows PowerShell or Command Prompt after the Windows 11 gate passes.
wsl --status
wsl --version
wsl --list --verbose
```

On Windows, continue only when the Windows version gate explicitly reports Windows 11, WSL version 2, and a selected distribution. Stop rather than infer Windows 11 from WSL or partial signals. If WSL2 is absent, explain that the human must approve the current Microsoft-documented WSL2 installation path and any restart it requires.

## Placement decisions

### macOS native

Use macOS as the single execution target for OpenSSH, Tailscale, Mosh, and the session host. Before proposing a lifecycle daemon, firewall change, or persistent-login setting, obtain current official Apple documentation and collect local evidence. This draft intentionally supplies no exact macOS firewall or lifecycle command because those commands must be verified for the installed macOS release.

### Windows 11 + WSL2

Windows is the lifecycle host; the selected WSL2 distribution is the Linux execution target. For the full-Mosh route, Tailscale must run in WSL only. If the Windows Tailscale client is active, present the conflict and require approval to stop or remove that placement before enabling WSL Tailscale. Never run both concurrently for this route.

Ask separately for approval before each of these mutations:

1. Enabling WSL systemd by editing the distribution configuration and restarting WSL.
2. Creating a Windows startup scheduled task that invokes the selected distribution's approved keepalive/service-start action.
3. Enabling user linger in WSL so approved user services can start without an interactive login.

Use current Microsoft and distribution documentation to construct the exact scheduled-task and systemd commands. Verify each with read-only checks such as:

```bash
# Read-only: from WSL after systemd is enabled.
systemctl is-system-running
loginctl show-user "$USER" -p Linger

# Read-only: from Windows after the task is created.
schtasks /query /tn "<task-name>" /fo LIST /v
```

Linger and a startup task can start configured services after boot; they do not preserve running agent processes across a physical reboot. Only persisted Pi JSONL sessions may resume from disk.

## Permission and rollback gate

Before the first change, identify the invoking user, privilege boundary, current SSH access path, installed service state, and how to undo each proposed mutation. Keep an already-working local console or separate authenticated session available before touching firewall or SSH authentication. If that recovery path cannot be demonstrated, stop rather than making the change.
