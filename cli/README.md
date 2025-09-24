# Findawise CLI - Empire Command Center

## Quick Start

```bash
# Install globally
npm install -g ./cli

# Configure
findawise-cli configure

# Create your first neuron
findawise-cli neuron --action=create --niche=finance --name="My Finance Hub"

# Check empire status
findawise-cli status --detailed
```

## Commands

### Neuron Lifecycle
- `neuron --action=create` - Create new neuron
- `neuron --action=clone` - Clone existing neuron  
- `neuron --action=retire` - Retire neuron

### Bulk Operations
- `deploy <config-file>` - Bulk deployment
- `status --export <file>` - Export configuration

### Monitoring
- `status` - Empire overview
- `health` - System diagnostics

## Configuration File Examples

Located in `./templates/` directory:
- `neuron-bulk-config.yaml` - Sample bulk deployment

## Support

For detailed documentation, see `../README_EMPIRE_LAUNCHPAD.md`