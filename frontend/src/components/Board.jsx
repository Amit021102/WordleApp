import Row from "./Row";

const Board = ({ board, shakingRowIndex }) => {
  // The board's own shape drives the layout: one grid column per letter. Set
  // as a custom property so the column count and tile size stay in CSS.
  const wordLength = board[0]?.length ?? 0;

  return (
    <div className="board" style={{ "--word-length": wordLength }}>
      {board.map((row, rowIndex) => (
        <Row
          key={rowIndex}
          tiles={row}
          isShaking={rowIndex === shakingRowIndex}
        />
      ))}
    </div>
  );
};

export default Board;
