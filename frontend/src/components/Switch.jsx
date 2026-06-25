const Switch = ({ isThemeSwitch = true, checked = false, onChange = () => {}, id, ariaLabel }) => {
    const themeSwitchLabel = "theme-switch";
    const themeSliderLabel = "theme-slider";
  return (
    <label className={`switch ${isThemeSwitch ? themeSwitchLabel : ""}`.trim()}>
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        aria-label={ariaLabel}
      />
      <span className={`slider ${isThemeSwitch ? themeSliderLabel : ""}`.trim()} />
    </label>
  );
};

export default Switch;