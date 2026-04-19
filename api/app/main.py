"""FastAPI application entry point."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.routes import analyze, feedback, health, stats


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(
        title="Blockchain-Bandits API",
        version="0.1.0",
        description="Risk scoring for Ethereum wallets.",
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(health.router, tags=["meta"])
    app.include_router(stats.router, tags=["meta"])
    app.include_router(analyze.router, tags=["analyze"])
    app.include_router(feedback.router, tags=["feedback"])

    return app


app = create_app()
