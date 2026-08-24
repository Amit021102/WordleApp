from fastapi import APIRouter, HTTPException

from app.schemas import (
    CreateGameRequest,
    CreateGameResponse,
    GuessRequest,
    GuessResponse,
    UpdateGameRequest,
    UpdateGameResponse,
)
from app.services.game_service import GameService
from app.words import available_word_lengths, random_select_answer

game_service = GameService()
router = APIRouter()

@router.get(
    "/api/health"
)
def health_check():
    return {"status": "ok"}

@router.post(
    "/api/games",
    response_model=CreateGameResponse
)
def create_game(request: CreateGameRequest):
    # The request's bounds are already checked by Pydantic; this checks whether
    # the length is actually playable, which depends on the data files present.
    playable_lengths = available_word_lengths()
    if request.word_length not in playable_lengths:
        raise HTTPException(
            status_code=400,
            detail=(
                f"No answer list for words of length {request.word_length}. "
                f"Available lengths: {playable_lengths}"
            ),
        )

    game_id = game_service.create_game(
        answer=random_select_answer(request.word_length),
        hard_mode=request.hard_mode,
        mode=request.mode,
        max_attempts=request.max_attempts,
    )
    game = game_service.get_game(game_id)

    # Every field is read back off the stored game rather than echoed from the
    # request: creating a rainbow game forces hard mode off, and the client
    # needs to be told the shape it actually got.
    return CreateGameResponse(
        game_id=game_id,
        word_length=game["word_length"],
        max_attempts=game["max_attempts"],
        mode=game["mode"],
        hard_mode=game["hard_mode"],
        hard_mode_constraints=game["hard_mode_constraints"],
    )

@router.post(
    "/api/games/{game_id}/guesses",
    response_model=GuessResponse
)
def make_guess(
    game_id: str,
    request: GuessRequest
):
    return game_service.make_guess(game_id, request.guess.lower())

@router.patch(
    "/api/games/{game_id}/hard_mode",
    response_model=UpdateGameResponse
)
def set_game_hard_mode(
    game_id: str,
    request: UpdateGameRequest
):
    game = game_service.set_hard_mode(game_id, request.hard_mode)
    return UpdateGameResponse(
        hard_mode=game["hard_mode"],
        hard_mode_constraints=game["hard_mode_constraints"],
    )