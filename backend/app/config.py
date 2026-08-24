"""Game shape defaults and bounds.

Word length and attempt count are per-game values, not global constants: the
scoring, the hard-mode constraints and the word-list naming all derive length
from their input, so the only thing needed to support other shapes is to stop
hardcoding them at the edges. These are the defaults used when a request does
not ask for something specific.

The bounds exist to keep obviously silly requests out (a 200-letter word, zero
attempts). Whether a *particular* length is actually playable depends on having
an answer list for it -- see ``words.available_word_lengths``.
"""

DEFAULT_WORD_LENGTH = 5
DEFAULT_MAX_ATTEMPTS = 6

MIN_WORD_LENGTH = 2
MAX_WORD_LENGTH = 15

MIN_MAX_ATTEMPTS = 1
MAX_MAX_ATTEMPTS = 20
