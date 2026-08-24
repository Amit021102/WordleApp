import { act, render, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

// The API is mocked rather than left to fail: App calls createGame on mount, so
// an un-mocked test passes only when no backend happens to be listening, and
// silently breaks the moment a dev server is running on the same machine.
vi.mock("./api/gameApi", () => ({
  createGame: vi.fn(),
  submitGuess: vi.fn(),
  updateHardMode: vi.fn(),
}));

import App from "./App";
import { createGame, submitGuess } from "./api/gameApi";

const emptyConstraints = {
  required_positions: [],
  forbidden_positions: [],
  required_counts: {},
  forbidden_letters: [],
};

const gameResponse = (overrides = {}) => ({
  game_id: "test1234",
  word_length: 5,
  max_attempts: 6,
  mode: "normal",
  hard_mode: false,
  hard_mode_constraints: emptyConstraints,
  ...overrides,
});

// Render and wait for the mount effect's create-game call to settle, so typing
// is not racing the board being replaced.
const renderGame = async (response = gameResponse()) => {
  createGame.mockResolvedValue(response);

  const utils = render(<App />);

  await waitFor(() => {
    expect(utils.container.querySelectorAll(".tile")).toHaveLength(
      response.word_length * response.max_attempts,
    );
  });

  return utils;
};

const tileText = (container) =>
  Array.from(container.querySelectorAll(".tile")).map((tile) => tile.textContent);

beforeEach(() => {
  vi.clearAllMocks();
});

describe("App keyboard typing", () => {
  it("fills the first row from left to right with typed letters", async () => {
    const user = userEvent.setup();
    const { container } = await renderGame();

    await user.keyboard("abc");

    expect(tileText(container).slice(0, 4)).toEqual(["A", "B", "C", ""]);
  });

  it("erases letters with backspace", async () => {
    const user = userEvent.setup();
    const { container } = await renderGame();

    await user.keyboard("abc");
    await user.keyboard("{Backspace}");

    expect(tileText(container).slice(0, 4)).toEqual(["A", "B", "", ""]);
  });

  it("types a new letter after backspace", async () => {
    const user = userEvent.setup();
    const { container } = await renderGame();

    await user.keyboard("abc");
    await user.keyboard("{Backspace}x");

    expect(tileText(container).slice(0, 4)).toEqual(["A", "B", "X", ""]);
  });

  it("does not accept more letters than the row holds", async () => {
    const user = userEvent.setup();
    const { container } = await renderGame();

    await user.keyboard("abcdefgh");

    expect(tileText(container).slice(0, 5)).toEqual(["A", "B", "C", "D", "E"]);
  });
});

describe("browser shortcuts", () => {
  // Dispatched directly so the cancellation can be inspected; userEvent does
  // not report whether a default was prevented.
  const pressKey = (init) => {
    const event = new KeyboardEvent("keydown", {
      bubbles: true,
      cancelable: true,
      ...init,
    });
    act(() => {
      window.dispatchEvent(event);
    });
    return event;
  };

  it("cancels the default for keys the game uses", async () => {
    await renderGame();

    expect(pressKey({ key: "a" }).defaultPrevented).toBe(true);
    expect(pressKey({ key: "Enter" }).defaultPrevented).toBe(true);
    expect(pressKey({ key: "Backspace" }).defaultPrevented).toBe(true);
    // space is not a game key, but would scroll the page
    expect(pressKey({ key: " " }).defaultPrevented).toBe(true);
  });

  it("leaves browser and OS shortcuts alone", async () => {
    await renderGame();

    expect(pressKey({ key: "r", ctrlKey: true }).defaultPrevented).toBe(false);
    expect(pressKey({ key: "f", ctrlKey: true }).defaultPrevented).toBe(false);
    expect(pressKey({ key: "l", metaKey: true }).defaultPrevented).toBe(false);
    expect(pressKey({ key: "F5" }).defaultPrevented).toBe(false);
    expect(pressKey({ key: "Tab" }).defaultPrevented).toBe(false);
  });

  it("does not type a letter that was part of a shortcut", async () => {
    const { container } = await renderGame();

    pressKey({ key: "a", ctrlKey: true });

    expect(tileText(container)[0]).toBe("");
  });
});

describe("board shape", () => {
  it("builds the board from the word length and attempt count", async () => {
    const { container } = await renderGame(
      gameResponse({ word_length: 7, max_attempts: 4 }),
    );

    expect(container.querySelectorAll(".row")).toHaveLength(4);
    expect(container.querySelectorAll(".tile")).toHaveLength(28);
  });

  it("exposes the word length to CSS for the grid columns", async () => {
    const { container } = await renderGame(
      gameResponse({ word_length: 7, max_attempts: 4 }),
    );

    expect(container.querySelector(".board").style.getPropertyValue("--word-length"))
      .toBe("7");
  });

  it("accepts a guess as long as the configured word length", async () => {
    const user = userEvent.setup();
    await renderGame(gameResponse({ word_length: 6, max_attempts: 6 }));

    submitGuess.mockResolvedValue({
      valid: true,
      guess: "cigars",
      result: ["green", "green", "green", "green", "green", "green"],
      attempt_number: 1,
      game_status: "won",
      answer: "??????",
      palette: null,
    });

    await user.keyboard("cigars{Enter}");

    expect(submitGuess).toHaveBeenCalledWith("test1234", "CIGARS");
  });
});

describe("rainbow madness", () => {
  const typeAGuess = async (user) => {
    await user.keyboard("crane{Enter}");
  };

  const keyClasses = (container) =>
    Array.from(container.querySelectorAll(".keyboard-key")).flatMap((key) =>
      Array.from(key.classList),
    );

  it("colours the keyboard in normal mode", async () => {
    const user = userEvent.setup();
    const { container } = await renderGame();

    submitGuess.mockResolvedValue({
      valid: true,
      guess: "crane",
      result: ["green", "gray", "gray", "yellow", "gray"],
      attempt_number: 1,
      game_status: "in_progress",
      answer: "?????",
      palette: null,
    });

    await typeAGuess(user);

    await waitFor(() => {
      expect(keyClasses(container)).toContain("key-green");
    });
  });

  it("leaves the keyboard uncoloured so the palette cannot be ranked", async () => {
    const user = userEvent.setup();
    const { container } = await renderGame(gameResponse({ mode: "rainbow" }));

    submitGuess.mockResolvedValue({
      valid: true,
      guess: "crane",
      result: ["grape", "rust", "rust", "teal", "rust"],
      attempt_number: 1,
      game_status: "in_progress",
      answer: "?????",
      palette: null,
    });

    await typeAGuess(user);

    // the board is coloured...
    await waitFor(() => {
      expect(container.querySelectorAll(".tile-grape").length).toBeGreaterThan(0);
    });

    // ...but no key carries a status class, in either palette or normal names
    const classes = keyClasses(container);
    expect(classes.every((name) => name === "keyboard-key" || name === "wide-key"))
      .toBe(true);
  });
});
