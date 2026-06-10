import Row from "./Row";

const BOARD_ROWS = 6;
const BOARD_COLS = 5;

const Board = () => {
  return (
    <div className="board" role="grid" aria-label="Wordle board">
      {Array.from({ length: BOARD_ROWS }).map((_, rowIndex) => (
        <Row key={rowIndex} columns={BOARD_COLS} />
      ))}
    </div>
  );
};

export default Board;
