from fastapi import FastAPI

from app.routes.games import router as games_router

app = FastAPI()

app.include_router(games_router)