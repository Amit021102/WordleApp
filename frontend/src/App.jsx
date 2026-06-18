import { useEffect, useState } from "react";
import "./App.css";

import IconButton from "./components/IconBtns";
import Board from "./components/Board";
import Keyboard from "./components/Keyboard";

import SettingsModal from "./components/popups/SettingsModal";
import HelpModal from "./components/popups/HelpModal";
import GameResultModal from "./components/popups/GameResultModal";
import Toast from "./components/popups/Toast";

import { createGame, submitGuess } from "./api/gameApi";

const BOARD_ROWS = 6;
const BOARD_COLS = 5;

const STATUS_PRIORITY = {
  gray: 1,
  yellow: 2,
  green: 3,
};

const createEmptyBoard = () =>
  Array.from({ length: BOARD_ROWS }, () =>
    Array.from({ length: BOARD_COLS }, () => ({
      value: "",
      status: "",
    })),
  );

const App = () => {
  const [board, setBoard] = useState(createEmptyBoard);
  const [activeRowIndex, setActiveRowIndex] = useState(0);
  const [finalGuessCount, setFinalGuessCount] = useState(0);
  const [gameId, setGameId] = useState(null);
  const [gameOver, setGameOver] = useState(false);
  const [correctWord, setCorrectWord] = useState("")
  const [keyStatuses, setKeyStatuses] = useState({});
  const [activeModal, setActiveModal] = useState(null);
  const [toast, setToast] = useState(null);
  const [theme, setTheme] = useState("dark");
  const [shakingRowIndex, setShakingRowIndex] = useState(null);

  const startNewGame = async () => {
  try {
    const gameData = await createGame();

    setBoard(createEmptyBoard());
    setKeyStatuses({})
    setActiveRowIndex(0);
    setGameId(gameData.game_id);
    setGameOver(false);

    console.log("Created game:", gameData);
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
        // status: "",
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
        nextEmptyColumnIndex === -1 ? BOARD_COLS - 1 : nextEmptyColumnIndex - 1;

      if (lastFilledIndex < 0) {
        return currentBoard;
      }

      activeRow[lastFilledIndex] = {
        value: "",
        // status: "",
      };

      return nextBoard;
    });
  };

  const submitCurrentGuess = async () => {
    const guess = board[activeRowIndex].map((cell) => cell.value).join("");

    if (guess.length !== BOARD_COLS) {
      setToast({
        id: Date.now(),
        message: "Not enough letters",
      });
      shakeActiveRow();
      return;
    }

    const response = await submitGuess(gameId, guess);

    console.log(response);
    if (response.valid) {
      colorActiveRow(response.result);
      updateKeyStatuses(guess, response.result);
      setActiveRowIndex((index) => index + 1);

      const game_status = response.game_status;
      if (game_status !== "in_progress") {
        setGameOver(true);
        setCorrectWord(response.answer)
        setFinalGuessCount(activeRowIndex + 1);

        setTimeout(() => {
          setActiveModal(game_status);
        }, 2000);
      }
    } else {
      setToast({
        id: Date.now(),
        message: "Not in word list",
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

  // game init use effect
  useEffect(() => {
    startNewGame();
  }, []);

  // keyboard event listener use effect
  useEffect(() => {
    const handleKeyDown = (event) => {
      event.preventDefault();
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
    <div className={`app theme-${theme}`}>
      <header className="header">
        <IconButton label="Help" onClick={() => setActiveModal("help")}>
          ?
        </IconButton>
        <h1>Infinite Wordle</h1>
        <IconButton label="Settings" onClick={() => setActiveModal("settings")}>
          ⚙
        </IconButton>
      </header>

      <main>
        <div className="board-toolbar">
          <button
            type="button"
            className="new-game-button"
            onClick={startNewGame}
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
          onClose={() => setActiveModal(null)}
        />
      )}

      {activeModal === "help" && (
        <HelpModal onClose={() => setActiveModal(null)} />
      )}

      {(activeModal === "won" || activeModal === "lost") && (
        <GameResultModal
          result={activeModal}
          guessCount={finalGuessCount}
          answer={correctWord}
          onClose={() => setActiveModal(null)}
          playAgain={() => {
            setActiveModal(null)
            startNewGame()
          }
          }
        />
      )}

      <Toast message={toast?.message} />
    </div>
  );
};

export default App;
