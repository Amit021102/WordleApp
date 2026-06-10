const Tile = ({ value }) => {
  return (
    <div
      className="tile"
      role="gridcell"
      aria-label={value ? `tile ${value}` : "empty tile"}
    >
      {value}
    </div>
  );
};

export default Tile;
