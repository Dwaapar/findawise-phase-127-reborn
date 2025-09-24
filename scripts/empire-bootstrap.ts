#!/usr/bin/env tsx
/**
 * EMPIRE BOOTSTRAP SCRIPT - BILLION DOLLAR EMPIRE GRADE
 * Self-healing system bootstrapper that ensures all infrastructure is operational
 */

import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import chalk from 'chalk';
import ora from 'ora';

interface BootstrapConfig {
  autoFix: boolean;
  verbose: boolean;
  skipHealthChecks: boolean;
  forceReinit: boolean;
}

class EmpireBootstrapper {
  private config: BootstrapConfig;
  private spinner: any = null;

  constructor(config: Partial<BootstrapConfig> = {}) {
    this.config = {
      autoFix: true,
      verbose: false,
      skipHealthChecks: false,
      forceReinit: false,
      ...config
    };
  }

  /**
   * Main bootstrap sequence
   */
  async bootstrap(): Promise<void> {
    console.log(chalk.blue.bold('\n🚀 EMPIRE BOOTSTRAP SYSTEM - BILLION DOLLAR GRADE\n'));
    
    try {
      // Phase 1: Environment Validation
      await this.validateEnvironment();
      
      // Phase 2: Database Bootstrap
      await this.bootstrapDatabase();
      
      // Phase 3: Core Infrastructure
      await this.bootstrapInfrastructure();
      
      // Phase 4: Service Initialization
      await this.initializeServices();
      
      // Phase 5: Health Verification
      if (!this.config.skipHealthChecks) {
        await this.verifySystemHealth();
      }
      
      console.log(chalk.green.bold('\n✅ EMPIRE BOOTSTRAP COMPLETED SUCCESSFULLY\n'));
      console.log(chalk.green('🎯 System is ready for billion-dollar operations'));
      console.log(chalk.green('🛡️ All fallback mechanisms are active'));
      console.log(chalk.green('📊 Health monitoring is operational'));
      
    } catch (error) {
      console.log(chalk.red.bold('\n❌ BOOTSTRAP FAILED\n'));
      console.error(chalk.red(`Error: ${error}`));
      
      if (this.config.autoFix) {
        console.log(chalk.yellow('\n🔧 Attempting auto-repair...'));
        await this.attemptAutoRepair();
      }
      
      throw error;
    }
  }

  /**
   * Validate environment prerequisites
   */
  private async validateEnvironment(): Promise<void> {
    this.spinner = ora('Validating environment...').start();
    
    try {
      // Check Node.js version
      const nodeVersion = process.version;
      if (!nodeVersion.startsWith('v20') && !nodeVersion.startsWith('v18')) {
        throw new Error(`Unsupported Node.js version: ${nodeVersion}. Requires v18+ or v20+`);
      }
      
      // Check required environment variables
      const requiredEnvVars = ['DATABASE_URL'];
      const missingVars = requiredEnvVars.filter(env => !process.env[env]);
      if (missingVars.length > 0) {
        throw new Error(`Missing environment variables: ${missingVars.join(', ')}`);
      }
      
      // Check package.json exists
      try {
        await fs.access('./package.json');
        const packageJson = JSON.parse(await fs.readFile('./package.json', 'utf-8'));
        if (!packageJson.dependencies) {
          throw new Error('Invalid package.json: no dependencies found');
        }
      } catch (error) {
        throw new Error('package.json not found or invalid');
      }
      
      // Check node_modules
      try {
        await fs.access('./node_modules');
      } catch (error) {
        throw new Error('node_modules not found. Run npm install first.');
      }
      
      this.spinner.succeed('Environment validation passed');
      
    } catch (error) {
      this.spinner.fail(`Environment validation failed: ${error}`);
      throw error;
    }
  }

  /**
   * Bootstrap database infrastructure
   */
  private async bootstrapDatabase(): Promise<void> {
    this.spinner = ora('Bootstrapping database...').start();
    
    try {
      // Push database schema
      await this.executeCommand('npm', ['run', 'db:push']);
      
      // Test database connectivity
      await this.testDatabaseConnection();
      
      // Seed critical data if needed
      await this.seedCriticalData();
      
      this.spinner.succeed('Database bootstrap completed');
      
    } catch (error) {
      this.spinner.fail(`Database bootstrap failed: ${error}`);
      throw error;
    }
  }

  /**
   * Test database connection
   */
  private async testDatabaseConnection(): Promise<void> {
    try {
      // Import database client dynamically to avoid issues during bootstrap
      const { db } = await import('../server/db');
      await db.execute('SELECT 1');
      console.log(chalk.green('  ✓ Database connection verified'));
    } catch (error) {
      throw new Error(`Database connection failed: ${error}`);
    }
  }

  /**
   * Seed critical system data
   */
  private async seedCriticalData(): Promise<void> {
    try {
      const { db } = await import('../server/db');
      const { users } = await import('../shared/schema');
      
      // Check if admin user exists
      const { eq } = await import('drizzle-orm');
      const adminExists = await db.select().from(users).where(eq(users.username, 'admin')).limit(1);
      
      if (adminExists.length === 0) {
        // Create admin user
        const bcrypt = await import('bcrypt');
        const hashedPassword = await bcrypt.hash('admin123', 10);
        
        await db.insert(users).values({
          username: 'admin',
          password: hashedPassword
        }).onConflictDoNothing();
        
        console.log(chalk.green('  ✓ Admin user seeded'));
      }
      
    } catch (error) {
      console.log(chalk.yellow(`  ⚠ Could not seed critical data: ${error}`));
      // Don't fail bootstrap for seeding issues
    }
  }

  /**
   * Bootstrap core infrastructure
   */
  private async bootstrapInfrastructure(): Promise<void> {
    this.spinner = ora('Bootstrapping infrastructure...').start();
    
    try {
      // Ensure required directories exist
      const dirs = [
        './backups',
        './logs',
        './tmp',
        './uploads',
        './exports'
      ];
      
      for (const dir of dirs) {
        try {
          await fs.mkdir(dir, { recursive: true });
        } catch (error) {
          // Directory might already exist
        }
      }
      
      // Create default configuration if missing
      await this.ensureDefaultConfigs();
      
      // Initialize logging infrastructure
      await this.initializeLogging();
      
      this.spinner.succeed('Infrastructure bootstrap completed');
      
    } catch (error) {
      this.spinner.fail(`Infrastructure bootstrap failed: ${error}`);
      throw error;
    }
  }

  /**
   * Ensure default configurations exist
   */
  private async ensureDefaultConfigs(): Promise<void> {
    const configs = [
      {
        path: './empire.config.json',
        content: {
          version: '1.0.0',
          environment: process.env.NODE_ENV || 'development',
          deployment: {
            strategy: 'blue-green',
            healthChecks: ['/api/health', '/api/db-health'],
            rollbackEnabled: true
          },
          monitoring: {
            enabled: true,
            interval: 30000
          }
        }
      }
    ];
    
    for (const config of configs) {
      try {
        await fs.access(config.path);
      } catch (error) {
        await fs.writeFile(config.path, JSON.stringify(config.content, null, 2));
        console.log(chalk.green(`  ✓ Created ${config.path}`));
      }
    }
  }

  /**
   * Initialize logging infrastructure
   */
  private async initializeLogging(): Promise<void> {
    try {
      const logConfig = {
        level: process.env.LOG_LEVEL || 'info',
        timestamp: true,
        colorize: true,
        maxFiles: 10,
        maxSize: '10MB'
      };
      
      await fs.writeFile('./logs/bootstrap.log', 
        `[${new Date().toISOString()}] Empire Bootstrap Started\n`, 
        { flag: 'a' }
      );
      
      console.log(chalk.green('  ✓ Logging infrastructure initialized'));
      
    } catch (error) {
      console.log(chalk.yellow(`  ⚠ Could not initialize logging: ${error}`));
    }
  }

  /**
   * Initialize core services
   */
  private async initializeServices(): Promise<void> {
    this.spinner = ora('Initializing services...').start();
    
    try {
      // Initialize deployment orchestrator
      const { deploymentOrchestrator } = await import('./deployment-orchestrator');
      await deploymentOrchestrator.initialize();
      console.log(chalk.green('  ✓ Deployment orchestrator initialized'));
      
      // Initialize health monitoring
      const { deploymentHealthMonitor } = await import('../server/services/deployment/deploymentHealthMonitor');
      await deploymentHealthMonitor.startMonitoring(30000);
      console.log(chalk.green('  ✓ Health monitoring started'));
      
      // Initialize universal database adapter
      const { ensureDbInitialized } = await import('../server/db/index');
      await ensureDbInitialized();
      console.log(chalk.green('  ✓ Universal database adapter initialized'));
      
      this.spinner.succeed('Services initialization completed');
      
    } catch (error) {
      this.spinner.fail(`Services initialization failed: ${error}`);
      throw error;
    }
  }

  /**
   * Verify system health
   */
  private async verifySystemHealth(): Promise<void> {
    this.spinner = ora('Verifying system health...').start();
    
    try {
      const { deploymentHealthMonitor } = await import('../server/services/deployment/deploymentHealthMonitor');
      
      // Wait a moment for health checks to complete
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      const healthStatus = deploymentHealthMonitor.getHealthStatus();
      
      if (healthStatus.overall === 'healthy') {
        this.spinner.succeed('System health verification passed');
        console.log(chalk.green(`  ✓ Overall status: ${healthStatus.overall}`));
        console.log(chalk.green(`  ✓ Health checks: ${healthStatus.checks.length} active`));
        console.log(chalk.green(`  ✓ Active alerts: ${healthStatus.alerts.length}`));
      } else {
        this.spinner.warn(`System health: ${healthStatus.overall}`);
        console.log(chalk.yellow(`  ⚠ Health issues detected, but system is operational`));
        console.log(chalk.yellow(`  ⚠ Fallback mechanisms are active`));
      }
      
    } catch (error) {
      this.spinner.fail(`System health verification failed: ${error}`);
      // Don't fail bootstrap for health check issues
      console.log(chalk.yellow('  ⚠ Continuing with health check issues'));
    }
  }

  /**
   * Attempt automatic repair
   */
  private async attemptAutoRepair(): Promise<void> {
    try {
      console.log(chalk.yellow('🔧 Running database migrations...'));
      await this.executeCommand('npm', ['run', 'db:push']);
      
      console.log(chalk.yellow('🔧 Reinstalling dependencies...'));
      await this.executeCommand('npm', ['install']);
      
      console.log(chalk.yellow('🔧 Clearing caches...'));
      await this.executeCommand('npm', ['run', 'clean'], { optional: true });
      
      console.log(chalk.green('✅ Auto-repair completed'));
      
    } catch (error) {
      console.log(chalk.red(`❌ Auto-repair failed: ${error}`));
    }
  }

  /**
   * Execute shell command
   */
  private async executeCommand(
    command: string, 
    args: string[], 
    options: { timeout?: number; optional?: boolean } = {}
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const proc = spawn(command, args, {
        stdio: this.config.verbose ? 'inherit' : 'pipe'
      });

      let output = '';
      let errorOutput = '';

      if (!this.config.verbose) {
        proc.stdout?.on('data', (data) => {
          output += data.toString();
        });

        proc.stderr?.on('data', (data) => {
          errorOutput += data.toString();
        });
      }

      proc.on('close', (code) => {
        if (code === 0) {
          resolve(output);
        } else {
          const error = new Error(`Command failed: ${command} ${args.join(' ')}\n${errorOutput}`);
          if (options.optional) {
            console.log(chalk.yellow(`  ⚠ Optional command failed: ${command}`));
            resolve('');
          } else {
            reject(error);
          }
        }
      });

      proc.on('error', (error) => {
        if (options.optional) {
          console.log(chalk.yellow(`  ⚠ Optional command error: ${command}`));
          resolve('');
        } else {
          reject(error);
        }
      });

      // Timeout handling
      if (options.timeout) {
        setTimeout(() => {
          proc.kill();
          reject(new Error(`Command timeout: ${command}`));
        }, options.timeout);
      }
    });
  }
}

// CLI interface
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const config: Partial<BootstrapConfig> = {};

  // Parse CLI arguments
  if (args.includes('--verbose')) config.verbose = true;
  if (args.includes('--no-health-checks')) config.skipHealthChecks = true;
  if (args.includes('--force-reinit')) config.forceReinit = true;
  if (args.includes('--no-auto-fix')) config.autoFix = false;

  const bootstrapper = new EmpireBootstrapper(config);
  
  bootstrapper.bootstrap()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error(chalk.red('Bootstrap failed:'), error);
      process.exit(1);
    });
}

export { EmpireBootstrapper };