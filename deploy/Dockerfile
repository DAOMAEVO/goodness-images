# ---- Build stage ----
FROM node:20-alpine AS build

WORKDIR /app

ARG VITE_SYSTEM_API_URL=
ARG VITE_SYSTEM_API_KEY=
ARG VITE_SYSTEM_API_MODE=
ARG VITE_SYSTEM_MODEL=
ARG VITE_SYSTEM_TIMEOUT=
ARG VITE_SYSTEM_CODEX_CLI=

ENV VITE_DEFAULT_API_URL=__VITE_DEFAULT_API_URL_PLACEHOLDER__
ENV VITE_SYSTEM_API_URL=$VITE_SYSTEM_API_URL
ENV VITE_SYSTEM_API_KEY=$VITE_SYSTEM_API_KEY
ENV VITE_SYSTEM_API_MODE=$VITE_SYSTEM_API_MODE
ENV VITE_SYSTEM_MODEL=$VITE_SYSTEM_MODEL
ENV VITE_SYSTEM_TIMEOUT=$VITE_SYSTEM_TIMEOUT
ENV VITE_SYSTEM_CODEX_CLI=$VITE_SYSTEM_CODEX_CLI

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# ---- Production stage ----
FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY deploy/inject-api-url.sh /docker-entrypoint.d/40-inject-api-url.sh
RUN sed -i 's/\r$//' /docker-entrypoint.d/40-inject-api-url.sh
RUN chmod +x /docker-entrypoint.d/40-inject-api-url.sh

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
