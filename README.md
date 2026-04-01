# LogiAgent ? multi-agente logística

Monorepo com **Next.js** (App Router na raiz) e **NestJS** em `apps/api`, **Prisma**, **PostgreSQL**, **Redis** e **BullMQ**. O `docker-compose.yml` na raiz sobe a stack completa: **postgres**, **redis**, **api** e **web**.

## Pré-requisitos

- **Node.js** 20+
- **pnpm** 9+
- **Docker** e Docker Compose (recomendado)

## Variáveis de ambiente (principais)

| Variável | Onde | Descrição |
| --- | --- | --- |
| `DATABASE_URL` | API (`apps/api`) | PostgreSQL (ex.: `postgresql://user:pass@localhost:5433/db` no host com Compose na porta 5433) |
| `REDIS_URL` | API | Redis (ex.: `redis://localhost:6379`) |
| `JWT_SECRET` | API | Segredo para assinar JWT (**obrigatório em produção**; mín. ~32 caracteres). **Não use o valor de exemplo em produção** ? rodeção periódica recomendada. |
| `FRONTEND_URL` | API | Origem(s) do browser permitida(s) no CORS em **produção** (lista separada por vírgula). Ex.: `https://app.exemplo.com` |
| `NEXT_PUBLIC_API_URL` | Web (build/runtime) | URL da API que o **browser** usa em chamadas diretas (ex.: `http://localhost:3001`). Sem barra final. |
| `INTERNAL_API_URL` | Web (servidor) | URL da API nas rotas Next `/api/*` (login, registo, proxy). Em Docker: `http://api:3001`; em dev local: `http://localhost:3001` |

Modelos: `.env.example` (raiz), `.env.docker.example` (Compose), `apps/api/.env.example`.

### Segurança (`JWT_SECRET`)

Se `JWT_SECRET` estiver vazio, a API usa um segredo de desenvolvimento (apenas para ambiente local). Em **produção**, defina um segredo forte e único; trate ficheiros `.env` como confidenciais e planeie rotação se houver suspeita de compromisso.

## Setup local passo a passo

1. **Clonar** o repositório.

2. **Variáveis do front** ? copiar `.env.example` ? `.env.local` na raiz:
   - `NEXT_PUBLIC_API_URL=http://localhost:3001`
   - `INTERNAL_API_URL=http://localhost:3001`

3. **Docker Compose** ? na raiz, criar `.env.docker` a partir de templates (ex.: `pnpm docker:env`) e subir serviços:
   ```bash
   docker compose up -d
   ```
   Isto inicia **postgres** (localhost **5433** ? 5432 no container), **redis**, **api** e **web** (conforme o seu `docker-compose.yml`).

4. **Migrações e seed (desenvolvimento sem container API)** ? se correr a API só com Node:
   ```bash
   pnpm --dir apps/api exec prisma migrate deploy
   pnpm --dir apps/api exec prisma db seed
   ```

5. **Ou desenvolvimento em máquina** ? com Postgres/Redis no ar:
   ```bash
   pnpm install
   pnpm --dir apps/api exec prisma generate
   pnpm --dir apps/api exec prisma migrate deploy
   pnpm --dir apps/api exec prisma db seed
   pnpm dev:api   # terminal 1 ? porta 3001
   pnpm dev       # terminal 2 ? porta 3000
   ```

6. **Primeiro utilizador** ? `/register` no front ou `POST /auth/register` na API (e-mail, senha ? 8 caracteres, nome). Depois `/login`.

7. **Abrir** [http://localhost:3000](http://localhost:3000).

Sessão no browser: cookie httpOnly via `/api/auth`; dados autenticados via proxy `/api/backend/*`.

## Docker Compose (stack)

O ficheiro `docker-compose.yml` típico inclui:

- **postgres** ? volume persistente, healthcheck  
- **redis** ? filas BullMQ  
- **api** ? imagem `apps/api`, healthcheck em `/health`  
- **web** ? imagem Next (standalone), `INTERNAL_API_URL=http://api:3001` para o servidor Next contactar a API na rede interna  

Em produção, a imagem da API pode executar `prisma migrate deploy` no arranque quando `NODE_ENV=production` (ver `docker-entrypoint.sh` em `apps/api`).

## Scripts úteis (raiz)

| Comando | Descrição |
| --- | --- |
| `pnpm dev` | Next em desenvolvimento |
| `pnpm dev:api` | Nest em watch (`apps/api`) |
| `pnpm build` | Build de produção do Next (*requer TypeScript válido*) |
| `pnpm lint` | ESLint na raiz (max 0 warnings) |
| `pnpm test:coverage` | Vitest + coverage em `apps/api` |
| `pnpm test:e2e` | Playwright (subir API + Next antes, ou usar CI) |
| `pnpm docker:up` / `pnpm docker:down` | Compose |
| `pnpm api:migrate` / `pnpm api:generate` | Prisma na API |

## Estrutura

- `app/`, `components/`, `lib/`, `e2e/`, `playwright.config.ts` ? frontend e testes E2E  
- `apps/api/` ? NestJS, Prisma, filas, Swagger em `/api/docs` (quando exposto)

## CI

O workflow `.github/workflows/ci.yml` executa **lint** (raiz + API), **test** (`pnpm test:coverage`), **build** (`pnpm build`) e job **e2e** com Postgres, Redis, migrações, seed e Playwright.
