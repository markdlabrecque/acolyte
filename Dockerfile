FROM node:24.20.0-bookworm-slim@sha256:ba849c60be29959425b8734d57b8b4b7d56f98edd9504c9af091d5281095a71e

WORKDIR /app
COPY package.json package-lock.json .nvmrc ./
RUN test "$(node --version)" = "v$(cat .nvmrc)" \
    && test "$(npm --version)" = "11.19.0" \
    && npm ci --include=dev --no-audit --no-fund \
    && npm cache clean --force

COPY tsconfig.json ./
COPY src/ ./src/
COPY tests/ ./tests/
USER node
CMD ["sh", "-c", "npm test && npm run typecheck"]
