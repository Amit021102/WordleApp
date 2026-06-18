import Row from "./Row";

const Board = ({ board, shakingRowIndex }) => {
  return (
    <div className="board">
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
