import Modal from "./Modal";

const SettingsModal = ({ onClose }) => {
  return (
    <Modal onClose={onClose}>
      <div className="settings-modal-content" />
    </Modal>
  );
};

export default SettingsModal;
