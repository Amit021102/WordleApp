from typing import List, Optional, Set, Dict
from pydantic import BaseModel, Field


class HardModeConstraints(BaseModel):
    required_positions: List[Optional[str]] = Field(default_factory=list)  # greens
    forbidden_positions: List[Set[str]] = Field(default_factory=list)      # yellows
    required_counts: Dict[str, int] = Field(default_factory=dict)          # minimum occurrences
    forbidden_letters: Set[str] = Field(default_factory=set)              # letters proven absent

class CreateGameResponse(BaseModel):
    game_id: str
    word_length: int
    max_attempts: int
    hard_mode: bool = False
    hard_mode_constraints: HardModeConstraints

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
    result: Optional[List[str]] = None
    attempt_number: Optional[int] = None
    game_status: Optional[str] = None
    message: Optional[str] = None
    answer: Optional[str] = None