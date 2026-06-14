from typing import List, Optional
from pydantic import BaseModel


class CreateGameResponse(BaseModel):
    game_id: str
    word_length: int
    max_attempts: int

class GuessRequest(BaseModel):
    guess: str


class GuessResponse(BaseModel):
    valid: bool
    guess: Optional[str] = None
    result: Optional[List[str]] = None
    attempt_number: Optional[int] = None
    game_status: Optional[str] = None
    message: Optional[str] = None