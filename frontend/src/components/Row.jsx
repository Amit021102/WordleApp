import Tile from "./Tile";

const Row = ({ letters }) => {
  return (
    <div className="row">
      {letters.map((letter, index) => (
        <Tile key={index} value={letter} />
      ))}
    </div>
  );
};

export default Row;
