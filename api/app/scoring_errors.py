"""Raised when a wallet cannot be scored (missing API key, upstream failure, etc.)."""


class ScoringError(Exception):
    """User-facing failure; mapped to HTTP 503 in routes."""
