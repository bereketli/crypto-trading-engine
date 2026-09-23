import enum

from sqlalchemy import Enum as SAEnum


def pg_enum(enum_cls: type, name: str, create_type: bool = True) -> SAEnum:
    """Build a native Postgres ENUM column type keyed off member .value.

    SQLAlchemy's Enum type defaults to using the Python member *name*
    (e.g. "BUY") for the stored/DB labels. Our str-Enums use lowercase
    .value ("buy") to match the JSON the API sends and receives, so
    values_callable is required to keep DB labels, server defaults, and
    API payloads all speaking the same casing.

    Pass create_type=False when a second column reuses a Postgres ENUM
    type already emitted for another column (e.g. order_side is defined
    on orders.side and reused, not redefined, on trades.taker_side).
    """
    return SAEnum(
        enum_cls,
        name=name,
        native_enum=True,
        create_type=create_type,
        values_callable=lambda obj: [e.value for e in obj],
    )


class UserRole(str, enum.Enum):
    USER = "user"
    ADMIN = "admin"


class KycStatus(str, enum.Enum):
    UNVERIFIED = "unverified"
    PENDING = "pending"
    VERIFIED = "verified"
    REJECTED = "rejected"


class OrderSide(str, enum.Enum):
    BUY = "buy"
    SELL = "sell"


class OrderType(str, enum.Enum):
    MARKET = "market"
    LIMIT = "limit"
    STOP_LIMIT = "stop_limit"
    STOP_MARKET = "stop_market"


class OrderStatus(str, enum.Enum):
    PENDING = "pending"
    OPEN = "open"
    PARTIALLY_FILLED = "partially_filled"
    FILLED = "filled"
    CANCELLED = "cancelled"
    REJECTED = "rejected"


class TimeInForce(str, enum.Enum):
    GTC = "gtc"
    IOC = "ioc"
    FOK = "fok"


class TransactionType(str, enum.Enum):
    DEPOSIT = "deposit"
    WITHDRAWAL = "withdrawal"
    TRANSFER_IN = "transfer_in"
    TRANSFER_OUT = "transfer_out"
    TRADE_LOCK = "trade_lock"
    TRADE_UNLOCK = "trade_unlock"
    TRADE_SETTLEMENT = "trade_settlement"
    FEE = "fee"


class TransactionStatus(str, enum.Enum):
    PENDING = "pending"
    COMPLETED = "completed"
    FAILED = "failed"
    REVERSED = "reversed"
