import { useEffect, useState } from "react";
import "./App.css";
import Board from "./components/Board";

const BOARD_ROWS = 6;
const BOARD_COLS = 5;

const createEmptyBoard = () =>
  Array.from({ length: BOARD_ROWS }, () => Array(BOARD_COLS).fill(""));

const App = () => {
  const [board, setBoard] = useState(createEmptyBoard);
  const [activeRowIndex] = useState(0);

  useEffect(() => {
    const handleKeyDown = (event) => {
      const key = event.key;

      if (/^[A-Za-z]$/.test(key)) {
        event.preventDefault();

        setBoard((currentBoard) => {
          const nextBoard = currentBoard.map((row) => [...row]);
          const activeRow = nextBoard[activeRowIndex];
          const nextColumnIndex =
            activeRow.findIndex((cell) => cell === "") === -1
              ? BOARD_COLS - 1
              : activeRow.findIndex((cell) => cell === "");

          console.log("Next column index:", nextColumnIndex);

          if (nextColumnIndex === -1) {
            return currentBoard;
          }

          activeRow[nextColumnIndex] = key.toUpperCase();
          return nextBoard;
        });
      } else if (key === "Backspace") {
        event.preventDefault();

        setBoard((currentBoard) => {
          const nextBoard = currentBoard.map((row) => [...row]);
          const activeRow = nextBoard[activeRowIndex];
          const lastFilledIndex =
            activeRow.findIndex((cell) => cell === "") === -1
              ? BOARD_COLS - 1
              : activeRow.findIndex((cell) => cell === "") - 1;

          if (lastFilledIndex >= 0) {
            activeRow[lastFilledIndex] = "";
          }

          return nextBoard;
        });
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [activeRowIndex]);

  return (
    <div className="app">
      <header className="header">
        <button type="button">Help</button>
        <h1>Wordle</h1>
        <button type="button">Settings</button>
      </header>

      <main>
        <Board board={board} />
      </main>

      <footer className="footer">
        <button type="button">Submit</button>
        <button type="button">Erase</button>
      </footer>
    </div>
  );
};

export default App;
