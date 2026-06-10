#!/usr/bin/env python3
"""
Filter words from backend/data/allowed_words.txt by length and save them
into backend/data/allowed_len_<N>.txt.

Usage:
    python3 backend/data/word_len_extractor_script.py 5
"""

import sys
from pathlib import Path


def filter_words_by_length(input_file: Path, target_length: int, output_file: Path) -> None:
    words = [line.strip().lower() for line in input_file.read_text(encoding="utf-8").splitlines()]
    filtered = [word for word in words if len(word) == target_length and word]

    output_file.write_text("\n".join(filtered) + ("\n" if filtered else ""), encoding="utf-8")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python3 backend/data/word_len_extractor_script.py <N>")
        sys.exit(1)

    try:
        target_length = int(sys.argv[1])
    except ValueError:
        print("Error: <N> must be an integer.")
        sys.exit(1)

    base_dir = Path(__file__).resolve().parent
    input_file = base_dir / "allowed_words.txt"
    output_file = base_dir / f"allowed_len_{target_length}.txt"

    if not input_file.exists():
        print(f"Error: input file not found: {input_file}")
        sys.exit(1)

    filter_words_by_length(input_file, target_length, output_file)
    print(f"Created/updated: {output_file}")
