# Backend - Flask + Gunicorn
FROM python:3.11-slim AS base

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

# Install build deps for pandas (requires gcc)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY backend/requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r /app/requirements.txt

COPY backend /app

EXPOSE 5000

CMD ["gunicorn", "-b", "0.0.0.0:5000", "app.main:app", "--workers=2", "--threads=4"]
