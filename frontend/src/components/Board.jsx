import Row from "./Row";

const Board = ({ board }) => {
  return (
    <div className="board">
      {board.map((row, rowIndex) => (
        <Row key={rowIndex} tiles={row} />
      ))}
    </div>
  );
};

export default Board;
