# syntax=docker/dockerfile:1
FROM node:20-alpine AS build

RUN corepack enable && corepack prepare pnpm@9 --activate

WORKDIR /app

RUN printf '%s\n' 'node-linker=hoisted' > .npmrc
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY prisma ./prisma
COPY src ./src
COPY nest-cli.json tsconfig.json tsconfig.build.json ./

RUN pnpm exec prisma generate
RUN pnpm run build

FROM node:20-alpine AS prod

RUN addgroup -g 1001 -S nodejs \
    && adduser -S nestjs -u 1001 -G nodejs

RUN corepack enable && corepack prepare pnpm@9 --activate

WORKDIR /app

RUN printf '%s\n' 'node-linker=hoisted' > .npmrc
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod

COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma

USER nestjs

ENV NODE_ENV=production
ENV PORT=3001

EXPOSE 3001

CMD ["node", "dist/main"]
