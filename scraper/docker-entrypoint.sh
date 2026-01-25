#!/bin/bash

# Export environment variables for cron
printenv | grep -E '^(DATABASE_URL|V2EX_TOKEN|RAPIDAPI_KEY)=' >> /etc/environment

# Run initial scrape on startup
echo "$(date): Running initial scrape..."
cd /app && python main.py

# Start cron in foreground
echo "$(date): Starting cron scheduler (runs every hour)..."
cron -f
