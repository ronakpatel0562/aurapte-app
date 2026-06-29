"""
link_questions.py — bulk-link Supabase question UUIDs to Mongo ObjectIDs.

Reads pairs from a CSV (or TSV) file and PATCHes the questions table via
the Supabase service-role key. Skips pairs that are already linked.

CSV format (no header required):
    mongo_id,question_uuid
    6a04a1368911318eb273e152,abc-1234-...
    6a04a1638911318eb273e153,def-5678-...

Usage:
    export SUPABASE_URL=https://your-project.supabase.co
    export SUPABASE_SERVICE_ROLE_KEY=...
    python scripts/link_questions.py mappings.csv

The script is idempotent: re-running with the same input is safe.
"""
import csv
import os
import re
import sys
from pathlib import Path

try:
    # Supabase Python SDK is not currently a project dep; we use REST via
    # the standard library instead so this script works without extra
    # installs. If you do install supabase-py, swap the http_post helper
    # for the SDK's table.update() call.
    import urllib.request
    import urllib.error
    import json
except ImportError:
    print("ERROR: urllib not available", file=sys.stderr)
    sys.exit(2)

MONGO_RE = re.compile(r"^[a-f0-9]{24}$", re.IGNORECASE)
UUID_RE = re.compile(
    r"^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$",
    re.IGNORECASE,
)


def http_patch(url: str, key: str, body: dict, row_id: str) -> tuple[int, str]:
    """PATCH a single row by id=eq.<uuid> via PostgREST. Returns (status, text)."""
    req = urllib.request.Request(
        f"{url}/rest/v1/questions?id=eq.{row_id}",
        method="PATCH",
        headers={
            "apikey": key,
            "Authorization": f"Bearer {key}",
            "Content-Type": "application/json",
            "Prefer": "return=minimal",
        },
        data=json.dumps(body).encode("utf-8"),
    )
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            return resp.status, resp.read().decode("utf-8", errors="ignore")
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode("utf-8", errors="ignore")


def main() -> int:
    if len(sys.argv) != 2:
        print("Usage: link_questions.py <mappings.csv>", file=sys.stderr)
        return 2

    supabase_url = os.environ.get("SUPABASE_URL") or os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
    service_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    if not supabase_url or not service_key:
        print(
            "ERROR: SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) and "
            "SUPABASE_SERVICE_ROLE_KEY must be set in the environment.",
            file=sys.stderr,
        )
        return 2

    csv_path = Path(sys.argv[1])
    if not csv_path.exists():
        print(f"ERROR: {csv_path} not found", file=sys.stderr)
        return 2

    linked = 0
    skipped = 0
    failed = 0

    with csv_path.open(newline="", encoding="utf-8") as f:
        # Sniff delimiter from the first line.
        sample = f.read(4096)
        f.seek(0)
        dialect = csv.Sniffer().sniff(sample, delimiters=",\t;|")
        reader = csv.reader(f, dialect)

        for line_num, row in enumerate(reader, start=1):
            if not row or len(row) < 2:
                continue
            mongo_id = row[0].strip().lower()
            uuid_val = row[1].strip()
            if not MONGO_RE.match(mongo_id):
                print(f"  line {line_num}: bad mongo id '{mongo_id}', skipping")
                failed += 1
                continue
            if not UUID_RE.match(uuid_val):
                print(f"  line {line_num}: bad uuid '{uuid_val}', skipping")
                failed += 1
                continue

            status, text = http_patch(
                supabase_url,
                service_key,
                {"legacy_mongo_id": mongo_id},
                uuid_val,
            )
            if status in (200, 204):
                linked += 1
                if linked % 100 == 0:
                    print(f"  linked {linked}…")
            elif status == 409:
                skipped += 1  # already linked to something else; fine to skip
            else:
                failed += 1
                print(f"  line {line_num}: HTTP {status} {text[:200]}")

    print()
    print(f"Linked:  {linked}")
    print(f"Skipped: {skipped}")
    print(f"Failed:  {failed}")
    return 0 if failed == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
