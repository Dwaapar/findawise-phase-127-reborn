# API-Only Neuron: Data Processing Guide

## Overview

Data processing neurons are specialized backend services that handle ETL operations, real-time data streams, batch processing, and data quality monitoring in the Findawise Empire Federation.

## Data Processing Patterns

### 1. ETL Pipeline Neuron

```python
import asyncio
import pandas as pd
import sqlalchemy as sa
from sqlalchemy.ext.asyncio import create_async_engine
from typing import Dict, Any, List
import logging
from datetime import datetime, timedelta

class ETLProcessor:
    def __init__(self, source_db: str, target_db: str):
        self.source_engine = create_async_engine(source_db)
        self.target_engine = create_async_engine(target_db)
        self.federation_client = None
        self.processed_records = 0
        self.failed_records = 0
        
    async def extract_data(self, query: str, params: Dict = None) -> pd.DataFrame:
        """Extract data from source database"""
        try:
            async with self.source_engine.connect() as conn:
                result = await conn.execute(sa.text(query), params or {})
                data = result.fetchall()
                columns = result.keys()
                
            df = pd.DataFrame(data, columns=columns)
            logging.info(f"Extracted {len(df)} records from source")
            return df
            
        except Exception as e:
            logging.error(f"Data extraction failed: {e}")
            self.failed_records += 1
            raise
    
    async def transform_data(self, df: pd.DataFrame) -> pd.DataFrame:
        """Transform extracted data"""
        try:
            # Example transformations
            df['processed_at'] = datetime.utcnow()
            df['record_hash'] = df.apply(lambda row: hash(str(row.values)), axis=1)
            
            # Data quality checks
            df = df.dropna()  # Remove null records
            df = df.drop_duplicates()  # Remove duplicates
            
            # Business logic transformations
            if 'amount' in df.columns:
                df['amount_usd'] = df['amount'] * df.get('exchange_rate', 1.0)
            
            logging.info(f"Transformed {len(df)} records")
            return df
            
        except Exception as e:
            logging.error(f"Data transformation failed: {e}")
            raise
    
    async def load_data(self, df: pd.DataFrame, table_name: str) -> int:
        """Load transformed data to target database"""
        try:
            async with self.target_engine.begin() as conn:
                # Convert DataFrame to dict records for async insert
                records = df.to_dict('records')
                
                # Bulk insert with conflict resolution
                insert_query = f"""
                INSERT INTO {table_name} ({', '.join(df.columns)})
                VALUES ({', '.join([f':{col}' for col in df.columns])})
                ON CONFLICT (id) DO UPDATE SET
                {', '.join([f'{col} = EXCLUDED.{col}' for col in df.columns if col != 'id'])}
                """
                
                await conn.execute(sa.text(insert_query), records)
                
            self.processed_records += len(df)
            logging.info(f"Loaded {len(df)} records to {table_name}")
            return len(df)
            
        except Exception as e:
            logging.error(f"Data loading failed: {e}")
            self.failed_records += len(df)
            raise
    
    async def run_etl_pipeline(self, pipeline_config: Dict[str, Any]) -> Dict[str, Any]:
        """Execute complete ETL pipeline"""
        start_time = datetime.utcnow()
        
        try:
            # Extract
            df = await self.extract_data(
                pipeline_config['extract_query'],
                pipeline_config.get('extract_params', {})
            )
            
            if df.empty:
                return {
                    "status": "success",
                    "message": "No new data to process",
                    "records_processed": 0,
                    "duration_seconds": 0
                }
            
            # Transform
            transformed_df = await self.transform_data(df)
            
            # Load
            loaded_count = await self.load_data(
                transformed_df,
                pipeline_config['target_table']
            )
            
            duration = (datetime.utcnow() - start_time).total_seconds()
            
            # Report to federation
            if self.federation_client:
                await self.federation_client.report_analytics({
                    "pipeline_name": pipeline_config.get('name', 'etl_pipeline'),
                    "records_extracted": len(df),
                    "records_transformed": len(transformed_df),
                    "records_loaded": loaded_count,
                    "duration_seconds": duration,
                    "success_rate": (loaded_count / len(df)) * 100 if len(df) > 0 else 100
                })
            
            return {
                "status": "success",
                "records_processed": loaded_count,
                "duration_seconds": duration,
                "quality_score": (loaded_count / len(df)) * 100 if len(df) > 0 else 100
            }
            
        except Exception as e:
            duration = (datetime.utcnow() - start_time).total_seconds()
            logging.error(f"ETL pipeline failed: {e}")
            
            # Report failure to federation
            if self.federation_client:
                await self.federation_client.report_analytics({
                    "pipeline_name": pipeline_config.get('name', 'etl_pipeline'),
                    "status": "failed",
                    "error": str(e),
                    "duration_seconds": duration
                })
            
            return {
                "status": "failed",
                "error": str(e),
                "duration_seconds": duration
            }
```

### 2. Real-time Stream Processing Neuron

```python
import asyncio
import json
from aiokafka import AIOKafkaConsumer, AIOKafkaProducer
from typing import Dict, Any, Callable
import logging
from datetime import datetime

class StreamProcessor:
    def __init__(self, kafka_config: Dict[str, str]):
        self.kafka_config = kafka_config
        self.consumer = None
        self.producer = None
        self.federation_client = None
        self.processors: Dict[str, Callable] = {}
        self.metrics = {
            "messages_processed": 0,
            "messages_failed": 0,
            "average_processing_time": 0,
            "throughput_per_second": 0
        }
        
    def register_processor(self, message_type: str, processor_func: Callable):
        """Register a message processor function"""
        self.processors[message_type] = processor_func
        
    async def start_stream_processing(self):
        """Start consuming and processing messages"""
        self.consumer = AIOKafkaConsumer(
            'data-events',
            bootstrap_servers=self.kafka_config['bootstrap_servers'],
            group_id=self.kafka_config['group_id'],
            value_deserializer=lambda x: json.loads(x.decode('utf-8'))
        )
        
        self.producer = AIOKafkaProducer(
            bootstrap_servers=self.kafka_config['bootstrap_servers'],
            value_serializer=lambda x: json.dumps(x).encode('utf-8')
        )
        
        await self.consumer.start()
        await self.producer.start()
        
        logging.info("Stream processor started")
        
        try:
            async for msg in self.consumer:
                await self.process_message(msg.value)
        finally:
            await self.consumer.stop()
            await self.producer.stop()
    
    async def process_message(self, message: Dict[str, Any]):
        """Process a single message"""
        start_time = datetime.utcnow()
        
        try:
            message_type = message.get('type', 'unknown')
            
            if message_type in self.processors:
                # Process the message
                result = await self.processors[message_type](message)
                
                # Send result to output topic
                if result:
                    await self.producer.send('processed-data', result)
                
                # Update metrics
                processing_time = (datetime.utcnow() - start_time).total_seconds()
                self.metrics["messages_processed"] += 1
                self.metrics["average_processing_time"] = (
                    (self.metrics["average_processing_time"] * (self.metrics["messages_processed"] - 1) + processing_time) 
                    / self.metrics["messages_processed"]
                )
                
                logging.debug(f"Processed {message_type} message in {processing_time:.3f}s")
                
            else:
                logging.warning(f"No processor registered for message type: {message_type}")
                
        except Exception as e:
            self.metrics["messages_failed"] += 1
            logging.error(f"Failed to process message: {e}")
            
            # Send to dead letter queue
            await self.producer.send('failed-messages', {
                "original_message": message,
                "error": str(e),
                "timestamp": datetime.utcnow().isoformat()
            })

# Example message processors
async def user_event_processor(message: Dict[str, Any]) -> Dict[str, Any]:
    """Process user behavior events"""
    user_id = message.get('user_id')
    event_type = message.get('event_type')
    timestamp = message.get('timestamp')
    
    # Example: aggregate user activity
    if event_type == 'page_view':
        return {
            "type": "user_activity_summary",
            "user_id": user_id,
            "event_count": 1,
            "last_activity": timestamp,
            "activity_type": "page_view"
        }
    
    return None

async def transaction_processor(message: Dict[str, Any]) -> Dict[str, Any]:
    """Process financial transactions"""
    transaction = message.get('transaction', {})
    
    # Fraud detection logic
    amount = transaction.get('amount', 0)
    if amount > 10000:  # Flag large transactions
        return {
            "type": "fraud_alert",
            "transaction_id": transaction.get('id'),
            "amount": amount,
            "risk_score": 85,
            "reason": "Large transaction amount"
        }
    
    # Normal processing
    return {
        "type": "transaction_processed",
        "transaction_id": transaction.get('id'),
        "status": "approved"
    }
```

### 3. Data Quality Monitoring Neuron

```python
import pandas as pd
import numpy as np
from typing import Dict, Any, List, Tuple
import logging
from datetime import datetime, timedelta

class DataQualityMonitor:
    def __init__(self):
        self.federation_client = None
        self.quality_rules = {}
        self.quality_history = []
        
    def add_quality_rule(self, rule_name: str, rule_func: Callable, threshold: float):
        """Add a data quality rule"""
        self.quality_rules[rule_name] = {
            "function": rule_func,
            "threshold": threshold,
            "failures": 0,
            "last_check": None
        }
    
    async def check_data_quality(self, df: pd.DataFrame, dataset_name: str) -> Dict[str, Any]:
        """Run comprehensive data quality checks"""
        quality_report = {
            "dataset_name": dataset_name,
            "timestamp": datetime.utcnow().isoformat(),
            "total_records": len(df),
            "quality_score": 100,
            "issues": [],
            "metrics": {}
        }
        
        # Basic quality metrics
        quality_report["metrics"]["null_percentage"] = (df.isnull().sum().sum() / (len(df) * len(df.columns))) * 100
        quality_report["metrics"]["duplicate_percentage"] = (df.duplicated().sum() / len(df)) * 100
        
        # Data type consistency
        type_issues = self.check_data_types(df)
        if type_issues:
            quality_report["issues"].extend(type_issues)
            quality_report["quality_score"] -= len(type_issues) * 5
        
        # Custom quality rules
        for rule_name, rule_config in self.quality_rules.items():
            try:
                rule_result = rule_config["function"](df)
                quality_report["metrics"][rule_name] = rule_result
                
                if rule_result < rule_config["threshold"]:
                    quality_report["issues"].append({
                        "rule": rule_name,
                        "value": rule_result,
                        "threshold": rule_config["threshold"],
                        "severity": "high" if rule_result < rule_config["threshold"] * 0.7 else "medium"
                    })
                    quality_report["quality_score"] -= 10
                    rule_config["failures"] += 1
                
                rule_config["last_check"] = datetime.utcnow()
                
            except Exception as e:
                logging.error(f"Quality rule {rule_name} failed: {e}")
                quality_report["issues"].append({
                    "rule": rule_name,
                    "error": str(e),
                    "severity": "high"
                })
        
        # Store in quality history
        self.quality_history.append(quality_report)
        
        # Keep only last 100 reports
        if len(self.quality_history) > 100:
            self.quality_history = self.quality_history[-100:]
        
        # Report to federation
        if self.federation_client:
            await self.federation_client.report_analytics({
                "data_quality_check": True,
                "dataset_name": dataset_name,
                "quality_score": quality_report["quality_score"],
                "total_records": len(df),
                "issues_count": len(quality_report["issues"])
            })
        
        return quality_report
    
    def check_data_types(self, df: pd.DataFrame) -> List[Dict[str, Any]]:
        """Check for data type inconsistencies"""
        issues = []
        
        for column in df.columns:
            if df[column].dtype == 'object':
                # Check for mixed types in object columns
                sample = df[column].dropna().head(1000)
                types = set(type(x).__name__ for x in sample)
                
                if len(types) > 1:
                    issues.append({
                        "type": "mixed_data_types",
                        "column": column,
                        "types_found": list(types),
                        "severity": "medium"
                    })
        
        return issues
    
    def get_quality_trends(self, days: int = 7) -> Dict[str, Any]:
        """Get data quality trends over time"""
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        
        recent_reports = [
            report for report in self.quality_history
            if datetime.fromisoformat(report["timestamp"]) > cutoff_date
        ]
        
        if not recent_reports:
            return {"error": "No recent quality reports found"}
        
        # Calculate trends
        quality_scores = [report["quality_score"] for report in recent_reports]
        
        return {
            "average_quality_score": np.mean(quality_scores),
            "quality_trend": "improving" if quality_scores[-1] > quality_scores[0] else "declining",
            "total_reports": len(recent_reports),
            "datasets_monitored": len(set(report["dataset_name"] for report in recent_reports))
        }

# Example quality rule functions
def completeness_check(df: pd.DataFrame) -> float:
    """Check data completeness percentage"""
    total_cells = len(df) * len(df.columns)
    non_null_cells = total_cells - df.isnull().sum().sum()
    return (non_null_cells / total_cells) * 100

def uniqueness_check(df: pd.DataFrame) -> float:
    """Check data uniqueness percentage"""
    return ((len(df) - df.duplicated().sum()) / len(df)) * 100

def consistency_check(df: pd.DataFrame) -> float:
    """Check data consistency based on business rules"""
    consistency_score = 100
    
    # Example: email format validation
    if 'email' in df.columns:
        email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        valid_emails = df['email'].str.match(email_pattern, na=False).sum()
        email_consistency = (valid_emails / len(df.dropna(subset=['email']))) * 100
        consistency_score = min(consistency_score, email_consistency)
    
    # Example: date range validation
    if 'date' in df.columns:
        valid_dates = pd.to_datetime(df['date'], errors='coerce').notna().sum()
        date_consistency = (valid_dates / len(df)) * 100
        consistency_score = min(consistency_score, date_consistency)
    
    return consistency_score
```

### 4. Complete Data Processing Neuron Example

```python
import asyncio
import logging
import os
from datetime import datetime
from typing import Dict, Any
from federation_client import FederationClient, NeuronConfig

class DataProcessingNeuron:
    def __init__(self):
        self.etl_processor = None
        self.stream_processor = None
        self.quality_monitor = None
        self.federation_client = None
        
    async def initialize(self):
        """Initialize the data processing neuron"""
        # Setup federation client
        config = NeuronConfig(
            neuron_id=os.getenv("NEURON_ID", "data-processor-001"),
            name="Data Processing Neuron",
            type="python-data-processor",
            federation_url=os.getenv("FEDERATION_URL", "http://localhost:5000")
        )
        
        self.federation_client = FederationClient(config)
        
        # Initialize processors
        self.etl_processor = ETLProcessor(
            source_db=os.getenv("SOURCE_DB_URL"),
            target_db=os.getenv("TARGET_DB_URL")
        )
        self.etl_processor.federation_client = self.federation_client
        
        self.stream_processor = StreamProcessor({
            "bootstrap_servers": os.getenv("KAFKA_SERVERS", "localhost:9092"),
            "group_id": "data-processor-group"
        })
        self.stream_processor.federation_client = self.federation_client
        
        # Register stream processors
        self.stream_processor.register_processor("user_event", user_event_processor)
        self.stream_processor.register_processor("transaction", transaction_processor)
        
        self.quality_monitor = DataQualityMonitor()
        self.quality_monitor.federation_client = self.federation_client
        
        # Add quality rules
        self.quality_monitor.add_quality_rule("completeness", completeness_check, 95.0)
        self.quality_monitor.add_quality_rule("uniqueness", uniqueness_check, 99.0)
        self.quality_monitor.add_quality_rule("consistency", consistency_check, 90.0)
        
        # Register with federation
        async with self.federation_client as client:
            if await client.register():
                logging.info("Data processing neuron registered with federation")
                
                # Start background tasks
                asyncio.create_task(client.heartbeat_loop())
                asyncio.create_task(self.run_etl_pipelines())
                asyncio.create_task(self.stream_processor.start_stream_processing())
                
                return True
        
        return False
    
    async def run_etl_pipelines(self):
        """Run scheduled ETL pipelines"""
        while True:
            try:
                # Daily customer data ETL
                customer_pipeline = {
                    "name": "customer_data_etl",
                    "extract_query": """
                        SELECT customer_id, name, email, registration_date, last_activity
                        FROM raw_customers 
                        WHERE updated_at > NOW() - INTERVAL '1 day'
                    """,
                    "target_table": "processed_customers"
                }
                
                result = await self.etl_processor.run_etl_pipeline(customer_pipeline)
                logging.info(f"Customer ETL completed: {result}")
                
                # Sales data ETL
                sales_pipeline = {
                    "name": "sales_data_etl",
                    "extract_query": """
                        SELECT transaction_id, customer_id, amount, product_id, transaction_date
                        FROM raw_transactions 
                        WHERE transaction_date > NOW() - INTERVAL '1 day'
                    """,
                    "target_table": "processed_sales"
                }
                
                result = await self.etl_processor.run_etl_pipeline(sales_pipeline)
                logging.info(f"Sales ETL completed: {result}")
                
                # Wait 1 hour before next run
                await asyncio.sleep(3600)
                
            except Exception as e:
                logging.error(f"ETL pipeline error: {e}")
                await asyncio.sleep(300)  # Wait 5 minutes on error

async def main():
    logging.basicConfig(level=logging.INFO)
    
    neuron = DataProcessingNeuron()
    
    if await neuron.initialize():
        logging.info("Data processing neuron started successfully")
        
        # Keep running
        try:
            while True:
                await asyncio.sleep(60)
        except KeyboardInterrupt:
            logging.info("Shutting down data processing neuron")
    else:
        logging.error("Failed to initialize data processing neuron")

if __name__ == "__main__":
    asyncio.run(main())
```

## Deployment Configuration

### Docker Setup

```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application
COPY . .

# Create non-root user
RUN useradd -m -u 1000 datauser && chown -R datauser:datauser /app
USER datauser

EXPOSE 8080

CMD ["python", "data_neuron.py"]
```

### Kubernetes Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: data-processing-neuron
spec:
  replicas: 2
  selector:
    matchLabels:
      app: data-processing-neuron
  template:
    metadata:
      labels:
        app: data-processing-neuron
    spec:
      containers:
      - name: data-processor
        image: data-processing-neuron:1.0.0
        env:
        - name: FEDERATION_URL
          value: "http://federation-core:5000"
        - name: SOURCE_DB_URL
          valueFrom:
            secretKeyRef:
              name: db-credentials
              key: source-url
        - name: TARGET_DB_URL
          valueFrom:
            secretKeyRef:
              name: db-credentials
              key: target-url
        - name: KAFKA_SERVERS
          value: "kafka:9092"
        resources:
          requests:
            memory: "2Gi"
            cpu: "1"
          limits:
            memory: "4Gi"
            cpu: "2"
        livenessProbe:
          httpGet:
            path: /health
            port: 8080
          initialDelaySeconds: 30
          periodSeconds: 30
```

## Monitoring & Observability

### Metrics to Track
- Records processed per minute/hour
- Data quality scores over time
- ETL pipeline success/failure rates
- Stream processing latency
- Error rates and types
- Resource utilization (CPU, memory, disk)

### Alerting Rules
- Data quality score drops below threshold
- ETL pipeline failures exceed 3 in 1 hour
- Stream processing lag exceeds 5 minutes
- Disk usage exceeds 85%
- Memory usage exceeds 90%

This comprehensive data processing neuron implementation provides enterprise-grade capabilities for handling large-scale data operations while maintaining full federation compliance and monitoring.