from fastapi import APIRouter

from app.schemas import (
    CreateGameRequest,
    CreateGameResponse,
    GuessRequest,
    GuessResponse,
    UpdateGameRequest,
    UpdateGameResponse,
)
from app.services.game_service import GameService
from app.words import random_select_answer

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
    game_id = game_service.create_game(
        answer=random_select_answer(),
        hard_mode=request.hard_mode,
        mode=request.mode,
    )
    game = game_service.get_game(game_id)

    # hard_mode is read back off the game rather than echoed from the request:
    # creating a rainbow game forces it off, and the client needs to see that.
    return CreateGameResponse(
        game_id=game_id,
        word_length=5,
        max_attempts=6,
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