FROM node:22-bookworm-slim AS frontend-builder

WORKDIR /app
COPY frontend/package.json frontend/package-lock.json ./frontend/
RUN npm ci --prefix frontend
COPY frontend ./frontend
RUN npm run build --prefix frontend

FROM python:3.12-slim-bookworm AS runtime

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    ANALYST_DATA_DIR=/data

RUN apt-get update \
    && apt-get install --no-install-recommends -y bubblewrap ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY backend/requirements.lock ./backend/requirements.lock
RUN python -m pip install --no-cache-dir -r backend/requirements.lock

COPY backend ./backend
RUN python -m pip install --no-cache-dir --no-deps -e ./backend

COPY --from=frontend-builder /app/frontend/out ./frontend/out
COPY frontend/public ./frontend/public
COPY examples ./examples
COPY scripts/bootstrap_admin.py ./scripts/bootstrap_admin.py
COPY scripts/start-production.sh ./scripts/start-production.sh

RUN mkdir -p /data \
    && chmod 1777 /data \
    && chmod +x ./scripts/start-production.sh

EXPOSE 8000
CMD ["./scripts/start-production.sh"]
