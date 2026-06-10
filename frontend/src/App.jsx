import './App.css';
import Board from './components/Board';

const App = () => {
  return (
    <div className="app">
      <header className="header">
        <button type="button">Help</button>
        <h1>Wordle</h1>
        <button type="button">Settings</button>
      </header>

      <main>
        <Board />
      </main>

      <footer className="footer">
        <button type="button">Submit</button>
        <button type="button">Erase</button>
      </footer>
    </div>
  );
};

export default App;
