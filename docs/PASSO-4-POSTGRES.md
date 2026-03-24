# PASSO 4 — Usuário e banco Postgres (complemento do guia)

## Quando **não** precisa fazer nada

Com o `docker-compose.yml` atual, as variáveis abaixo **já criam** usuário, senha e banco na primeira subida do container:

- `POSTGRES_USER=logiagent`
- `POSTGRES_PASSWORD=logiagent`
- `POSTGRES_DB=logiagent`

## Comando que estava cortado (`docker exec -it $(...)`)

Use o **nome do container** (fixo no compose):

```powershell
docker exec -it logiagent-postgres psql -U logiagent -d logiagent
```

Verificação rápida (sem TTY interativo):

```powershell
docker exec logiagent-postgres psql -U logiagent -d logiagent -c "SELECT current_user, current_database();"
```

## Se precisar criar usuário/banco manualmente (Postgres “vazio”)

Entre no `psql` como superuser (imagem oficial usa o usuário definido em `POSTGRES_USER`; não há `postgres` por padrão se só existir `logiagent`):

```powershell
docker exec -it logiagent-postgres psql -U logiagent -d logiagent
```

Em outro cenário (imagem com usuário `postgres`):

```sql
CREATE USER logiagent WITH PASSWORD 'logiagent';
CREATE DATABASE logiagent OWNER logiagent;
GRANT ALL PRIVILEGES ON DATABASE logiagent TO logiagent;
```

## Depois: aplicar o schema Prisma **no seu PC** (fora de sandbox)

```powershell
cd "c:\Users\Administrador\Documents\GitHub\Prompts Lucas\apps\api"
pnpm exec prisma generate
pnpm exec prisma db push
```

> A pasta `prisma/migrations/.../migration.sql` atual contém só um `ALTER TABLE`; em banco novo use `db push` ou gere migrações íntegras com `prisma migrate dev`.

## Se der `P1000` no host mas `docker exec` funciona

1. Confirme que só um serviço usa a porta **5432**: `Get-NetTCPConnection -LocalPort 5432`
2. Teste no PowerShell: `Test-NetConnection -ComputerName 127.0.0.1 -Port 5432`
3. Garanta `apps/api/.env` com o mesmo usuário/senha do container.

Script auxiliar: `apps/api/scripts/verify-postgres.ps1`
