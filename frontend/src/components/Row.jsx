import Tile from "./Tile";

const Row = ({ tiles, isShaking }) => {
  return (
    <div className={`row ${isShaking ? "row-shake" : ""}`}>
      {tiles.map((tile, index) => (
        <Tile
          key={index}
          value={tile.value}
          status={tile.status}
          index={index}
        />
      ))}
    </div>
  );
};

export default Row;
