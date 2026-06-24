
from collections import Counter
from typing import List


def score_guess(answer: str, guess: str) -> List[str]:
    """
    returns: ["green", "yellow", "gray", ...]
    must handle duplicate letters correctly
    """
    if len(answer) != len(guess):
        raise ValueError("answer and guess must be the same length")

    result = [""] * len(answer)
    answer_counts = Counter()

    for i, (a, g) in enumerate(zip(answer, guess)):
        if a == g:
            result[i] = "green"
        else:
            answer_counts[a] += 1

    for i, (a, g) in enumerate(zip(answer, guess)):
        if result[i] != "":
            continue
        if answer_counts[g] > 0:
            result[i] = "yellow"
            answer_counts[g] -= 1
        else:
            result[i] = "gray"

    return result

def update_hard_constraints(constraints: dict, guess: str, result: List[str]) -> dict:
    """
    Update the hard mode constraints based on the latest guess and its result.
    """
    # Defensive initialization: accept None or malformed structures
    if not isinstance(constraints, dict):
        constraints = {}

    length = len(guess)

    required_positions = list(constraints.get("required_positions") or [None] * length)
    if len(required_positions) < length:
        required_positions.extend([None] * (length - len(required_positions)))

    forbidden_positions = list(constraints.get("forbidden_positions") or [])
    if len(forbidden_positions) < length:
        forbidden_positions.extend([set() for _ in range(length - len(forbidden_positions))])
    # Ensure each slot is a set
    for i, s in enumerate(forbidden_positions):
        if not isinstance(s, set):
            forbidden_positions[i] = set(s or [])

    required_counts = dict(constraints.get("required_counts") or {})

    forbidden_letters = constraints.get("forbidden_letters") or set()
    if not isinstance(forbidden_letters, set):
        forbidden_letters = set(forbidden_letters)

    confirmed_counts = Counter()

    for g, r in zip(guess, result):
        if r in ("green", "yellow"):
            confirmed_counts[g] += 1

    for i, (g, r) in enumerate(zip(guess, result)):
        if r == "green":
            required_positions[i] = g
            required_counts[g] = max(required_counts.get(g, 0), confirmed_counts[g])
        elif r == "yellow":
            if len(forbidden_positions) <= i:
                forbidden_positions.append(set())
            forbidden_positions[i].add(g)
            required_counts[g] = max(required_counts.get(g, 0), confirmed_counts[g])
        elif r == "gray":
            if confirmed_counts[g] == 0:
                forbidden_letters.add(g)

    return {
        "required_positions": required_positions,
        "forbidden_positions": forbidden_positions,
        "required_counts": required_counts,
        "forbidden_letters": forbidden_letters,
    }