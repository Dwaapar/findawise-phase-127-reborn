"""
Configuration module for Python API Neuron
==========================================
"""

import os
from dataclasses import dataclass
from typing import List, Optional

@dataclass
class NeuronConfig:
    """Configuration settings for the neuron"""
    
    # Federation settings
    federation_base_url: str = os.environ.get("FEDERATION_URL", "http://localhost:5000")
    
    # Neuron identity
    neuron_id: str = os.environ.get("NEURON_ID", "")
    name: str = os.environ.get("NEURON_NAME", "Python Data Processor")
    type: str = os.environ.get("NEURON_TYPE", "python-data-processor")
    language: str = "python"
    version: str = os.environ.get("NEURON_VERSION", "1.0.0")
    
    # Capabilities
    capabilities: List[str] = None
    
    # Timing settings
    heartbeat_interval: int = int(os.environ.get("HEARTBEAT_INTERVAL", "60"))
    command_check_interval: int = int(os.environ.get("COMMAND_CHECK_INTERVAL", "30"))
    analytics_report_interval: int = int(os.environ.get("ANALYTICS_INTERVAL", "300"))
    
    # Reliability settings
    max_restart_attempts: int = int(os.environ.get("MAX_RESTART_ATTEMPTS", "3"))
    health_check_timeout: int = int(os.environ.get("HEALTH_CHECK_TIMEOUT", "30"))
    
    # Logging
    log_level: str = os.environ.get("LOG_LEVEL", "INFO")
    log_file: str = os.environ.get("LOG_FILE", "/app/logs/neuron.log")
    
    # Metrics
    metrics_enabled: bool = os.environ.get("METRICS_ENABLED", "true").lower() == "true"
    metrics_port: int = int(os.environ.get("METRICS_PORT", "8080"))
    
    def __post_init__(self):
        if self.capabilities is None:
            self.capabilities = [
                "data_processing", 
                "file_analysis", 
                "report_generation",
                "batch_processing",
                "real_time_monitoring"
            ]
        
        if not self.neuron_id:
            import uuid
            self.neuron_id = f"python-neuron-{uuid.uuid4().hex[:8]}"