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

def random_select_answer(length: int = 5) -> str:
    """Randomly select a word from the answer-word list."""
    import random

    answer_file = ANSWER_DIR / f"answers_len_{length}.txt"
    with answer_file.open("r", encoding="utf-8") as f:
        answer_words = [line.strip().lower() for line in f if line.strip()]

    return random.choice(answer_words)