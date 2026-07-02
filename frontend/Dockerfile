FROM node:22-bookworm-slim AS build

ARG VITE_API_URL=/api
ARG VITE_TENANT_ID=platform

ENV VITE_API_URL=${VITE_API_URL}
ENV VITE_TENANT_ID=${VITE_TENANT_ID}

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY tsconfig.json vite.config.ts tailwind.config.ts postcss.config.js index.html ./
COPY src ./src
RUN npm run build

FROM nginxinc/nginx-unprivileged:1.28-alpine AS runtime

COPY --chown=101:101 --chmod=644 docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --chown=101:101 --from=build /app/dist /usr/share/nginx/html

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://127.0.0.1:8080/healthz || exit 1
