import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import App from "./App";

describe("App keyboard typing", () => {
  it("fills the first row from left to right with typed letters", async () => {
    const user = userEvent.setup();
    const { container } = render(<App />);

    await user.keyboard("abc");

    const tiles = container.querySelectorAll(".tile");
    expect(tiles[0].textContent).toBe("A");
    expect(tiles[1].textContent).toBe("B");
    expect(tiles[2].textContent).toBe("C");
    expect(tiles[3].textContent).toBe("");
  });

  it("erases letters with backspace", async () => {
    const user = userEvent.setup();
    const { container } = render(<App />);

    await user.keyboard("abc");
    await user.keyboard("{Backspace}");

    const tiles = container.querySelectorAll(".tile");
    expect(tiles[0].textContent).toBe("A");
    expect(tiles[1].textContent).toBe("B");
    expect(tiles[2].textContent).toBe("");
    expect(tiles[3].textContent).toBe("");
  });

  it("types a new letter after backspace", async () => {
    const user = userEvent.setup();
    const { container } = render(<App />);

    await user.keyboard("abc");
    await user.keyboard("{Backspace}x");

    const tiles = container.querySelectorAll(".tile");
    expect(tiles[0].textContent).toBe("A");
    expect(tiles[1].textContent).toBe("B");
    expect(tiles[2].textContent).toBe("X");
    expect(tiles[3].textContent).toBe("");
  });
});
