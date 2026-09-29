from typing import List

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.repositories import market_repository
from app.schemas.market import AssetResponse, TickerResponse, TradeResponse
from app.services import market_service

router = APIRouter(prefix="/market", tags=["market"])


@router.get("/assets", response_model=List[AssetResponse])
async def list_assets(db: AsyncSession = Depends(get_db)):
    return await market_repository.list_assets(db)


@router.get("/tickers", response_model=List[TickerResponse])
async def list_tickers(
    hours: int = Query(24, ge=1, le=168, description="Rolling stats window"),
    db: AsyncSession = Depends(get_db),
) -> List[TickerResponse]:
    return await market_service.list_tickers(db, hours=hours)


@router.get("/tickers/{symbol}", response_model=TickerResponse)
async def get_ticker(symbol: str, db: AsyncSession = Depends(get_db)) -> TickerResponse:
    ticker = await market_service.get_ticker(db, symbol)
    if ticker is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Trading pair not found")
    return ticker


@router.get("/trades/{symbol}", response_model=List[TradeResponse])
async def recent_trades(
    symbol: str,
    limit: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
):
    pair = await market_repository.get_pair_by_symbol(db, symbol)
    if pair is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Trading pair not found")

    trades = await market_repository.recent_trades(db, pair_id=pair.id, limit=limit)
    return [
        TradeResponse(
            id=t.id,
            price=t.price,
            quantity=t.quantity,
            taker_side=t.taker_side.value,
            created_at=t.created_at,
        )
        for t in trades
    ]
