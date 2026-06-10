import Tile from './Tile';

const Row = ({ columns }) => {
  return (
    <div className="row">
      {Array.from({ length: columns }).map((_, index) => (
        <Tile key={index} />
      ))}
    </div>
  );
};

export default Row;
