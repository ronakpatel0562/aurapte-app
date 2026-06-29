"""Reset Next.js dev cache.

Run this when you see:
    Error: Cannot find module './vendor-chunks/@supabase.js'
or any other "Cannot find module ./vendor-chunks/..." error during
`next dev`. The cause is a stale dev chunk graph — webpack-turbopack
emitted a chunk reference into webpack-runtime.js but didn't write the
chunk file to disk before the dev server tried to require() it.

Usage:
    python scripts/reset_dev_cache.py

What it does:
    1. Kills any running `next dev` / `next-server` process so the cache
       isn't being held open.
    2. Removes `.next/` and `node_modules/.cache/` (if present).
    3. Re-runs `npm run build` once to produce a fresh, consistent chunk
       graph under .next/ so subsequent dev sessions inherit good chunks.

After running this, start `npm run dev` again as normal.
"""
import os
import shutil
import subprocess
import sys
from pathlib import Path


def kill_dev_servers() -> None:
    """Best-effort kill of any running next dev server on Windows.

    taskkill /IM node.exe /F would also kill every other Node process
    on the machine (Claude Code, IDE helpers, etc.). Instead we use
    wmic to find PIDs whose command line contains 'next dev' or
    'next-server' and only kill those.
    """
    try:
        # List Node PIDs and their command lines, then kill the dev ones.
        out = subprocess.check_output(
            ["wmic", "process", "where", "name='node.exe'",
             "get", "processid,commandline", "/format:list"],
            text=True, errors="ignore", timeout=15,
        )
    except (subprocess.CalledProcessError, FileNotFoundError, subprocess.TimeoutExpired):
        print("  (could not enumerate Node processes; skipping)")
        return

    pids: list[int] = []
    current_pid = os.getpid()
    for block in out.split("\n\n"):
        pid = None
        cmdline = ""
        for line in block.splitlines():
            line = line.strip()
            if line.startswith("ProcessId="):
                pid = int(line.split("=", 1)[1])
            elif line.startswith("CommandLine="):
                cmdline = line.split("=", 1)[1]
        if not pid or pid == current_pid:
            continue
        if "next dev" in cmdline or "next-server" in cmdline:
            pids.append(pid)

    if not pids:
        print("  (no next dev process running)")
        return

    for pid in pids:
        try:
            subprocess.run(["taskkill", "/PID", str(pid), "/F"],
                           check=False, capture_output=True)
            print(f"  killed pid {pid}")
        except Exception as e:
            print(f"  could not kill pid {pid}: {e}")


def main() -> int:
    project_root = Path(__file__).resolve().parent.parent
    print(f"Project root: {project_root}")
    print()
    print("Step 1: killing running next dev processes...")
    kill_dev_servers()
    print()
    print("Step 2: removing .next/ and node_modules/.cache/...")
    for d in [project_root / ".next", project_root / "node_modules" / ".cache"]:
        if d.exists():
            shutil.rmtree(d, ignore_errors=True)
            print(f"  removed {d.relative_to(project_root)}")
        else:
            print(f"  (no {d.relative_to(project_root)} to remove)")
    print()
    print("Step 3: running a fresh `npm run build` to re-emit the chunk graph...")
    try:
        subprocess.run(["npm", "run", "build"], cwd=project_root, check=True)
    except subprocess.CalledProcessError:
        print("  build failed; inspect the output above")
        return 1
    print()
    print("Done. You can now run `npm run dev` again.")
    return 0


if __name__ == "__main__":
    sys.exit(main())