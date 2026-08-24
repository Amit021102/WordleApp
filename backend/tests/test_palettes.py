import pytest

from app.palettes import (
    GUESS_STATES,
    RAINBOW_TRIOS,
    assign_rainbow_palette,
    to_display_colours,
)

NORMAL_COLOURS = {"green", "yellow", "gray"}


def test_trios_are_well_formed():
    assert RAINBOW_TRIOS, "at least one trio must be defined"

    for trio in RAINBOW_TRIOS:
        assert len(trio) == 3
        assert len(set(trio)) == 3, f"colours must be distinct within {trio}"


def test_trios_never_reuse_the_normal_mode_colours():
    # a rainbow board must never be mistakeable for a regular one
    for trio in RAINBOW_TRIOS:
        assert not set(trio) & NORMAL_COLOURS


def test_colour_names_are_unique_across_trios():
    # every name maps to exactly one CSS class in the frontend
    all_colours = [colour for trio in RAINBOW_TRIOS for colour in trio]

    assert len(all_colours) == len(set(all_colours))


def test_assign_rainbow_palette_covers_every_state_exactly_once():
    for _ in range(50):
        palette = assign_rainbow_palette()

        assert set(palette) == set(GUESS_STATES)
        assert len(set(palette.values())) == 3


def test_assign_rainbow_palette_draws_from_a_single_trio():
    for _ in range(50):
        colours = set(assign_rainbow_palette().values())

        assert any(colours == set(trio) for trio in RAINBOW_TRIOS)


def test_assign_rainbow_palette_varies_the_permutation():
    # the secret is which colour means what, so the assignment must not be fixed
    seen = {tuple(assign_rainbow_palette().items()) for _ in range(200)}

    assert len(seen) > 1


def test_to_display_colours_translates_every_position():
    palette = {"green": "violet", "yellow": "blush", "gray": "sky"}

    result = to_display_colours(["green", "gray", "yellow", "gray", "green"], palette)

    assert result == ["violet", "sky", "blush", "sky", "violet"]


def test_to_display_colours_preserves_length_and_leaks_no_states():
    palette = assign_rainbow_palette()
    states = ["green", "yellow", "gray", "green", "gray"]

    result = to_display_colours(states, palette)

    assert len(result) == len(states)
    assert not set(result) & NORMAL_COLOURS


def test_to_display_colours_rejects_an_unknown_state():
    palette = {"green": "violet", "yellow": "blush", "gray": "sky"}

    with pytest.raises(KeyError):
        to_display_colours(["chartreuse"], palette)
