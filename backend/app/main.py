import os

from fastapi import FastAPI

from app.routes.games import router as games_router

from fastapi.middleware.cors import CORSMiddleware

# Where the frontend is served from. Override with a comma-separated
# WORDLE_CORS_ORIGINS when the frontend does not live on the Vite dev server,
# e.g. WORDLE_CORS_ORIGINS="https://wordle.example.com".
DEFAULT_CORS_ORIGINS = "http://localhost:5173,http://127.0.0.1:5173"

allowed_origins = [
    origin.strip()
    for origin in os.getenv("WORDLE_CORS_ORIGINS", DEFAULT_CORS_ORIGINS).split(",")
    if origin.strip()
]

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(games_router)