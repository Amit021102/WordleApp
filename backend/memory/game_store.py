"""In-process game storage.

Keyed by the 8-character game id issued in ``GameService.create_game``. Imported
once via ``memory/__init__.py`` so every caller shares this one instance.

Not persistent: games are lost on restart and are not shared across worker
processes. Run uvicorn single-process, or replace this module with a real store.
"""

from typing import Any, Dict

games: Dict[str, Dict[str, Any]] = {}
