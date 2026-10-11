#!/usr/bin/env sh
set -eu

export PATH="/opt/prisma-tools/node_modules/.bin:$PATH"
TOOLS="/opt/prisma-tools"

echo "==> waiting for database…"
i=0
until (
  cd "$TOOLS"
  node -e "const {PrismaClient}=require('@prisma/client'); const p=new PrismaClient(); p.\$connect().then(()=>p.\$disconnect()).then(()=>process.exit(0)).catch(()=>process.exit(1))"
); do
  i=$((i+1))
  if [ "$i" -ge 30 ]; then
    echo "ERROR: database not reachable" >&2
    exit 1
  fi
  sleep 2
done

echo "==> sync prisma files into tools dir"
rm -rf "$TOOLS/prisma"
cp -R /app/prisma "$TOOLS/prisma"
cp -f /app/package.json "$TOOLS/package.json"

echo "==> prisma migrate deploy"
(
  cd "$TOOLS"
  npx prisma migrate deploy --schema=./prisma/schema.prisma
)

if [ "${RUN_SEED:-false}" = "true" ]; then
  echo "==> prisma db seed (RUN_SEED=true)"
  (
    cd "$TOOLS"
    npx prisma db seed --schema=./prisma/schema.prisma
  )
fi

echo "==> starting Next.js"
cd /app
exec "$@"
