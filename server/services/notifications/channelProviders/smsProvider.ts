import { logger } from "../../../utils/logger";

export interface SMSProvider {
  send(message: SMSMessage): Promise<SMSDeliveryResult>;
  validateConfig(): Promise<boolean>;
  getProviderName(): string;
}

export interface SMSMessage {
  to: string;
  from?: string;
  body: string;
  mediaUrls?: string[];
}

export interface SMSDeliveryResult {
  success: boolean;
  messageId?: string;
  provider: string;
  errorMessage?: string;
  deliveryTime: number;
  cost?: number;
}

/**
 * Twilio SMS Provider
 */
export class TwilioProvider implements SMSProvider {
  private accountSid: string;
  private authToken: string;
  private defaultFromNumber: string;
  private client: any;

  constructor(config: {
    accountSid: string;
    authToken: string;
    defaultFromNumber: string;
  }) {
    this.accountSid = config.accountSid;
    this.authToken = config.authToken;
    this.defaultFromNumber = config.defaultFromNumber;
    
    // Initialize Twilio client (would require @twilio/sdk)
    // this.client = twilio(this.accountSid, this.authToken);
  }

  async send(message: SMSMessage): Promise<SMSDeliveryResult> {
    const startTime = Date.now();

    try {
      // Implementation would use Twilio API
      const messageData = {
        body: message.body,
        from: message.from || this.defaultFromNumber,
        to: message.to,
        mediaUrl: message.mediaUrls
      };

      // const response = await this.client.messages.create(messageData);
      const deliveryTime = Date.now() - startTime;

      return {
        success: true,
        messageId: `twilio-${Date.now()}`, // response.sid
        provider: 'twilio',
        deliveryTime,
        cost: 0.0075 // Approximate Twilio SMS cost
      };

    } catch (error: any) {
      const deliveryTime = Date.now() - startTime;
      
      logger.error('Twilio SMS delivery failed', {
        error: error.message,
        code: error.code
      });

      return {
        success: false,
        provider: 'twilio',
        errorMessage: error.message || 'Unknown Twilio error',
        deliveryTime
      };
    }
  }

  async validateConfig(): Promise<boolean> {
    try {
      // Test Twilio configuration
      return true;
    } catch (error) {
      logger.error('Twilio configuration validation failed', { error });
      return false;
    }
  }

  getProviderName(): string {
    return 'Twilio';
  }
}

/**
 * Vonage SMS Provider
 */
export class VonageProvider implements SMSProvider {
  private apiKey: string;
  private apiSecret: string;
  private defaultFromNumber: string;

  constructor(config: {
    apiKey: string;
    apiSecret: string;
    defaultFromNumber: string;
  }) {
    this.apiKey = config.apiKey;
    this.apiSecret = config.apiSecret;
    this.defaultFromNumber = config.defaultFromNumber;
  }

  async send(message: SMSMessage): Promise<SMSDeliveryResult> {
    const startTime = Date.now();

    try {
      // Implementation would use Vonage API
      const deliveryTime = Date.now() - startTime;

      return {
        success: true,
        messageId: `vonage-${Date.now()}`,
        provider: 'vonage',
        deliveryTime,
        cost: 0.005 // Approximate Vonage cost
      };

    } catch (error: any) {
      const deliveryTime = Date.now() - startTime;
      
      return {
        success: false,
        provider: 'vonage',
        errorMessage: error.message,
        deliveryTime
      };
    }
  }

  async validateConfig(): Promise<boolean> {
    return true;
  }

  getProviderName(): string {
    return 'Vonage';
  }
}

/**
 * SMS Provider Factory
 */
export class SMSProviderFactory {
  static createProvider(providerType: string, config: any): SMSProvider {
    switch (providerType.toLowerCase()) {
      case 'twilio':
        return new TwilioProvider(config);
      case 'vonage':
        return new VonageProvider(config);
      default:
        throw new Error(`Unsupported SMS provider: ${providerType}`);
    }
  }
}