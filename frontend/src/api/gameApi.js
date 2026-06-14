const API_BASE_URL = "http://127.0.0.1:8000";

export const createGame = async () => {
  const response = await fetch(`${API_BASE_URL}/api/games`, {
    method: "POST",
  });

  if (!response.ok) {
    throw new Error("Failed to create game");
  }

  return response.json();
};

export const submitGuess = async (gameId, guess) => {
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
};
