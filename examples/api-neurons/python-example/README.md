# Python API Neuron Example

This is a production-grade example of an API-only neuron that integrates with the Findawise Empire Federation system.

## Features

- **Automatic Registration**: Registers with the federation on startup
- **JWT Authentication**: Secure token-based authentication
- **Heartbeat Monitoring**: Regular status updates to federation
- **Command Handling**: Processes commands from federation control center
- **Analytics Reporting**: Detailed metrics and performance data
- **Health Monitoring**: Continuous health checks and scoring
- **Error Recovery**: Robust error handling and recovery mechanisms
- **Structured Logging**: JSON-formatted logs for better observability

## Requirements

- Python 3.11+
- Dependencies listed in `requirements.txt`
- Access to Findawise Empire Federation API

## Installation

1. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Set environment variables:**
   ```bash
   export FEDERATION_URL=http://localhost:5000
   ```

3. **Run the neuron:**
   ```bash
   python neuron_client.py
   ```

## Docker Deployment

1. **Build the image:**
   ```bash
   docker build -t api-neuron-python .
   ```

2. **Run the container:**
   ```bash
   docker run -e FEDERATION_URL=http://host.docker.internal:5000 api-neuron-python
   ```

## Configuration

The neuron can be configured through the `NeuronConfig` class:

```python
config = NeuronConfig(
    neuron_id="my-unique-neuron-id",
    name="My Python Neuron",
    type="data-processor",
    federation_url="http://localhost:5000",
    heartbeat_interval=60,  # seconds
    analytics_interval=300  # 5 minutes
)
```

## API Endpoints

The neuron exposes the following capabilities:

- `GET /health` - Health check endpoint
- `POST /data/process` - Data processing endpoint
- `GET /status` - Neuron status information

## Monitoring

The neuron reports the following metrics to the federation:

### System Metrics
- CPU usage percentage
- Memory usage percentage
- Disk usage percentage
- Process uptime

### Application Metrics
- Total requests processed
- Successful vs failed requests
- Average response time
- Error rate

### Health Metrics
- Overall health score (0-100)
- Dependency status
- Performance metrics

## Commands

The neuron can process the following commands from the federation:

- `restart` - Restart the neuron service
- `config_update` - Update configuration settings
- `run_task` - Execute a specific task
- `stop` - Gracefully shutdown the neuron

## Logging

The neuron uses structured JSON logging for better observability:

```json
{
  "timestamp": "2025-01-20T08:34:15.123Z",
  "level": "INFO",
  "message": "API Neuron initialized",
  "neuron_id": "python-data-processor-1753086739",
  "name": "Python Data Processor",
  "type": "data-processor"
}
```

## Error Handling

The neuron includes comprehensive error handling:

- **Connection failures**: Automatic retry with exponential backoff
- **Authentication errors**: Token refresh and re-registration
- **Command failures**: Proper error reporting to federation
- **Health issues**: Automatic health score calculation and alerting

## Production Considerations

### Security
- JWT tokens are securely managed
- No sensitive data logged
- HTTPS communication (configure FEDERATION_URL accordingly)

### Performance
- Async command processing
- Efficient resource usage monitoring
- Configurable intervals for reporting

### Reliability
- Graceful shutdown handling
- Health check timeouts
- Automatic recovery mechanisms

## Integration Examples

### Custom Data Processing
```python
def process_custom_data(data):
    # Your custom processing logic
    result = transform_data(data)
    neuron.simulate_request(success=True, response_time=200)
    return result
```

### External API Integration
```python
def call_external_api(endpoint, data):
    try:
        response = requests.post(endpoint, json=data)
        neuron.simulate_request(success=True, response_time=response.elapsed.total_seconds() * 1000)
        return response.json()
    except Exception as e:
        neuron.simulate_request(success=False, response_time=5000)
        raise
```

## Troubleshooting

### Common Issues

1. **Registration fails**
   - Check FEDERATION_URL environment variable
   - Verify federation API is running
   - Check network connectivity

2. **Heartbeat failures**
   - Verify JWT token is valid
   - Check system resource usage
   - Review federation logs

3. **Command processing errors**
   - Check command format and data
   - Verify neuron capabilities match commands
   - Review error logs

### Debug Mode

Enable debug logging:
```python
logger.setLevel(logging.DEBUG)
```

## License

This example is part of the Findawise Empire Federation system and follows the same licensing terms.