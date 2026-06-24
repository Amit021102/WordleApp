import uuid

from fastapi import HTTPException

from app.game_logic import score_guess, update_hard_constraints
from app.schemas import GuessResponse
from app.words import is_allowed_word, validate_hard_mode
from memory import games


class GameService:
    def _build_constraints(self, length: int) -> dict:
        return {
            "required_positions": [None] * length,
            "forbidden_positions": [set() for _ in range(length)],
            "required_counts": {},
            "forbidden_letters": set(),
        }

    def _ensure_constraints(self, game: dict) -> dict:
        length = len(game["answer"])
        constraints = game.get("hard_mode_constraints") or {}

        required_positions = list(constraints.get("required_positions") or [None] * length)
        if len(required_positions) < length:
            required_positions.extend([None] * (length - len(required_positions)))

        forbidden_positions = list(constraints.get("forbidden_positions") or [])
        if len(forbidden_positions) < length:
            forbidden_positions.extend([set() for _ in range(length - len(forbidden_positions))])
        for i, value in enumerate(forbidden_positions):
            if not isinstance(value, set):
                forbidden_positions[i] = set(value or [])

        required_counts = dict(constraints.get("required_counts") or {})

        forbidden_letters = constraints.get("forbidden_letters") or set()
        if not isinstance(forbidden_letters, set):
            forbidden_letters = set(forbidden_letters)

        game["hard_mode_constraints"] = {
            "required_positions": required_positions,
            "forbidden_positions": forbidden_positions,
            "required_counts": required_counts,
            "forbidden_letters": forbidden_letters,
        }

        return game["hard_mode_constraints"]

    def create_game(self, answer: str, hard_mode: bool = False) -> str:
        game_id = str(uuid.uuid4())[:8]
        length = len(answer)
        games[game_id] = {
            "answer": answer,
            "guesses": [],
            "status": "in_progress",
            "hard_mode": hard_mode,
            "hard_mode_constraints": self._build_constraints(length),
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

        self._ensure_constraints(game)

        if game["hard_mode"]:
            if not validate_hard_mode(guess, game["hard_mode_constraints"]):
                return GuessResponse(valid=False, message="Word is not allowed on hard mode")

        result = score_guess(answer=game["answer"], guess=guess)

        game["hard_mode_constraints"] = update_hard_constraints(game["hard_mode_constraints"], guess, result)

        game["guesses"].append({"guess": guess, "result": result})

        answer = "?????"

        if guess == game["answer"]:
            game["status"] = "won"
        elif len(game["guesses"]) >= 6:
            game["status"] = "lost"
            answer = game["answer"]

        return GuessResponse(
            valid=True,
            guess=guess,
            result=result,
            attempt_number=len(game["guesses"]),
            game_status=game["status"],
            answer=answer,
        )

    def set_hard_mode(self, game_id: str, hard_mode: bool):
        game = self.get_game(game_id)
        if game is None:
            raise HTTPException(status_code=404, detail="Game not found")

        game["hard_mode"] = hard_mode
        self._ensure_constraints(game)
        return game
