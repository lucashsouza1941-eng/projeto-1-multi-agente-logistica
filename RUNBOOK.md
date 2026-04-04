# RUNBOOK Operacional

## Reprocessar jobs da DLQ

### Listar jobs falhos

- Endpoint: `GET /admin/failed-jobs`

```bash
curl -sS "http://localhost:3001/admin/failed-jobs" \
  -H "Authorization: Bearer ${ADMIN_JWT}"
```

### Reprocessar um job específico

- Endpoint: `POST /admin/failed-jobs/:id/retry`

```bash
curl -sS -X POST "http://localhost:3001/admin/failed-jobs/<DLQ_JOB_ID>/retry" \
  -H "Authorization: Bearer ${ADMIN_JWT}"
```

### Limpar a DLQ inteira

- Endpoint: `DELETE /admin/failed-jobs`

```bash
curl -sS -X DELETE "http://localhost:3001/admin/failed-jobs" \
  -H "Authorization: Bearer ${ADMIN_JWT}"
```

## Resposta a incidentes

### Checklist para API fora do ar

1. Verificar `GET /health`.
2. Verificar logs: `docker logs api --tail 100`.
3. Verificar Redis: `redis-cli ping`.
4. Verificar DB: `psql -c "SELECT 1"`.
5. Reiniciar serviço: `docker compose restart api`.

### Checklist para filas paradas

1. Verificar `GET /admin/metrics`.
2. Verificar workers ativos.
3. Reprocessar DLQ se necessário.

## Rollback de deploy

Passo a passo para reverter para versão anterior:

1. Identificar a imagem anterior no registry.
2. Atualizar `docker-compose.yml` com a tag anterior.
3. Se houve migração: rodar `prisma migrate resolve --rolled-back`.
4. `docker compose up -d api web`.
5. Verificar `GET /health`.

## Backup e restore testado

- Comando de backup automatizado: ver seção de automação/backup da stack (Seção 5).

Procedimento de restore testado:

1. Parar a API: `docker compose stop api`.
2. Dropar e recriar o banco.
3. Restaurar: `psql -U $POSTGRES_USER $POSTGRES_DB < backup.sql`.
4. Rodar `prisma migrate deploy`.
5. Subir a API: `docker compose start api`.
6. Verificar `GET /health`.

## Rotacao de segredos (sem downtime)

1. Gerar novos segredos:
   - `bash scripts/rotate-secrets.sh`
2. Atualizar variaveis no ambiente de producao:
   - `JWT_SECRET`
   - `REFRESH_TOKEN_SECRET`
3. Reiniciar a API (preferencialmente rolling restart).
4. Utilizadores precisarao fazer login novamente (tokens antigos invalidados).
