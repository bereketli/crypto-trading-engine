from datetime import datetime
from decimal import Decimal
from typing import List, Optional

from pydantic import BaseModel, ConfigDict

from app.models.enums import TransactionStatus, TransactionType


class WalletResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    asset: str
    available_balance: Decimal
    locked_balance: Decimal


class WalletWithValue(WalletResponse):
    """A wallet plus its mark-to-market value in the quote currency."""

    total_balance: Decimal
    price: Optional[Decimal] = None
    value: Optional[Decimal] = None


class PortfolioResponse(BaseModel):
    quote_asset: str
    total_value: Decimal
    wallets: List[WalletWithValue]


class TransactionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    wallet_id: int
    transaction_type: TransactionType
    amount: Decimal
    asset: str
    status: TransactionStatus
    created_at: datetime


class TransactionListResponse(BaseModel):
    items: List[TransactionResponse]
    total: int
    limit: int
    offset: int
