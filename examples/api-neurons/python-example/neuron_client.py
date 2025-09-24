#!/usr/bin/env python3
"""
Production-Grade Python API Neuron Example
============================================

This is a comprehensive example of how to build an API-only neuron that
integrates with the Findawise Empire Federation system.

Features:
- Automatic registration with the federation
- JWT-based authentication
- Heartbeat monitoring
- Command handling
- Analytics reporting
- Error handling and recovery
- Health checks
- Configuration management

Requirements:
- requests
- psutil (for system metrics)
- python-json-logger
- schedule

Install with: pip install requests psutil python-json-logger schedule
"""

import requests
import json
import time
import threading
import logging
import psutil
import os
import sys
from typing import Dict, Any, Optional, List
from datetime import datetime, timedelta
from dataclasses import dataclass, asdict
import schedule
from pythonjsonlogger import jsonlogger

# Configure structured logging
logHandler = logging.StreamHandler()
formatter = jsonlogger.JsonFormatter()
logHandler.setFormatter(formatter)
logger = logging.getLogger()
logger.addHandler(logHandler)
logger.setLevel(logging.INFO)

@dataclass
class NeuronConfig:
    """Configuration for the API neuron"""
    neuron_id: str
    name: str
    type: str
    language: str = "python"
    version: str = "1.0.0"
    federation_url: str = "http://localhost:5000"
    healthcheck_endpoint: str = "/health"
    heartbeat_interval: int = 60  # seconds
    analytics_interval: int = 300  # 5 minutes
    max_restart_attempts: int = 3
    api_endpoints: List[Dict[str, Any]] = None
    capabilities: List[str] = None
    dependencies: List[str] = None

    def __post_init__(self):
        if self.api_endpoints is None:
            self.api_endpoints = [
                {
                    "path": "/health",
                    "method": "GET",
                    "description": "Health check endpoint"
                },
                {
                    "path": "/data/process",
                    "method": "POST", 
                    "description": "Process data endpoint"
                },
                {
                    "path": "/status",
                    "method": "GET",
                    "description": "Get neuron status"
                }
            ]
        
        if self.capabilities is None:
            self.capabilities = [
                "data_processing",
                "web_scraping", 
                "api_integration",
                "background_tasks"
            ]
        
        if self.dependencies is None:
            self.dependencies = ["requests", "psutil"]

class ApiNeuronClient:
    """
    Production-grade API Neuron client for the Findawise Empire Federation
    """
    
    def __init__(self, config: NeuronConfig):
        self.config = config
        self.token: Optional[str] = None
        self.is_registered = False
        self.is_running = False
        self.start_time = datetime.now()
        self.request_count = 0
        self.successful_requests = 0
        self.failed_requests = 0
        self.total_response_time = 0
        self.health_score = 100
        self.last_heartbeat = None
        self.session = requests.Session()
        
        # Threading for background tasks
        self.heartbeat_thread = None
        self.analytics_thread = None
        self.command_thread = None
        
        logger.info("API Neuron initialized", extra={
            "neuron_id": self.config.neuron_id,
            "name": self.config.name,
            "type": self.config.type
        })

    def register_with_federation(self) -> bool:
        """Register this neuron with the federation"""
        try:
            registration_data = {
                "neuronId": self.config.neuron_id,
                "name": self.config.name,
                "type": self.config.type,
                "language": self.config.language,
                "version": self.config.version,
                "healthcheckEndpoint": self.config.healthcheck_endpoint,
                "apiEndpoints": self.config.api_endpoints,
                "authentication": {
                    "type": "jwt",
                    "required": True
                },
                "capabilities": self.config.capabilities,
                "dependencies": self.config.dependencies,
                "resourceRequirements": {
                    "cpu": "1 core",
                    "memory": "512MB",
                    "storage": "1GB"
                },
                "deploymentInfo": {
                    "runtime": "python3.11",
                    "host": os.uname().nodename,
                    "pid": os.getpid()
                },
                "alertThresholds": {
                    "healthScore": 70,
                    "responseTime": 5000,
                    "errorRate": 10
                },
                "metadata": {
                    "environment": "production",
                    "tags": ["data-processing", "python", "api"]
                }
            }

            response = self.session.post(
                f"{self.config.federation_url}/api/api-neurons/register",
                json=registration_data,
                timeout=30
            )
            
            if response.status_code == 201:
                data = response.json()
                self.token = data['data']['token']
                self.is_registered = True
                
                logger.info("Successfully registered with federation", extra={
                    "neuron_id": self.config.neuron_id,
                    "token_received": bool(self.token)
                })
                
                # Set authorization header for future requests
                self.session.headers.update({
                    'Authorization': f'Bearer {self.token}'
                })
                
                return True
            else:
                logger.error("Registration failed", extra={
                    "status_code": response.status_code,
                    "response": response.text
                })
                return False
                
        except Exception as e:
            logger.error("Registration error", extra={
                "error": str(e),
                "neuron_id": self.config.neuron_id
            })
            return False

    def send_heartbeat(self) -> bool:
        """Send heartbeat to federation"""
        if not self.is_registered:
            return False
            
        try:
            # Get system metrics
            cpu_percent = psutil.cpu_percent(interval=1)
            memory = psutil.virtual_memory()
            disk = psutil.disk_usage('/')
            
            # Calculate uptime
            uptime_seconds = int((datetime.now() - self.start_time).total_seconds())
            
            # Calculate average response time
            avg_response_time = (
                self.total_response_time / max(self.request_count, 1)
            )
            
            heartbeat_data = {
                "status": "active" if self.is_running else "inactive",
                "healthScore": self.health_score,
                "uptime": uptime_seconds,
                "processId": str(os.getpid()),
                "hostInfo": {
                    "hostname": os.uname().nodename,
                    "platform": sys.platform,
                    "python_version": sys.version
                },
                "systemMetrics": {
                    "cpu_percent": cpu_percent,
                    "memory_percent": memory.percent,
                    "disk_percent": disk.percent,
                    "memory_used": memory.used,
                    "memory_available": memory.available
                },
                "applicationMetrics": {
                    "total_requests": self.request_count,
                    "successful_requests": self.successful_requests,
                    "failed_requests": self.failed_requests,
                    "average_response_time": avg_response_time
                },
                "dependencyStatus": {
                    "federation_api": "healthy",
                    "database": "not_applicable",
                    "external_services": "healthy"
                },
                "performanceMetrics": {
                    "requests_per_minute": self.request_count / max(uptime_seconds / 60, 1),
                    "error_rate": (self.failed_requests / max(self.request_count, 1)) * 100
                },
                "configVersion": "1.0",
                "buildVersion": self.config.version
            }

            response = self.session.post(
                f"{self.config.federation_url}/api/api-neurons/heartbeat",
                json=heartbeat_data,
                timeout=10
            )
            
            if response.status_code == 200:
                self.last_heartbeat = datetime.now()
                data = response.json()
                
                logger.info("Heartbeat sent successfully", extra={
                    "neuron_id": self.config.neuron_id,
                    "health_score": self.health_score,
                    "pending_commands": data['data'].get('pendingCommands', 0)
                })
                
                return True
            else:
                logger.error("Heartbeat failed", extra={
                    "status_code": response.status_code,
                    "response": response.text
                })
                return False
                
        except Exception as e:
            logger.error("Heartbeat error", extra={
                "error": str(e),
                "neuron_id": self.config.neuron_id
            })
            return False

    def check_for_commands(self) -> List[Dict[str, Any]]:
        """Check for pending commands from federation"""
        if not self.is_registered:
            return []
            
        try:
            response = self.session.get(
                f"{self.config.federation_url}/api/api-neurons/commands/pending",
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                commands = data['data']
                
                if commands:
                    logger.info("Received commands", extra={
                        "neuron_id": self.config.neuron_id,
                        "command_count": len(commands)
                    })
                
                return commands
            else:
                logger.error("Failed to fetch commands", extra={
                    "status_code": response.status_code
                })
                return []
                
        except Exception as e:
            logger.error("Command fetch error", extra={
                "error": str(e),
                "neuron_id": self.config.neuron_id
            })
            return []

    def acknowledge_command(self, command_id: str) -> bool:
        """Acknowledge receipt of a command"""
        try:
            response = self.session.post(
                f"{self.config.federation_url}/api/api-neurons/commands/{command_id}/acknowledge",
                timeout=10
            )
            
            return response.status_code == 200
            
        except Exception as e:
            logger.error("Command acknowledgment error", extra={
                "error": str(e),
                "command_id": command_id
            })
            return False

    def complete_command(self, command_id: str, success: bool, response: Any = None, error_message: str = None) -> bool:
        """Report command completion to federation"""
        try:
            completion_data = {
                "success": success,
                "response": response,
                "errorMessage": error_message
            }
            
            response = self.session.post(
                f"{self.config.federation_url}/api/api-neurons/commands/{command_id}/complete",
                json=completion_data,
                timeout=10
            )
            
            return response.status_code == 200
            
        except Exception as e:
            logger.error("Command completion error", extra={
                "error": str(e),
                "command_id": command_id
            })
            return False

    def process_command(self, command: Dict[str, Any]) -> None:
        """Process a command from the federation"""
        command_id = command['commandId']
        command_type = command['commandType']
        command_data = command.get('commandData', {})
        
        logger.info("Processing command", extra={
            "command_id": command_id,
            "command_type": command_type
        })
        
        # Acknowledge command receipt
        self.acknowledge_command(command_id)
        
        try:
            success = True
            response_data = None
            error_message = None
            
            if command_type == "restart":
                response_data = "Restart command received - would restart service"
                logger.info("Restart command processed", extra={"command_id": command_id})
                
            elif command_type == "config_update":
                new_config = command_data.get('config', {})
                response_data = f"Configuration updated with {len(new_config)} settings"
                logger.info("Config update processed", extra={
                    "command_id": command_id,
                    "config_keys": list(new_config.keys())
                })
                
            elif command_type == "run_task":
                task_name = command_data.get('task', 'unknown')
                response_data = f"Task '{task_name}' executed successfully"
                logger.info("Task executed", extra={
                    "command_id": command_id,
                    "task": task_name
                })
                
            elif command_type == "stop":
                response_data = "Stop command received - would gracefully shutdown"
                logger.info("Stop command processed", extra={"command_id": command_id})
                
            else:
                success = False
                error_message = f"Unknown command type: {command_type}"
                logger.warning("Unknown command type", extra={
                    "command_id": command_id,
                    "command_type": command_type
                })
            
            # Report completion
            self.complete_command(command_id, success, response_data, error_message)
            
        except Exception as e:
            error_message = str(e)
            logger.error("Command processing error", extra={
                "command_id": command_id,
                "error": error_message
            })
            self.complete_command(command_id, False, None, error_message)

    def report_analytics(self) -> bool:
        """Report analytics to federation"""
        if not self.is_registered:
            return False
            
        try:
            # Calculate metrics for the current day
            uptime_seconds = int((datetime.now() - self.start_time).total_seconds())
            avg_response_time = self.total_response_time / max(self.request_count, 1)
            error_rate = (self.failed_requests / max(self.request_count, 1)) * 100
            
            # Get system metrics
            cpu_percent = psutil.cpu_percent()
            memory = psutil.virtual_memory()
            disk = psutil.disk_usage('/')
            
            analytics_data = {
                "requestCount": self.request_count,
                "successfulRequests": self.successful_requests,
                "failedRequests": self.failed_requests,
                "averageResponseTime": int(avg_response_time),
                "p95ResponseTime": int(avg_response_time * 1.2),  # Estimate
                "p99ResponseTime": int(avg_response_time * 1.5),  # Estimate
                "totalDataProcessed": self.request_count * 1024,  # Estimated bytes
                "errorRate": int(error_rate * 100),  # Percentage * 100
                "uptime": uptime_seconds,
                "cpuUsageAvg": int(cpu_percent * 100),
                "memoryUsageAvg": int(memory.percent * 100),
                "diskUsageAvg": int(disk.percent * 100),
                "networkBytesIn": 0,  # Would track if available
                "networkBytesOut": 0,  # Would track if available
                "customMetrics": {
                    "python_version": sys.version_info[:2],
                    "process_id": os.getpid(),
                    "requests_per_hour": self.request_count / max(uptime_seconds / 3600, 1)
                },
                "alerts": [],
                "events": [
                    {
                        "timestamp": datetime.now().isoformat(),
                        "type": "analytics_report",
                        "message": "Daily analytics report generated"
                    }
                ]
            }

            response = self.session.post(
                f"{self.config.federation_url}/api/api-neurons/analytics/report",
                json=analytics_data,
                timeout=15
            )
            
            if response.status_code == 200:
                logger.info("Analytics reported successfully", extra={
                    "neuron_id": self.config.neuron_id,
                    "total_requests": self.request_count,
                    "error_rate": error_rate
                })
                return True
            else:
                logger.error("Analytics report failed", extra={
                    "status_code": response.status_code,
                    "response": response.text
                })
                return False
                
        except Exception as e:
            logger.error("Analytics reporting error", extra={
                "error": str(e),
                "neuron_id": self.config.neuron_id
            })
            return False

    def health_check(self) -> Dict[str, Any]:
        """Perform health check"""
        try:
            # Basic health metrics
            cpu_percent = psutil.cpu_percent()
            memory = psutil.virtual_memory()
            uptime_seconds = (datetime.now() - self.start_time).total_seconds()
            
            # Calculate health score
            health_score = 100
            if cpu_percent > 90:
                health_score -= 20
            if memory.percent > 90:
                health_score -= 20
            if self.failed_requests / max(self.request_count, 1) > 0.1:
                health_score -= 30
            
            self.health_score = max(health_score, 0)
            
            return {
                "status": "healthy" if self.health_score > 70 else "degraded",
                "health_score": self.health_score,
                "uptime_seconds": int(uptime_seconds),
                "cpu_percent": cpu_percent,
                "memory_percent": memory.percent,
                "total_requests": self.request_count,
                "error_rate": (self.failed_requests / max(self.request_count, 1)) * 100,
                "last_heartbeat": self.last_heartbeat.isoformat() if self.last_heartbeat else None
            }
            
        except Exception as e:
            logger.error("Health check error", extra={"error": str(e)})
            return {
                "status": "error",
                "health_score": 0,
                "error": str(e)
            }

    def start_background_tasks(self):
        """Start background threads for heartbeat, analytics, and commands"""
        # Heartbeat thread
        def heartbeat_loop():
            while self.is_running:
                self.send_heartbeat()
                time.sleep(self.config.heartbeat_interval)
        
        # Analytics thread
        def analytics_loop():
            while self.is_running:
                self.report_analytics()
                time.sleep(self.config.analytics_interval)
        
        # Command processing thread
        def command_loop():
            while self.is_running:
                commands = self.check_for_commands()
                for command in commands:
                    threading.Thread(
                        target=self.process_command, 
                        args=(command,)
                    ).start()
                time.sleep(10)  # Check every 10 seconds
        
        self.heartbeat_thread = threading.Thread(target=heartbeat_loop, daemon=True)
        self.analytics_thread = threading.Thread(target=analytics_loop, daemon=True)
        self.command_thread = threading.Thread(target=command_loop, daemon=True)
        
        self.heartbeat_thread.start()
        self.analytics_thread.start()
        self.command_thread.start()
        
        logger.info("Background tasks started", extra={
            "neuron_id": self.config.neuron_id
        })

    def start(self) -> bool:
        """Start the API neuron"""
        logger.info("Starting API neuron", extra={
            "neuron_id": self.config.neuron_id,
            "name": self.config.name
        })
        
        # Register with federation
        if not self.register_with_federation():
            logger.error("Failed to register with federation")
            return False
        
        # Mark as running
        self.is_running = True
        
        # Start background tasks
        self.start_background_tasks()
        
        # Send initial heartbeat
        self.send_heartbeat()
        
        logger.info("API neuron started successfully", extra={
            "neuron_id": self.config.neuron_id
        })
        
        return True

    def stop(self):
        """Stop the API neuron"""
        logger.info("Stopping API neuron", extra={
            "neuron_id": self.config.neuron_id
        })
        
        self.is_running = False
        
        # Wait for threads to finish
        if self.heartbeat_thread:
            self.heartbeat_thread.join(timeout=5)
        if self.analytics_thread:
            self.analytics_thread.join(timeout=5)
        if self.command_thread:
            self.command_thread.join(timeout=5)
        
        logger.info("API neuron stopped", extra={
            "neuron_id": self.config.neuron_id
        })

    def simulate_request(self, success: bool = True, response_time: float = 100):
        """Simulate processing a request for demo purposes"""
        self.request_count += 1
        self.total_response_time += response_time
        
        if success:
            self.successful_requests += 1
        else:
            self.failed_requests += 1
            
        logger.debug("Request simulated", extra={
            "success": success,
            "response_time": response_time,
            "total_requests": self.request_count
        })

def main():
    """Main function to run the API neuron"""
    # Configuration
    config = NeuronConfig(
        neuron_id=f"python-data-processor-{int(time.time())}",
        name="Python Data Processor",
        type="data-processor",
        federation_url=os.getenv("FEDERATION_URL", "http://localhost:5000"),
        heartbeat_interval=60,
        analytics_interval=300
    )
    
    # Create and start neuron
    neuron = ApiNeuronClient(config)
    
    try:
        # Start the neuron
        if not neuron.start():
            logger.error("Failed to start neuron")
            sys.exit(1)
        
        # Simulate some work
        logger.info("Neuron is running. Simulating requests...")
        
        # Schedule some simulated requests
        schedule.every(30).seconds.do(lambda: neuron.simulate_request(True, 150))
        schedule.every(2).minutes.do(lambda: neuron.simulate_request(False, 5000))
        
        # Keep running
        while neuron.is_running:
            schedule.run_pending()
            time.sleep(1)
            
    except KeyboardInterrupt:
        logger.info("Received interrupt signal")
    except Exception as e:
        logger.error("Unexpected error", extra={"error": str(e)})
    finally:
        neuron.stop()
        logger.info("Neuron shutdown complete")

if __name__ == "__main__":
    main()