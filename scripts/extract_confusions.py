"""Extract the confusion matrices printed in the TransfHAR paper (Figures 14 and 15).

The matrices are embedded as real text in the PDF, so we read word bounding boxes
from `pdftotext -bbox` (poppler) and rebuild each grid by row. Row labels in the PDF
wrap in Figure 15, so class names are given explicitly below, exactly as the paper labels
them (Figure 14 axis labels, Table 6 for participants); parsed labels are only a sanity check.

Usage: python3 scripts/extract_confusions.py [path/to/TransfHAR.pdf]
Writes public/data/confusions.json
"""

import html
import json
import re
import subprocess
import sys
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PDF = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / "res" / "TransfHAR.pdf"
OUT = ROOT / "public" / "data" / "confusions.json"
PAGE = 15  # Figures 14 and 15 share this page

NUM = re.compile(r"^\d*\.\d+$")

# Panel regions in PDF points (x0, x1, y0, y1), found from gaps between numeric tokens.
FIG14 = {
    "samosa": (0, 235, 60, 270),
    "utd": (235, 400, 60, 270),
    "prism_latte": (400, 612, 60, 270),
}
_cols = [0, 175, 276, 377, 478, 612]
FIG15 = {
    f"P{i + 1}": (_cols[i % 5], _cols[i % 5 + 1], 270 if i < 5 else 375, 375 if i < 5 else 480)
    for i in range(10)
}

CLASSES = {
    "samosa": [
        "Alarm clock", "Blender in use", "Brushing hair", "Chopping", "Clapping", "Coughing",
        "Drill in use", "Drinking", "Grating", "Hair dryer in use", "Hammering", "Knocking",
        "Laughing", "Microwave", "Other", "Pouring pitcher", "Sanding", "Scratching", "Screwing",
        "Shaver in use", "Toilet flushing", "Toothbrushing", "Twisting jar", "Vacuum in use",
        "Washing hands", "Washing Utensils", "Wiping with rag",
    ],
    "utd": [
        "swipe left", "swipe right", "wave", "clap", "throw", "arm cross", "basketball shoot",
        "draw x", "draw circle CW", "draw circle CCW", "draw triangle", "bowling", "boxing",
        "baseball swing", "tennis swing", "arm curl", "tennis serve", "push", "knock", "catch",
        "pickup and throw",
    ],
    "prism_latte": [
        "adjust grind", "attach filter", "brew coffee", "clean wand", "dump grinds", "get towel",
        "grind beans", "move filter", "place cup", "pour milk cup", "pour milk jug",
        "purge wand", "remove cup", "remove filter", "steam milk", "throw towel", "use fridge",
        "wash filter", "wash jug",
    ],
    # Table 6 order, which is also the Act 1-7 order of Figures 13 and 15.
    "P1": ["air heart", "folding paper", "hand sanitizer", "stirring coffee", "unscrewing bottle", "winding cord", "writing"],
    "P2": ["drawing figure eight in the air", "eating with chopsticks", "pouring water between cups", "stirring coffee", "using mouse", "using stylus", "wiping whiteboard"],
    "P3": ["applying hand sanitizer", "drawing circle in the air", "opening and closing laptop", "unbuttoning jacket", "waving goodbye", "writing with pen", "zipping and unzipping bag"],
    "P4": ["opening Gatorade bottle", "snapping", "tearing paper", "tying shoelace", "winding rope", "wiping glass", "writing with marker"],
    "P5": ["drawing circle in the air", "screwing mason jar lid", "stirring coffee", "typing on keyboard", "unplugging USB cable", "waving goodbye", "zipping sleeping bag"],
    "P6": ["flicking badminton racket", "massage giving", "taking phone out of pocket", "twisting screwdriver", "typing on keyboard", "using computer mouse", "writing on whiteboard"],
    "P7": ["basketball shooting", "phone scrolling", "putting on lotion", "scratching nails", "shadow boxing", "shuffling deck of cards", "turning book pages"],
    "P8": ["clicking pen", "crumpling paper", "filing nails", "fist bump", "opening AirPods case", "rock paper scissors", "setting 3D printer"],
    "P9": ["karate chop", "organizing fridge", "pointing", "reading Japanese manga", "unscrewing lip balm", "waving hello", "wiping laptop"],
    "P10": ["drawing", "fist pump", "hand gesture sequence", "rolling up poster", "stirring coffee", "typing", "unscrewing water bottle"],
}


def page_words(pdf: Path, page: int) -> list[dict]:
    out = subprocess.run(
        ["pdftotext", "-bbox", "-f", str(page), "-l", str(page), str(pdf), "-"],
        check=True, capture_output=True, text=True,
    ).stdout
    words = []
    for m in re.finditer(
        r'<word xMin="([\d.]+)" yMin="([\d.]+)" xMax="([\d.]+)" yMax="([\d.]+)">(.*?)</word>', out
    ):
        x0, y0, x1, y1 = map(float, m.groups()[:4])
        words.append({"x0": x0, "y0": y0, "x1": x1, "y1": y1, "t": html.unescape(m.group(5))})
    return words


def parse_panel(words: list[dict], box: tuple) -> tuple[list[str], list[list[float]]]:
    xa, xb, ya, yb = box
    ws = [w for w in words if xa <= w["x0"] < xb and ya <= w["y0"] < yb]
    rows: dict[float, list[dict]] = defaultdict(list)
    for w in ws:
        if not NUM.match(w["t"]):
            continue
        yc = (w["y0"] + w["y1"]) / 2
        key = next((k for k in rows if abs(k - yc) < 0.6), yc)
        rows[key].append(w)
    labels, matrix = [], []
    for yc in sorted(rows):
        cells = sorted(rows[yc], key=lambda w: w["x0"])
        first_x = cells[0]["x0"]
        label = [
            w for w in ws
            if not NUM.match(w["t"]) and w["x1"] <= first_x + 0.5 and abs((w["y0"] + w["y1"]) / 2 - yc) < 0.8
        ]
        labels.append(" ".join(w["t"] for w in sorted(label, key=lambda w: w["x0"])))
        matrix.append([float(w["t"]) for w in cells])
    return labels, matrix


def main() -> None:
    words = page_words(PDF, PAGE)
    result = {}
    for key, box in {**FIG14, **FIG15}.items():
        labels, matrix = parse_panel(words, box)
        classes = CLASSES[key]
        n = len(classes)
        if len(matrix) != n or any(len(r) != n for r in matrix):
            sys.exit(f"{key}: expected {n}x{n}, got {len(matrix)} rows {[len(r) for r in matrix]}")
        print(f"{key:12s} {n}x{n}  first label parsed as {labels[0]!r}")
        result[key] = {"classes": classes, "matrix": matrix}
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(result, separators=(",", ":")))
    print(f"wrote {OUT.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
