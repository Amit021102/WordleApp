import Row from "./Row";

const Board = ({ board }) => {
  return (
    <div className="board" role="grid" aria-label="Wordle board">
      {board.map((row, rowIndex) => (
        <Row key={rowIndex} letters={row} />
      ))}
    </div>
  );
};

export default Board;
