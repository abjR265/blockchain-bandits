.PHONY: help setup setup-web setup-api setup-ml setup-data dev dev-web dev-api test test-web test-api lint format clean deploy-web deploy-api deploy-modal db-migrate db-reset

help:
	@echo "Blockchain-Bandits — common commands"
	@echo ""
	@echo "  make setup           Install all dependencies (web + api + ml + data)"
	@echo "  make dev             Boot API (:8000) and web (:3000) concurrently"
	@echo "  make test            Run all test suites"
	@echo "  make lint            Lint all source trees"
	@echo "  make format          Format all source trees"
	@echo ""
	@echo "  make deploy-web      Deploy frontend to Vercel"
	@echo "  make deploy-api      Deploy FastAPI to Fly.io"
	@echo "  make deploy-modal    Deploy ML inference to Modal"
	@echo ""
	@echo "  make db-migrate      Apply Supabase migrations"
	@echo "  make clean           Nuke build artifacts, caches, venvs"

# ---- Setup ----

setup: setup-web setup-api setup-ml setup-data

setup-web:
	cd web && pnpm install

setup-api:
	cd api && uv sync

setup-ml:
	cd ml && uv sync

setup-data:
	cd data && uv sync

# ---- Dev ----

dev:
	@echo "Starting API on :8000 and web on :3000..."
	@trap 'kill 0' SIGINT; \
		(cd api && uv run uvicorn app.main:app --reload --port 8000) & \
		(cd web && pnpm dev) & \
		wait

dev-api:
	cd api && uv run uvicorn app.main:app --reload --port 8000

dev-web:
	cd web && pnpm dev

# ---- Test ----

test: test-api test-web

test-api:
	cd api && uv run pytest

test-web:
	cd web && pnpm test

# ---- Lint / format ----

lint:
	cd web && pnpm lint
	uv run ruff check api/ ml/ data/

format:
	cd web && pnpm format
	uv run ruff format api/ ml/ data/

# ---- Deploy ----

deploy-web:
	cd web && vercel --prod

deploy-api:
	cd api && fly deploy

deploy-modal:
	cd ml && uv run modal deploy modal_app.py

# ---- DB ----

db-migrate:
	cd data && supabase db push

db-reset:
	cd data && supabase db reset

# ---- Clean ----

clean:
	find . -type d -name __pycache__ -prune -exec rm -rf {} +
	find . -type d -name .pytest_cache -prune -exec rm -rf {} +
	find . -type d -name .ruff_cache -prune -exec rm -rf {} +
	find . -type d -name node_modules -prune -exec rm -rf {} +
	find . -type d -name .next -prune -exec rm -rf {} +
	find . -type d -name .venv -prune -exec rm -rf {} +
