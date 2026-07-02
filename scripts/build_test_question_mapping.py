"""
build_test_question_mapping.py — precompute the test_questions mapping.

Runs the same resolution the runner pages used to do live on every page
load (exact `original_id` match per category, then top up any shortfall
from active questions in the same module/task_type) and persists the
result into the `test_questions` table. After this, the runner pages
read one indexed query per test instead of resolving live, and never
touch `original_id`.

Practice tests only draw from the 'shared' pool. Mock tests draw from
both 'shared' and 'mock_only' so newly-added mock-exclusive questions
can be used as backfill without ever leaking into practice tests or the
question browse pages.

Safe to re-run: each test's existing mapping rows are deleted and
rebuilt from scratch, so this also "repairs" a test after new questions
are imported or an existing one is deactivated.

Usage:
    export SUPABASE_URL=https://your-project.supabase.co
    export SUPABASE_SERVICE_ROLE_KEY=...
    python scripts/build_test_question_mapping.py [--kind practice|mock] [--test-id practice-test-3]
"""
import argparse
import json
import os
import sys
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC_DIR = ROOT / "src" / "lib"


def http(method: str, url: str, key: str, body=None, extra_headers=None):
    headers = {
        "apikey": key,
        "Authorization": f"Bearer {key}",
        "Content-Type": "application/json",
    }
    if extra_headers:
        headers.update(extra_headers)
    data = json.dumps(body).encode("utf-8") if body is not None else None
    req = urllib.request.Request(url, method=method, headers=headers, data=data)
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            text = resp.read().decode("utf-8", errors="ignore")
            return resp.status, (json.loads(text) if text else None)
    except urllib.error.HTTPError as e:
        text = e.read().decode("utf-8", errors="ignore")
        return e.code, text


def fetch_exact(base_url: str, key: str, ids: list) -> dict:
    """original_id -> row, for whichever of `ids` currently exist and are active."""
    if not ids:
        return {}
    id_list = ",".join(ids)
    q = f"original_id=in.({id_list})&is_active=eq.true&select=id,original_id,task_type,module"
    status, data = http("GET", f"{base_url}/rest/v1/questions?{q}", key)
    if status != 200:
        print(f"    WARN exact-match fetch failed ({status}): {data}", file=sys.stderr)
        return {}
    return {row["original_id"]: row for row in data}


def fetch_backfill(base_url: str, key: str, module: str, task_type, need: int, used_ids: set, allow_mock_only: bool) -> list:
    if need <= 0:
        return []
    params = {
        "module": f"eq.{module}",
        "is_active": "eq.true",
        "select": "id,task_type",
        "order": "created_at.asc",
        "limit": str(need + len(used_ids)),
    }
    if task_type:
        params["task_type"] = f"eq.{task_type}"
    if not allow_mock_only:
        params["pool"] = "eq.shared"
    q = urllib.parse.urlencode(params, safe="().,")
    status, data = http("GET", f"{base_url}/rest/v1/questions?{q}", key)
    if status != 200:
        print(f"    WARN backfill fetch failed ({status}): {data}", file=sys.stderr)
        return []
    filler = [row for row in data if row["id"] not in used_ids]
    return filler[:need]


def resolve_section_rows(base_url: str, key: str, kind: str, section: dict) -> list:
    """Returns an ordered list of {id, task_type} rows for one section."""
    module = section["module"]
    target = section["targetCount"]
    allow_mock_only = kind == "mock"
    used_ids: set = set()
    rows: list = []

    categories = section.get("categories") or None
    if categories:
        for cat in categories:
            task_type = cat.get("taskType")
            legacy_ids = cat.get("legacyIds") or []
            exact_by_id = fetch_exact(base_url, key, legacy_ids)
            matched = 0
            for legacy_id in legacy_ids:
                row = exact_by_id.get(legacy_id)
                if row and row["id"] not in used_ids:
                    rows.append(row)
                    used_ids.add(row["id"])
                    matched += 1
            need = len(legacy_ids) - matched
            filler = fetch_backfill(base_url, key, module, task_type, need, used_ids, allow_mock_only)
            for row in filler:
                rows.append(row)
                used_ids.add(row["id"])
        if len(rows) < target:
            filler = fetch_backfill(base_url, key, module, None, target - len(rows), used_ids, allow_mock_only)
            for row in filler:
                rows.append(row)
                used_ids.add(row["id"])
    else:
        legacy_ids = section.get("legacyIds") or []
        exact_by_id = fetch_exact(base_url, key, legacy_ids)
        matched = 0
        for legacy_id in legacy_ids:
            row = exact_by_id.get(legacy_id)
            if row and row["id"] not in used_ids:
                rows.append(row)
                used_ids.add(row["id"])
                matched += 1
        need = target - matched
        filler = fetch_backfill(base_url, key, module, None, need, used_ids, allow_mock_only)
        for row in filler:
            rows.append(row)
            used_ids.add(row["id"])

    return rows[:target]


def build_test(base_url: str, key: str, kind: str, test: dict) -> int:
    test_id = test["id"]
    total_mapped = 0
    mapping_rows = []

    for section in test["sections"]:
        module = section["module"]
        rows = resolve_section_rows(base_url, key, kind, section)
        for position, row in enumerate(rows):
            mapping_rows.append({
                "test_id": test_id,
                "kind": kind,
                "module": module,
                "position": position,
                "question_id": row["id"],
            })
        total_mapped += len(rows)
        shortfall = section["targetCount"] - len(rows)
        if shortfall > 0:
            print(f"    {module}: {len(rows)}/{section['targetCount']} ({shortfall} short — not enough active questions yet)")

    # Full replace: delete then insert, so shrinking/repaired tests never
    # leave stale trailing positions behind.
    status, _ = http("DELETE", f"{base_url}/rest/v1/test_questions?test_id=eq.{urllib.parse.quote(test_id)}", key,
                      extra_headers={"Prefer": "return=minimal"})
    if status not in (200, 204):
        print(f"    ERROR: delete failed for {test_id} ({status})", file=sys.stderr)
        return 0

    if mapping_rows:
        status, data = http("POST", f"{base_url}/rest/v1/test_questions", key, body=mapping_rows,
                             extra_headers={"Prefer": "return=minimal"})
        if status not in (200, 201, 204):
            print(f"    ERROR: insert failed for {test_id} ({status}): {data}", file=sys.stderr)
            return 0

    print(f"  {test_id}: mapped {total_mapped}/{test['totalQuestions']}")
    return total_mapped


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--kind", choices=["practice", "mock"], default=None)
    parser.add_argument("--test-id", default=None)
    args = parser.parse_args()

    base_url = (os.environ.get("SUPABASE_URL") or os.environ.get("NEXT_PUBLIC_SUPABASE_URL") or "").rstrip("/")
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    if not base_url or not key:
        print("ERROR: SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY must be set.", file=sys.stderr)
        return 2

    with (SRC_DIR / "testDefinitions.practice.json").open(encoding="utf-8") as f:
        practice_tests = json.load(f)["data"]["practiceTests"]
    with (SRC_DIR / "testDefinitions.mock.json").open(encoding="utf-8") as f:
        mock_tests = json.load(f)["data"]["mockTests"]

    jobs = []
    if args.kind in (None, "practice"):
        jobs += [("practice", t) for t in practice_tests]
    if args.kind in (None, "mock"):
        jobs += [("mock", t) for t in mock_tests]
    if args.test_id:
        jobs = [(kind, t) for kind, t in jobs if t["id"] == args.test_id]
        if not jobs:
            print(f"ERROR: no test with id '{args.test_id}'", file=sys.stderr)
            return 2
    else:
        # Synthetic tests (e.g. practice-test-24..30) have no legacy Mongo
        # roster — they're built by build_bonus_practice_tests.py, which
        # does usage-aware allocation this script's legacyIds/backfill
        # logic can't reproduce. Only touch them via --test-id.
        synthetic_ids = [t["id"] for _, t in jobs if t.get("synthetic")]
        if synthetic_ids:
            print(f"Skipping {len(synthetic_ids)} synthetic test(s) (rebuild via build_bonus_practice_tests.py): {', '.join(synthetic_ids)}")
        jobs = [(kind, t) for kind, t in jobs if not t.get("synthetic")]

    print(f"Building mappings for {len(jobs)} test(s)...")
    for kind, test in jobs:
        build_test(base_url, key, kind, test)

    return 0


if __name__ == "__main__":
    sys.exit(main())
