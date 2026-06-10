
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