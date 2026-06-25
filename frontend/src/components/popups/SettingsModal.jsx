import Modal from "./Modal";
import Switch from "../Switch";

const SettingsModal = ({ theme, onThemeChange, isHardMode, onHardModeChange, onClose }) => {
  return (
    <Modal onClose={onClose}>
      <div className="settings-modal">
        <h2>Settings</h2>
        <div className="theme-selector settings-row">
          <span>THEME</span>
          <Switch
            checked={theme === "dark"}
            onChange={(checked) => onThemeChange(checked ? "dark" : "light")}
            ariaLabel="Toggle theme"
          />
        </div>

        <div className="hard-mode-toggle settings-row">
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
