# LogiAgent - multi-agente logistica

Monorepo com **Next.js** (App Router na raiz) e **NestJS** em `apps/api`, **Prisma**, **PostgreSQL**, **Redis** e **BullMQ**. O `docker-compose.yml` na raiz sobe a stack completa: **postgres**, **redis**, **api** e **web**.

## Pre-requisitos

- **Node.js** 20+
- **pnpm** 9+
- **Docker** e Docker Compose (recomendado)

## Variaveis de ambiente (principais)

| Variavel | Onde | Descricao |
| --- | --- | --- |
| `DATABASE_URL` | API (`apps/api`) | PostgreSQL (ex.: `postgresql://user:pass@localhost:5433/db` no host com Compose na porta 5433) |
| `REDIS_URL` | API | Redis (ex.: `redis://localhost:6379`) |
| `JWT_SECRET` | API | Segredo para assinar access JWT (**minimo 32 caracteres**). A API **nao arranca** se estiver ausente ou curto. |
| `REFRESH_TOKEN_SECRET` | API | Pepper para refresh tokens opacos (**minimo 32 caracteres**). Obrigatorio no arranque. |
| `ADMIN_INTERNAL_KEY` | API | (Opcional/legado) Chave interna administrativa; endpoints `/admin/*` atuais usam JWT com role `admin`. |
| `FRONTEND_URL` | API | Origem(ns) do browser no CORS em **producao** (lista separada por virgula). Ex.: `https://app.exemplo.com` |
| `NEXT_PUBLIC_API_URL` | Web (build/runtime) | URL da API que o **browser** usa (ex.: `http://localhost:3001`). Sem barra final. |
| `INTERNAL_API_URL` | Web (servidor) | URL da API nas rotas Next `/api/*`. Em Docker: `http://api:3001`; em dev: `http://localhost:3001` |

Modelos: `.env.example` (raiz), `.env.docker.example` (Compose), `apps/api/.env.example`.

### Seguranca (`JWT_SECRET` e `REFRESH_TOKEN_SECRET`)

- `JWT_SECRET` deve ter no minimo **32 caracteres aleatorios**.
- `REFRESH_TOKEN_SECRET` deve ser uma variavel de ambiente **separada** (nao reutilizar `JWT_SECRET`), tambem com minimo de 32 caracteres.
- Na inicializacao (`main.ts`), se `JWT_SECRET` ou `REFRESH_TOKEN_SECRET` estiverem ausentes ou curtos, o processo termina com erro.
- Trate ficheiros `.env` como confidenciais e planeie rotacao se houver suspeita de compromisso.

## Setup local passo a passo

1. **Clonar** o repositorio.

2. **Variaveis do front** ? copiar `.env.example` para `.env.local` na raiz:
   - `NEXT_PUBLIC_API_URL=http://localhost:3001`
   - `INTERNAL_API_URL=http://localhost:3001`

3. **Docker Compose** ? na raiz, criar `.env.docker` a partir dos templates (ex.: `pnpm docker:env`) e subir servicos:

   ```bash
   docker compose up -d
   ```

   Isto inicia **postgres** (localhost **5433** mapeado para 5432 no container), **redis**, **api** e **web**.

4. **Migracoes e seed (desenvolvimento sem container API)** ? se correr a API so com Node:

   ```bash
   pnpm --dir apps/api exec prisma migrate deploy
   pnpm --dir apps/api exec prisma db seed
   ```

5. **Ou desenvolvimento em maquina** ? com Postgres/Redis no ar:

   ```bash
   pnpm install
   pnpm --dir apps/api exec prisma generate
   pnpm --dir apps/api exec prisma migrate deploy
   pnpm --dir apps/api exec prisma db seed
   pnpm dev:api   # terminal 1 ? porta 3001
   pnpm dev       # terminal 2 ? porta 3000
   ```

6. **Primeiro utilizador** ? `/register` no front ou `POST /auth/register` na API. Depois `/login` (redireciona para `/dashboard`).

7. **Abrir** [http://localhost:3000](http://localhost:3000).

Sessao no browser: cookies httpOnly via `/api/auth` (access + refresh); dados autenticados via proxy `/api/backend/*`.

## Docker Compose (stack)

- **postgres** ? volume persistente, healthcheck
- **redis** ? filas BullMQ
- **api** ? imagem `apps/api`, healthcheck em `GET /health`
- **web** ? imagem Next (standalone), `INTERNAL_API_URL=http://api:3001`

Em producao, a imagem da API pode executar `prisma migrate deploy` no arranque quando `NODE_ENV=production` (ver `docker-entrypoint.sh` em `apps/api`).

## Scripts uteis (raiz)

| Comando | Descricao |
| --- | --- |
| `pnpm dev` | Next em desenvolvimento |
| `pnpm dev:api` | Nest em watch (`apps/api`) |
| `pnpm build` | Build de producao do Next (*requer TypeScript valido*) |
| `pnpm lint` | ESLint na raiz (max 0 warnings) |
| `pnpm test:coverage` | Vitest + coverage em `apps/api` |
| `pnpm test:frontend` | Vitest (jsdom) em `lib/` e `components/*.test.tsx` |
| `pnpm test:e2e` | Playwright (subir API + Next antes, ou usar CI) |
| `pnpm docker:up` / `pnpm docker:down` | Compose |
| `pnpm api:migrate` / `pnpm api:generate` | Prisma na API |

## Estrutura

- `app/`, `components/`, `lib/`, `e2e/`, `playwright.config.ts` ? frontend e testes E2E
- `apps/api/` ? NestJS, Prisma, filas, Swagger em `/api/docs` (quando exposto)

## CI

O workflow `.github/workflows/ci.yml` executa **lint** (raiz + API), **test** (`pnpm test:coverage`), **build** (`pnpm build`) e job **e2e** com Postgres, Redis, migracoes, seed e Playwright.

- Politica de branch: a `main` deve exigir **CI verde** (todos os jobs obrigatorios) antes de qualquer merge.

## Atualizacao de dependencias

- O **Dependabot** (`.github/dependabot.yml`) abre PRs **semanais** para `patch` e `minor` na raiz e em `apps/api`; atualizacoes **patch** sao agrupadas para reduzir ruido.
- Atualizacoes **major** devem ser avaliadas manualmente (breaking changes).
- Antes de fazer merge de qualquer PR de dependencias: executar `pnpm test:coverage` (API) e `pnpm build` (Next).

## Controle de Acesso

- Roles existentes:
  - `user`: acesso as rotas de produto do proprio tenant (dashboard, emails, reports, tickets, api-keys).
  - `admin`: acesso adicional a operacoes administrativas (`/admin/*`).
- Promocao para admin (SQL):

  ```sql
  UPDATE "User" SET "role" = 'ADMIN' WHERE "email" = 'admin@exemplo.com';
  ```

- Endpoints que exigem admin:
  - `GET /admin/failed-jobs`
  - `POST /admin/failed-jobs/:id/retry`
  - `DELETE /admin/failed-jobs`
  - `GET /admin/metrics`
- Politica de API keys:
  - Escopo: autenticacao de integracoes no contexto do utilizador dono da chave.
  - Expiracao recomendada: rotacao periodica (ex.: a cada 90 dias).
  - Revogacao: `DELETE /api-keys/:id` (soft delete via `revokedAt`).

## Operacao de filas (BullMQ)

- Filas principais: `email-triage`, `report-generation`, `escalation-processing`.
- Politica de resiliencia (todas as filas): `attempts: 3` + `backoff: { type: exponential, delay: 2000 }`.
- Jobs que esgotam tentativas sao encaminhados para a fila **`failed-jobs`** (DLQ).
- **Inspecao**: `GET /admin/failed-jobs` (header `x-admin-key` se `ADMIN_INTERNAL_KEY` estiver definido).
- **Metricas**: `GET /admin/metrics` (contagens por estado e tempo medio dos ultimos 100 concluidos por fila).
- **Reprocessar (manual)**:
  1. Ler entradas da DLQ via `GET /admin/failed-jobs`.
  2. Reenfileirar o `data` no endpoint/fluxo original (ex.: `POST /emails/:id/process` para triagem).
  3. Confirmar em `GET /admin/metrics` que `failed` diminuiu e `completed` aumentou.
- **Limpar DLQ (manual)**:
  - via UI Bull Board/Redis Insight, ou
  - script Node com BullMQ chamando `queue.obliterate({ force: true })` apenas em ambiente controlado.

## Backup e restore do banco de dados

- **Backup** (PostgreSQL no host ou container com `psql`/`pg_dump` disponivel):

  ```bash
  pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB" > backup.sql
  ```

- **Restore**:

  ```bash
  psql -U "$POSTGRES_USER" "$POSTGRES_DB" < backup.sql
  ```

- Recomenda-se executar **backup antes** de `prisma migrate deploy` em producao.
- Em bases gerenciadas, use tambem os mecanismos nativos de backup/PITR: [Railway backups](https://docs.railway.com/databases/postgresql#backups), [Supabase backups](https://supabase.com/docs/guides/platform/backups), [Amazon RDS backup](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/CHAP_CommonTasks.BackupRestore.html).
