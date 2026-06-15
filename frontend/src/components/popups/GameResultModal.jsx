import Modal from "./Modal";

const getWinTagline = (guessCount) => {
  switch (guessCount) {
    case 1:
      return "Incredible! First try!";
    case 2:
      return "Amazing! You made that look easy.";
    case 3:
      return "Great job! Very impressive.";
    case 4:
      return "Nicely done! You found the word.";
    case 5:
      return "Good save! You got there.";
    case 6:
      return "That was close! You made it.";
    default:
      return "You found the word!";
  }
};

const GameResultModal = ({ result, guessCount, onClose }) => {
  const didWin = result === "won";
  const tagline = didWin
    ? getWinTagline(guessCount)
    : "Better luck on the next puzzle.";

  return (
    <Modal onClose={onClose}>
      <div className="game-result-modal">
        <h2 className="game-result-title">
          {didWin ? "You won!" : "Game over"}
        </h2>

        <div className="game-result-message">
          <p>{tagline}</p>

          {didWin && <p>You solved it in {guessCount} guesses.</p>}
        </div>

        <button
          type="button"
          className="admire-puzzle-button"
          onClick={onClose}
        >
          Admire puzzle
        </button>
      </div>
    </Modal>
  );
};

export default GameResultModal;
