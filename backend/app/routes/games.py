from fastapi import APIRouter

from app.schemas import GuessRequest, GuessResponse, CreateGameResponse
from app.services.game_service import GameService

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
def create_game():
    game_id = game_service.create_game(answer="crane")

    return CreateGameResponse(
        game_id=game_id,
        word_length=5,
        max_attempts=6,
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