import Tile from "./Tile";

const Row = ({ tiles }) => {
  return (
    <div className="row">
      {tiles.map((tile, index) => (
        <Tile key={index} value={tile.value} status={tile.status} />
      ))}
    </div>
  );
};

export default Row;
