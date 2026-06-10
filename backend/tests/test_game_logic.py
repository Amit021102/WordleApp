import pytest
from app.game_logic import score_guess


def test_score_guess_all_green():
    assert score_guess("apple", "apple") == ["green"] * 5


def test_score_guess_green_and_gray():
    assert score_guess("abcde", "axcye") == ["green", "gray", "green", "gray", "green"]


def test_score_guess_yellow_and_gray_with_duplicates():
    assert score_guess("apple", "allee") == ["green", "yellow", "gray", "gray", "green"]


def test_score_guess_guess_too_short_raises():
    with pytest.raises(ValueError):
        score_guess("apple", "app")