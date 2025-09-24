# API-Only Neuron: ML/AI Model Deployment Guide

## Overview

This guide covers deploying machine learning models and AI services as API-only neurons in the Findawise Empire Federation. ML neurons can serve models, perform inference, train models, or provide AI-powered data processing capabilities.

## ML Neuron Types

### 1. Model Serving Neurons
- Serve pre-trained models via REST/gRPC APIs
- Handle real-time inference requests  
- Support batch prediction workflows
- Model versioning and A/B testing

### 2. Training Neurons
- Continuous model training and retraining
- Hyperparameter optimization
- Data pipeline management
- Model evaluation and validation

### 3. Data Processing Neurons
- Feature engineering and transformation
- Data quality monitoring
- Anomaly detection
- Stream processing for real-time ML

## Production ML Neuron Example

### FastAPI-based Model Serving Neuron

```python
import asyncio
import uvicorn
import numpy as np
import joblib
from fastapi import FastAPI, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import logging
import time
import os
from datetime import datetime

# Federation client (from previous examples)
from federation_client import FederationClient, NeuronConfig

# ML-specific imports
import torch
import transformers
from sklearn.base import BaseEstimator
import mlflow

app = FastAPI(title="ML Inference Neuron", version="1.0.0")

class PredictionRequest(BaseModel):
    features: List[float]
    model_version: Optional[str] = "latest"
    
class BatchPredictionRequest(BaseModel):
    batch_features: List[List[float]]
    model_version: Optional[str] = "latest"
    
class PredictionResponse(BaseModel):
    prediction: float
    confidence: float
    model_version: str
    inference_time_ms: int
    
class MLNeuron:
    def __init__(self):
        self.models = {}
        self.model_metadata = {}
        self.metrics = {
            "total_predictions": 0,
            "successful_predictions": 0,
            "failed_predictions": 0,
            "average_inference_time": 0,
            "model_accuracy": 0.95
        }
        self.federation_client = None
        self.load_models()
        
    def load_models(self):
        """Load all available models"""
        # Load primary model
        try:
            self.models["primary"] = joblib.load("models/primary_model.pkl")
            self.model_metadata["primary"] = {
                "version": "1.0.0",
                "type": "sklearn_random_forest",
                "trained_at": "2025-01-20T10:00:00Z",
                "accuracy": 0.95,
                "features": 10
            }
            logging.info("✅ Primary model loaded successfully")
        except Exception as e:
            logging.error(f"❌ Failed to load primary model: {e}")
            
        # Load experimental model
        try:
            self.models["experimental"] = joblib.load("models/experimental_model.pkl")
            self.model_metadata["experimental"] = {
                "version": "1.1.0-beta",
                "type": "xgboost_classifier",
                "trained_at": "2025-01-21T08:00:00Z",
                "accuracy": 0.97,
                "features": 10
            }
            logging.info("✅ Experimental model loaded successfully")
        except Exception as e:
            logging.warning(f"⚠️ Experimental model not available: {e}")
    
    async def predict(self, features: List[float], model_version: str = "primary") -> Dict[str, Any]:
        """Make a single prediction"""
        start_time = time.time()
        
        try:
            if model_version not in self.models:
                raise ValueError(f"Model version {model_version} not available")
                
            model = self.models[model_version]
            features_array = np.array(features).reshape(1, -1)
            
            # Make prediction
            prediction = model.predict(features_array)[0]
            
            # Get prediction confidence if available
            confidence = 0.8  # Default confidence
            if hasattr(model, "predict_proba"):
                probabilities = model.predict_proba(features_array)[0]
                confidence = float(np.max(probabilities))
            
            inference_time = int((time.time() - start_time) * 1000)
            
            # Update metrics
            self.metrics["total_predictions"] += 1
            self.metrics["successful_predictions"] += 1
            self.metrics["average_inference_time"] = (
                (self.metrics["average_inference_time"] * (self.metrics["total_predictions"] - 1) + inference_time) 
                / self.metrics["total_predictions"]
            )
            
            return {
                "prediction": float(prediction),
                "confidence": confidence,
                "model_version": model_version,
                "inference_time_ms": inference_time,
                "model_metadata": self.model_metadata[model_version]
            }
            
        except Exception as e:
            self.metrics["failed_predictions"] += 1
            self.metrics["total_predictions"] += 1
            raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")
    
    async def batch_predict(self, batch_features: List[List[float]], model_version: str = "primary") -> List[Dict[str, Any]]:
        """Make batch predictions"""
        results = []
        for features in batch_features:
            try:
                result = await self.predict(features, model_version)
                results.append(result)
            except Exception as e:
                results.append({"error": str(e), "features": features})
        return results
    
    async def retrain_model(self, training_data_path: str) -> Dict[str, Any]:
        """Retrain model with new data"""
        try:
            # This would implement your retraining logic
            # For demo purposes, we'll simulate it
            await asyncio.sleep(5)  # Simulate training time
            
            new_accuracy = 0.96
            self.model_metadata["primary"]["accuracy"] = new_accuracy
            self.model_metadata["primary"]["trained_at"] = datetime.utcnow().isoformat()
            
            return {
                "success": True,
                "new_accuracy": new_accuracy,
                "training_time_seconds": 5,
                "model_version": "1.0.1"
            }
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def get_model_info(self) -> Dict[str, Any]:
        """Get information about all loaded models"""
        return {
            "available_models": list(self.models.keys()),
            "model_metadata": self.model_metadata,
            "total_predictions": self.metrics["total_predictions"],
            "success_rate": (
                self.metrics["successful_predictions"] / max(1, self.metrics["total_predictions"])
            ),
            "average_inference_time_ms": self.metrics["average_inference_time"]
        }

# Global ML neuron instance
ml_neuron = MLNeuron()

@app.post("/predict", response_model=PredictionResponse)
async def predict(request: PredictionRequest):
    """Single prediction endpoint"""
    result = await ml_neuron.predict(request.features, request.model_version)
    return PredictionResponse(**result)

@app.post("/batch_predict")
async def batch_predict(request: BatchPredictionRequest):
    """Batch prediction endpoint"""
    results = await ml_neuron.batch_predict(request.batch_features, request.model_version)
    return {"predictions": results, "batch_size": len(results)}

@app.post("/retrain")
async def retrain_model(background_tasks: BackgroundTasks, training_data_path: str = "data/training.csv"):
    """Trigger model retraining"""
    background_tasks.add_task(ml_neuron.retrain_model, training_data_path)
    return {"message": "Retraining started", "data_path": training_data_path}

@app.get("/models")
async def get_models():
    """Get information about all available models"""
    return ml_neuron.get_model_info()

@app.get("/health")
async def health_check():
    """Health check endpoint for federation monitoring"""
    model_count = len(ml_neuron.models)
    success_rate = (
        ml_neuron.metrics["successful_predictions"] / max(1, ml_neuron.metrics["total_predictions"])
    )
    
    # Health scoring based on model availability and performance
    health_score = 100
    if model_count == 0:
        health_score = 0
    elif success_rate < 0.9:
        health_score = 70
    elif ml_neuron.metrics["average_inference_time"] > 1000:  # >1 second
        health_score = 80
    
    return {
        "status": "healthy" if health_score > 50 else "unhealthy",
        "health_score": health_score,
        "models_loaded": model_count,
        "total_predictions": ml_neuron.metrics["total_predictions"],
        "success_rate": success_rate,
        "average_inference_time_ms": ml_neuron.metrics["average_inference_time"]
    }

async def setup_federation():
    """Initialize federation client and register neuron"""
    config = NeuronConfig(
        neuron_id=os.getenv("NEURON_ID", "ml-inference-001"),
        name="ML Inference Neuron",
        type="python-ml-inference",
        federation_url=os.getenv("FEDERATION_URL", "http://localhost:5000")
    )
    
    ml_neuron.federation_client = FederationClient(config)
    
    # Register with federation
    async with ml_neuron.federation_client as client:
        if await client.register():
            # Start heartbeat loop in background
            asyncio.create_task(client.heartbeat_loop())
            
            # Report initial analytics
            await client.report_analytics({
                "modelsLoaded": len(ml_neuron.models),
                "totalPredictions": ml_neuron.metrics["total_predictions"],
                "averageInferenceTime": ml_neuron.metrics["average_inference_time"]
            })

@app.on_event("startup")
async def startup_event():
    """Initialize the ML neuron on startup"""
    logging.basicConfig(level=logging.INFO)
    await setup_federation()
    logging.info("🤖 ML Inference Neuron started successfully")

@app.on_event("shutdown")
async def shutdown_event():
    """Clean shutdown"""
    if ml_neuron.federation_client:
        ml_neuron.federation_client.stop()
    logging.info("🛑 ML Inference Neuron stopped")

if __name__ == "__main__":
    uvicorn.run(
        "ml_neuron:app",
        host="0.0.0.0",
        port=int(os.getenv("PORT", 8080)),
        reload=False
    )
```

### Dockerfile for ML Neuron

```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    cmake \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy model files
COPY models/ ./models/
COPY *.py ./

# Create non-root user
RUN useradd -m -u 1000 mluser && chown -R mluser:mluser /app
USER mluser

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1

EXPOSE 8080

CMD ["python", "ml_neuron.py"]
```

### requirements.txt for ML Neuron

```
fastapi==0.104.1
uvicorn[standard]==0.24.0
pydantic==2.5.0
scikit-learn==1.3.2
numpy==1.25.2
joblib==1.3.2
torch==2.1.1
transformers==4.35.2
mlflow==2.8.1
psutil==5.9.6
aiohttp==3.9.1
structlog==23.2.0
prometheus-client==0.19.0
```

## Model Versioning & A/B Testing

### Model Registry Integration

```python
import mlflow
import mlflow.sklearn
from mlflow.tracking import MlflowClient

class ModelRegistry:
    def __init__(self):
        self.client = MlflowClient()
        
    def load_model(self, model_name: str, version: str = "latest"):
        """Load model from MLflow registry"""
        try:
            if version == "latest":
                model_version = self.client.get_latest_versions(
                    model_name, stages=["Production"]
                )[0]
            else:
                model_version = self.client.get_model_version(model_name, version)
                
            model_uri = f"models:/{model_name}/{model_version.version}"
            model = mlflow.sklearn.load_model(model_uri)
            
            return {
                "model": model,
                "version": model_version.version,
                "stage": model_version.current_stage,
                "metrics": self.get_model_metrics(model_name, model_version.version)
            }
        except Exception as e:
            logging.error(f"Failed to load model {model_name}: {e}")
            return None
    
    def get_model_metrics(self, model_name: str, version: str):
        """Get model metrics from MLflow"""
        try:
            model_version = self.client.get_model_version(model_name, version)
            run = self.client.get_run(model_version.run_id)
            return run.data.metrics
        except Exception:
            return {}
    
    def register_model(self, model, model_name: str, metrics: Dict[str, float]):
        """Register new model version"""
        with mlflow.start_run():
            # Log metrics
            for key, value in metrics.items():
                mlflow.log_metric(key, value)
            
            # Log model
            mlflow.sklearn.log_model(
                model, 
                "model",
                registered_model_name=model_name
            )
```

### A/B Testing for Models

```python
class ModelABTesting:
    def __init__(self):
        self.model_variants = {}
        self.traffic_split = {}
        
    def add_variant(self, variant_name: str, model, traffic_percentage: float):
        """Add a model variant for A/B testing"""
        self.model_variants[variant_name] = model
        self.traffic_split[variant_name] = traffic_percentage
        
    def get_model_for_request(self, user_id: str) -> str:
        """Determine which model variant to use based on traffic split"""
        import hashlib
        
        # Consistent hash-based assignment
        hash_value = int(hashlib.md5(user_id.encode()).hexdigest(), 16)
        cumulative = 0
        
        for variant, percentage in self.traffic_split.items():
            cumulative += percentage
            if (hash_value % 100) < cumulative:
                return variant
                
        return list(self.model_variants.keys())[0]  # fallback
    
    async def predict_with_ab_testing(self, features: List[float], user_id: str):
        """Make prediction with A/B testing"""
        variant = self.get_model_for_request(user_id)
        model = self.model_variants[variant]
        
        start_time = time.time()
        prediction = model.predict([features])[0]
        inference_time = time.time() - start_time
        
        # Log A/B test metrics
        await self.log_ab_metrics(variant, inference_time, prediction)
        
        return {
            "prediction": float(prediction),
            "model_variant": variant,
            "inference_time_ms": int(inference_time * 1000)
        }
    
    async def log_ab_metrics(self, variant: str, inference_time: float, prediction: float):
        """Log A/B testing metrics"""
        # Implementation depends on your metrics storage
        pass
```

## Real-time ML Pipeline

### Stream Processing with Kafka

```python
import asyncio
from aiokafka import AIOKafkaConsumer, AIOKafkaProducer
import json

class StreamMLProcessor:
    def __init__(self, ml_neuron: MLNeuron):
        self.ml_neuron = ml_neuron
        self.consumer = None
        self.producer = None
        
    async def start_stream_processing(self):
        """Start processing ML requests from Kafka stream"""
        self.consumer = AIOKafkaConsumer(
            'ml-inference-requests',
            bootstrap_servers='kafka:9092',
            group_id='ml-neuron-group',
            value_deserializer=lambda x: json.loads(x.decode('utf-8'))
        )
        
        self.producer = AIOKafkaProducer(
            bootstrap_servers='kafka:9092',
            value_serializer=lambda x: json.dumps(x).encode('utf-8')
        )
        
        await self.consumer.start()
        await self.producer.start()
        
        try:
            async for msg in self.consumer:
                await self.process_message(msg.value)
        finally:
            await self.consumer.stop()
            await self.producer.stop()
    
    async def process_message(self, message: Dict[str, Any]):
        """Process a single inference request from stream"""
        try:
            request_id = message['request_id']
            features = message['features']
            callback_topic = message.get('callback_topic', 'ml-inference-results')
            
            # Make prediction
            result = await self.ml_neuron.predict(features)
            
            # Send result back
            response = {
                'request_id': request_id,
                'result': result,
                'timestamp': datetime.utcnow().isoformat()
            }
            
            await self.producer.send(callback_topic, response)
            
        except Exception as e:
            logging.error(f"Failed to process stream message: {e}")
            
            # Send error response
            error_response = {
                'request_id': message.get('request_id'),
                'error': str(e),
                'timestamp': datetime.utcnow().isoformat()
            }
            
            await self.producer.send('ml-inference-errors', error_response)
```

## Monitoring & Observability

### Prometheus Metrics

```python
from prometheus_client import Counter, Histogram, Gauge, start_http_server

# Metrics
prediction_requests = Counter('ml_prediction_requests_total', 'Total prediction requests', ['model_version'])
prediction_duration = Histogram('ml_prediction_duration_seconds', 'Prediction duration', ['model_version'])
model_accuracy = Gauge('ml_model_accuracy', 'Model accuracy', ['model_name', 'version'])
active_models = Gauge('ml_active_models', 'Number of active models')

class MLMetrics:
    def __init__(self):
        # Start Prometheus metrics server
        start_http_server(9090)
        
    def record_prediction(self, model_version: str, duration: float):
        """Record a prediction request"""
        prediction_requests.labels(model_version=model_version).inc()
        prediction_duration.labels(model_version=model_version).observe(duration)
    
    def update_model_accuracy(self, model_name: str, version: str, accuracy: float):
        """Update model accuracy metric"""
        model_accuracy.labels(model_name=model_name, version=version).set(accuracy)
    
    def set_active_models(self, count: int):
        """Set number of active models"""
        active_models.set(count)
```

### Structured Logging

```python
import structlog

logger = structlog.get_logger()

# Log prediction with structured data
logger.info(
    "Prediction completed",
    model_version="1.0.0",
    inference_time_ms=250,
    prediction_value=0.87,
    confidence=0.92,
    user_id="user_123",
    request_id="req_456"
)

# Log model performance
logger.info(
    "Model performance metrics",
    model_name="customer_churn",
    accuracy=0.95,
    precision=0.93,
    recall=0.97,
    f1_score=0.95,
    data_points=10000
)
```

## Deployment Patterns

### Kubernetes Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ml-inference-neuron
  labels:
    app: ml-inference-neuron
spec:
  replicas: 3
  selector:
    matchLabels:
      app: ml-inference-neuron
  template:
    metadata:
      labels:
        app: ml-inference-neuron
    spec:
      containers:
      - name: ml-neuron
        image: myregistry/ml-inference-neuron:1.0.0
        ports:
        - containerPort: 8080
        - containerPort: 9090  # Prometheus metrics
        env:
        - name: FEDERATION_URL
          value: "http://federation-core:5000"
        - name: NEURON_ID
          value: "ml-inference-001"
        - name: MLFLOW_TRACKING_URI
          value: "http://mlflow:5000"
        resources:
          requests:
            memory: "4Gi"
            cpu: "2"
            nvidia.com/gpu: "1"  # For GPU models
          limits:
            memory: "8Gi"
            cpu: "4"
            nvidia.com/gpu: "1"
        volumeMounts:
        - name: model-storage
          mountPath: /app/models
        readinessProbe:
          httpGet:
            path: /health
            port: 8080
          initialDelaySeconds: 30
          periodSeconds: 10
        livenessProbe:
          httpGet:
            path: /health
            port: 8080
          initialDelaySeconds: 60
          periodSeconds: 30
      volumes:
      - name: model-storage
        persistentVolumeClaim:
          claimName: ml-models-pvc
---
apiVersion: v1
kind: Service
metadata:
  name: ml-inference-service
spec:
  selector:
    app: ml-inference-neuron
  ports:
  - name: http
    port: 80
    targetPort: 8080
  - name: metrics
    port: 9090
    targetPort: 9090
---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: ml-inference-ingress
spec:
  rules:
  - host: ml-api.company.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: ml-inference-service
            port:
              number: 80
```

This comprehensive ML neuron implementation provides production-ready ML model serving with full federation integration, monitoring, and scalability features.