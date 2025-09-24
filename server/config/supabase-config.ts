/**
 * EMPIRE-GRADE SUPABASE CONFIGURATION
 * ==================================
 * 
 * Billion-dollar scale Supabase integration with automatic failover,
 * secrets management, and migration-proof configuration.
 */

import { createClient } from '@supabase/supabase-js';

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  serviceRoleKey: string;
  projectRef: string;
  region: string;
}

export interface SupabaseCredentials {
  url: string;
  anonKey: string;
  serviceRoleKey: string;
}

/**
 * Enterprise-grade secrets validation and loading
 */
export class SupabaseSecretsManager {
  private static instance: SupabaseSecretsManager;
  private config: SupabaseConfig | null = null;
  private client: any = null;

  static getInstance(): SupabaseSecretsManager {
    if (!SupabaseSecretsManager.instance) {
      SupabaseSecretsManager.instance = new SupabaseSecretsManager();
    }
    return SupabaseSecretsManager.instance;
  }

  /**
   * Initialize Supabase with environment validation
   */
  async initialize(): Promise<{ success: boolean; error?: string }> {
    try {
      // Try environment variables first
      const envConfig = this.loadFromEnvironment();
      if (envConfig.success && envConfig.config) {
        this.config = envConfig.config;
        this.client = createClient(this.config.url, this.config.serviceRoleKey);
        return { success: true };
      }

      // Try embedded credentials fallback
      const embeddedConfig = await this.loadFromEmbeddedCredentials();
      if (embeddedConfig.success && embeddedConfig.config) {
        this.config = embeddedConfig.config;
        this.client = createClient(this.config.url, this.config.serviceRoleKey);
        return { success: true };
      }

      // Create development/demo credentials if none found
      const devConfig = this.createDevelopmentCredentials();
      this.config = devConfig;
      
      console.log('⚠️ Using development Supabase configuration - not for production');
      return { success: false, error: 'Using development configuration' };

    } catch (error) {
      console.error('Failed to initialize Supabase configuration:', error);
      return { success: false, error: 'Initialization failed' };
    }
  }

  /**
   * Load configuration from environment variables
   */
  private loadFromEnvironment(): { success: boolean; config?: SupabaseConfig } {
    const url = process.env.SUPABASE_URL;
    const anonKey = process.env.SUPABASE_ANON_KEY;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !anonKey || !serviceRoleKey) {
      return { success: false };
    }

    // Validate URL format
    if (!url.includes('supabase.co') && !url.includes('localhost')) {
      console.warn('⚠️ Supabase URL format may be invalid');
    }

    // Extract project reference and region
    const projectRef = this.extractProjectRef(url);
    const region = this.extractRegion(url);

    return {
      success: true,
      config: {
        url,
        anonKey,
        serviceRoleKey,
        projectRef,
        region
      }
    };
  }

  /**
   * Load from embedded credentials (migration-proof)
   */
  private async loadFromEmbeddedCredentials(): Promise<{ success: boolean; config?: SupabaseConfig }> {
    try {
      // Check for embedded credentials file
      const embeddedPath = './server/config/embedded-credentials.ts';
      
      try {
        const { getActiveSupabaseConfig } = await import('./embedded-credentials');
        const credentials = getActiveSupabaseConfig();
        
        if (credentials) {
          const projectRef = this.extractProjectRef(credentials.url);
          const region = this.extractRegion(credentials.url);
          
          return {
            success: true,
            config: {
              url: credentials.url,
              anonKey: credentials.anonKey,
              serviceRoleKey: credentials.serviceRoleKey,
              projectRef,
              region
            }
          };
        }
      } catch (importError) {
        console.log('No embedded credentials found, this is normal for new installations');
      }

      return { success: false };
    } catch (error) {
      console.error('Error loading embedded credentials:', error);
      return { success: false };
    }
  }

  /**
   * Create development credentials for testing
   */
  private createDevelopmentCredentials(): SupabaseConfig {
    return {
      url: 'https://your-project.supabase.co',
      anonKey: 'your-anon-key-here',
      serviceRoleKey: 'your-service-role-key-here',
      projectRef: 'development',
      region: 'us-east-1'
    };
  }

  /**
   * Extract project reference from URL
   */
  private extractProjectRef(url: string): string {
    const match = url.match(/https:\/\/([^.]+)\.supabase\.co/);
    return match ? match[1] : 'unknown';
  }

  /**
   * Extract region from URL
   */
  private extractRegion(url: string): string {
    // Default to us-east-1 for now, could be enhanced to detect actual region
    return 'us-east-1';
  }

  /**
   * Get current configuration
   */
  getConfig(): SupabaseConfig | null {
    return this.config;
  }

  /**
   * Get Supabase client
   */
  getClient(): any {
    return this.client;
  }

  /**
   * Validate connection to Supabase
   */
  async validateConnection(): Promise<{ success: boolean; error?: string }> {
    if (!this.client || !this.config) {
      return { success: false, error: 'Client not initialized' };
    }

    try {
      // Test connection with a simple query
      const { data, error } = await this.client
        .from('neurons')
        .select('count')
        .limit(1);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: 'Connection test failed' };
    }
  }

  /**
   * Health check for monitoring
   */
  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    details: any;
  }> {
    if (!this.config) {
      return {
        status: 'unhealthy',
        details: { error: 'Configuration not loaded' }
      };
    }

    const connectionTest = await this.validateConnection();
    
    return {
      status: connectionTest.success ? 'healthy' : 'degraded',
      details: {
        config: {
          projectRef: this.config.projectRef,
          region: this.config.region,
          url: this.config.url.replace(/[^/]*$/g, '***') // Mask URL
        },
        connection: connectionTest
      }
    };
  }
}

/**
 * Global Supabase instance
 */
export const supabaseManager = SupabaseSecretsManager.getInstance();

/**
 * Initialize Supabase on module load
 */
export async function initializeSupabase(): Promise<void> {
  const result = await supabaseManager.initialize();
  if (result.success) {
    console.log('✅ Supabase configuration loaded successfully');
  } else {
    console.log('⚠️ Supabase configuration failed, using PostgreSQL fallback');
  }
}

/**
 * Export for backward compatibility
 */
export function getSupabaseClient() {
  return supabaseManager.getClient();
}

export function getSupabaseConfig() {
  return supabaseManager.getConfig();
}