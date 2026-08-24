import Modal from "./Modal";
import Tile from "../Tile";

const HelpModal = ({ isRainbowMode = false, onClose }) => {
  // The normal rules would give the whole game away here, so rainbow madness
  // gets its own instructions -- which are, necessarily, mostly about what the
  // player is not being told.
  if (isRainbowMode) {
    return (
      <Modal onClose={onClose}>
        <div className="help-modal">
          <h2>Rainbow madness</h2>

          <p>Guess the word in six tries.</p>

          <section className="help-rule">
            <p>
              Every guess is scored with three colours drawn fresh for this
              game — but <strong>nobody tells you which colour means what</strong>.
              One means right letter, right place. One means right letter, wrong
              place. One means the letter is not in the word.
            </p>
            <p>
              Work out which is which as you play. The keyboard stays uncoloured,
              so the board is all you have to go on.
            </p>
            <p>The answer reveals the mapping — see how well you read it.</p>
          </section>
        </div>
      </Modal>
    );
  }

  return (
    <Modal onClose={onClose}>
      <div className="help-modal">
        <h2>How to play</h2>

        <p>Guess the word in six tries.</p>

        <section className="help-rule">
          <p>
            <strong>Green</strong> means the letter is in the correct place.
          </p>
          <div className="help-example-word">
            <Tile value="W" className="example-tile" />
            <Tile value="O" status="green" className="example-tile" />
            <Tile value="R" className="example-tile" />
            <Tile value="D" className="example-tile" />
            <Tile value="S" className="example-tile" />
          </div>
        </section>

        <section className="help-rule">
          <p>
            <strong>Yellow</strong> means the letter is in the word but in the
            wrong place.
          </p>
          <div className="help-example-word">
            <Tile value="G" className="example-tile" />
            <Tile value="A" className="example-tile" />
            <Tile value="M" className="example-tile" />
            <Tile value="E" status="yellow" className="example-tile" />
            <Tile value="S" className="example-tile" />
          </div>
        </section>

        <section className="help-rule">
          <p>
            <strong>Gray</strong> means the letter is not in the word.
          </p>

          <div className="help-example-word">
            <Tile value="R" status="gray" className="example-tile" />
            <Tile value="E" className="example-tile" />
            <Tile value="A" className="example-tile" />
            <Tile value="C" className="example-tile" />
            <Tile value="T" className="example-tile" />
          </div>
        </section>
      </div>
    </Modal>
  );
};

export default HelpModal;
