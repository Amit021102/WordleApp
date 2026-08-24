import { useEffect, useState } from "react";
import "./App.css";

import IconButton from "./components/IconBtns";
import Board from "./components/Board";
import Keyboard from "./components/Keyboard";

import SettingsModal from "./components/popups/SettingsModal";
import HelpModal from "./components/popups/HelpModal";
import GameResultModal from "./components/popups/GameResultModal";
import Toast from "./components/popups/Toast";

import { createGame, submitGuess, updateHardMode } from "./api/gameApi";

// Only used for the board rendered before the first game arrives. After that
// the shape comes from the server's create-game response, and the board itself
// is the source of truth: board.length is the attempt count, and the length of
// a row is the word length.
const DEFAULT_BOARD_ROWS = 6;
const DEFAULT_BOARD_COLS = 5;

// Only meaningful in normal mode. Keys upgrade but never downgrade, so a letter
// scored green stays green even if a later guess puts it somewhere wrong.
//
// This ladder is exactly why the keyboard stays uncoloured in rainbow madness:
// ranking is public knowledge (gray < yellow < green), so watching a key upgrade
// from one colour to another would give the mapping away for free.
const STATUS_PRIORITY = {
  gray: 1,
  yellow: 2,
  green: 3,
};

// Keys the board responds to. Space is included because it is not a game key
// but would scroll the page, which is the one default worth cancelling purely
// for the nuisance it causes.
const isConsumedKey = (key) =>
  key === "Enter" ||
  key === "Backspace" ||
  key === " " ||
  /^[A-Za-z]$/.test(key);

const createEmptyBoard = (rows = DEFAULT_BOARD_ROWS, cols = DEFAULT_BOARD_COLS) =>
  Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => ({
      value: "",
      status: "",
    })),
  );

const App = () => {
  const [board, setBoard] = useState(createEmptyBoard);
  const [activeRowIndex, setActiveRowIndex] = useState(0);
  const [finalGuessCount, setFinalGuessCount] = useState(0);
  const [gameId, setGameId] = useState(null);
  const [mode, setMode] = useState("normal");
  const [revealedPalette, setRevealedPalette] = useState(null);
  const [hardMode, setHardMode] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [correctWord, setCorrectWord] = useState("")
  const [keyStatuses, setKeyStatuses] = useState({});
  const [activeModal, setActiveModal] = useState(null);
  const [toast, setToast] = useState(null);
  const [theme, setTheme] = useState("dark");
  const [shakingRowIndex, setShakingRowIndex] = useState(null);

  const startNewGame = async (initialHardMode = false, initialMode = "normal") => {
    try {
      const gameData = await createGame(initialHardMode, initialMode);

      setBoard(createEmptyBoard(gameData.max_attempts, gameData.word_length));
      setKeyStatuses({});
      setActiveRowIndex(0);
      setGameId(gameData.game_id);
      setGameOver(false);
      setRevealedPalette(null);
      // Read back from the response rather than the arguments: the server
      // forces hard mode off for a rainbow game, and that has to be reflected.
      setMode(gameData.mode);
      setHardMode(gameData.hard_mode);
    } catch (error) {
      console.error("Could not start a new game:", error);
    }
  };

  const addLetter = (letter) => {
    setBoard((currentBoard) => {
      const nextBoard = currentBoard.map((row) => [...row]);
      const activeRow = nextBoard[activeRowIndex];

      const nextEmptyColumnIndex = activeRow.findIndex(
        (cell) => cell.value === "",
      );

      if (nextEmptyColumnIndex === -1) {
        return currentBoard;
      }

      activeRow[nextEmptyColumnIndex] = {
        value: letter.toUpperCase(),
        status: "",
      };

      return nextBoard;
    });
  };

  const eraseLetter = () => {
    setBoard((currentBoard) => {
      const nextBoard = currentBoard.map((row) => [...row]);
      const activeRow = nextBoard[activeRowIndex];

      const nextEmptyColumnIndex = activeRow.findIndex(
        (cell) => cell.value === "",
      );

      const lastFilledIndex =
        nextEmptyColumnIndex === -1
          ? activeRow.length - 1
          : nextEmptyColumnIndex - 1;

      if (lastFilledIndex < 0) {
        return currentBoard;
      }

      activeRow[lastFilledIndex] = {
        value: "",
        status: "",
      };

      return nextBoard;
    });
  };

  const submitCurrentGuess = async () => {
    const guess = board[activeRowIndex].map((cell) => cell.value).join("");

    if (guess.length !== board[activeRowIndex].length) {
      setToast({
        id: Date.now(),
        message: "Not enough letters",
      });
      shakeActiveRow();
      return;
    }

    let response;

    try {
      response = await submitGuess(gameId, guess);
    } catch (error) {
      console.error("Could not submit guess:", error);
      setToast({
        id: Date.now(),
        message: "Connection problem — try again",
      });
      shakeActiveRow();
      return;
    }

    if (response.valid) {
      colorActiveRow(response.result);

      // Rainbow madness: leave the keyboard uncoloured. See STATUS_PRIORITY.
      if (mode !== "rainbow") {
        updateKeyStatuses(guess, response.result);
      }

      setActiveRowIndex((index) => index + 1);

      const game_status = response.game_status;
      if (game_status !== "in_progress") {
        setGameOver(true);
        setCorrectWord(response.answer)
        setFinalGuessCount(activeRowIndex + 1);
        // Null in normal mode; the decoded mapping when a rainbow game ends.
        setRevealedPalette(response.palette ?? null);

        setTimeout(() => {
          setActiveModal(game_status);
        }, 2000);
      }
    } else {
      setToast({
        id: Date.now(),
        message: response.message || "Invalid guess",
      });
      shakeActiveRow();
    }
  };

  const handleKeyPress = (key) => {
    if (!gameOver) {
      if (key === "Enter" || key === "ENTER") {
        submitCurrentGuess();
        return;
      }

      if (key === "Backspace" || key === "BACKSPACE") {
        eraseLetter();
        return;
      }

      if (/^[A-Za-z]$/.test(key)) {
        addLetter(key);
      }
    }
  };

  const colorActiveRow = (statuses) => {
    setBoard((currentBoard) => {
      const nextBoard = currentBoard.map((row) =>
        row.map((tile) => ({ ...tile })),
      );

      nextBoard[activeRowIndex] = nextBoard[activeRowIndex].map(
        (tile, index) => ({
          ...tile,
          status: statuses[index],
        }),
      );

      return nextBoard;
    });
  };

  const updateKeyStatuses = (guess, results) => {
    setKeyStatuses((currentStatuses) => {
      const nextStatuses = { ...currentStatuses };

      results.forEach((status, index) => {
        const letter = guess[index].toUpperCase();
        const currentStatus = nextStatuses[letter];

        if (
          !currentStatus ||
          STATUS_PRIORITY[status] > STATUS_PRIORITY[currentStatus]
        ) {
          nextStatuses[letter] = status;
        }
      });

      return nextStatuses;
    });
  };

  const shakeActiveRow = () => {
    setShakingRowIndex(activeRowIndex);

    setTimeout(() => {
      setShakingRowIndex(null);
    }, 450);
  };

  const toggleHardMode = async (newHardMode) => {
    if (!gameId) {
      return;
    }

    try {
      const response = await updateHardMode(gameId, newHardMode);
      setHardMode(response.hard_mode);
    } catch (error) {
      console.error("Could not update hard mode:", error);
      setToast({
        id: Date.now(),
        message: "Failed to update hard mode",
      });
    }
  };

  // Switching variants always starts a fresh game: the colour mapping is drawn
  // when the game is created, so there is no way to convert a board in flight.
  const toggleRainbowMode = (enabled) => {
    const nextMode = enabled ? "rainbow" : "normal";

    if (nextMode === mode) {
      return;
    }

    // Rainbow games are never hard mode; coming back out, start clean rather
    // than silently restoring a setting the player last saw a while ago.
    startNewGame(false, nextMode);
    setActiveModal(null);
  };

  // game init use effect
  useEffect(() => {
    startNewGame();
  }, []);

  // keyboard event listener use effect
  useEffect(() => {
    const handleKeyDown = (event) => {
      // Only cancel the browser's default for keys the game actually consumes.
      // Cancelling everything would take out Ctrl+R, F5, Ctrl+F and Tab while
      // the page has focus -- Tab in particular is how a keyboard-only player
      // reaches the help and settings buttons.
      const isShortcut = event.ctrlKey || event.metaKey || event.altKey;

      if (!isShortcut && isConsumedKey(event.key)) {
        // Space would scroll the page and Backspace can trigger "back" in some
        // webviews; the rest are cancelled so nothing types twice.
        event.preventDefault();
      }

      if (isShortcut) {
        return;
      }

      handleKeyPress(event.key);
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  });

  // toast auto-dismiss
  useEffect(() => {
    if (!toast) {
      return;
    }

    const timeoutId = setTimeout(() => {
      setToast(null);
    }, 2000);

    return () => clearTimeout(timeoutId);
  }, [toast]);

  return (
    <div className={`app theme-${theme} mode-${mode}`}>
      <header className="header">
        <IconButton label="Help" onClick={() => setActiveModal("help")}>
          ?
        </IconButton>
        <h1>{mode === "rainbow" ? "Rainbow Madness" : "Infinite Wordle"}</h1>
        <IconButton label="Settings" onClick={() => setActiveModal("settings")}>
          ⚙
        </IconButton>
      </header>

      <main>
        <div className="board-toolbar">
          <button
            type="button"
            className="new-game-button"
            onClick={() => startNewGame(hardMode, mode)}
          >
            New game
          </button>
        </div>
        <Board
        board={board}
        shakingRowIndex={shakingRowIndex}
        />
      </main>

      <footer className="footer">
        <Keyboard onKeyPress={handleKeyPress} keyStatuses={keyStatuses} />
      </footer>

      {activeModal === "settings" && (
        <SettingsModal
          theme={theme}
          onThemeChange={setTheme}
          isHardMode={hardMode}
          onHardModeChange={toggleHardMode}
          isRainbowMode={mode === "rainbow"}
          onRainbowModeChange={toggleRainbowMode}
          onClose={() => setActiveModal(null)}
        />
      )}

      {activeModal === "help" && (
        <HelpModal
          isRainbowMode={mode === "rainbow"}
          onClose={() => setActiveModal(null)}
        />
      )}

      {(activeModal === "won" || activeModal === "lost") && (
        <GameResultModal
          result={activeModal}
          guessCount={finalGuessCount}
          answer={correctWord}
          palette={revealedPalette}
          onClose={() => setActiveModal(null)}
          playAgain={() => {
            setActiveModal(null)
            startNewGame(hardMode, mode)
          }
          }
        />
      )}

      <Toast message={toast?.message} />
    </div>
  );
};

export default App;
