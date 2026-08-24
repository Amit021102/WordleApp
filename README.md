# Infinite Wordle

A self-hosted Wordle clone with a FastAPI backend and a React frontend. Unlike the original
puzzle, there is no daily word and no waiting: every "New game" pulls a fresh random answer, so
you can play as many rounds as you like.

Beyond the standard game it ships two variants — **hard mode**, which forces every guess to reuse
the hints you have already been given, and **rainbow madness**, which scores your guesses in three
colours and refuses to tell you what any of them mean.

The project is deliberately split into a **backend that owns the game rules** and a
**presentation-only frontend**. The browser is never sent anything that would spoil the puzzle.

---

## What you can play

- Six attempts to guess a five-letter word.
- Tiles are scored `green` (right letter, right place), `yellow` (right letter, wrong place) and
  `gray` (letter not in the word), with correct duplicate-letter handling.
- The on-screen keyboard accumulates the best status seen for each letter.
- **Hard mode** — every guess must reuse all revealed hints: greens stay in place, yellows must
  appear somewhere (but not in a position already proven wrong), letter minimum counts are
  respected, and letters proven absent are banned. Can be toggled mid-game.
- **Rainbow madness** — the same word game, but the three tile states are drawn in colours picked
  fresh per game and you are never told which colour means what. Working that out is the added
  puzzle. See [Game modes](#game-modes).
- Light/dark theme, help and settings modals, a result modal, toast notices, and an
  invalid-guess shake animation.

Hard mode and rainbow madness are **mutually exclusive** — rainbow madness is a different game,
not a setting layered on the normal one.

---

## Contents

- [Running the project](#running-the-project)
- [Architecture](#architecture)
- [Repository layout](#repository-layout)
- [Game shape](#game-shape)
- [Game modes](#game-modes)
- [Backend design](#backend-design)
- [Frontend design](#frontend-design)
- [The word lists](#the-word-lists)
- [API reference](#api-reference)
- [Tests](#tests)
- [Known gaps](#known-gaps)

---

## Running the project

Two processes, so two terminals. Requires Python 3.8+ and Node 18+.

### Terminal 1 — backend

```bash
cd backend
python3 -m venv .venv            # first time only
source .venv/bin/activate
pip install -r requirements.txt  # first time only
uvicorn app.main:app --reload --port 8000
```

Run uvicorn from `backend/`, not from the repo root — imports are absolute (`from app.routes…`,
`from memory import games`) and resolve against that directory.

### Terminal 2 — frontend

```bash
cd frontend
npm install                      # first time only
npm run dev
```

Then open **http://localhost:5173**.

Other frontend scripts: `npm run build`, `npm run preview`.

### Pointing the two halves at each other

Both ends default to localhost and can be overridden by environment variables. See
`frontend/.env.example` and `backend/.env.example`.

| Side | Variable | Default |
|---|---|---|
| Frontend | `VITE_API_BASE_URL` | `http://127.0.0.1:8000` |
| Backend | `WORDLE_CORS_ORIGINS` (comma-separated) | `http://localhost:5173,http://127.0.0.1:5173` |

They have to agree in both directions: the frontend must point at where uvicorn listens, and the
frontend's own origin must appear in the backend's allowed origins, or the browser blocks the
request. To change them:

```bash
# frontend — Vite only exposes VITE_-prefixed variables
cp frontend/.env.example frontend/.env     # then edit

# backend — a plain process variable; the app does not read .env itself
WORDLE_CORS_ORIGINS="http://localhost:4173" uvicorn app.main:app --port 8000
```

Vite **inlines** `VITE_API_BASE_URL` at build time, so a deployed bundle needs the variable set
when `npm run build` runs, not when it is served.

### Notes on `--reload`

Games live in memory (see [State](#state-an-in-memory-dict-on-purpose)), so **saving a backend
file restarts uvicorn and wipes every in-flight game**. The open board in your browser is then
attached to a `game_id` the server no longer knows, and the next guess returns `404`. The UI shows
a "Connection problem — try again" toast; press *New game* to recover. Drop `--reload` if you want
a game to survive your editing.

### Finding the modes

Both variants live behind the ⚙ settings icon. Turning rainbow madness on immediately starts a new
game — the colour mapping is drawn when a game is created, so a board already in progress cannot
be converted. The header changes to "Rainbow Madness", the keyboard stops colouring, and the hard
mode switch is disabled. The `?` icon shows mode-appropriate instructions.

---

## Architecture

```
   Browser (React + Vite, :5173)              FastAPI (uvicorn, :8000)
  ┌────────────────────────────┐             ┌──────────────────────────────┐
  │  App.jsx                   │             │  routes/games.py             │
  │   board / keyboard state   │             │   HTTP shape, Pydantic I/O   │
  │   modal + toast state      │             ├──────────────────────────────┤
  │            │               │  fetch      │  services/game_service.py    │
  │  api/gameApi.js  ──────────┼────────────►│   lifecycle, validation,     │
  │   the only fetch() calls   │  JSON       │   palette translation        │
  └────────────────────────────┘             ├──────────┬─────────┬─────────┤
                                             │game_logic│ words.py│palettes │
                                             │pure rules│  dict   │ colours │
                                             ├──────────┴─────────┴─────────┤
                                             │  memory/game_store.py (dict) │
                                             └──────────────────────────────┘
```

**Why the backend owns the rules.** The answer, the scoring, the hard-mode validation and the
rainbow colour mapping all live server-side. The frontend receives only a colour array per guess,
and the answer string only once the game is lost. A player who opens devtools sees nothing that
spoils the puzzle. This also means the game rules have a single implementation with real unit
tests, rather than being duplicated in JS for the UI.

**Why the client is a dumb renderer.** `App.jsx` holds board contents, cursor position and modal
state — none of which the server needs to know — and delegates every decision that could be
cheated on. That split keeps the client free of rule logic while still feeling instant: typing and
erasing are local, only `Enter` costs a round trip.

---

## Repository layout

```
WordleApp/
├── backend/
│   ├── app/
│   │   ├── main.py                    # FastAPI app + CORS, mounts the router
│   │   ├── routes/games.py            # HTTP endpoints, request/response mapping
│   │   ├── services/game_service.py   # game lifecycle: create, guess, mode handling
│   │   ├── game_logic.py              # pure functions: scoring, constraint derivation
│   │   ├── words.py                   # dictionary lookups, hard-mode validation, random answer
│   │   ├── palettes.py                # rainbow madness: colour trios + secret assignment
│   │   ├── config.py                  # game-shape defaults and bounds
│   │   └── schemas.py                 # Pydantic request/response models
│   ├── memory/game_store.py           # in-process dict of games
│   ├── data/                          # word lists (see below)
│   ├── tests/                         # pytest suites: logic, palettes, service
│   └── requirements.txt
└── frontend/
    ├── index.html                     # Vite entry
    └── src/
        ├── main.jsx                   # React root
        ├── App.jsx                    # all game state + orchestration
        ├── App.css                    # themed via CSS custom properties
        ├── api/gameApi.js             # the only module that talks HTTP
        ├── components/                # Board, Row, Tile, Keyboard, Switch, IconBtns
        │   └── popups/                # Modal + Settings/Help/GameResult/Toast
        └── App.test.jsx               # Vitest + Testing Library
```

---

## Game shape

Word length and attempt count are **per-game values**, not global constants. `POST /api/games`
accepts `word_length` and `max_attempts`, both stored on the game and reported back in the
response; nothing downstream carries a hardcoded 5 or 6.

Almost none of the code needed changing for this, because the rules were already generic:
`score_guess` derives length from its arguments, the hard-mode constraint functions size
themselves from the guess, and the word lists are named `_len_<N>`. What existed were four
literals at the edges — `word_length: 5` and `max_attempts: 6` in the route, `>= 6` in
`GameService.make_guess`, and `BOARD_ROWS`/`BOARD_COLS` in `App.jsx` — plus one easy-to-miss one:
the masked answer was the string `"?????"`, which is now `"?" * len(answer)`.

Defaults and bounds live in `app/config.py`. Validation happens in two stages, because there are
two different kinds of wrong:

- **Pydantic bounds** (`MIN_WORD_LENGTH`…`MAX_WORD_LENGTH`) reject nonsense like a 99-letter word
  with a `422`.
- **`words.available_word_lengths()`** reports which lengths have an answer list, and the route
  returns a `400` naming the playable ones. A length can be perfectly reasonable and still
  unplayable because the data isn't there.

The frontend takes the shape from the create-game response and then treats **the board itself as
the source of truth** — `board.length` is the attempt count and a row's length is the word length
— so `addLetter`, `eraseLetter` and the guess-length check read from the data rather than from
constants. `Board` passes the width to CSS as `--word-length`, and `.row` uses
`repeat(var(--word-length, 5), var(--tile-size))`, so the grid follows automatically.

Adding another length is therefore a data task, not a code task: drop an `answers_len_<N>.txt`
into `data/answers/` (optionally an `allowed_len_<N>.txt` for speed) and that length becomes
playable. Only length 5 ships with the project.

---

## Game modes

A game is either `normal` or `rainbow`. This is stored as a **single `mode` field**, not as a
second boolean next to `hard_mode`, so "you cannot play both variants at once" is true by
construction rather than being a rule scattered across call sites. Hard mode remains a *setting on
a normal game*; rainbow madness is a different game.

Mutual exclusion is enforced in two places, both server-side:

- `create_game` forces `hard_mode = False` when `mode == "rainbow"`, and the route echoes the
  stored value back rather than the requested one, so a client that asks for both is told plainly
  which one it got.
- `PATCH /hard_mode` returns `400` on a rainbow game. The frontend also disables the switch, but
  the API does not rely on that.

### Rainbow madness

Same five-letter word, same six attempts. The difference is that the three tile states are
rendered in colours drawn per-game, and **the player is never told which colour means what**.
Decoding the mapping is the added puzzle.

`app/palettes.py` holds hand-picked *trios* rather than a flat colour pool. Random colours would
regularly produce clashing or near-identical combinations, and in this mode colour is the only
information channel — an unreadable trio isn't a cosmetic issue, it's a broken game. Each trio is
tonally compatible, internally distinct, varied in lightness as well as hue (so the board stays
readable without full colour vision), and contains none of green/yellow/gray, so a rainbow board
can never be mistaken for a normal one.

Two things are randomised per game: which trio is used, and which colour within it maps to which
state. The trio itself is obvious from the first guess, so the real secret is the permutation —
one of six.

**Where the translation happens.** `score_guess` and the hard-mode constraint functions keep
working in `green`/`yellow`/`gray` and know nothing about rainbow mode. `GameService.make_guess`
translates through the palette *only when building the response*:

```python
game["guesses"].append({"guess": guess, "result": result})   # stored semantically
display_result = to_display_colours(result, palette) if palette else result
```

So internal state and the rules layer stay semantic and testable, and the disguise is a
presentation concern applied at the boundary. Crucially the response carries the colours *instead
of* the states, never alongside them — shipping `["green", ...]` plus a mapping would put the
answer one devtools glance away. The palette is withheld from `POST /api/games` entirely and
returned only once `game_status` leaves `in_progress`, on a win or a loss, as the payoff.

**Why the keyboard goes uncoloured.** In normal mode the on-screen keyboard upgrades each letter
using `STATUS_PRIORITY` (`gray < yellow < green`). That ranking is public knowledge, so if the
keyboard were coloured in rainbow mode, watching a key upgrade from one colour to another would
reveal their order — and the order *is* the mapping. A few upgrades would decode the palette for
free. The keyboard therefore stays blank in rainbow mode, which also puts the difficulty where it
belongs: reading the board.

---

## Backend design

### Layers, each with one job

| Layer | File | Responsibility | Depends on |
|---|---|---|---|
| Transport | `routes/games.py` | URL shape, status codes, Pydantic models | service |
| Orchestration | `services/game_service.py` | Game lifecycle and state transitions | logic, words, palettes, store |
| Rules | `game_logic.py` | Pure scoring + constraint derivation | nothing |
| Presentation | `palettes.py` | Rainbow colour trios and translation | nothing |
| Config | `config.py` | Game-shape defaults and bounds | nothing |
| Data | `words.py`, `memory/` | Dictionary access, game persistence | filesystem |

The point of the split is testability. `game_logic.py` imports nothing but `collections` and
`typing` — `score_guess` and `update_hard_constraints` are pure functions that can be tested
exhaustively without spinning up an app or a store. `GameService` is tested by calling it directly
(`tests/test_game_service.py`), never through HTTP, because the routes contain no logic worth
testing separately: they map a request model to a service call and a service result to a response
model.

### Scoring, and why it is two passes

`score_guess` cannot decide a tile's colour in a single left-to-right sweep, because a duplicate
letter later in the guess may deserve green while an earlier copy deserves gray. The
implementation therefore does:

1. **Pass one** — mark every exact positional match green, and count the answer's letters that
   were *not* consumed by a green.
2. **Pass two** — walk the unresolved positions, handing out yellow only while the remaining
   count for that letter is positive, gray otherwise.

This is what makes `score_guess("apple", "allee") == [green, yellow, gray, gray, green]` come out
right: the second `l` has no unmatched `l` left to claim.

### Hard mode as an accumulated constraint object

Rather than re-deriving hard-mode rules from the full guess history on every submission, the game
carries a `hard_mode_constraints` object that is folded forward after each scored guess:

```python
{
  "required_positions": [None, "i", None, None, None],  # greens, by index
  "forbidden_positions": [set(), set(), {"g"}, ...],    # yellows: letter seen here, wrong spot
  "required_counts":     {"i": 1, "g": 1},              # minimum occurrences
  "forbidden_letters":   {"a", "e"},                    # proven absent
}
```

`update_hard_constraints` (in `game_logic.py`) produces it; `validate_hard_mode` (in `words.py`)
checks a candidate guess against it. Splitting *derive* from *enforce* means hard mode can be
switched on mid-game: constraints are accumulated on **every** guess regardless of the current
mode, so flipping the toggle immediately starts enforcing everything already revealed instead of
starting from a blank slate.

`required_counts` is tracked separately from the green/yellow position maps because minimum-count
is a distinct rule: guessing `SPEED` and getting one yellow `E` proves the answer has *at least*
one `E`, which no positional map can express.

All three constraint-touching functions begin with a defensive normalisation block (coercing
`None`, lists-instead-of-sets, and short arrays). That is the cost of storing constraints as a
plain dict rather than a class — the shape is not enforced by the type system, so each consumer
re-establishes it. `GameService._ensure_constraints` does the same for games already in the store.

### State: an in-memory dict, on purpose

`memory/game_store.py` is a module-level `games` dict keyed by an 8-character UUID prefix.
It is imported once (`memory/__init__.py` re-exports it), so every caller shares one instance.

This is the right size for the project — no schema, no migrations, no database to run before you
can play — and the tradeoffs are explicit:

- **Games do not survive a server restart.** A reload during development drops every in-flight
  game; the frontend will get a 404 on its next guess.
- **It does not survive multiple worker processes.** Run uvicorn single-process, or games will
  land in whichever worker's dict.
- **Nothing is ever evicted**, so a long-running server leaks finished games.

Because the store is a single import boundary, swapping it for Redis or SQLite means rewriting
`game_store.py` and nothing else — `GameService` only does `games[id]`, `games.get(id)`.

---

## Frontend design

### One stateful component, many presentational ones

`App.jsx` is the only component with state. Everything under `components/` is a pure function of
its props — `Board` maps rows, `Row` maps tiles, `Tile` maps a status to a CSS class. There is no
context, no reducer and no state library, because the state that actually exists is small and
entirely co-located with the one component that mutates it:

| State | Purpose |
|---|---|
| `board` | 6×5 array of `{value, status}` — the single source of truth for what's on screen |
| `activeRowIndex` | Which row the cursor is on |
| `gameId`, `mode`, `hardMode`, `gameOver`, `correctWord` | Mirrors of server-owned facts |
| `revealedPalette` | Rainbow mapping, `null` until the game ends |
| `keyStatuses` | Best-known colour per keyboard letter (unused in rainbow mode) |
| `activeModal`, `toast`, `theme`, `shakingRowIndex` | Pure UI |

`activeModal` is a single string (`"help" | "settings" | "won" | "lost" | null`) rather than four
booleans, which makes "only one modal at a time" true by construction.

### Keyboard status uses a priority ladder

A letter can be scored differently across guesses. `STATUS_PRIORITY = {gray: 1, yellow: 2,
green: 3}` ensures the keyboard only ever upgrades a key's colour — once a letter is green it
cannot be knocked back to yellow by a later guess. It is skipped entirely in rainbow mode, for the
reason given under [Game modes](#rainbow-madness).

### Physical and virtual keyboards share one path

`handleKeyPress` accepts both `"Enter"`/`"Backspace"` (from the `keydown` listener) and
`"ENTER"`/`"BACKSPACE"` (from the on-screen `Keyboard` buttons), so both input methods run
identical code. Letters are gated through `/^[A-Za-z]$/`, which silently ignores everything else.

The `window` listener cancels the browser default **only for keys the game consumes**
(`isConsumedKey`), and bails out entirely when Ctrl/Cmd/Alt is held. Cancelling every keydown
would be simpler but would disable Ctrl+R, F5, Ctrl+F and Tab while the page has focus — and Tab
is how a keyboard-only player reaches the help and settings buttons. Space is cancelled despite
not being a game key, because it would otherwise scroll the page.

### The API module is the only place `fetch` appears

`api/gameApi.js` exports `createGame`, `submitGuess` and `updateHardMode`. Components never touch
the network directly. That keeps the base URL in one place and gives every call a uniform
error contract (throw on non-2xx), so `App.jsx` handles failures rather than status codes. Each
caller wraps its request in a `try/catch` that surfaces a toast, so a dead backend or a stale
`game_id` produces a visible message instead of a board that silently stops responding.

### Rainbow mode needed almost no frontend change

Worth noting as evidence the component split was right: `Tile` already rendered
`` `tile-${status}` ``, so a status of `"grape"` picks up `.tile-grape` with no code change at all.
The client never had an opinion about what the statuses meant, which is exactly what let the
server start lying about them. The real changes were three: skip `updateKeyStatuses` in rainbow
mode, add a CSS class per colour name, and give `HelpModal` a rainbow variant — the normal
instructions would otherwise hand the player the answer.

Colour names (not hex values) cross the wire, so the actual values stay in `App.css` alongside the
normal tiles rather than being split between two languages. `mode-${mode}` on the root div is a
styling hook for anything that should look different per variant.

### Theming through CSS custom properties

`App.css` defines `.theme-dark` and `.theme-light` blocks of the same custom-property names
(`--tile-green-background`, `--key-gray-background`, …), and `App.jsx` puts `theme-${theme}` on the
root div. Switching themes re-resolves variables; no component knows a colour value or re-renders
because of the change.

The rainbow classes are deliberately *not* theme variables: they are defined once, since each trio
is chosen to hold up against both backgrounds.

### Component decomposition

`Board → Row → Tile` is split three ways rather than being one nested map so that the shake
animation has somewhere to live (`Row` owns `isShaking`) and so `Tile` can be reused standalone —
in `HelpModal` for the colour examples, and in `GameResultModal` for the rainbow mapping reveal.

`popups/Modal.jsx` is a shell — backdrop, click-outside-to-close, close button, `role="dialog"` —
and Settings/Help/GameResult supply only their contents. `Switch` is shared between the theme,
hard-mode and rainbow toggles, with `isThemeSwitch` selecting the styling variant and `disabled`
locking hard mode out during a rainbow game.

---

## The word lists

Two vocabularies, which is what the real game does:

- **`data/allowed_words.txt`** (~370k words) — everything a guess may be. Large, so guesses are
  never rejected for being obscure.
- **`data/answers/answers_len_5.txt`** (~2.2k words) — the much smaller pool answers are drawn
  from. Common words only, and plurals were stripped (`9cb5f93`) so the answer is never a
  cheap `-S`.

**`data/allowed_len_5.txt`** is a precomputed length filter of the big list, generated by
`data/word_len_extractor_script.py`:

```bash
python3 backend/data/word_len_extractor_script.py 5
```

`is_allowed_word` prefers `allowed_len_<N>.txt` when it exists and falls back to scanning the full
list otherwise — a 16k-line read instead of a 370k-line one on every guess. Note that the file is
re-read and re-parsed into a set on each call rather than being cached at import; correct, but the
obvious place to optimise if guess latency ever matters.

The naming convention (`allowed_len_<N>.txt`, `answers_len_<N>.txt`) is what makes other word
lengths a data task rather than a code change — see [Game shape](#game-shape).
`available_word_lengths()` discovers playable lengths by globbing the answers directory, so
nothing needs updating when a file is added.

---

## API reference

Base URL: `http://127.0.0.1:8000`. Interactive docs at `http://127.0.0.1:8000/docs`.

### `GET /api/health`
```json
{ "status": "ok" }
```

### `POST /api/games`
Creates a game with a random answer.

```jsonc
// request — every field optional
{
  "hard_mode": false,
  "mode": "normal",        // "normal" | "rainbow"
  "word_length": 5,        // needs a matching data/answers/answers_len_<N>.txt
  "max_attempts": 6
}

// response
{
  "game_id": "a72d4c1b",
  "word_length": 5,
  "max_attempts": 6,
  "mode": "normal",
  "hard_mode": false,
  "hard_mode_constraints": { "required_positions": [], "forbidden_positions": [],
                             "required_counts": {}, "forbidden_letters": [] }
}
```

Every field in the response is read back off the created game, not echoed from the request, so it
always describes what you actually got. Requesting `{"mode": "rainbow", "hard_mode": true}`
succeeds but returns `"hard_mode": false` — the variants are mutually exclusive. There is
deliberately **no palette field here**: in rainbow mode the mapping is the puzzle.

Errors: `422` if `word_length` or `max_attempts` falls outside the bounds in `app/config.py`;
`400` if the length is in range but has no answer list, with the playable lengths in the message
(`"No answer list for words of length 6. Available lengths: [5]"`).

### `POST /api/games/{game_id}/guesses`

```jsonc
// request
{ "guess": "cigar" }

// response — accepted guess
{
  "valid": true,
  "guess": "cigar",
  "result": ["green", "green", "green", "green", "green"],
  "attempt_number": 1,
  "game_status": "in_progress" | "won" | "lost",
  "answer": "?????",       // masked until the game is lost
  "palette": null          // rainbow mode only, and only once the game is over
}

// response — a rainbow game, at the moment it ends
{
  "valid": true,
  "guess": "cigar",
  "result": ["teal", "teal", "teal", "teal", "teal"],   // colours, never states
  "attempt_number": 1,
  "game_status": "won",
  "answer": "?????",
  "palette": { "green": "teal", "yellow": "rust", "gray": "grape" }
}

// response — rejected guess (still HTTP 200)
{ "valid": false, "message": "Word is not allowed" }
```

A rejected guess returns `200` with `valid: false` rather than a `4xx`, because "not in the
dictionary" is a normal move in the game, not a protocol error — it must not consume an attempt or
trigger the client's error path. Genuine errors do raise: `404` for an unknown `game_id`, `400` for
guessing into a finished game.

`answer` is `"?????"` while the game is playable or won, and the real word only when
`game_status == "lost"`. `palette` is `null` for every normal game and for every rainbow guess
that leaves the game `in_progress`; it is populated on both a win and a loss.

### `PATCH /api/games/{game_id}/hard_mode`

```jsonc
// request
{ "hard_mode": true }

// response
{ "hard_mode": true, "hard_mode_constraints": { ... } }
```

Returns `400 "Hard mode is not available in rainbow madness"` on a rainbow game.

---

## Tests

```bash
cd backend && pytest              # 44 tests: scoring, palettes, words, service behaviour
cd frontend && npm test           # 12 tests: Vitest + Testing Library, jsdom
```

`tests/test_game_logic.py` covers scoring, including the duplicate-letter cases and the
length-mismatch `ValueError`. `tests/test_game_service.py` covers the lifecycle: id uniqueness,
win/loss transitions, rejection of invalid and hard-mode-violating guesses, and the `400` on
guessing into a finished game. It calls `games.clear()` in `setup_function` — necessary because
the store is module-global and would otherwise leak state between tests.

`tests/test_palettes.py` covers the pure palette functions: trios are well-formed and never reuse
the normal colours, names are unique across trios (each maps to one CSS class), and the assignment
is a bijection onto a single trio whose permutation actually varies. The rainbow cases in
`test_game_service.py` cover the secrecy properties that matter — a guess response contains
palette colours and *no* semantic state, the mapping stays `null` until the game ends and appears
on both a win and a loss, stored history stays semantic, and rainbow games refuse hard mode.

`tests/test_words.py` covers the dictionary layer: which lengths are playable, that a selected
answer has the requested length, that an unavailable length raises, and — the one that would
really hurt — that every answer is itself an allowed guess, since an answer the player cannot
legally type would be an unwinnable game.

Frontend tests cover typing (fill left-to-right, backspace, retype, overflow), the board being
built from the server's `word_length`/`max_attempts`, and the rainbow keyboard rule.

They **mock `api/gameApi`** rather than letting the mount `fetch` fail. That is not just tidiness:
`App` calls `createGame` on mount, so with a real fetch the tests passed only while nothing was
listening on the API port, and broke as soon as a dev server was running on the same machine —
the resolved call reset the board mid-typing. Mocking also makes the rainbow test possible at all,
since it needs a scripted guess response.

The rainbow test is the interesting one: it asserts the board picks up palette classes while
**every keyboard key carries only layout classes**, which pins the "no key colouring" rule down.
Its normal-mode counterpart asserts a key *does* get `key-green`, so the rainbow assertion cannot
pass just because key colouring broke everywhere.

---

## Known gaps

Honest list of what is unfinished or deliberately deferred.

**Data**

- **Only length 5 ships with answers.** The code is length-generic (see
  [Game shape](#game-shape)) and other lengths work as soon as an `answers_len_<N>.txt` exists,
  but the project only includes one, so `word_length` other than 5 returns a `400` out of the box.
- **The word list is re-read and re-parsed on every guess** rather than cached at import.
  Correct, but the obvious thing to optimise if guess latency ever matters.

**Frontend**

- **The keydown listener has no dependency array**, so it is removed and re-added on every render.
  This is deliberate and load-bearing: the handler closes over `activeRowIndex`, so an empty array
  would freeze it at `0` and send every guess after the first into row one. Re-subscribing avoids
  that stale closure at the cost of some cheap churn. A ref holding the latest handler would be
  tidier, but do not "fix" this by adding `[]`.

**Environment**

- **Python 3.8.** The pins in `requirements.txt` are the newest releases of each package that
  still support it; upgrading the interpreter would allow much newer FastAPI/uvicorn.

**Persistence**

- **No accounts, no statistics, no daily-puzzle mode**, and games vanish on restart (see
  [State](#state-an-in-memory-dict-on-purpose)).
