FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY neuron_client.py .

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV FEDERATION_URL=http://host.docker.internal:5000

# Expose health check port (if implementing HTTP endpoints)
EXPOSE 8080

# Run the neuron
CMD ["python", "neuron_client.py"]