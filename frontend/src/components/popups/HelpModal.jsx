import Modal from "./Modal";

const HelpModal = ({ onClose }) => {
  return (
    <Modal onClose={onClose}>
      <div className="help-modal-content" />
    </Modal>
  );
};

export default HelpModal;
