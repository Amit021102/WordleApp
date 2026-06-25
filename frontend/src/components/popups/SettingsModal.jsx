import Modal from "./Modal";
import Switch from "../Switch";

const SettingsModal = ({ theme, onThemeChange, isHardMode, onHardModeChange, onClose }) => {
  return (
    <Modal onClose={onClose}>
      <div className="settings-modal">
        <div className="theme-selector">
          {/* <button
            type="button"
            className={`theme-button ${
              theme === "light" ? "theme-button-active" : ""
            }`}
            onClick={() => onThemeChange("light")}
            aria-label="Use light mode"
            aria-pressed={theme === "light"}
          >
            ☀
          </button> */}

          <Switch
            checked={theme === "dark"}
            onChange={(checked) => onThemeChange(checked ? "dark" : "light")}
            ariaLabel="Toggle theme"
          />

          {/* <button
            type="button"
            className={`theme-button ${
              theme === "dark" ? "theme-button-active" : ""
            }`}
            onClick={() => onThemeChange("dark")}
            aria-label="Use dark mode"
            aria-pressed={theme === "dark"}
          >
            ☾
          </button> */}
        </div>

        <div className="hard-mode-toggle">
          <span>HARD MODE</span>
          <Switch
            checked={isHardMode}
            onChange={(c) => onHardModeChange(!isHardMode)}
            ariaLabel="Toggle hard mode"
            isThemeSwitch={false}
          />
        </div>

        {/* <div>
          <span>HARD MODE</span>
          <Switch
            checked={isHardMode}
            onChange={(c) => onHardModeChange(!isHardMode)}
            ariaLabel="Toggle hard mode"
            isThemeSwitch={false}
          />
        </div> */}
      </div>
    </Modal>
  );
};

export default SettingsModal;
