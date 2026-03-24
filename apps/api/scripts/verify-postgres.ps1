# PASSO 4 — Verificar usuário e banco (Docker Compose já cria logiagent/logiagent/logiagent).
# Se o container tiver outro nome, ajuste $container.

$container = "logiagent-postgres"
Write-Host "Verificando conexão em $container..."
docker exec $container psql -U logiagent -d logiagent -c "SELECT current_user AS usuario, current_database() AS banco, version();"
