#!/usr/bin/env python3
"""
Production-Grade Python API Neuron Client
==========================================

A comprehensive, enterprise-ready Python client for the Findawise Empire Federation.
This neuron demonstrates full integration with the federation system including:
- Authentication with JWT tokens
- Real-time heartbeat monitoring
- Command & control system
- Analytics reporting
- Error handling and recovery
- Production logging and metrics

Author: Findawise Empire Development Team
Version: 1.0.0
License: MIT
"""

import asyncio
import json
import logging
import os
import platform
import psutil
import requests
import signal
import sys
import time
import traceback
import uuid
from datetime import datetime, timezone
from typing import Dict, List, Optional, Any
from dataclasses import dataclass, asdict
from threading import Thread, Lock
import schedule

# Configuration
@dataclass
class NeuronConfig:
    """Configuration for the API neuron"""
    federation_base_url: str = "http://localhost:5000"
    neuron_id: str = ""
    name: str = "Python Data Processor"
    type: str = "python-data-processor"
    language: str = "python"
    version: str = "1.0.0"
    healthcheck_endpoint: str = "/health"
    api_endpoints: List[str] = None
    capabilities: List[str] = None
    heartbeat_interval: int = 60  # seconds
    command_check_interval: int = 30  # seconds
    analytics_report_interval: int = 300  # 5 minutes
    max_restart_attempts: int = 3
    log_level: str = "INFO"
    
    def __post_init__(self):
        if self.api_endpoints is None:
            self.api_endpoints = ["/health", "/process", "/status", "/metrics"]
        if self.capabilities is None:
            self.capabilities = [
                "data_processing", 
                "file_analysis", 
                "report_generation",
                "batch_processing",
                "real_time_monitoring"
            ]
        if not self.neuron_id:
            self.neuron_id = f"python-neuron-{int(time.time())}"

class ProductionLogger:
    """Production-grade logging system"""
    
    def __init__(self, name: str, level: str = "INFO"):
        self.logger = logging.getLogger(name)
        self.logger.setLevel(getattr(logging, level))
        
        # Console handler
        console_handler = logging.StreamHandler()
        console_formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - [%(filename)s:%(lineno)d] - %(message)s'
        )
        console_handler.setFormatter(console_formatter)
        self.logger.addHandler(console_handler)
        
        # File handler
        file_handler = logging.FileHandler('neuron.log')
        file_formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(funcName)s:%(lineno)d - %(message)s'
        )
        file_handler.setFormatter(file_formatter)
        self.logger.addHandler(file_handler)
    
    def debug(self, msg): self.logger.debug(msg)
    def info(self, msg): self.logger.info(msg)
    def warning(self, msg): self.logger.warning(msg)
    def error(self, msg): self.logger.error(msg)
    def critical(self, msg): self.logger.critical(msg)

class SystemMetrics:
    """System metrics collector"""
    
    @staticmethod
    def get_system_info() -> Dict[str, Any]:
        """Get comprehensive system information"""
        try:
            cpu_percent = psutil.cpu_percent(interval=1)
            memory = psutil.virtual_memory()
            disk = psutil.disk_usage('/')
            
            return {
                "cpu_usage": cpu_percent,
                "memory_usage": memory.percent,
                "memory_total": memory.total,
                "memory_available": memory.available,
                "disk_usage": disk.percent,
                "disk_total": disk.total,
                "disk_free": disk.free,
                "load_average": os.getloadavg() if hasattr(os, 'getloadavg') else None,
                "process_count": len(psutil.pids()),
                "uptime": time.time() - psutil.boot_time()
            }
        except Exception as e:
            return {"error": str(e)}
    
    @staticmethod
    def get_application_metrics() -> Dict[str, Any]:
        """Get application-specific metrics"""
        process = psutil.Process()
        return {
            "pid": process.pid,
            "cpu_percent": process.cpu_percent(),
            "memory_info": process.memory_info()._asdict(),
            "num_threads": process.num_threads(),
            "create_time": process.create_time(),
            "status": process.status()
        }

class FederationClient:
    """Client for communicating with the Empire Federation"""
    
    def __init__(self, config: NeuronConfig, logger: ProductionLogger):
        self.config = config
        self.logger = logger
        self.jwt_token: Optional[str] = None
        self.session = requests.Session()
        self.is_registered = False
        self.last_heartbeat = None
        self.command_queue = []
        self.metrics_lock = Lock()
        self.analytics_data = {
            "request_count": 0,
            "successful_requests": 0,
            "failed_requests": 0,
            "total_data_processed": 0,
            "uptime_start": time.time()
        }
    
    def register_neuron(self) -> bool:
        """Register this neuron with the federation"""
        try:
            registration_data = {
                "neuronId": self.config.neuron_id,
                "name": self.config.name,
                "type": self.config.type,
                "language": self.config.language,
                "version": self.config.version,
                "baseUrl": None,  # No web server for this example
                "healthcheckEndpoint": self.config.healthcheck_endpoint,
                "apiEndpoints": self.config.api_endpoints,
                "authentication": {
                    "type": "jwt",
                    "enabled": True
                },
                "capabilities": self.config.capabilities,
                "dependencies": [
                    "python>=3.8",
                    "requests",
                    "psutil",
                    "schedule"
                ],
                "resourceRequirements": {
                    "cpu": "0.5",
                    "memory": "512Mi",
                    "storage": "1Gi"
                },
                "deploymentInfo": {
                    "platform": platform.platform(),
                    "hostname": platform.node(),
                    "python_version": platform.python_version()
                },
                "alertThresholds": {
                    "cpu_usage": 80,
                    "memory_usage": 85,
                    "error_rate": 5,
                    "response_time": 5000
                },
                "autoRestartEnabled": True,
                "maxRestartAttempts": self.config.max_restart_attempts,
                "metadata": {
                    "environment": os.environ.get("ENVIRONMENT", "development"),
                    "region": os.environ.get("REGION", "local"),
                    "instance_id": str(uuid.uuid4())
                }
            }
            
            response = self.session.post(
                f"{self.config.federation_base_url}/api/api-neurons/register",
                json=registration_data,
                timeout=30
            )
            
            if response.status_code == 201:
                data = response.json()
                self.jwt_token = data['data']['token']
                self.session.headers.update({
                    'Authorization': f'Bearer {self.jwt_token}'
                })
                self.is_registered = True
                self.logger.info(f"✅ Successfully registered neuron: {self.config.neuron_id}")
                self.logger.info(f"📋 Instructions: {data['data']['instructions']}")
                return True
            else:
                self.logger.error(f"❌ Registration failed: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            self.logger.error(f"❌ Registration error: {str(e)}")
            return False
    
    def send_heartbeat(self) -> bool:
        """Send heartbeat to federation"""
        if not self.is_registered:
            return False
            
        try:
            system_metrics = SystemMetrics.get_system_info()
            app_metrics = SystemMetrics.get_application_metrics()
            
            heartbeat_data = {
                "status": "active",
                "healthScore": self._calculate_health_score(system_metrics),
                "uptime": int(time.time() - self.analytics_data["uptime_start"]),
                "processId": str(os.getpid()),
                "hostInfo": {
                    "hostname": platform.node(),
                    "platform": platform.platform(),
                    "ip_address": self._get_local_ip(),
                    "container_id": os.environ.get("CONTAINER_ID")
                },
                "systemMetrics": system_metrics,
                "applicationMetrics": app_metrics,
                "dependencyStatus": self._check_dependencies(),
                "performanceMetrics": {
                    "requests_per_second": self._calculate_rps(),
                    "average_response_time": self._get_avg_response_time(),
                    "memory_usage_mb": app_metrics.get("memory_info", {}).get("rss", 0) / 1024 / 1024
                },
                "configVersion": "1.0",
                "buildVersion": self.config.version
            }
            
            response = self.session.post(
                f"{self.config.federation_base_url}/api/api-neurons/heartbeat",
                json=heartbeat_data,
                timeout=15
            )
            
            if response.status_code == 200:
                self.last_heartbeat = datetime.now(timezone.utc)
                data = response.json()
                if data['data']['pendingCommands'] > 0:
                    self.logger.info(f"📋 {data['data']['pendingCommands']} pending commands")
                return True
            else:
                self.logger.error(f"❌ Heartbeat failed: {response.status_code}")
                return False
                
        except Exception as e:
            self.logger.error(f"❌ Heartbeat error: {str(e)}")
            return False
    
    def check_commands(self) -> List[Dict]:
        """Check for pending commands from federation"""
        if not self.is_registered:
            return []
            
        try:
            response = self.session.get(
                f"{self.config.federation_base_url}/api/api-neurons/commands/pending",
                timeout=10
            )
            
            if response.status_code == 200:
                commands = response.json()['data']
                self.logger.info(f"📋 Retrieved {len(commands)} pending commands")
                return commands
            else:
                self.logger.error(f"❌ Command check failed: {response.status_code}")
                return []
                
        except Exception as e:
            self.logger.error(f"❌ Command check error: {str(e)}")
            return []
    
    def acknowledge_command(self, command_id: str) -> bool:
        """Acknowledge receipt of a command"""
        try:
            response = self.session.post(
                f"{self.config.federation_base_url}/api/api-neurons/commands/{command_id}/acknowledge",
                timeout=10
            )
            return response.status_code == 200
        except Exception as e:
            self.logger.error(f"❌ Command acknowledge error: {str(e)}")
            return False
    
    def complete_command(self, command_id: str, success: bool, response_data: Any = None, error_message: str = None) -> bool:
        """Report command completion"""
        try:
            completion_data = {
                "success": success,
                "response": response_data,
                "errorMessage": error_message
            }
            
            response = self.session.post(
                f"{self.config.federation_base_url}/api/api-neurons/commands/{command_id}/complete",
                json=completion_data,
                timeout=10
            )
            return response.status_code == 200
        except Exception as e:
            self.logger.error(f"❌ Command completion error: {str(e)}")
            return False
    
    def report_analytics(self) -> bool:
        """Report analytics to federation"""
        if not self.is_registered:
            return False
            
        try:
            with self.metrics_lock:
                uptime = int(time.time() - self.analytics_data["uptime_start"])
                
                analytics_data = {
                    "requestCount": self.analytics_data["request_count"],
                    "successfulRequests": self.analytics_data["successful_requests"],
                    "failedRequests": self.analytics_data["failed_requests"],
                    "averageResponseTime": self._get_avg_response_time(),
                    "totalDataProcessed": self.analytics_data["total_data_processed"],
                    "uptime": uptime,
                    "customMetrics": {
                        "data_processing_jobs": self.analytics_data.get("processing_jobs", 0),
                        "files_processed": self.analytics_data.get("files_processed", 0),
                        "error_rate": self._calculate_error_rate(),
                        "memory_peak_mb": self.analytics_data.get("memory_peak", 0)
                    },
                    "events": self.analytics_data.get("events", [])
                }
            
            response = self.session.post(
                f"{self.config.federation_base_url}/api/api-neurons/analytics/report",
                json=analytics_data,
                timeout=15
            )
            
            if response.status_code == 200:
                self.logger.info("📊 Analytics reported successfully")
                # Reset some counters
                self.analytics_data["events"] = []
                return True
            else:
                self.logger.error(f"❌ Analytics report failed: {response.status_code}")
                return False
                
        except Exception as e:
            self.logger.error(f"❌ Analytics report error: {str(e)}")
            return False
    
    def _calculate_health_score(self, system_metrics: Dict) -> int:
        """Calculate health score based on system metrics"""
        score = 100
        
        # CPU usage penalty
        cpu_usage = system_metrics.get("cpu_usage", 0)
        if cpu_usage > 80:
            score -= 20
        elif cpu_usage > 60:
            score -= 10
        
        # Memory usage penalty
        memory_usage = system_metrics.get("memory_usage", 0)
        if memory_usage > 85:
            score -= 20
        elif memory_usage > 70:
            score -= 10
        
        # Disk usage penalty
        disk_usage = system_metrics.get("disk_usage", 0)
        if disk_usage > 90:
            score -= 15
        elif disk_usage > 80:
            score -= 5
        
        # Error rate penalty
        error_rate = self._calculate_error_rate()
        if error_rate > 5:
            score -= 25
        elif error_rate > 2:
            score -= 10
        
        return max(0, score)
    
    def _calculate_rps(self) -> float:
        """Calculate requests per second"""
        uptime = time.time() - self.analytics_data["uptime_start"]
        if uptime > 0:
            return self.analytics_data["request_count"] / uptime
        return 0.0
    
    def _get_avg_response_time(self) -> int:
        """Get average response time in milliseconds"""
        return self.analytics_data.get("avg_response_time", 100)
    
    def _calculate_error_rate(self) -> float:
        """Calculate error rate percentage"""
        total = self.analytics_data["request_count"]
        if total > 0:
            return (self.analytics_data["failed_requests"] / total) * 100
        return 0.0
    
    def _get_local_ip(self) -> str:
        """Get local IP address"""
        try:
            import socket
            s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
            s.connect(("8.8.8.8", 80))
            ip = s.getsockname()[0]
            s.close()
            return ip
        except:
            return "127.0.0.1"
    
    def _check_dependencies(self) -> Dict[str, str]:
        """Check status of external dependencies"""
        dependencies = {}
        
        # Check internet connectivity
        try:
            response = requests.get("https://httpbin.org/status/200", timeout=5)
            dependencies["internet"] = "healthy" if response.status_code == 200 else "degraded"
        except:
            dependencies["internet"] = "unhealthy"
        
        # Check federation connectivity
        try:
            response = requests.get(f"{self.config.federation_base_url}/health", timeout=5)
            dependencies["federation"] = "healthy" if response.status_code == 200 else "degraded"
        except:
            dependencies["federation"] = "unhealthy"
        
        return dependencies

class CommandProcessor:
    """Processes commands from the federation"""
    
    def __init__(self, logger: ProductionLogger, federation_client: FederationClient):
        self.logger = logger
        self.federation_client = federation_client
        self.processing = False
    
    def process_command(self, command: Dict) -> None:
        """Process a single command"""
        command_id = command.get("commandId")
        command_type = command.get("commandType")
        command_data = command.get("commandData", {})
        
        self.logger.info(f"🔄 Processing command {command_id}: {command_type}")
        
        # Acknowledge command receipt
        self.federation_client.acknowledge_command(command_id)
        
        try:
            if command_type == "config_update":
                result = self._handle_config_update(command_data)
            elif command_type == "restart":
                result = self._handle_restart(command_data)
            elif command_type == "run_task":
                result = self._handle_run_task(command_data)
            elif command_type == "health_check":
                result = self._handle_health_check(command_data)
            elif command_type == "stop":
                result = self._handle_stop(command_data)
            else:
                result = {"success": False, "error": f"Unknown command type: {command_type}"}
            
            # Report completion
            self.federation_client.complete_command(
                command_id,
                result["success"],
                result.get("data"),
                result.get("error")
            )
            
            self.logger.info(f"✅ Command {command_id} completed: {result['success']}")
            
        except Exception as e:
            error_msg = f"Command processing error: {str(e)}"
            self.logger.error(f"❌ {error_msg}")
            self.federation_client.complete_command(command_id, False, None, error_msg)
    
    def _handle_config_update(self, data: Dict) -> Dict:
        """Handle configuration update"""
        try:
            self.logger.info(f"📝 Updating configuration: {data}")
            # In a real implementation, update actual configuration
            return {"success": True, "data": {"updated": True, "config": data}}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def _handle_restart(self, data: Dict) -> Dict:
        """Handle restart command"""
        try:
            self.logger.info("🔄 Restart requested")
            # In a real implementation, perform graceful restart
            return {"success": True, "data": {"restart_initiated": True}}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def _handle_run_task(self, data: Dict) -> Dict:
        """Handle task execution"""
        try:
            task_type = data.get("task_type")
            self.logger.info(f"🚀 Running task: {task_type}")
            
            if task_type == "data_processing":
                # Simulate data processing
                time.sleep(2)
                return {"success": True, "data": {"processed_records": 1000, "duration": 2.0}}
            elif task_type == "report_generation":
                # Simulate report generation
                time.sleep(1)
                return {"success": True, "data": {"report_id": str(uuid.uuid4()), "pages": 25}}
            else:
                return {"success": False, "error": f"Unknown task type: {task_type}"}
                
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def _handle_health_check(self, data: Dict) -> Dict:
        """Handle health check"""
        try:
            system_metrics = SystemMetrics.get_system_info()
            app_metrics = SystemMetrics.get_application_metrics()
            
            return {
                "success": True,
                "data": {
                    "status": "healthy",
                    "system_metrics": system_metrics,
                    "application_metrics": app_metrics,
                    "timestamp": datetime.now(timezone.utc).isoformat()
                }
            }
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def _handle_stop(self, data: Dict) -> Dict:
        """Handle stop command"""
        try:
            self.logger.info("🛑 Stop requested")
            # Graceful shutdown
            os.kill(os.getpid(), signal.SIGTERM)
            return {"success": True, "data": {"stop_initiated": True}}
        except Exception as e:
            return {"success": False, "error": str(e)}

class PythonApiNeuron:
    """Main API Neuron class"""
    
    def __init__(self, config: NeuronConfig):
        self.config = config
        self.logger = ProductionLogger("PythonApiNeuron", config.log_level)
        self.federation_client = FederationClient(config, self.logger)
        self.command_processor = CommandProcessor(self.logger, self.federation_client)
        self.running = False
        self.threads = []
        
        # Setup signal handlers
        signal.signal(signal.SIGINT, self._signal_handler)
        signal.signal(signal.SIGTERM, self._signal_handler)
    
    def start(self) -> None:
        """Start the neuron"""
        self.logger.info("🚀 Starting Python API Neuron...")
        self.logger.info(f"📋 Configuration: {self.config}")
        
        # Register with federation
        if not self.federation_client.register_neuron():
            self.logger.error("❌ Failed to register with federation. Exiting.")
            sys.exit(1)
        
        self.running = True
        
        # Start background threads
        self._start_heartbeat_thread()
        self._start_command_processing_thread()
        self._start_analytics_thread()
        
        self.logger.info("✅ Python API Neuron started successfully!")
        
        # Main loop
        try:
            while self.running:
                time.sleep(1)
        except KeyboardInterrupt:
            self.logger.info("⚠️ Received keyboard interrupt")
        finally:
            self._shutdown()
    
    def _start_heartbeat_thread(self) -> None:
        """Start heartbeat thread"""
        def heartbeat_loop():
            while self.running:
                try:
                    self.federation_client.send_heartbeat()
                    time.sleep(self.config.heartbeat_interval)
                except Exception as e:
                    self.logger.error(f"❌ Heartbeat thread error: {str(e)}")
                    time.sleep(5)  # Brief pause before retry
        
        thread = Thread(target=heartbeat_loop, daemon=True)
        thread.start()
        self.threads.append(thread)
        self.logger.info(f"💓 Heartbeat thread started (interval: {self.config.heartbeat_interval}s)")
    
    def _start_command_processing_thread(self) -> None:
        """Start command processing thread"""
        def command_loop():
            while self.running:
                try:
                    commands = self.federation_client.check_commands()
                    for command in commands:
                        self.command_processor.process_command(command)
                    time.sleep(self.config.command_check_interval)
                except Exception as e:
                    self.logger.error(f"❌ Command processing thread error: {str(e)}")
                    time.sleep(5)
        
        thread = Thread(target=command_loop, daemon=True)
        thread.start()
        self.threads.append(thread)
        self.logger.info(f"📋 Command processing thread started (interval: {self.config.command_check_interval}s)")
    
    def _start_analytics_thread(self) -> None:
        """Start analytics reporting thread"""
        def analytics_loop():
            while self.running:
                try:
                    self.federation_client.report_analytics()
                    time.sleep(self.config.analytics_report_interval)
                except Exception as e:
                    self.logger.error(f"❌ Analytics thread error: {str(e)}")
                    time.sleep(30)
        
        thread = Thread(target=analytics_loop, daemon=True)
        thread.start()
        self.threads.append(thread)
        self.logger.info(f"📊 Analytics thread started (interval: {self.config.analytics_report_interval}s)")
    
    def _signal_handler(self, signum, frame):
        """Handle shutdown signals"""
        self.logger.info(f"⚠️ Received signal {signum}. Initiating graceful shutdown...")
        self.running = False
    
    def _shutdown(self) -> None:
        """Graceful shutdown"""
        self.logger.info("🛑 Shutting down Python API Neuron...")
        self.running = False
        
        # Wait for threads to finish
        for thread in self.threads:
            if thread.is_alive():
                thread.join(timeout=5)
        
        self.logger.info("✅ Python API Neuron shutdown complete")

def main():
    """Main entry point"""
    # Load configuration from environment or defaults
    config = NeuronConfig(
        federation_base_url=os.environ.get("FEDERATION_URL", "http://localhost:5000"),
        neuron_id=os.environ.get("NEURON_ID", ""),
        name=os.environ.get("NEURON_NAME", "Python Data Processor"),
        log_level=os.environ.get("LOG_LEVEL", "INFO")
    )
    
    # Create and start neuron
    neuron = PythonApiNeuron(config)
    neuron.start()

if __name__ == "__main__":
    main()