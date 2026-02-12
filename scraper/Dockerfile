FROM python:3.11-slim

WORKDIR /app

# Install system dependencies for psycopg2, cron, and Ollama health checks
RUN apt-get update && apt-get install -y \
    libpq-dev \
    gcc \
    cron \
    curl \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Create cron job file
RUN echo "0 * * * * cd /app && /usr/local/bin/python main.py >> /var/log/scraper.log 2>&1" > /etc/cron.d/scraper-cron \
    && chmod 0644 /etc/cron.d/scraper-cron \
    && crontab /etc/cron.d/scraper-cron \
    && touch /var/log/scraper.log

# Start script that runs initial scrape and then starts cron
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

CMD ["/docker-entrypoint.sh"]
