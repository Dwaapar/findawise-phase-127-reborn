#!/bin/bash
# Docker entrypoint script for Python API Neuron
# ==============================================

set -e

# Function to handle shutdown
shutdown() {
    echo "Received shutdown signal. Gracefully stopping neuron..."
    if [ ! -z "$NEURON_PID" ]; then
        kill -TERM "$NEURON_PID" 2>/dev/null || true
        wait "$NEURON_PID" 2>/dev/null || true
    fi
    exit 0
}

# Set up signal handlers
trap shutdown SIGTERM SIGINT

# Set default environment variables
export FEDERATION_URL=${FEDERATION_URL:-"http://localhost:5000"}
export NEURON_ID=${NEURON_ID:-"python-neuron-$(date +%s)"}
export NEURON_NAME=${NEURON_NAME:-"Python Data Processor"}
export LOG_LEVEL=${LOG_LEVEL:-"INFO"}
export ENVIRONMENT=${ENVIRONMENT:-"production"}

# Create log directory
mkdir -p /app/logs

# Print startup information
echo "=================================================="
echo "🚀 Starting Python API Neuron"
echo "=================================================="
echo "Federation URL: $FEDERATION_URL"
echo "Neuron ID: $NEURON_ID"
echo "Neuron Name: $NEURON_NAME"
echo "Log Level: $LOG_LEVEL"
echo "Environment: $ENVIRONMENT"
echo "=================================================="

# Wait for federation to be available
echo "🔍 Waiting for federation to be available..."
while ! curl -f "$FEDERATION_URL/health" >/dev/null 2>&1; do
    echo "⏳ Federation not ready, waiting 5 seconds..."
    sleep 5
done
echo "✅ Federation is available!"

# Start the neuron
echo "🚀 Starting neuron process..."
exec "$@" &
NEURON_PID=$!

# Wait for the process
wait "$NEURON_PID"