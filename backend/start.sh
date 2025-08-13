#!/bin/bash
set -e

echo "Starting application initialization..."

# Run database migration
echo "Running database migration..."
python migrations/add_excuse_form_fields.py

# Start the main application
echo "Starting Flask application..."
exec python src/main.py
