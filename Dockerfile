# syntax=docker/dockerfile:1
FROM node:22-bookworm-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
RUN npm ci

FROM node:22-bookworm-slim AS api-build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules
COPY package.json package-lock.json ./
COPY apps/api ./apps/api
RUN npm run build -w @contract-spirit/api

FROM node:22-bookworm-slim AS web-build
WORKDIR /app
ARG NEXT_PUBLIC_API_URL=http://localhost:4000
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/web/node_modules ./apps/web/node_modules
COPY package.json package-lock.json ./
COPY apps/web ./apps/web
RUN npm run build -w @contract-spirit/web

FROM node:22-bookworm-slim AS api
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY --from=api-build /app/apps/api ./apps/api
COPY package.json ./
RUN mkdir -p /data
ENV DB_PATH=/data/contract-spirit.db
ENV PORT=4000
EXPOSE 4000
CMD ["node", "apps/api/dist/index.js"]

FROM node:22-bookworm-slim AS web
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY --from=web-build /app/apps/web ./apps/web
COPY package.json ./
ENV PORT=3000
EXPOSE 3000
CMD ["npm", "run", "start", "-w", "@contract-spirit/web"]
