"""Runtime configuration loaded from environment variables."""

from functools import lru_cache
from pathlib import Path
from typing import Literal

from pydantic_settings import BaseSettings, SettingsConfigDict

# config.py → api/app/config.py — parents[1]=api, parents[2]=repo root
_API_DIR = Path(__file__).resolve().parents[1]
_REPO_ROOT = Path(__file__).resolve().parents[2]


def _env_file_paths() -> tuple[str, ...]:
    """Load repo `.env` then `api/.env` (later overrides). Either file is enough."""
    paths: list[str] = []
    for p in (_REPO_ROOT / ".env", _API_DIR / ".env"):
        if p.is_file():
            paths.append(str(p))
    return tuple(paths) if paths else (".env",)


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=_env_file_paths(), extra="ignore")

    # Runtime
    environment: Literal["development", "staging", "production"] = "development"
    api_port: int = 8000
    api_cors_origins: str = "http://localhost:3000"

    # Supabase / Postgres
    database_url: str = "postgresql://postgres:postgres@localhost:5432/postgres"
    supabase_url: str = ""
    supabase_service_role_key: str = ""

    # Model file path (loaded per request; use `api/checkpoints` for Docker)
    model_path: str = "../ml/checkpoints/xgb.json"

    # Optional integrations
    anthropic_api_key: str = ""
    # Mainnet tx source for live features (https://etherscan.io/apis) — API v2 requires chain id
    etherscan_api_key: str = ""
    etherscan_chain_id: int = 1  # Ethereum mainnet; see Etherscan supported chains for L2s
    # Dev-only: use synthetic txs instead of Etherscan (no real chain data)
    allow_synthetic_features: bool = False
    # Dev-only: hash-based fake scores when True; when False, use heuristic+XGB only
    allow_mock_scorer: bool = False

    @property
    def cors_origins_list(self) -> list[str]:
        raw = [o.strip() for o in self.api_cors_origins.split(",") if o.strip()]
        # Empty env like API_CORS_ORIGINS= would otherwise allow no browser origins.
        if not raw:
            return ["http://localhost:3000"]
        return raw


@lru_cache
def get_settings() -> Settings:
    return Settings()
