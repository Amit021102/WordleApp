const Switch = ({
  isThemeSwitch = true,
  checked = false,
  onChange = () => {},
  disabled = false,
  id,
  ariaLabel,
}) => {
    const themeSwitchLabel = "theme-switch";
    const themeSliderLabel = "theme-slider";
  return (
    <label
      className={`switch ${isThemeSwitch ? themeSwitchLabel : ""} ${
        disabled ? "switch-disabled" : ""
      }`.trim()}
    >
      <input
        id={id}
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        aria-label={ariaLabel}
      />
      <span className={`slider ${isThemeSwitch ? themeSliderLabel : ""}`.trim()} />
    </label>
  );
};

export default Switch;
