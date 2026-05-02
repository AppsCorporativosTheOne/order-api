# syntax=docker/dockerfile:1

FROM node:20-alpine AS base
WORKDIR /app
RUN apk add --no-cache libc6-compat
COPY package.json package-lock.json ./

FROM base AS development
ENV NODE_ENV=development
COPY docker/entrypoint-dev.sh /usr/local/bin/entrypoint-dev.sh
RUN chmod +x /usr/local/bin/entrypoint-dev.sh
COPY . .
RUN npm ci
EXPOSE 3333
ENTRYPOINT ["/usr/local/bin/entrypoint-dev.sh"]
CMD ["npx", "tsx", "watch", "src/server.ts"]

FROM base AS builder
COPY . .
RUN npm ci && npm run build

FROM node:20-alpine AS production
WORKDIR /app
RUN apk add --no-cache libc6-compat
ENV NODE_ENV=production
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=builder --chown=node:node /app/dist ./dist
USER node
EXPOSE 3333
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3333)+'/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "dist/server.js"]
