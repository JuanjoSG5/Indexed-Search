
FROM node:20-alpine AS builder

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

COPY package*.json ./

RUN pnpm install

COPY . .
RUN ls -la
RUN pnpm run build

FROM node:20-alpine

WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./

COPY --from=builder /app/package.json /app/index_snapshot.json.g[z] ./

ENV NODE_OPTIONS="--max-old-space-size=450"

EXPOSE 3000

CMD ["node", "dist/main"]