"""
build_bonus_practice_tests.py — generate practice-test-24..30 from leftover
question inventory, using the canonical category format derived from tests
1-13 (the tests whose legacy roster had full task_type recovery):

  speaking (28): read_aloud 6, repeat_sentence 10, describe_image 4,
                 responding_to_situation 2, answer_short_question 6
  writing  (3):  summarize_written_text 2, write_an_email 1
  reading  (13): rw_fill_in_the_blanks 11, reading_mcq_multiple 1,
                 reading_mcq_single 1
  listening(11): listening_mcq_multiple 1, summarize_spoken_text 3,
                 listening_mcq_single 1, select_missing_word 1,
                 write_from_dictation 5

For each category, questions are assigned to the 7 new tests in
usage-ascending order (never-used-in-any-practice-test questions first,
then the globally least-reused ones), round-robin across the 7 tests so
fresh content is spread evenly rather than dumped into the first test.
A question is never assigned twice within the same test.

These tests have no legacy Mongo roster, so testDefinitions.practice.json
marks them "synthetic": true — build_test_question_mapping.py skips
synthetic tests so a later full re-run of that script can't clobber this
allocation with its legacy-roster logic.

Safe to re-run: existing test_questions rows for practice-test-24..30 are
deleted and rebuilt from scratch each time.

Usage:
    export SUPABASE_URL=...
    export SUPABASE_SERVICE_ROLE_KEY=...
    python scripts/build_bonus_practice_tests.py
"""
import json
import os
import sys
import urllib.error
import urllib.request

FORMAT = {
    "speaking": [
        ("read_aloud", 6),
        ("repeat_sentence", 10),
        ("describe_image", 4),
        ("responding_to_situation", 2),
        ("answer_short_question", 6),
    ],
    "writing": [
        ("summarize_written_text", 2),
        ("write_an_email", 1),
    ],
    "reading": [
        ("rw_fill_in_the_blanks", 11),
        ("reading_mcq_multiple", 1),
        ("reading_mcq_single", 1),
    ],
    "listening": [
        ("listening_mcq_multiple", 1),
        ("summarize_spoken_text", 3),
        ("listening_mcq_single", 1),
        ("select_missing_word", 1),
        ("write_from_dictation", 5),
    ],
}

TEST_IDS = [f"practice-test-{n}" for n in range(24, 31)]


def http(method, url, key, body=None, extra_headers=None):
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


def fetch_all(base_url, key, path):
    all_rows = []
    offset = 0
    page_size = 1000
    while True:
        sep = "&" if "?" in path else "?"
        status, data = http("GET", f"{base_url}{path}{sep}limit={page_size}&offset={offset}", key)
        if status != 200:
            print(f"ERROR fetching {path}: {status} {data}", file=sys.stderr)
            sys.exit(1)
        all_rows.extend(data)
        if len(data) < page_size:
            break
        offset += page_size
    return all_rows


def main():
    base_url = (os.environ.get("SUPABASE_URL") or os.environ.get("NEXT_PUBLIC_SUPABASE_URL") or "").rstrip("/")
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    if not base_url or not key:
        print("ERROR: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set.", file=sys.stderr)
        return 2

    print("Fetching active shared-pool questions...")
    questions = fetch_all(base_url, key,
        "/rest/v1/questions?select=id,module,task_type,pool,is_active&is_active=eq.true&pool=eq.shared")
    print(f"  {len(questions)} active shared questions")

    print("Fetching existing practice test_questions usage...")
    existing = fetch_all(base_url, key,
        "/rest/v1/test_questions?select=question_id&kind=eq.practice")
    print(f"  {len(existing)} existing mapping rows")

    usage = {}
    for row in existing:
        usage[row["question_id"]] = usage.get(row["question_id"], 0) + 1

    by_cat = {}
    for q in questions:
        key_cat = (q["module"], q["task_type"])
        by_cat.setdefault(key_cat, []).append(q["id"])

    # assigned[test_id][module] = list of question ids, in position order
    assigned = {tid: {mod: [] for mod in FORMAT} for tid in TEST_IDS}

    for module, cats in FORMAT.items():
        for task_type, count in cats:
            pool = by_cat.get((module, task_type), [])
            if len(pool) < count:
                print(f"WARN {module}/{task_type}: pool has only {len(pool)} questions, need {count} per test", file=sys.stderr)
            for _round in range(count):
                for tid in TEST_IDS:
                    used_in_test = set(assigned[tid][module])
                    candidates = [qid for qid in pool if qid not in used_in_test]
                    if not candidates:
                        print(f"ERROR {module}/{task_type}: ran out of distinct questions for {tid}", file=sys.stderr)
                        continue
                    candidates.sort(key=lambda qid: (usage.get(qid, 0), qid))
                    pick = candidates[0]
                    assigned[tid][module].append(pick)
                    usage[pick] = usage.get(pick, 0) + 1

    # Build mapping rows, positions per (test, module) in FORMAT category order
    total_by_test = {}
    for tid in TEST_IDS:
        rows = []
        for module in FORMAT:
            for position, qid in enumerate(assigned[tid][module]):
                rows.append({
                    "test_id": tid,
                    "kind": "practice",
                    "module": module,
                    "position": position,
                    "question_id": qid,
                })
        total_by_test[tid] = len(rows)

        status, _ = http("DELETE", f"{base_url}/rest/v1/test_questions?test_id=eq.{tid}", key,
                          extra_headers={"Prefer": "return=minimal"})
        if status not in (200, 204):
            print(f"ERROR: delete failed for {tid} ({status})", file=sys.stderr)
            continue

        status, data = http("POST", f"{base_url}/rest/v1/test_questions", key, body=rows,
                             extra_headers={"Prefer": "return=minimal"})
        if status not in (200, 201, 204):
            print(f"ERROR: insert failed for {tid} ({status}): {data}", file=sys.stderr)
            continue
        print(f"  {tid}: mapped {len(rows)} questions")

    print("\nDone.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
