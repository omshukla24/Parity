#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# P·A·R·I·T·Y — Google Cloud Run Deploy Script
# ═══════════════════════════════════════════════════════════════
# Usage:  bash deploy.sh
# Reads keys from .env → deploys to parity-491619 on Cloud Run
# ═══════════════════════════════════════════════════════════════
set -e

PROJECT_ID="parity-491619"
SERVICE_NAME="parity"
REGION="us-central1"

echo "🚀 P·A·R·I·T·Y Deploy → $PROJECT_ID"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# ── Load .env ──────────────────────────────────────────────────
if [ ! -f .env ]; then
  echo "❌ .env file not found. Copy .env.example → .env and fill in your keys."
  exit 1
fi

# Export vars from .env (skip comments and blank lines)
export $(grep -v '^#' .env | grep -v '^$' | xargs)

# ── Validate required key ──────────────────────────────────────
if [ -z "$GOOGLE_API_KEY" ]; then
  echo "❌ GOOGLE_API_KEY not set in .env"
  exit 1
fi

echo "✅ GOOGLE_API_KEY found (Gemini 2.5 Flash)"

# ── Build env vars string for Cloud Run ───────────────────────
ENV_VARS="GOOGLE_API_KEY=${GOOGLE_API_KEY}"

if [ -n "$FEATHERLESS_API_KEY" ]; then
  ENV_VARS="${ENV_VARS},FEATHERLESS_API_KEY=${FEATHERLESS_API_KEY}"
  echo "✅ FEATHERLESS_API_KEY found (fallback)"
fi

if [ -n "$N8N_WEBHOOK_URL" ]; then
  ENV_VARS="${ENV_VARS},N8N_WEBHOOK_URL=${N8N_WEBHOOK_URL}"
  echo "✅ N8N_WEBHOOK_URL found"
fi

if [ -n "$MIRO_ACCESS_TOKEN" ]; then
  ENV_VARS="${ENV_VARS},MIRO_ACCESS_TOKEN=${MIRO_ACCESS_TOKEN}"
  echo "✅ MIRO_ACCESS_TOKEN found"
fi

echo ""
echo "📦 Building React frontend..."
npm run build

echo ""
echo "☁️  Deploying to Cloud Run..."
gcloud run deploy "$SERVICE_NAME" \
  --source . \
  --project "$PROJECT_ID" \
  --platform managed \
  --region "$REGION" \
  --allow-unauthenticated \
  --port 8080 \
  --memory 1Gi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 10 \
  --set-env-vars "$ENV_VARS"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Deployed! Your app is live at the URL above."
echo "   Health check: <URL>/health"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
