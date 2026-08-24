import pytest
from fastapi import HTTPException
from app.palettes import RAINBOW_TRIOS
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


def test_create_game_with_hard_mode_stores_flag():
    service = GameService()
    game_id = service.create_game("cigar", hard_mode=True)

    assert games[game_id]["hard_mode"] is True


def test_hard_mode_rejects_non_compliant_guess():
    service = GameService()
    game_id = service.create_game("cigar", hard_mode=True)

    first_response = service.make_guess(game_id, "cider")
    assert first_response.valid is True

    second_response = service.make_guess(game_id, "cider")
    assert second_response.valid is False
    assert second_response.message == "Word is not allowed on hard mode"


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

# --- rainbow madness ---

def test_create_rainbow_game_assigns_a_palette():
    service = GameService()
    game_id = service.create_game("cigar", mode="rainbow")

    palette = games[game_id]["palette"]

    assert games[game_id]["mode"] == "rainbow"
    assert set(palette) == {"green", "yellow", "gray"}
    # a bijection onto one trio: three distinct colours, none of them the
    # normal-mode names the player would recognise
    assert len(set(palette.values())) == 3
    assert not set(palette.values()) & {"green", "yellow", "gray"}


def test_create_rainbow_game_uses_a_known_trio():
    service = GameService()
    game_id = service.create_game("cigar", mode="rainbow")

    colours = set(games[game_id]["palette"].values())

    assert any(colours == set(trio) for trio in RAINBOW_TRIOS)


def test_normal_game_has_no_palette():
    service = GameService()
    game_id = service.create_game("cigar")

    assert games[game_id]["mode"] == "normal"
    assert games[game_id]["palette"] is None


def test_rainbow_game_forces_hard_mode_off():
    service = GameService()
    game_id = service.create_game("cigar", hard_mode=True, mode="rainbow")

    assert games[game_id]["hard_mode"] is False


def test_rainbow_game_rejects_enabling_hard_mode():
    service = GameService()
    game_id = service.create_game("cigar", mode="rainbow")

    with pytest.raises(HTTPException) as exc_info:
        service.set_hard_mode(game_id, True)

    assert exc_info.value.status_code == 400
    assert games[game_id]["hard_mode"] is False


def test_rainbow_guess_returns_palette_colours_not_states():
    service = GameService()
    game_id = service.create_game("cigar", mode="rainbow")
    palette = games[game_id]["palette"]

    response = service.make_guess(game_id, "cider")

    # same shape as the normal-mode result, translated through the palette
    assert response.result == [
        palette["green"],
        palette["green"],
        palette["gray"],
        palette["gray"],
        palette["green"],
    ]
    assert not set(response.result) & {"green", "yellow", "gray"}


def test_rainbow_hides_palette_until_the_game_ends():
    service = GameService()
    game_id = service.create_game("cigar", mode="rainbow")

    ongoing = service.make_guess(game_id, "cider")
    assert ongoing.game_status == "in_progress"
    assert ongoing.palette is None

    finished = service.make_guess(game_id, "cigar")
    assert finished.game_status == "won"
    assert finished.palette == games[game_id]["palette"]


def test_rainbow_reveals_palette_on_a_loss_too():
    service = GameService()
    game_id = service.create_game("cigar", mode="rainbow")

    for _ in range(5):
        service.make_guess(game_id, "apple")
    response = service.make_guess(game_id, "apple")

    assert response.game_status == "lost"
    assert response.palette == games[game_id]["palette"]


def test_rainbow_stores_guesses_in_semantic_terms():
    service = GameService()
    game_id = service.create_game("cigar", mode="rainbow")

    service.make_guess(game_id, "cider")

    # the palette is a presentation concern; internal state stays semantic so
    # the scoring and constraint logic never has to know about rainbow mode
    assert games[game_id]["guesses"][0]["result"] == [
        "green", "green", "gray", "gray", "green",
    ]
