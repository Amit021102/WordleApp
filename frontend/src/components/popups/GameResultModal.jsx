import Modal from "./Modal";
import Tile from "../Tile";

// Rainbow madness only. The mapping is withheld for the whole game, so this is
// the player's one chance to see whether they read the board correctly.
const PALETTE_LEGEND = [
  { state: "green", label: "Right letter, right place" },
  { state: "yellow", label: "Right letter, wrong place" },
  { state: "gray", label: "Not in the word" },
];

const PaletteReveal = ({ palette }) => (
  <div className="palette-reveal">
    <h3 className="palette-reveal-title">The colours meant:</h3>

    {PALETTE_LEGEND.map(({ state, label }) => (
      <div className="palette-reveal-row" key={state}>
        <Tile value="" status={palette[state]} className="example-tile" />
        <span>{label}</span>
      </div>
    ))}
  </div>
);

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

const GameResultModal = ({ result, guessCount, answer, palette, onClose, playAgain }) => {
  const didWin = result === "won";
  const tagline = didWin
    ? getWinTagline(guessCount)
    : "Better luck on the next puzzle.";

  return (
    <Modal onClose={onClose}>
      <div className="game-result-modal">
        <h2 className="game-result-title">
          {didWin ? "You won!" : "Better luck next time..."}
        </h2>

        <div className="game-result-message">
          <p>{tagline}</p>

          {didWin && <p>You solved it in {guessCount} guesses</p>}
          {!didWin && <p>The correct word was <strong>{answer}</strong></p>}
        </div>

        {palette && <PaletteReveal palette={palette} />}

        <div className="game-over-actions">
          <button
            type="button"
            className="admire-puzzle-button"
            onClick={onClose}
          >
            Admire puzzle
          </button>

          <button
            type="button"
            className="new-game-button"
            onClick={playAgain}
          >
            Play again
          </button>
        </div>
        
      </div>
    </Modal>
  );
};

export default GameResultModal;
