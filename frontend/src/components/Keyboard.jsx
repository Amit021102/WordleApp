const KEYBOARD_ROWS = [
  ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
  ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
  ["ENTER", "Z", "X", "C", "V", "B", "N", "M", "BACKSPACE"],
];

const Keyboard = ({ onKeyPress }) => {
  return (
    <div className="keyboard">
      {KEYBOARD_ROWS.map((row, rowIndex) => (
        <div className="keyboard-row" key={rowIndex}>
          {row.map((keyValue) => (
            <button
              key={keyValue}
              type="button"
              className={
                keyValue.length > 1 ? "keyboard-key wide-key" : "keyboard-key"
              }
              onClick={() => onKeyPress(keyValue)}
            >
              {keyValue === "BACKSPACE" ? "⌫" : keyValue}
            </button>
          ))}
        </div>
      ))}
    </div>
  );
};

export default Keyboard;
