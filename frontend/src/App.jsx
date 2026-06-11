import { useEffect, useState } from "react";

import "./App.css";

import IconButton from "./components/IconBtns";
import Board from "./components/Board";
import Keyboard from "./components/Keyboard";

const BOARD_ROWS = 6;
const BOARD_COLS = 5;

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

  const submitGuess = () => {
    const guess = board[activeRowIndex].map((cell) => cell.value).join("");

    if (guess.length !== BOARD_COLS) {
      console.log("Not enough letters");
      return;
    }

    console.log("Submitting guess:", guess);

    // Later:
    // call your backend here
    // colorActiveRow(["green", "yellow", "gray", "gray", "green"]);
  };

  const handleKeyPress = (key) => {
    if (key === "Enter" || key === "ENTER") {
      submitGuess();
      return;
    }

    if (key === "Backspace" || key === "BACKSPACE") {
      eraseLetter();
      return;
    }

    if (/^[A-Za-z]$/.test(key)) {
      addLetter(key);
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

  return (
    <div className="app">
      <header className="header">
        <IconButton label="Help">?</IconButton>
        <h1>Wordle</h1>
        <IconButton label="Settings">⚙</IconButton>
      </header>

      <main>
        <Board board={board} />
      </main>

      <footer className="footer">
        <Keyboard onKeyPress={handleKeyPress} />
      </footer>
    </div>
  );
};

export default App;
