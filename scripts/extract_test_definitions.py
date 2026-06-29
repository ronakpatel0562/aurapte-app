"""
Extract compact test definitions (test number + section sizes + Mongo IDs)
from the original PracticeTest.txt / MockTest.txt dumps and write them to
src/lib/testDefinitions.{practice,mock}.json so the QuestionRunner can
look up tests at runtime without a database hit.

Run from the project root:
    python scripts/extract_test_definitions.py
"""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC_DIR = ROOT / "src" / "lib"
PRACTICE_IN = Path(r"C:\Users\ronak\OneDrive\Desktop\Aus\PracticeTest.txt")
MOCK_IN = Path(r"C:\Users\ronak\OneDrive\Desktop\Aus\MockTest.txt")
PRACTICE_OUT = SRC_DIR / "testDefinitions.practice.json"
MOCK_OUT = SRC_DIR / "testDefinitions.mock.json"


def read_first_json(path: Path) -> dict:
    """The dumps sometimes have a stray trailing brace or duplicate object.
    Walk to the first balanced top-level close so we get the real JSON."""
    text = path.read_text(encoding="utf-8")
    depth = 0
    start = text.find("{")
    if start < 0:
        raise ValueError(f"No JSON in {path}")
    for i in range(start, len(text)):
        c = text[i]
        if c == "{":
            depth += 1
        elif c == "}":
            depth -= 1
            if depth == 0:
                return json.loads(text[start:i + 1])
    raise ValueError(f"Unbalanced JSON in {path}")


def extract(raw_tests: list, kind: str) -> list:
    out = []
    for i, t in enumerate(raw_tests):
        sections = {}
        for mod_key in ["Speaking", "Writing", "Reading", "Listening"]:
            arr = t.get("sections", {}).get(mod_key) or []
            sections[mod_key] = {
                "module": mod_key.lower(),
                "legacyIds": arr,
                "targetCount": len(arr),
            }
        total = sum(s["targetCount"] for s in sections.values())
        out.append({
            "id": f"{'mock' if kind == 'mock' else 'practice'}-test-{i + 1}",
            "kind": kind,
            "testNumber": i + 1,
            "title": f"{'Full Mock Test' if kind == 'mock' else 'Practice Test'} #{i + 1}",
            "totalQuestions": total,
            "isMock": kind == "mock",
            "sections": [
                sections[k]
                for k in ["Speaking", "Writing", "Reading", "Listening"]
                if sections[k]["targetCount"] > 0
            ],
        })
    return out


def main() -> None:
    practice_raw = read_first_json(PRACTICE_IN)
    mock_raw = read_first_json(MOCK_IN)

    practice_defs = extract(practice_raw["data"]["practiceTests"], "practice")
    mock_defs = extract(mock_raw["data"]["mockTests"], "mock")

    SRC_DIR.mkdir(parents=True, exist_ok=True)
    PRACTICE_OUT.write_text(
        json.dumps({"data": {"practiceTests": practice_defs}}, indent=2),
        encoding="utf-8",
    )
    MOCK_OUT.write_text(
        json.dumps({"data": {"mockTests": mock_defs}}, indent=2),
        encoding="utf-8",
    )

    print(f"Practice tests: {len(practice_defs)}")
    print(f"  total-questions per test (sorted): {sorted(d['totalQuestions'] for d in practice_defs)}")
    if practice_defs:
        s = practice_defs[0]["sections"]
        print(f"  first test breakdown S/W/R/L = "
              f"{s[0]['targetCount']}/{s[1]['targetCount']}/{s[2]['targetCount']}/{s[3]['targetCount']}")
    print(f"Mock tests: {len(mock_defs)}")
    print(f"  total-questions per test (sorted): {sorted(d['totalQuestions'] for d in mock_defs)}")
    if mock_defs:
        s = mock_defs[0]["sections"]
        print(f"  first test breakdown S/W/R/L = "
              f"{s[0]['targetCount']}/{s[1]['targetCount']}/{s[2]['targetCount']}/{s[3]['targetCount']}")
    print(f"\nWrote {PRACTICE_OUT.relative_to(ROOT)}")
    print(f"Wrote {MOCK_OUT.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
