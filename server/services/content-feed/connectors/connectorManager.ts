// Connector Manager - Manages different content feed connectors
import { ContentFeedSource } from "../../../../shared/contentFeedTables";
import { BaseConnector, ConnectorFetchOptions } from "./baseConnector";
import { AmazonPAConnector } from "./amazonPAConnector";
import { RSSConnector } from "./rssConnector";
import { CJAffiliateConnector } from "./cjAffiliateConnector";
import { SaaSFeedConnector } from "./saasFeedConnector";
import { WebScraperConnector } from "./webScraperConnector";

export class ContentFeedConnectorManager {
  private connectors: Map<string, BaseConnector> = new Map();

  constructor() {
    // Register available connectors
    this.registerConnector('amazon_pa', new AmazonPAConnector());
    this.registerConnector('rss', new RSSConnector());
    this.registerConnector('cj_affiliate', new CJAffiliateConnector());
    this.registerConnector('saas_feed', new SaaSFeedConnector());
    this.registerConnector('web_scraper', new WebScraperConnector());
  }

  registerConnector(sourceType: string, connector: BaseConnector): void {
    this.connectors.set(sourceType, connector);
    console.log(`📡 Registered connector: ${sourceType}`);
  }

  getConnector(sourceType: string): BaseConnector | null {
    return this.connectors.get(sourceType) || null;
  }

  getAvailableConnectors(): string[] {
    return Array.from(this.connectors.keys());
  }

  async testConnector(sourceType: string, source: ContentFeedSource): Promise<{ success: boolean; message: string; itemCount?: number }> {
    try {
      const connector = this.getConnector(sourceType);
      if (!connector) {
        return { success: false, message: `Connector not found for type: ${sourceType}` };
      }

      // Test connection with minimal fetch
      const testOptions: ConnectorFetchOptions = {
        syncType: 'manual',
        maxItems: 5, // Minimal test
        testMode: true
      };

      const items = await connector.fetchContent(source, testOptions);
      
      return {
        success: true,
        message: `Connection successful`,
        itemCount: items.length
      };

    } catch (error) {
      return {
        success: false,
        message: `Connection failed: ${(error as Error).message}`
      };
    }
  }

  async getConnectorStats(): Promise<{
    totalConnectors: number;
    availableConnectors: { type: string; status: string }[];
  }> {
    const availableConnectors = [];

    for (const [type, connector] of this.connectors) {
      try {
        const isHealthy = await connector.healthCheck();
        availableConnectors.push({
          type,
          status: isHealthy ? 'healthy' : 'unhealthy'
        });
      } catch (error) {
        availableConnectors.push({
          type,
          status: 'error'
        });
      }
    }

    return {
      totalConnectors: this.connectors.size,
      availableConnectors
    };
  }
}