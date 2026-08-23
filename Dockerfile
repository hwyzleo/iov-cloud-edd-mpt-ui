FROM node:16.20.2-alpine AS builder

WORKDIR /app

ARG NODE_OPTIONS=--max-old-space-size=4096

ENV NODE_OPTIONS=${NODE_OPTIONS}
ENV NPM_CONFIG_AUDIT=false
ENV NPM_CONFIG_FUND=false

COPY package.json package-lock.json ./

RUN npm ci --include=dev --legacy-peer-deps

COPY . .

RUN npm run build:prod && test -f /app/dist/index.html

FROM nginx:1.27.5-alpine AS runtime

COPY ui-nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist/ /usr/share/nginx/html/

RUN nginx -t

EXPOSE 80

HEALTHCHECK --interval=10s --timeout=3s --start-period=10s --retries=3 CMD wget -q -O /dev/null http://127.0.0.1/ || exit 1
