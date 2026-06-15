const KEYBOARD_ROWS = [
  ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
  ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
  ["ENTER", "Z", "X", "C", "V", "B", "N", "M", "BACKSPACE"],
];

const Keyboard = ({ onKeyPress, keyStatuses }) => {
  return (
    <div className="keyboard">
      {KEYBOARD_ROWS.map((row, rowIndex) => (
        <div className="keyboard-row" key={rowIndex}>
          {row.map((keyValue) => {
            const status = keyStatuses[keyValue];

            const classNames = [
              "keyboard-key",
              keyValue.length > 1 ? "wide-key" : "",
              status ? `key-${status}` : "",
            ]
              .filter(Boolean)
              .join(" ");

            return (
              <button
                key={keyValue}
                type="button"
                className={classNames}
                onClick={() => onKeyPress(keyValue)}
              >
                {keyValue === "BACKSPACE" ? "⌫" : keyValue}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
};

export default Keyboard;
