from typing import List, Literal, Optional, Set, Dict
from pydantic import BaseModel, Field

from app.config import (
    DEFAULT_MAX_ATTEMPTS,
    DEFAULT_WORD_LENGTH,
    MAX_MAX_ATTEMPTS,
    MAX_WORD_LENGTH,
    MIN_MAX_ATTEMPTS,
    MIN_WORD_LENGTH,
)

# The game's two mutually exclusive variants. Modelled as one field rather than
# a second boolean alongside hard_mode so that "you cannot play both at once" is
# true by construction instead of being a rule someone has to remember to check.
GameMode = Literal["normal", "rainbow"]


class HardModeConstraints(BaseModel):
    required_positions: List[Optional[str]] = Field(default_factory=list)  # greens
    forbidden_positions: List[Set[str]] = Field(default_factory=list)      # yellows
    required_counts: Dict[str, int] = Field(default_factory=dict)          # minimum occurrences
    forbidden_letters: Set[str] = Field(default_factory=set)              # letters proven absent

class CreateGameResponse(BaseModel):
    game_id: str
    word_length: int
    max_attempts: int
    mode: GameMode = "normal"
    hard_mode: bool = False
    hard_mode_constraints: HardModeConstraints
    # Deliberately no palette field: in rainbow mode the colour mapping is the
    # puzzle, so it is withheld until the game is over (see GuessResponse).

class CreateGameRequest(BaseModel):
    hard_mode: bool = False
    mode: GameMode = "normal"
    # Bounds only reject nonsense here; whether a length is actually playable
    # depends on an answer list existing, which the route checks.
    word_length: int = Field(
        default=DEFAULT_WORD_LENGTH, ge=MIN_WORD_LENGTH, le=MAX_WORD_LENGTH
    )
    max_attempts: int = Field(
        default=DEFAULT_MAX_ATTEMPTS, ge=MIN_MAX_ATTEMPTS, le=MAX_MAX_ATTEMPTS
    )

class UpdateGameRequest(BaseModel):
    hard_mode: bool

class UpdateGameResponse(BaseModel):
    hard_mode: bool
    hard_mode_constraints: HardModeConstraints

class GuessRequest(BaseModel):
    guess: str


class GuessResponse(BaseModel):
    valid: bool
    guess: Optional[str] = None
    # In normal mode these are "green"/"yellow"/"gray". In rainbow mode they are
    # the game's assigned colour names, with no way to tell which state each one
    # represents -- that is the mode's entire point.
    result: Optional[List[str]] = None
    attempt_number: Optional[int] = None
    game_status: Optional[str] = None
    message: Optional[str] = None
    answer: Optional[str] = None
    # Rainbow mode only, and only once the game has finished: the state -> colour
    # mapping, so the player can check how they did at reading the board.
    palette: Optional[Dict[str, str]] = None