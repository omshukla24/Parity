# P.A.R.I.T.Y. - Google Cloud Run
# Multi-stage build: builds React frontend + Python backend in one step
# Usage: gcloud run deploy parity --source . --region us-central1 --allow-unauthenticated

# ── Stage 1: Build React frontend ──────────────────────────────────────────
FROM node:20-slim AS frontend-builder

WORKDIR /app

# Install Node dependencies
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

# Copy frontend source and build
COPY index.html vite.config.ts tsconfig.json tsconfig.node.json ./
COPY src/ ./src/
RUN npm run build

# ── Stage 2: Python backend ─────────────────────────────────────────────────
FROM python:3.11-slim

WORKDIR /app

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend source
COPY main.py .
COPY agents/ ./agents/

# Copy pre-built React frontend from stage 1
COPY --from=frontend-builder /app/dist ./dist/

# Cloud Run sets PORT env var (always 8080 on Cloud Run)
ENV PORT=8080

EXPOSE 8080

CMD uvicorn main:app --host 0.0.0.0 --port ${PORT}
