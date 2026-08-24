import pytest

from app.config import DEFAULT_WORD_LENGTH
from app.words import available_word_lengths, is_allowed_word, random_select_answer


def test_available_word_lengths_includes_the_default():
    lengths = available_word_lengths()

    assert DEFAULT_WORD_LENGTH in lengths
    assert lengths == sorted(lengths)
    assert all(isinstance(length, int) for length in lengths)


def test_random_select_answer_returns_a_word_of_that_length():
    for length in available_word_lengths():
        answer = random_select_answer(length)

        assert len(answer) == length
        assert answer.isalpha()
        assert answer == answer.lower()


def test_random_select_answer_rejects_an_unavailable_length():
    missing = max(available_word_lengths()) + 50

    with pytest.raises(ValueError):
        random_select_answer(missing)


def test_answers_are_themselves_allowed_guesses():
    # an answer the player could never legally type would be unwinnable
    for length in available_word_lengths():
        answer = random_select_answer(length)

        assert is_allowed_word(answer)


def test_is_allowed_word_rejects_non_alphabetic_input():
    assert not is_allowed_word("ci9ar")
    assert not is_allowed_word("")
    assert not is_allowed_word(None)
