#!/bin/sh
set -e
if [ "$NODE_ENV" = "production" ]; then
  echo "Applying Prisma migrations (production)..."
  npx prisma migrate deploy
fi
exec node dist/main.js
