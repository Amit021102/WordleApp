import Modal from "./Modal";
import Switch from "../Switch";

const SettingsModal = ({
  theme,
  onThemeChange,
  isHardMode,
  onHardModeChange,
  isRainbowMode,
  onRainbowModeChange,
  onClose,
}) => {
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
          <div className="settings-label">
            <span>HARD MODE</span>
            {isRainbowMode && (
              <small className="settings-hint">
                Not available in rainbow madness
              </small>
            )}
          </div>
          <Switch
            checked={isHardMode}
            onChange={(c) => onHardModeChange(!isHardMode)}
            ariaLabel="Toggle hard mode"
            isThemeSwitch={false}
            disabled={isRainbowMode}
          />
        </div>

        <div className="rainbow-mode-toggle settings-row">
          <div className="settings-label">
            <span>RAINBOW MADNESS</span>
            <small className="settings-hint">
              New colours, meanings unknown. Starts a new game.
            </small>
          </div>
          <Switch
            checked={isRainbowMode}
            onChange={onRainbowModeChange}
            ariaLabel="Toggle rainbow madness"
            isThemeSwitch={false}
          />
        </div>
      </div>
    </Modal>
  );
};

export default SettingsModal;
