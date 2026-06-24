from pathlib import Path


BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
ANSWER_DIR = DATA_DIR / "answers"


def is_allowed_word(word: str) -> bool:
    """Return True if the word is alphabetic and exists in the allowed-word lists."""
    if not isinstance(word, str) or not word.isalpha():
        return False

    word = word.lower()
    length = len(word)

    specific_file = DATA_DIR / f"allowed_len_{length}.txt"
    if specific_file.exists():
        with specific_file.open("r", encoding="utf-8") as f:
            allowed_words = {line.strip().lower() for line in f if line.strip()}
        return word in allowed_words

    full_file = DATA_DIR / "allowed_words.txt"
    with full_file.open("r", encoding="utf-8") as f:
        allowed_words = {line.strip().lower() for line in f if line.strip()}

    return word in allowed_words

def validate_hard_mode(guess: str, constraints: dict) -> bool:
    """Validate a guess against hard mode constraints."""
    # Defensive initialization: accept None or malformed constraint containers
    if not isinstance(constraints, dict):
        constraints = {}

    length = len(guess)

    required_positions = list(constraints.get("required_positions") or [None] * length)
    if len(required_positions) < length:
        required_positions.extend([None] * (length - len(required_positions)))

    forbidden_positions = list(constraints.get("forbidden_positions") or [set() for _ in range(length)])
    if len(forbidden_positions) < length:
        forbidden_positions.extend([set() for _ in range(length - len(forbidden_positions))])
    # normalize to sets
    for i, s in enumerate(forbidden_positions):
        if not isinstance(s, set):
            forbidden_positions[i] = set(s or [])

    required_counts = dict(constraints.get("required_counts") or {})

    forbidden_letters = constraints.get("forbidden_letters") or set()
    if not isinstance(forbidden_letters, set):
        forbidden_letters = set(forbidden_letters)

    # Check required positions (greens)
    for i, letter in enumerate(required_positions):
        if letter is not None and guess[i] != letter:
            return False

    # Check forbidden positions (yellows)
    for i, forbidden_set in enumerate(forbidden_positions):
        if guess[i] in forbidden_set:
            return False

    # Check required counts
    for letter, count in required_counts.items():
        if guess.count(letter) < count:
            return False

    # Check forbidden letters
    if any(letter in forbidden_letters for letter in guess):
        return False

    return True

def random_select_answer(length: int = 5) -> str:
    """Randomly select a word from the answer-word list."""
    import random

    answer_file = ANSWER_DIR / f"answers_len_{length}.txt"
    with answer_file.open("r", encoding="utf-8") as f:
        answer_words = [line.strip().lower() for line in f if line.strip()]

    return random.choice(answer_words)