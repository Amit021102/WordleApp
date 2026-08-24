"""Colour palettes for Rainbow Madness mode.

In this mode the player is not told what the tile colours mean. The server picks
a trio of colours per game and assigns them to the three underlying states, and
only ever sends the *assigned colour* to the client -- never the state it stands
for. Decoding the mapping is the puzzle.

Colours are shipped as names, not hex values: the frontend owns the actual
values in ``App.css`` (``.tile-violet``, ``.tile-rust``, ...) the same way it
owns the normal green/yellow/gray tiles. Trios are hand-picked so the three
colours sit together comfortably and stay distinguishable from each other --
colour is the only information channel in this mode, so a hard-to-read trio is
not a cosmetic problem but a broken game.

None of these overlap with the normal mode's green/yellow/gray, so a player can
never mistake a rainbow board for a regular one.
"""

import random
from typing import Dict, List

# Each trio is three mutually distinct, tonally compatible colours. They differ
# in lightness as well as hue so they remain separable for colour-blind players.
RAINBOW_TRIOS: List[List[str]] = [
    ["violet", "blush", "sky"],
    ["rust", "grape", "teal"],
    ["magenta", "indigo", "copper"],
]

# The states score_guess produces, in a fixed order so the assignment below is
# a straightforward zip.
GUESS_STATES = ("green", "yellow", "gray")


def assign_rainbow_palette() -> Dict[str, str]:
    """Pick a random trio and map its colours onto the three guess states.

    Returns a dict such as ``{"green": "grape", "yellow": "teal", "gray": "rust"}``.

    Both choices are random: which trio is used, and which colour within it
    stands for which state. The trio is visible to the player from the first
    guess, so the actual secret is the permutation -- one of six.

    This is the only place the mapping is created. It is stored on the game and
    must not be sent to the client before the game ends.
    """
    trio = random.choice(RAINBOW_TRIOS)
    shuffled = random.sample(trio, len(trio))

    return dict(zip(GUESS_STATES, shuffled))


def to_display_colours(result: List[str], palette: Dict[str, str]) -> List[str]:
    """Translate a semantic ``score_guess`` result into palette colours.

    ``["green", "gray", ...]`` -> ``["grape", "rust", ...]``. Applied on the way
    out of the service so the scoring and hard-mode logic keep working in
    semantic terms and never learn that rainbow mode exists.
    """
    return [palette[status] for status in result]
