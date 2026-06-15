const IconButton = ({ children, label, onClick }) => {
  return (
    <button
      type="button"
      className="icon-button"
      aria-label={label}
      onClick={onClick}
    >
      {children}
    </button>
  );
};

export default IconButton;
