FROM node:16.20.2-alpine AS builder

WORKDIR /app

ARG NODE_OPTIONS=--max-old-space-size=4096

ENV NODE_ENV=production \
    NODE_OPTIONS=${NODE_OPTIONS} \
    NPM_CONFIG_AUDIT=false \
    NPM_CONFIG_FUND=false

# 先复制依赖描述文件，以便复用 Docker 缓存。
COPY package.json package-lock.json ./

RUN npm ci --legacy-peer-deps

# 再复制源代码。
COPY . .

RUN npm run build:prod && test -f /app/dist/index.html

FROM nginx:1.27.5-alpine AS runtime

LABEL org.opencontainers.image.title="OpenIOV UI"
LABEL org.opencontainers.image.description="OpenIOV management frontend"

COPY ui-nginx.conf /etc/nginx/conf.d/default.conf

COPY --from=builder /app/dist/ /usr/share/nginx/html/

RUN chown -R nginx:nginx /usr/share/nginx/html && nginx -t

EXPOSE 80

HEALTHCHECK
--interval=10s
--timeout=3s
--start-period=10s
--retries=3
CMD wget -q -O /dev/null http://127.0.0.1/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
