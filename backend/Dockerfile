FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    curl \
 && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=5 \
    CMD curl -f http://localhost:8080/actuator/health || exit 1

# Apply any pending DB migrations before starting the API, so a deploy always
# lands on a schema that matches the code. `alembic upgrade head` is idempotent
# and the baseline uses IF NOT EXISTS, so this is safe on an existing DB. If a
# migration fails the container won't start — a safe failure (old version stays).
CMD ["sh", "-c", "alembic upgrade head && uvicorn main:app --host 0.0.0.0 --port 8080"]
