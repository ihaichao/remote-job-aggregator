#!/bin/bash

# Export environment variables for cron
printenv | grep -E '^(DATABASE_URL|V2EX_TOKEN|RAPIDAPI_KEY|OLLAMA_BASE_URL)=' >> /etc/environment

# ============================================
#  Wait for Ollama & auto-pull model
# ============================================
OLLAMA_URL="${OLLAMA_BASE_URL:-http://ollama:11434}"
MODEL_NAME="qwen2.5:1.5b"

echo "$(date): Waiting for Ollama at ${OLLAMA_URL}..."
until curl -sf "${OLLAMA_URL}/api/tags" > /dev/null 2>&1; do
  echo "  Ollama not ready, retrying in 5s..."
  sleep 5
done
echo "$(date): Ollama is up!"

# Check if model is already installed
if curl -sf "${OLLAMA_URL}/api/tags" | grep -q "${MODEL_NAME}"; then
  echo "$(date): Model '${MODEL_NAME}' already installed."
else
  echo "$(date): Pulling model '${MODEL_NAME}'... (this may take a few minutes on first run)"
  curl -sf "${OLLAMA_URL}/api/pull" -d "{\"name\":\"${MODEL_NAME}\"}" > /dev/null
  echo "$(date): Model '${MODEL_NAME}' pulled successfully."
fi

# ============================================
#  Run initial scrape on startup
# ============================================
echo "$(date): Running initial scrape..."
cd /app && python main.py

# Start cron in foreground
echo "$(date): Starting cron scheduler (runs every hour)..."
cron -f
