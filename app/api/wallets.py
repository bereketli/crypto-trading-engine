from decimal import Decimal
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user
from app.database import get_db
from app.models import User
from app.repositories import wallet_repository
from app.schemas.wallet import (
    PortfolioResponse,
    TransactionListResponse,
    TransactionResponse,
    WalletResponse,
    WalletWithValue,
)
from app.services import market_service

router = APIRouter(prefix="/wallets", tags=["wallets"])

QUOTE_ASSET = "USDT"


@router.get("", response_model=List[WalletResponse])
async def list_wallets(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await wallet_repository.list_for_user(db, current_user.id)


@router.get("/portfolio", response_model=PortfolioResponse)
async def get_portfolio(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> PortfolioResponse:
    """Balances valued at the last traded price, for the dashboard header."""
    wallets = await wallet_repository.list_for_user(db, current_user.id)
    prices = await market_service.price_map(db, quote_asset=QUOTE_ASSET)

    priced: List[WalletWithValue] = []
    total = Decimal("0")

    for wallet in wallets:
        total_balance = wallet.available_balance + wallet.locked_balance
        price = prices.get(wallet.asset)
        value = (total_balance * price) if price is not None else None
        if value is not None:
            total += value

        priced.append(
            WalletWithValue(
                id=wallet.id,
                asset=wallet.asset,
                available_balance=wallet.available_balance,
                locked_balance=wallet.locked_balance,
                total_balance=total_balance,
                price=price,
                value=value,
            )
        )

    priced.sort(key=lambda w: w.value or Decimal("0"), reverse=True)
    return PortfolioResponse(quote_asset=QUOTE_ASSET, total_value=total, wallets=priced)


@router.get("/transactions", response_model=TransactionListResponse)
async def list_transactions(
    limit: int = Query(25, ge=1, le=100),
    offset: int = Query(0, ge=0),
    asset: Optional[str] = Query(None, max_length=10),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> TransactionListResponse:
    items, total = await wallet_repository.list_transactions(
        db, current_user.id, limit=limit, offset=offset, asset=asset
    )
    return TransactionListResponse(
        items=[TransactionResponse.model_validate(t) for t in items],
        total=total,
        limit=limit,
        offset=offset,
    )


@router.get("/{asset}", response_model=WalletResponse)
async def get_wallet(
    asset: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    wallet = await wallet_repository.get_for_user(db, current_user.id, asset)
    if wallet is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "No wallet for that asset")
    return wallet
