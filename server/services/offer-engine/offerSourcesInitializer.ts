/**
 * Offer Sources Initializer - Billion Dollar Empire Grade
 * Initialize and manage offer sources in the database
 */

import { db } from "../../db";
import { offerSources } from "@shared/schema";
import { eq } from "drizzle-orm";

export interface OfferSourceTemplate {
  slug: string;
  name: string;
  type: string;
  description: string;
  baseUrl: string;
  syncFrequency: string;
  credentials: Record<string, string>;
  metadata: Record<string, any>;
}

export class OfferSourcesInitializer {
  private static instance: OfferSourcesInitializer;

  static getInstance(): OfferSourcesInitializer {
    if (!OfferSourcesInitializer.instance) {
      OfferSourcesInitializer.instance = new OfferSourcesInitializer();
    }
    return OfferSourcesInitializer.instance;
  }

  /**
   * Initialize all default offer sources
   */
  async initializeAllSources(): Promise<void> {
    console.log('📊 Initializing offer sources...');

    const defaultSources: OfferSourceTemplate[] = [
      {
        slug: 'clickbank',
        name: 'ClickBank Digital Marketplace',
        type: 'api',
        description: 'ClickBank API integration for high-commission digital products',
        baseUrl: 'https://api.clickbank.com',
        syncFrequency: 'daily',
        credentials: {
          developerKey: '',
          clerkKey: '',
          nickname: ''
        },
        metadata: {
          supportedRegions: ['US', 'UK', 'CA', 'AU', 'EU', 'Global'],
          avgCommissionRate: '50-75%',
          authenticationType: 'HMAC'
        }
      },
      {
        slug: 'rakuten-advertising',
        name: 'Rakuten Advertising',
        type: 'api',
        description: 'Rakuten Advertising API integration for premium brand partnerships',
        baseUrl: 'https://api.linksynergy.com',
        syncFrequency: 'twice_daily',
        credentials: {
          token: '',
          mid: '',
          website: ''
        },
        metadata: {
          supportedRegions: ['US', 'UK', 'JP', 'DE', 'FR', 'IT', 'ES', 'AU', 'CA'],
          avgCommissionRate: '3-10%',
          authenticationType: 'Bearer Token'
        }
      },
      {
        slug: 'impact',
        name: 'Impact Affiliate Network',
        type: 'api',
        description: 'Impact API integration for enterprise partnership management',
        baseUrl: 'https://api.impact.com',
        syncFrequency: 'hourly',
        credentials: {
          accountSid: '',
          authToken: '',
          apiKey: ''
        },
        metadata: {
          supportedRegions: ['US', 'UK', 'CA', 'AU', 'DE', 'FR', 'IT', 'ES', 'NL'],
          avgCommissionRate: '5-20%',
          authenticationType: 'Basic Auth'
        }
      },
      {
        slug: 'awin',
        name: 'Awin Affiliate Network',
        type: 'api',
        description: 'Awin API integration for European and global affiliate partnerships',
        baseUrl: 'https://api.awin.com',
        syncFrequency: 'daily',
        credentials: {
          oAuthToken: '',
          publisherId: '',
          region: 'US'
        },
        metadata: {
          supportedRegions: ['US', 'UK', 'DE', 'FR', 'IT', 'ES', 'NL', 'SE', 'NO', 'DK', 'AU'],
          avgCommissionRate: '3-12%',
          authenticationType: 'OAuth 2.0'
        }
      },
      {
        slug: 'partnerstack',
        name: 'PartnerStack B2B Network',
        type: 'api',
        description: 'PartnerStack API integration for high-value B2B SaaS partnerships',
        baseUrl: 'https://api.partnerstack.com',
        syncFrequency: 'daily',
        credentials: {
          apiKey: '',
          partnerId: '',
          environment: 'production'
        },
        metadata: {
          supportedRegions: ['US', 'UK', 'CA', 'EU', 'AU'],
          avgCommissionRate: '20-30%',
          authenticationType: 'Bearer Token'
        }
      },
      {
        slug: 'ebay-partner',
        name: 'eBay Partner Network',
        type: 'api',
        description: 'eBay Partner Network API integration for marketplace deals',
        baseUrl: 'https://api.ebay.com',
        syncFrequency: 'twice_daily',
        credentials: {
          clientId: '',
          clientSecret: '',
          campaignId: '',
          marketplaceId: 'EBAY_US'
        },
        metadata: {
          supportedRegions: ['US', 'UK', 'DE', 'AU', 'CA', 'FR', 'IT', 'ES'],
          avgCommissionRate: '1-4%',
          authenticationType: 'OAuth 2.0'
        }
      }
    ];

    // Initialize each source
    for (const sourceTemplate of defaultSources) {
      await this.initializeSource(sourceTemplate);
    }

    console.log(`✅ ${defaultSources.length} offer sources initialized`);
  }

  /**
   * Initialize a single offer source
   */
  async initializeSource(sourceTemplate: OfferSourceTemplate): Promise<void> {
    try {
      // Check if source already exists
      const [existingSource] = await db.select()
        .from(offerSources)
        .where(eq(offerSources.slug, sourceTemplate.slug));

      if (existingSource) {
        // Update existing source (preserve credentials and active status)
        await db.update(offerSources)
          .set({
            name: sourceTemplate.name,
            description: sourceTemplate.description,
            baseUrl: sourceTemplate.baseUrl,
            syncFrequency: sourceTemplate.syncFrequency,
            metadata: sourceTemplate.metadata,
            updatedAt: new Date()
          })
          .where(eq(offerSources.id, existingSource.id));

        console.log(`🔄 Updated offer source: ${sourceTemplate.name}`);
      } else {
        // Create new source
        await db.insert(offerSources).values({
          slug: sourceTemplate.slug,
          name: sourceTemplate.name,
          type: sourceTemplate.type,
          description: sourceTemplate.description,
          baseUrl: sourceTemplate.baseUrl,
          syncFrequency: sourceTemplate.syncFrequency,
          isActive: false, // Start inactive until credentials are provided
          errorCount: 0,
          credentials: sourceTemplate.credentials,
          metadata: sourceTemplate.metadata,
          createdAt: new Date(),
          updatedAt: new Date()
        });

        console.log(`✅ Created offer source: ${sourceTemplate.name}`);
      }
    } catch (error) {
      console.error(`Failed to initialize source ${sourceTemplate.slug}:`, error);
    }
  }

  /**
   * Activate a source with credentials
   */
  async activateSource(slug: string, credentials: Record<string, string>): Promise<boolean> {
    try {
      const [source] = await db.select()
        .from(offerSources)
        .where(eq(offerSources.slug, slug));

      if (!source) {
        console.error(`Source not found: ${slug}`);
        return false;
      }

      // Update source with credentials and activate
      await db.update(offerSources)
        .set({
          credentials,
          isActive: true,
          errorCount: 0,
          updatedAt: new Date()
        })
        .where(eq(offerSources.id, source.id));

      console.log(`✅ Activated source: ${source.name}`);
      return true;
    } catch (error) {
      console.error(`Failed to activate source ${slug}:`, error);
      return false;
    }
  }

  /**
   * Deactivate a source
   */
  async deactivateSource(slug: string): Promise<boolean> {
    try {
      const [source] = await db.select()
        .from(offerSources)
        .where(eq(offerSources.slug, slug));

      if (!source) {
        console.error(`Source not found: ${slug}`);
        return false;
      }

      await db.update(offerSources)
        .set({
          isActive: false,
          updatedAt: new Date()
        })
        .where(eq(offerSources.id, source.id));

      console.log(`⏸️ Deactivated source: ${source.name}`);
      return true;
    } catch (error) {
      console.error(`Failed to deactivate source ${slug}:`, error);
      return false;
    }
  }

  /**
   * Get initialization status
   */
  async getInitializationStatus(): Promise<{
    total: number;
    initialized: number;
    active: number;
  }> {
    try {
      const sources = await db.select()
        .from(offerSources);

      const activeSources = sources.filter(s => s.isActive);

      return {
        total: sources.length,
        initialized: sources.length,
        active: activeSources.length
      };
    } catch (error) {
      console.error('Failed to get initialization status:', error);
      return {
        total: 0,
        initialized: 0,
        active: 0
      };
    }
  }

  /**
   * Update source credentials
   */
  async updateSourceCredentials(slug: string, credentials: Record<string, string>): Promise<boolean> {
    try {
      const [source] = await db.select()
        .from(offerSources)
        .where(eq(offerSources.slug, slug));

      if (!source) {
        console.error(`Source not found: ${slug}`);
        return false;
      }

      await db.update(offerSources)
        .set({
          credentials,
          updatedAt: new Date()
        })
        .where(eq(offerSources.id, source.id));

      console.log(`🔐 Updated credentials for source: ${source.name}`);
      return true;
    } catch (error) {
      console.error(`Failed to update credentials for source ${slug}:`, error);
      return false;
    }
  }

  /**
   * Reset source error count
   */
  async resetSourceErrors(slug: string): Promise<boolean> {
    try {
      const [source] = await db.select()
        .from(offerSources)
        .where(eq(offerSources.slug, slug));

      if (!source) {
        console.error(`Source not found: ${slug}`);
        return false;
      }

      await db.update(offerSources)
        .set({
          errorCount: 0,
          updatedAt: new Date()
        })
        .where(eq(offerSources.id, source.id));

      console.log(`🔄 Reset error count for source: ${source.name}`);
      return true;
    } catch (error) {
      console.error(`Failed to reset errors for source ${slug}:`, error);
      return false;
    }
  }

  /**
   * Get all sources with their status
   */
  async getAllSources(): Promise<Array<{
    id: number;
    slug: string;
    name: string;
    type: string;
    description: string;
    isActive: boolean;
    errorCount: number;
    lastSync: Date | null;
    syncFrequency: string;
    metadata: Record<string, any>;
    hasCredentials: boolean;
  }>> {
    try {
      const sources = await db.select()
        .from(offerSources)
        .orderBy(offerSources.name);

      return sources.map(source => ({
        id: source.id,
        slug: source.slug,
        name: source.name,
        type: source.type,
        description: source.description,
        isActive: source.isActive,
        errorCount: source.errorCount,
        lastSync: source.lastSync,
        syncFrequency: source.syncFrequency,
        metadata: source.metadata || {},
        hasCredentials: source.credentials && Object.keys(source.credentials).length > 0
      }));
    } catch (error) {
      console.error('Failed to get all sources:', error);
      return [];
    }
  }

  /**
   * Check if source has valid credentials
   */
  async hasValidCredentials(slug: string): Promise<boolean> {
    try {
      const [source] = await db.select()
        .from(offerSources)
        .where(eq(offerSources.slug, slug));

      if (!source || !source.credentials) {
        return false;
      }

      // Check if all required credential fields are filled
      const credentials = source.credentials;
      const requiredFields = Object.keys(credentials);
      
      return requiredFields.every(field => 
        credentials[field] && 
        credentials[field].trim() !== ''
      );
    } catch (error) {
      console.error(`Failed to check credentials for source ${slug}:`, error);
      return false;
    }
  }

  /**
   * Get source by slug
   */
  async getSource(slug: string) {
    try {
      const [source] = await db.select()
        .from(offerSources)
        .where(eq(offerSources.slug, slug));

      return source || null;
    } catch (error) {
      console.error(`Failed to get source ${slug}:`, error);
      return null;
    }
  }
}

// Export singleton instance
export const offerSourcesInitializer = OfferSourcesInitializer.getInstance();