import pytest
from fastapi import HTTPException
from app.services.game_service import GameService
from memory import games


def setup_function():
    games.clear()


def test_create_game_stores_a_new_game():
    service = GameService()

    game_id = service.create_game("cigar")

    assert game_id in games
    assert games[game_id]["answer"] == "cigar"
    assert games[game_id]["guesses"] == []
    assert games[game_id]["status"] == "in_progress"


def test_create_game_returns_unique_ids():
    service = GameService()

    first_id = service.create_game("cigar")
    second_id = service.create_game("apple")

    assert first_id != second_id


def test_get_game_returns_existing_game():
    service = GameService()
    games["abc123"] = {
        "answer": "cigar",
        "guesses": [],
        "status": "in_progress",
    }

    game = service.get_game("abc123")

    assert game is not None
    assert game["answer"] == "cigar"
    assert game["status"] == "in_progress"


def test_get_game_returns_none_for_unknown_id():
    service = GameService()

    assert service.get_game("missing") is None

def test_make_guess_correct_guess_updates_game_state():
    service = GameService()
    game_id = service.create_game("cigar")

    response = service.make_guess(game_id, "cigar")

    assert response.valid is True
    assert response.guess == "cigar"
    assert response.result == ["green", "green", "green", "green", "green"]
    assert response.attempt_number == 1
    assert response.game_status == "won"

def test_make_guess_incorrect_guess_updates_game_state():
    service = GameService()
    game_id = service.create_game("cigar")

    response = service.make_guess(game_id, "cider")

    assert response.valid is True
    assert response.guess == "cider"
    assert response.result == ["green", "green", "gray", "gray", "green"]
    assert response.attempt_number == 1
    assert response.game_status == "in_progress"

def test_make_guess_invalid_guess_updates_game_state():
    service = GameService()
    game_id = service.create_game("cigar")

    response_invalid = service.make_guess(game_id, "aaaaa")

    assert response_invalid.valid is False
    assert response_invalid.message == "Word is not allowed"

    response_valid = service.make_guess(game_id, "cider")

    assert response_valid.valid is True
    assert response_valid.guess == "cider"
    assert response_valid.result == ["green", "green", "gray", "gray", "green"]
    assert response_valid.attempt_number == 1
    assert response_valid.game_status == "in_progress"  
    
def test_make_guess_fail_game():
    service = GameService()
    game_id = service.create_game("cigar")

    service.make_guess(game_id, "apple")
    service.make_guess(game_id, "apple")
    service.make_guess(game_id, "apple")
    service.make_guess(game_id, "apple")
    service.make_guess(game_id, "apple")
    response = service.make_guess(game_id, "ended")


    assert response.valid is True
    assert response.guess == "ended"
    assert response.result == ["gray", "gray", "gray", "gray", "gray"]
    assert response.attempt_number == 6
    assert response.game_status == "lost"

def test_make_guess_after_win_raises_finished_game_error():
    service = GameService()
    game_id = service.create_game("cigar")

    service.make_guess(game_id, "cigar")

    with pytest.raises(HTTPException) as exc_info:
        service.make_guess(game_id, "apple")

    assert exc_info.value.status_code == 400
    assert exc_info.value.detail == "Game already finished"

def test_make_guess_after_loss_raises_finished_game_error():
    service = GameService()
    game_id = service.create_game("cigar")

    for _ in range(6):
        service.make_guess(game_id, "apple")

    with pytest.raises(HTTPException) as exc_info:
        service.make_guess(game_id, "apple")

    assert exc_info.value.status_code == 400
    assert exc_info.value.detail == "Game already finished"