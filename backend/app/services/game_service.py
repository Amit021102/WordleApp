import uuid

from fastapi import HTTPException

from app.game_logic import score_guess
from app.schemas import GuessResponse
from app.words import is_allowed_word
from memory import games


class GameService:
    def create_game(self, answer: str) -> str:
        game_id = str(uuid.uuid4())[:8]
        games[game_id] = {
            "answer": answer,
            "guesses": [],
            "status": "in_progress",
        }
        return game_id

    def get_game(self, game_id: str):
        return games.get(game_id)

    def make_guess(self, game_id: str, guess: str):
        game = games.get(game_id)

        if game is None:
            raise HTTPException(status_code=404, detail="Game not found")

        if game["status"] != "in_progress":
            raise HTTPException(status_code=400, detail="Game already finished")

        if not is_allowed_word(guess):
            return GuessResponse(valid=False, message="Word is not allowed")

        result = score_guess(answer=game["answer"], guess=guess)

        game["guesses"].append({"guess": guess, "result": result})

        if guess == game["answer"]:
            game["status"] = "won"
        elif len(game["guesses"]) >= 6:
            game["status"] = "lost"

        return GuessResponse(
            valid=True,
            guess=guess,
            result=result,
            attempt_number=len(game["guesses"]),
            game_status=game["status"],
        )
