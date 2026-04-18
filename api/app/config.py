"""Runtime configuration loaded from environment variables."""

from functools import lru_cache
from typing import Literal

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # Runtime
    environment: Literal["development", "staging", "production"] = "development"
    api_port: int = 8000
    api_cors_origins: str = "http://localhost:3000"

    # Supabase / Postgres
    database_url: str = "postgresql://postgres:postgres@localhost:5432/postgres"
    supabase_url: str = ""
    supabase_service_role_key: str = ""

    # Modal
    modal_token_id: str = ""
    modal_token_secret: str = ""
    modal_app_name: str = "blockchain-bandits"

    # Observability
    sentry_dsn: str = ""

    # Optional integrations
    anthropic_api_key: str = ""
    etherscan_api_key: str = ""

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.api_cors_origins.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
