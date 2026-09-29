from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.auth import router as auth_router
from app.api.market import router as market_router
from app.api.users import router as users_router
from app.api.wallets import router as wallets_router
from app.config import get_settings

settings = get_settings()

app = FastAPI(title="Berko Crypto Exchange")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(users_router)
app.include_router(wallets_router)
app.include_router(market_router)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
