import Modal from "./Modal";

const SettingsModal = ({ theme, onThemeChange, isHardMode, onHardModeChange, onClose }) => {
  return (
    <Modal onClose={onClose}>
      <div className="settings-modal">
        <div className="theme-selector">
          <button
            type="button"
            className={`theme-button ${
              theme === "light" ? "theme-button-active" : ""
            }`}
            onClick={() => onThemeChange("light")}
            aria-label="Use light mode"
            aria-pressed={theme === "light"}
          >
            ☀
          </button>

          <button
            type="button"
            className={`theme-button ${
              theme === "dark" ? "theme-button-active" : ""
            }`}
            onClick={() => onThemeChange("dark")}
            aria-label="Use dark mode"
            aria-pressed={theme === "dark"}
          >
            ☾
          </button>
        </div>

        <div className="hard-mode-toggle">
          <label htmlFor="hard-mode-checkbox">Hard mode</label>
          <input
            type="checkbox"
            id="hard-mode-checkbox"
            checked={isHardMode}
            onChange={() => onHardModeChange(!isHardMode)}
          />
        </div>
      </div>
    </Modal>
  );
};

export default SettingsModal;
