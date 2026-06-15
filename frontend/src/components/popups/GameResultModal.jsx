import Modal from "./Modal";

const GameResultModal = ({ result, onClose }) => {
  const didWin = result === "won";

  return (
    <Modal onClose={onClose}>
      <div className="game-result-modal">
        <h2>{didWin ? "You won!" : "Game over"}</h2>

        <p>
          {didWin ? "Great job! You found the word." : "Better luck next time."}
        </p>

        <button type="button" onClick={onClose}>
          Close
        </button>
      </div>
    </Modal>
  );
};

export default GameResultModal;
