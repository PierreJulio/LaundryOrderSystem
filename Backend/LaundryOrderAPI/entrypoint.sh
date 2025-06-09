#!/bin/bash
set -e

echo "Starting Laundry Order API..."
echo "Waiting for database to be ready..."

# Attendre que la base de données soit prête (optionnel)
sleep 5

echo "Starting the application..."
exec dotnet LaundryOrderAPI.dll
