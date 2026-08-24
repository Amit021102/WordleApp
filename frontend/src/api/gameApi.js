// Override with VITE_API_BASE_URL in frontend/.env to point at a non-local
// backend. Vite inlines this at build time, so a deployed bundle needs the
// variable set when `npm run build` runs, not when it is served.
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000";

export const createGame = async (hardMode = false, mode = "normal") => {
  const response = await fetch(
    `${API_BASE_URL}/api/games`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ hard_mode: hardMode, mode }),
    },
  );

  if (!response.ok) {
    throw new Error("Failed to create game");
  }

  return response.json();
};

export const updateHardMode = async (gameId, hardMode) => {
  if (!gameId) {
    throw new Error("updateHardMode called without a valid gameId");
  }

  const response = await fetch(`${API_BASE_URL}/api/games/${gameId}/hard_mode`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ hard_mode: hardMode }),
  });

  if (!response.ok) {
    throw new Error("Failed to update hard mode");
  }

  return response.json();
};

export const submitGuess = async (gameId, guess) => {
  if (!gameId) {
    throw new Error("submitGuess called without a valid gameId");
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/games/${gameId}/guesses`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ guess }),
    });

    if (!response.ok) {
      throw new Error("Failed to submit guess");
    }

    return response.json();
  } catch (error) {
    console.error("submitGuess network error:", error, { gameId, guess });
    throw error;
  }
};
