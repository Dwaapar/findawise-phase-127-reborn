# API-Only Neuron: Python Reference Implementation

## Overview

This document provides a complete guide for building and deploying Python-based API-only neurons that integrate with the Findawise Empire Federation. API-only neurons are backend services, data processors, scrapers, ML models, or microservices that participate in the federation without a UI component.

## What is an API-Only Neuron?

An API-only neuron is a backend service that:
- Runs independently (containers, servers, cron jobs, etc.)
- Registers with the Empire Federation on startup
- Sends heartbeats every 60 seconds to report health
- Receives configuration updates and commands from the federation
- Reports analytics and metrics to the central system
- Can be monitored, configured, and controlled through the admin dashboard

## Federation Integration Requirements

### 1. Registration (Required on Boot)
```python
POST /api/neuron/register
Content-Type: application/json

{
  "neuronId": "data-processor-001",
  "name": "Customer Data Processor",
  "type": "python-data-processor",
  "language": "python",
  "version": "1.2.0",
  "baseUrl": "http://localhost:8080",
  "healthcheckEndpoint": "/health",
  "apiEndpoints": [
    {
      "path": "/process",
      "method": "POST",
      "description": "Process customer data batch"
    },
    {
      "path": "/status",
      "method": "GET", 
      "description": "Get processing status"
    }
  ],
  "authentication": {
    "type": "jwt",
    "tokenEndpoint": "/auth/token"
  },
  "capabilities": [
    "data_processing",
    "batch_operations", 
    "real_time_processing"
  ],
  "dependencies": ["postgresql", "redis", "s3"],
  "resourceRequirements": {
    "cpu": "2 cores",
    "memory": "4GB",
    "storage": "10GB"
  },
  "deploymentInfo": {
    "type": "container",
    "image": "mycompany/data-processor:1.2.0",
    "ports": [8080]
  },
  "alertThresholds": {
    "errorRate": 5,
    "responseTime": 2000,
    "healthScore": 80
  },
  "metadata": {
    "environment": "production",
    "region": "us-east-1"
  }
}
```

### 2. Heartbeat System (Every 60 seconds)
```python
POST /api/neuron/status
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "status": "active",
  "healthScore": 95,
  "uptime": 3600,
  "processId": "12345",
  "hostInfo": {
    "hostname": "data-processor-01",
    "ip": "10.0.1.50",
    "containerId": "abc123"
  },
  "systemMetrics": {
    "cpuUsage": 45.2,
    "memoryUsage": 68.5,
    "diskUsage": 25.3
  },
  "applicationMetrics": {
    "requestsPerSecond": 150.5,
    "averageResponseTime": 250,
    "activeConnections": 12,
    "queueSize": 5
  },
  "dependencyStatus": {
    "postgresql": "healthy",
    "redis": "healthy", 
    "s3": "healthy"
  },
  "performanceMetrics": {
    "successRate": 99.8,
    "errorCount": 2,
    "warningCount": 0
  },
  "configVersion": "1.2.0",
  "buildVersion": "build-456"
}
```

### 3. Analytics Reporting
```python
POST /api/analytics/report
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "neuronId": "data-processor-001", 
  "metrics": {
    "totalRequests": 1500,
    "successfulRequests": 1497,
    "failedRequests": 3,
    "averageResponseTime": 245,
    "dataProcessed": 2500000,
    "customMetrics": {
      "recordsProcessed": 10000,
      "batchesCompleted": 50,
      "duplicatesFound": 23
    }
  },
  "events": [
    {
      "type": "batch_completed",
      "timestamp": "2025-01-21T11:30:00Z",
      "data": {
        "batchId": "batch-789",
        "recordCount": 200,
        "processingTime": 45000
      }
    }
  ]
}
```

### 4. Configuration Updates
```python
POST /api/neuron/update-config
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "config": {
    "batchSize": 1000,
    "maxRetries": 3,
    "timeoutSeconds": 30,
    "enableDebugMode": false
  },
  "experiment": {
    "id": "exp-001",
    "variant": "optimized_batch_size",
    "config": {
      "batchSize": 1500
    }
  },
  "command": {
    "type": "restart_worker",
    "data": {
      "workerId": "worker-3",
      "graceful": true
    }
  }
}
```

## Python Implementation Example

### Complete Production-Ready Client

```python
import asyncio
import aiohttp
import json
import time
import psutil
import logging
import os
from datetime import datetime
from typing import Dict, Any, Optional
from dataclasses import dataclass, asdict

@dataclass
class NeuronConfig:
    neuron_id: str
    name: str
    type: str
    federation_url: str
    jwt_token: Optional[str] = None
    heartbeat_interval: int = 60
    
class FederationClient:
    def __init__(self, config: NeuronConfig):
        self.config = config
        self.session: Optional[aiohttp.ClientSession] = None
        self.running = False
        self.start_time = time.time()
        
    async def __aenter__(self):
        self.session = aiohttp.ClientSession()
        return self
        
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()
    
    async def register(self) -> bool:
        """Register this neuron with the federation"""
        registration_data = {
            "neuronId": self.config.neuron_id,
            "name": self.config.name,
            "type": self.config.type,
            "language": "python",
            "version": "1.0.0",
            "healthcheckEndpoint": "/health",
            "apiEndpoints": [
                {
                    "path": "/process",
                    "method": "POST",
                    "description": "Process data batch"
                }
            ],
            "authentication": {
                "type": "jwt"
            },
            "capabilities": ["data_processing", "batch_operations"],
            "dependencies": ["postgresql"],
            "resourceRequirements": {
                "cpu": "1 core",
                "memory": "2GB",
                "storage": "5GB"
            },
            "deploymentInfo": {
                "type": "container",
                "image": f"{self.config.type}:1.0.0"
            },
            "alertThresholds": {
                "errorRate": 5,
                "responseTime": 2000,
                "healthScore": 80
            }
        }
        
        try:
            async with self.session.post(
                f"{self.config.federation_url}/api/neuron/register",
                json=registration_data,
                headers={"Content-Type": "application/json"}
            ) as response:
                if response.status == 201:
                    data = await response.json()
                    self.config.jwt_token = data["data"]["token"]
                    logging.info(f"✅ Registered with federation: {self.config.neuron_id}")
                    return True
                else:
                    error_text = await response.text()
                    logging.error(f"❌ Registration failed: {response.status} - {error_text}")
                    return False
        except Exception as e:
            logging.error(f"❌ Registration error: {e}")
            return False
    
    async def send_heartbeat(self) -> bool:
        """Send heartbeat to federation"""
        if not self.config.jwt_token:
            logging.error("❌ No JWT token - cannot send heartbeat")
            return False
            
        # Collect system metrics
        cpu_percent = psutil.cpu_percent(interval=1)
        memory = psutil.virtual_memory()
        disk = psutil.disk_usage('/')
        
        heartbeat_data = {
            "status": "active",
            "healthScore": self._calculate_health_score(),
            "uptime": int(time.time() - self.start_time),
            "processId": str(os.getpid()),
            "hostInfo": {
                "hostname": os.uname().nodename,
                "pid": os.getpid()
            },
            "systemMetrics": {
                "cpuUsage": cpu_percent,
                "memoryUsage": memory.percent,
                "diskUsage": disk.percent
            },
            "applicationMetrics": {
                "requestsPerSecond": 0,  # Implement your metrics
                "averageResponseTime": 0,
                "activeConnections": 0
            },
            "dependencyStatus": {
                "postgresql": "healthy"  # Check your dependencies
            },
            "performanceMetrics": {
                "successRate": 99.9,
                "errorCount": 0,
                "warningCount": 0
            },
            "configVersion": "1.0.0"
        }
        
        try:
            async with self.session.post(
                f"{self.config.federation_url}/api/neuron/status",
                json=heartbeat_data,
                headers={
                    "Authorization": f"Bearer {self.config.jwt_token}",
                    "Content-Type": "application/json"
                }
            ) as response:
                if response.status == 200:
                    logging.debug(f"💓 Heartbeat sent successfully")
                    return True
                else:
                    error_text = await response.text()
                    logging.error(f"❌ Heartbeat failed: {response.status} - {error_text}")
                    return False
        except Exception as e:
            logging.error(f"❌ Heartbeat error: {e}")
            return False
    
    async def report_analytics(self, metrics: Dict[str, Any]) -> bool:
        """Report analytics to federation"""
        if not self.config.jwt_token:
            return False
            
        analytics_data = {
            "neuronId": self.config.neuron_id,
            "metrics": metrics,
            "timestamp": datetime.utcnow().isoformat()
        }
        
        try:
            async with self.session.post(
                f"{self.config.federation_url}/api/analytics/report",
                json=analytics_data,
                headers={
                    "Authorization": f"Bearer {self.config.jwt_token}",
                    "Content-Type": "application/json"
                }
            ) as response:
                return response.status == 200
        except Exception as e:
            logging.error(f"❌ Analytics reporting error: {e}")
            return False
    
    async def get_config(self) -> Optional[Dict[str, Any]]:
        """Get current configuration from federation"""
        if not self.config.jwt_token:
            return None
            
        try:
            async with self.session.get(
                f"{self.config.federation_url}/api/neuron/config",
                headers={"Authorization": f"Bearer {self.config.jwt_token}"}
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    return data["data"]
                return None
        except Exception as e:
            logging.error(f"❌ Config fetch error: {e}")
            return None
    
    def _calculate_health_score(self) -> int:
        """Calculate health score based on system metrics"""
        # Implement your health scoring logic
        cpu_percent = psutil.cpu_percent()
        memory = psutil.virtual_memory()
        
        # Simple scoring: penalize high resource usage
        score = 100
        if cpu_percent > 80:
            score -= 20
        elif cpu_percent > 60:
            score -= 10
            
        if memory.percent > 90:
            score -= 20
        elif memory.percent > 70:
            score -= 10
            
        return max(0, score)
    
    async def heartbeat_loop(self):
        """Main heartbeat loop"""
        self.running = True
        while self.running:
            await self.send_heartbeat()
            await asyncio.sleep(self.config.heartbeat_interval)
    
    def stop(self):
        """Stop the heartbeat loop"""
        self.running = False

# Example usage in your application
async def main():
    # Configure your neuron
    config = NeuronConfig(
        neuron_id="python-processor-001",
        name="Python Data Processor",
        type="python-data-processor",
        federation_url="http://localhost:5000"
    )
    
    # Setup logging
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(levelname)s - %(message)s'
    )
    
    async with FederationClient(config) as client:
        # Register with federation
        if await client.register():
            # Start heartbeat loop
            heartbeat_task = asyncio.create_task(client.heartbeat_loop())
            
            try:
                # Your application logic here
                while True:
                    # Example: Process some data
                    await asyncio.sleep(10)
                    
                    # Report analytics
                    await client.report_analytics({
                        "totalRequests": 100,
                        "successfulRequests": 95,
                        "failedRequests": 5,
                        "averageResponseTime": 250
                    })
                    
            except KeyboardInterrupt:
                logging.info("🛑 Shutting down...")
                client.stop()
                await heartbeat_task

if __name__ == "__main__":
    asyncio.run(main())
```

## Docker Deployment

### Dockerfile
```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create non-root user
RUN useradd -m -u 1000 appuser && chown -R appuser:appuser /app
USER appuser

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD python -c "import requests; requests.get('http://localhost:8080/health')"

# Expose port
EXPOSE 8080

# Run the application
CMD ["python", "neuron_app.py"]
```

### requirements.txt
```
aiohttp==3.9.1
psutil==5.9.6
asyncio-mqtt==0.13.0
sqlalchemy==2.0.23
asyncpg==0.29.0
prometheus-client==0.19.0
structlog==23.2.0
```

### docker-compose.yml
```yaml
version: '3.8'

services:
  python-neuron:
    build: .
    environment:
      - FEDERATION_URL=http://federation-core:5000
      - NEURON_ID=python-processor-001
      - NEURON_NAME=Python Data Processor
      - DATABASE_URL=postgresql://user:pass@postgres:5432/neuron_db
      - LOG_LEVEL=INFO
    ports:
      - "8080:8080"
    restart: unless-stopped
    depends_on:
      - postgres
      - redis
    healthcheck:
      test: ["CMD", "python", "-c", "import requests; requests.get('http://localhost:8080/health')"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  postgres:
    image: postgres:15
    environment:
      - POSTGRES_DB=neuron_db
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=pass
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    restart: unless-stopped
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

## Security Best Practices

### 1. JWT Token Management
- Store JWT tokens securely (environment variables, secret managers)
- Implement token refresh logic for long-running services
- Validate all incoming requests with proper authentication

### 2. Network Security
- Use HTTPS for all federation communication
- Implement proper firewall rules
- Use VPN or private networks for internal communication

### 3. Input Validation
- Validate all configuration updates
- Sanitize command inputs
- Implement rate limiting

### 4. Monitoring & Alerting
- Monitor resource usage
- Track error rates and response times
- Implement health checks for dependencies
- Set up alerts for failure conditions

## Monitoring & Observability

### Metrics to Track
- System metrics (CPU, memory, disk, network)
- Application metrics (requests/sec, response time, error rate)
- Business metrics (records processed, tasks completed)
- Dependency health (database, external APIs)

### Structured Logging
```python
import structlog

logger = structlog.get_logger()

# Log with structured data
logger.info(
    "Processing batch completed",
    batch_id="batch-123",
    records_processed=1000,
    processing_time_ms=5000,
    success_rate=0.99
)
```

### Health Check Endpoint
```python
from aiohttp import web

async def health_check(request):
    # Check all dependencies
    db_healthy = await check_database()
    redis_healthy = await check_redis()
    
    if db_healthy and redis_healthy:
        return web.json_response({
            "status": "healthy",
            "dependencies": {
                "database": "up",
                "redis": "up"
            },
            "uptime": int(time.time() - start_time)
        })
    else:
        return web.json_response({
            "status": "unhealthy",
            "dependencies": {
                "database": "up" if db_healthy else "down",
                "redis": "up" if redis_healthy else "down"
            }
        }, status=503)
```

## Troubleshooting

### Common Issues

1. **Registration Fails**
   - Check federation URL is accessible
   - Verify neuron ID is unique
   - Check required fields in registration payload

2. **Heartbeat Failures**
   - Ensure JWT token is valid
   - Check network connectivity
   - Verify heartbeat interval (60 seconds)

3. **Configuration Updates Not Applied**
   - Check JWT token authorization
   - Implement configuration reload mechanism
   - Log configuration changes for debugging

4. **High Resource Usage**
   - Monitor system metrics
   - Implement resource limits
   - Optimize application performance

### Debug Commands
```bash
# Check neuron logs
docker logs python-neuron

# Monitor resource usage
docker stats python-neuron

# Test health endpoint
curl http://localhost:8080/health

# Check federation connectivity
curl -H "Authorization: Bearer $JWT_TOKEN" \
     http://federation-url:5000/api/neuron/config
```

## Scaling & Production Deployment

### Horizontal Scaling
- Deploy multiple instances with unique neuron IDs
- Use load balancers for high availability
- Implement proper service discovery

### Monitoring Integration
- Prometheus metrics export
- Grafana dashboards
- ELK stack for log aggregation
- Alertmanager for notifications

### CI/CD Pipeline
```yaml
# .github/workflows/deploy.yml
name: Deploy Python Neuron

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Build Docker image
        run: docker build -t python-neuron:${{ github.sha }} .
      
      - name: Push to registry
        run: |
          docker tag python-neuron:${{ github.sha }} registry.company.com/python-neuron:${{ github.sha }}
          docker push registry.company.com/python-neuron:${{ github.sha }}
      
      - name: Deploy to production
        run: |
          kubectl set image deployment/python-neuron \
            python-neuron=registry.company.com/python-neuron:${{ github.sha }}
```

This comprehensive guide provides everything needed to build, deploy, and maintain Python-based API-only neurons in the Findawise Empire Federation.