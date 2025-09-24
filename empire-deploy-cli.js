#!/usr/bin/env node

/**
 * Empire Deploy CLI - Master Deployment Script
 * Billion-Dollar Grade Multi-Region Disaster-Ready Deployment Tool
 */

const { Command } = require('commander');
const inquirer = require('inquirer');
const ora = require('ora');
const chalk = require('chalk');
const Table = require('cli-table3');
const fs = require('fs/promises');
const path = require('path');
const axios = require('axios');

const program = new Command();

// Configuration
const CONFIG_FILE = path.join(process.cwd(), 'empire-deploy.config.json');
const DEFAULT_API_BASE = process.env.EMPIRE_API_BASE || 'http://localhost:5000/api';

// ==========================================
// UTILITY FUNCTIONS
// ==========================================

async function loadConfig() {
  try {
    const config = await fs.readFile(CONFIG_FILE, 'utf-8');
    return JSON.parse(config);
  } catch {
    return {
      apiBase: DEFAULT_API_BASE,
      apiKey: process.env.EMPIRE_API_KEY,
      defaultEnvironment: 'dev',
      profiles: {}
    };
  }
}

async function saveConfig(config) {
  await fs.writeFile(CONFIG_FILE, JSON.stringify(config, null, 2));
}

async function apiRequest(endpoint, method = 'GET', data = null) {
  const config = await loadConfig();
  
  if (!config.apiKey) {
    console.error(chalk.red('❌ API key not configured. Run: empire-deploy configure'));
    process.exit(1);
  }

  try {
    const response = await axios({
      method,
      url: `${config.apiBase}${endpoint}`,
      data,
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  } catch (error) {
    if (error.response) {
      throw new Error(`API Error ${error.response.status}: ${error.response.data.error || error.response.statusText}`);
    }
    throw new Error(`Network Error: ${error.message}`);
  }
}

function formatDuration(ms) {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
}

function getStatusEmoji(status) {
  const statusMap = {
    'pending': '⏳',
    'running': '🔄',
    'completed': '✅',
    'failed': '❌',
    'rolled_back': '↩️',
    'cancelled': '🚫'
  };
  return statusMap[status] || '❓';
}

// ==========================================
// COMMAND IMPLEMENTATIONS
// ==========================================

async function configureCommand() {
  console.log(chalk.blue.bold('🔧 Empire Deploy Configuration'));
  console.log();

  const config = await loadConfig();
  
  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'apiBase',
      message: 'API Base URL:',
      default: config.apiBase
    },
    {
      type: 'password',
      name: 'apiKey',
      message: 'API Key:',
      mask: '*'
    },
    {
      type: 'list',
      name: 'defaultEnvironment',
      message: 'Default Environment:',
      choices: ['dev', 'staging', 'prod', 'dr'],
      default: config.defaultEnvironment
    }
  ]);

  const newConfig = { ...config, ...answers };
  await saveConfig(newConfig);
  
  console.log(chalk.green('✅ Configuration saved successfully!'));
}

async function deployCommand(options) {
  const config = await loadConfig();
  const spinner = ora('Preparing deployment...').start();

  try {
    // Load deployment profile or create inline config
    let deployConfig;
    
    if (options.profile) {
      if (!config.profiles[options.profile]) {
        spinner.fail(`Profile "${options.profile}" not found`);
        return;
      }
      deployConfig = config.profiles[options.profile];
    } else {
      // Interactive deployment configuration
      spinner.stop();
      
      const answers = await inquirer.prompt([
        {
          type: 'input',
          name: 'name',
          message: 'Deployment name:',
          default: `deploy-${Date.now()}`
        },
        {
          type: 'list',
          name: 'environment',
          message: 'Target environment:',
          choices: ['dev', 'staging', 'prod', 'dr'],
          default: options.env || config.defaultEnvironment
        },
        {
          type: 'list',
          name: 'deploymentType',
          message: 'Deployment type:',
          choices: ['full', 'partial', 'hotfix'],
          default: 'full'
        },
        {
          type: 'input',
          name: 'version',
          message: 'Version:',
          default: 'latest'
        },
        {
          type: 'checkbox',
          name: 'scope',
          message: 'What to deploy:',
          choices: [
            { name: 'Core Application', value: 'core', checked: true },
            { name: 'Database Migrations', value: 'migrations', checked: true },
            { name: 'Assets', value: 'assets', checked: false },
            { name: 'Configuration', value: 'config', checked: false }
          ]
        },
        {
          type: 'confirm',
          name: 'backup',
          message: 'Create backup before deployment?',
          default: true
        },
        {
          type: 'confirm',
          name: 'healthChecks',
          message: 'Run health checks after deployment?',
          default: true
        }
      ]);

      deployConfig = {
        name: answers.name,
        environment: answers.environment,
        deploymentType: answers.deploymentType,
        version: answers.version,
        scope: {
          core: answers.scope.includes('core'),
          migrations: answers.scope.includes('migrations'),
          assets: answers.scope.includes('assets'),
          config: answers.scope.includes('config')
        },
        parallelization: {
          enabled: !options.sequential,
          maxConcurrency: options.concurrent || 3
        },
        rollback: {
          enabled: true,
          backupBeforeDeployment: answers.backup,
          autoRollbackOnFailure: options.autoRollback !== false
        },
        healthChecks: {
          enabled: answers.healthChecks,
          endpoints: ['http://localhost:5000/health'],
          timeout: 30000,
          retries: 3
        },
        notifications: {
          channels: [],
          onStart: true,
          onComplete: true,
          onFailure: true
        },
        hooks: {
          preDeployment: options.preHook ? [options.preHook] : [],
          postDeployment: options.postHook ? [options.postHook] : []
        }
      };
      
      spinner.start('Starting deployment...');
    }

    // Start deployment
    const response = await apiRequest('/deployment/deploy', 'POST', deployConfig);
    const deploymentId = response.data.deploymentId;
    
    spinner.succeed(`Deployment started: ${deploymentId}`);
    
    if (options.wait) {
      await watchDeployment(deploymentId);
    } else {
      console.log(chalk.blue(`📊 Monitor progress: empire-deploy status ${deploymentId}`));
    }

  } catch (error) {
    spinner.fail(`Deployment failed: ${error.message}`);
    process.exit(1);
  }
}

async function watchDeployment(deploymentId) {
  const spinner = ora('Monitoring deployment...').start();
  
  let lastStatus = '';
  let lastProgress = 0;
  
  while (true) {
    try {
      const response = await apiRequest(`/deployment/deployments/${deploymentId}`);
      const deployment = response.data;
      
      if (deployment.status !== lastStatus || deployment.progress !== lastProgress) {
        const emoji = getStatusEmoji(deployment.status);
        const progress = deployment.progress || 0;
        
        spinner.text = `${emoji} ${deployment.name} - ${deployment.status} (${progress}%)`;
        
        if (deployment.status === 'completed') {
          spinner.succeed(`✅ Deployment completed successfully!`);
          break;
        } else if (deployment.status === 'failed') {
          spinner.fail(`❌ Deployment failed!`);
          break;
        }
        
        lastStatus = deployment.status;
        lastProgress = progress;
      }
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      
    } catch (error) {
      spinner.fail(`Failed to get deployment status: ${error.message}`);
      break;
    }
  }
}

async function statusCommand(deploymentId) {
  const spinner = ora('Fetching deployment status...').start();
  
  try {
    if (deploymentId) {
      // Show specific deployment
      const response = await apiRequest(`/deployment/deployments/${deploymentId}`);
      const deployment = response.data;
      
      spinner.stop();
      
      console.log(chalk.blue.bold(`\n📊 Deployment Status: ${deployment.name}`));
      console.log(chalk.gray('━'.repeat(50)));
      
      console.log(`ID: ${deployment.deploymentId}`);
      console.log(`Status: ${getStatusEmoji(deployment.status)} ${deployment.status}`);
      console.log(`Environment: ${deployment.environment}`);
      console.log(`Version: ${deployment.version}`);
      console.log(`Progress: ${deployment.progress || 0}%`);
      console.log(`Started: ${new Date(deployment.startedAt).toLocaleString()}`);
      
      if (deployment.completedAt) {
        const duration = new Date(deployment.completedAt) - new Date(deployment.startedAt);
        console.log(`Duration: ${formatDuration(duration)}`);
      }
      
      console.log(`Steps: ${deployment.completedSteps}/${deployment.totalSteps} completed`);
      
      if (deployment.failedSteps > 0) {
        console.log(chalk.red(`Failed Steps: ${deployment.failedSteps}`));
      }
      
    } else {
      // Show recent deployments
      const response = await apiRequest('/deployment/deployments?limit=10');
      const deployments = response.data;
      
      spinner.stop();
      
      console.log(chalk.blue.bold('\n📋 Recent Deployments'));
      
      const table = new Table({
        head: ['ID', 'Name', 'Status', 'Environment', 'Progress', 'Started', 'Duration'],
        colWidths: [12, 20, 12, 12, 10, 20, 12]
      });
      
      deployments.forEach(deployment => {
        const duration = deployment.completedAt ? 
          formatDuration(new Date(deployment.completedAt) - new Date(deployment.startedAt)) :
          'Running...';
        
        table.push([
          deployment.deploymentId.substring(0, 8),
          deployment.name,
          `${getStatusEmoji(deployment.status)} ${deployment.status}`,
          deployment.environment,
          `${deployment.progress || 0}%`,
          new Date(deployment.startedAt).toLocaleString(),
          duration
        ]);
      });
      
      console.log(table.toString());
    }
    
  } catch (error) {
    spinner.fail(`Failed to get status: ${error.message}`);
  }
}

async function rollbackCommand(deploymentId) {
  const spinner = ora('Initiating rollback...').start();
  
  try {
    await apiRequest(`/deployment/deployments/${deploymentId}/rollback`, 'POST');
    spinner.succeed('✅ Rollback initiated successfully!');
    
    console.log(chalk.blue(`📊 Monitor progress: empire-deploy status ${deploymentId}`));
    
  } catch (error) {
    spinner.fail(`Rollback failed: ${error.message}`);
  }
}

async function exportCommand(options) {
  const spinner = ora('Preparing export...').start();
  
  try {
    spinner.stop();
    
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'name',
        message: 'Export name:',
        default: `export-${Date.now()}`
      },
      {
        type: 'list',
        name: 'exportType',
        message: 'Export type:',
        choices: ['full', 'partial', 'neuron', 'config', 'data'],
        default: 'full'
      },
      {
        type: 'checkbox',
        name: 'scope',
        message: 'What to export:',
        choices: [
          { name: 'Neurons', value: 'neurons', checked: true },
          { name: 'Databases', value: 'databases', checked: true },
          { name: 'Configuration', value: 'config', checked: true },
          { name: 'Assets', value: 'assets', checked: false },
          { name: 'Analytics', value: 'analytics', checked: false },
          { name: 'Users', value: 'users', checked: false }
        ]
      },
      {
        type: 'list',
        name: 'compression',
        message: 'Compression format:',
        choices: ['gzip', 'zip', 'tar'],
        default: 'gzip'
      },
      {
        type: 'confirm',
        name: 'encryption',
        message: 'Enable encryption?',
        default: true
      }
    ]);
    
    const exportConfig = {
      name: answers.name,
      exportType: answers.exportType,
      scope: {
        neurons: answers.scope.includes('neurons'),
        databases: answers.scope.includes('databases'),
        config: answers.scope.includes('config'),
        assets: answers.scope.includes('assets'),
        analytics: answers.scope.includes('analytics'),
        users: answers.scope.includes('users')
      },
      compression: answers.compression,
      encryption: answers.encryption
    };
    
    spinner.start('Creating export...');
    
    const response = await apiRequest('/deployment/export', 'POST', exportConfig);
    const archiveId = response.data.archiveId;
    
    spinner.succeed(`✅ Export created: ${archiveId}`);
    console.log(chalk.blue(`📦 Archive ID: ${archiveId}`));
    
  } catch (error) {
    spinner.fail(`Export failed: ${error.message}`);
  }
}

async function importCommand(archiveId, options) {
  const spinner = ora('Preparing import...').start();
  
  try {
    spinner.stop();
    
    const answers = await inquirer.prompt([
      {
        type: 'list',
        name: 'importType',
        message: 'Import type:',
        choices: ['full', 'partial', 'merge', 'overwrite'],
        default: 'merge'
      },
      {
        type: 'list',
        name: 'duplicateHandling',
        message: 'Handle duplicates:',
        choices: ['skip', 'overwrite', 'merge'],
        default: 'skip'
      },
      {
        type: 'confirm',
        name: 'dryRun',
        message: 'Perform dry run first?',
        default: true
      },
      {
        type: 'confirm',
        name: 'rollbackOnError',
        message: 'Rollback on error?',
        default: true
      }
    ]);
    
    const importConfig = {
      archiveId,
      importType: answers.importType,
      conflictResolution: {
        duplicateHandling: answers.duplicateHandling,
        schemaUpgrade: true,
        preserveIds: false
      },
      dryRun: answers.dryRun,
      rollbackOnError: answers.rollbackOnError
    };
    
    spinner.start('Starting import...');
    
    const response = await apiRequest('/deployment/import', 'POST', importConfig);
    const operationId = response.data.operationId;
    
    spinner.succeed(`✅ Import started: ${operationId}`);
    
    if (options.wait) {
      await watchImport(operationId);
    } else {
      console.log(chalk.blue(`📊 Monitor progress: empire-deploy import-status ${operationId}`));
    }
    
  } catch (error) {
    spinner.fail(`Import failed: ${error.message}`);
  }
}

async function watchImport(operationId) {
  const spinner = ora('Monitoring import...').start();
  
  while (true) {
    try {
      const response = await apiRequest(`/deployment/import/${operationId}`);
      const operation = response.data;
      
      const progress = operation.totalItems > 0 ? 
        Math.round((operation.processedItems / operation.totalItems) * 100) : 0;
      
      spinner.text = `📦 Import - ${operation.status} (${progress}%)`;
      
      if (operation.status === 'completed') {
        spinner.succeed(`✅ Import completed successfully!`);
        if (operation.failedItems > 0) {
          console.log(chalk.yellow(`⚠️  ${operation.failedItems} items failed to import`));
        }
        break;
      } else if (operation.status === 'failed') {
        spinner.fail(`❌ Import failed!`);
        break;
      }
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      
    } catch (error) {
      spinner.fail(`Failed to get import status: ${error.message}`);
      break;
    }
  }
}

async function listCommand(type) {
  const spinner = ora(`Fetching ${type}...`).start();
  
  try {
    let endpoint, titleText, headers;
    
    switch (type) {
      case 'exports':
        endpoint = '/deployment/exports';
        titleText = '📦 Export Archives';
        headers = ['ID', 'Name', 'Type', 'Size', 'Created', 'Status'];
        break;
      case 'imports':
        endpoint = '/deployment/imports';
        titleText = '📥 Import Operations';
        headers = ['ID', 'Name', 'Status', 'Progress', 'Items', 'Started'];
        break;
      case 'backups':
        endpoint = '/deployment/backups';
        titleText = '💾 Backups';
        headers = ['ID', 'Name', 'Type', 'Size', 'Created', 'Expires'];
        break;
      default:
        throw new Error(`Unknown list type: ${type}`);
    }
    
    const response = await apiRequest(endpoint);
    const items = response.data;
    
    spinner.stop();
    
    console.log(chalk.blue.bold(`\n${titleText}`));
    
    const table = new Table({ head: headers });
    
    items.forEach(item => {
      let row;
      
      switch (type) {
        case 'exports':
          row = [
            item.archiveId.substring(0, 8),
            item.name,
            item.exportType,
            `${(item.fileSize / 1024 / 1024).toFixed(1)}MB`,
            new Date(item.createdAt).toLocaleDateString(),
            item.status
          ];
          break;
        case 'imports':
          row = [
            item.operationId.substring(0, 8),
            item.name,
            item.status,
            `${item.processedItems}/${item.totalItems}`,
            `${item.processedItems - item.failedItems}/${item.processedItems}`,
            new Date(item.startedAt || item.createdAt).toLocaleDateString()
          ];
          break;
        case 'backups':
          row = [
            item.backupId.substring(0, 8),
            item.name,
            item.backupType,
            item.fileSize ? `${(item.fileSize / 1024 / 1024).toFixed(1)}MB` : 'N/A',
            new Date(item.createdAt).toLocaleDateString(),
            new Date(item.expiresAt).toLocaleDateString()
          ];
          break;
      }
      
      table.push(row);
    });
    
    console.log(table.toString());
    
  } catch (error) {
    spinner.fail(`Failed to list ${type}: ${error.message}`);
  }
}

// ==========================================
// CLI COMMAND DEFINITIONS
// ==========================================

program
  .name('empire-deploy')
  .description('Empire Deploy CLI - Billion-Dollar Grade Deployment Tool')
  .version('1.0.0');

program
  .command('configure')
  .description('Configure Empire Deploy CLI')
  .action(configureCommand);

program
  .command('deploy')
  .description('Deploy the empire')
  .option('-e, --env <environment>', 'target environment')
  .option('-p, --profile <profile>', 'deployment profile')
  .option('--sequential', 'disable parallel execution')
  .option('--concurrent <number>', 'max concurrent steps', '3')
  .option('--no-auto-rollback', 'disable auto rollback on failure')
  .option('--pre-hook <command>', 'pre-deployment hook command')
  .option('--post-hook <command>', 'post-deployment hook command')
  .option('-w, --wait', 'wait for deployment to complete')
  .action(deployCommand);

program
  .command('status [deploymentId]')
  .description('Show deployment status')
  .action(statusCommand);

program
  .command('rollback <deploymentId>')
  .description('Rollback a deployment')
  .action(rollbackCommand);

program
  .command('export')
  .description('Export empire data')
  .action(exportCommand);

program
  .command('import <archiveId>')
  .description('Import empire data')
  .option('-w, --wait', 'wait for import to complete')
  .action(importCommand);

program
  .command('list <type>')
  .description('List resources (exports|imports|deployments|backups)')
  .action(listCommand);

program
  .command('logs <deploymentId>')
  .description('Show deployment logs')
  .action(async (deploymentId) => {
    try {
      const response = await apiRequest(`/deployment/deployments/${deploymentId}/logs`);
      const logs = response.data;
      
      console.log(chalk.blue.bold(`\n📜 Deployment Logs: ${deploymentId}`));
      console.log(chalk.gray('━'.repeat(50)));
      
      logs.forEach(step => {
        console.log(chalk.yellow(`\n[${step.stepId}] ${step.name}`));
        if (step.output) console.log(step.output);
        if (step.errorOutput) console.log(chalk.red(step.errorOutput));
      });
      
    } catch (error) {
      console.error(chalk.red(`Failed to get logs: ${error.message}`));
    }
  });

// Error handling
program.on('command:*', () => {
  console.error(chalk.red('Invalid command: %s\nSee --help for a list of available commands.'), program.args.join(' '));
  process.exit(1);
});

if (process.argv.length < 3) {
  program.help();
}

program.parse();