from fastapi import APIRouter

from app.schemas import GuessRequest, GuessResponse
from app.services.game_service import GameService

game_service = GameService()
router = APIRouter()

@router.get(
    "/api/health"
)
def health_check():
    return {"status": "ok"}

@router.post(
    "/api/games/{game_id}/guesses",
    response_model=GuessResponse
)
def make_guess(
    game_id: str,
    request: GuessRequest
):
    return game_service.make_guess(game_id, request.guess)