const Tile = ({ value, status }) => {
  const className = status ? `tile tile-${status}` : "tile";
  return (
    <div
      className={className}
      role="gridcell"
      aria-label={value ? `tile ${value}` : "empty tile"}
    >
      {value}
    </div>
  );
};

export default Tile;
