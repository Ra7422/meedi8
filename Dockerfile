# Use official Python runtime as base image
FROM python:3.9-slim

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Copy entire repo (dockerignore will filter)
COPY . .

# Debug: List what was copied
RUN ls -la && echo "=== Checking for backend ===" && ls -la backend/ || echo "Backend directory not found!"

# Install Python dependencies from backend
RUN pip install --no-cache-dir -r backend/requirements.txt

# Set working directory to backend
WORKDIR /app/backend

# Expose port (Railway will set this via $PORT env var)
EXPOSE 8000

# Run migrations and start server
CMD ["sh", "-c", "alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
