#!/bin/sh
# start.sh - Container startup script

set -e  # Exit on any error

echo "Starting PayZap Backend..."

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "ERROR: DATABASE_URL environment variable is not set"
    exit 1
fi

echo "Generating Prisma client..."
npx prisma generate

echo "Running database migrations..."
npx prisma migrate deploy

echo "Compiling TypeScript..."
npx tsc -b

echo "Database setup complete!"
echo "Starting the application..."
exec node dist/index.js