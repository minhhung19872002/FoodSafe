# syntax=docker/dockerfile:1.7
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
# Cypress is a test-only dependency; the production image only needs its
# TypeScript package metadata, not the ~200 MB browser binary.
RUN CYPRESS_INSTALL_BINARY=0 npm ci
COPY . .
RUN npm run build

# 1.30 = current nginx *stable* branch; its -alpine tag is actively rebuilt
# with Alpine security fixes (1.27 is retired and frozen). Keep the minor pin
# so upgrades stay deliberate.
FROM nginxinc/nginx-unprivileged:1.30-alpine
USER root
RUN apk upgrade --no-cache
# The snippet must NOT live in conf.d/ — everything matching conf.d/*.conf is
# auto-included into the http{} block, and these are server/location directives.
COPY docker/security-headers.conf /etc/nginx/snippets/security-headers.conf
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
USER nginx
EXPOSE 8080
HEALTHCHECK --interval=15s --timeout=3s --retries=5 \
  CMD wget -q -O /dev/null http://127.0.0.1:8080/healthz || exit 1
