from logging.config import fileConfig
from sqlalchemy import engine_from_config, pool
from alembic import context

# Import your models' Base
from app.models import Base  # Adjust the import path to your models

# this is the Alembic Config object, which provides
# access to the values within the .ini file in use.
config = context.config

# Interpret the config file for Python logging.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Set the target_metadata to your models' Base.metadata
target_metadata = Base.metadata

# Use a synchronous database URL for Alembic
import os
from sqlalchemy import create_engine

# Read the DATABASE_URL from the .env file or use a fallback
SYNC_DATABASE_URL = os.getenv(
    "SYNC_DATABASE_URL", "postgresql+psycopg2://postgres:1234@localhost:5432/crypto_trading_engine"
)

def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode."""
    context.configure(
        url=SYNC_DATABASE_URL,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode."""
    connectable = create_engine(SYNC_DATABASE_URL, poolclass=pool.NullPool)

    with connectable.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata)

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()