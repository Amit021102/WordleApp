const IconButton = ({ children, label }) => {
  return (
    <button type="button" className="icon-button" aria-label={label}>
      {children}
    </button>
  );
};

export default IconButton;
