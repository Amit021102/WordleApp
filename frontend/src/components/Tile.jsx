const Tile = ({ value, status, className = "" }) => {
  const statusClass = status ? `tile-${status}` : "";
  return (
    <div
      className={`tile ${statusClass} ${className}`.trim()}
      role="gridcell"
      aria-label={value ? `tile ${value}` : "empty tile"}
    >
      {value}
    </div>
  );
};

export default Tile;
