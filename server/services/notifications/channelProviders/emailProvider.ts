import { Resend } from 'resend';
import { logger } from "../../../utils/logger";

export interface EmailProvider {
  send(message: EmailMessage): Promise<EmailDeliveryResult>;
  validateConfig(): Promise<boolean>;
  getProviderName(): string;
}

export interface EmailMessage {
  to: string | string[];
  from: string;
  subject: string;
  text?: string;
  html?: string;
  attachments?: EmailAttachment[];
  headers?: Record<string, string>;
  replyTo?: string;
  cc?: string[];
  bcc?: string[];
}

export interface EmailAttachment {
  filename: string;
  content: string | Buffer;
  type?: string;
  disposition?: string;
}

export interface EmailDeliveryResult {
  success: boolean;
  messageId?: string;
  provider: string;
  errorMessage?: string;
  deliveryTime: number;
  cost?: number;
}

/**
 * Resend Email Provider - Modern, developer-friendly email API
 */
export class ResendProvider implements EmailProvider {
  private resend: Resend;
  private defaultFromEmail: string;
  private defaultFromName: string;

  constructor(config: {
    apiKey: string;
    defaultFromEmail: string;
    defaultFromName?: string;
  }) {
    this.resend = new Resend(config.apiKey);
    this.defaultFromEmail = config.defaultFromEmail;
    this.defaultFromName = config.defaultFromName || 'Findawise Empire';
  }

  async send(message: EmailMessage): Promise<EmailDeliveryResult> {
    const startTime = Date.now();

    try {
      const emailData = {
        from: `${this.defaultFromName} <${message.from || this.defaultFromEmail}>`,
        to: Array.isArray(message.to) ? message.to : [message.to],
        subject: message.subject,
        text: message.text,
        html: message.html,
        attachments: message.attachments?.map(att => ({
          filename: att.filename,
          content: att.content as string,
        })),
        reply_to: message.replyTo,
        cc: message.cc,
        bcc: message.bcc,
        headers: message.headers,
      };

      const response = await this.resend.emails.send(emailData);

      if (response.error) {
        throw new Error(response.error.message);
      }

      return {
        success: true,
        messageId: response.data?.id,
        provider: 'resend',
        deliveryTime: Date.now() - startTime,
        cost: 0 // Resend is free for first 3000 emails
      };
    } catch (error: any) {
      logger.error('Resend send error:', error);
      
      return {
        success: false,
        provider: 'resend',
        errorMessage: error.message || 'Unknown email error',
        deliveryTime: Date.now() - startTime
      };
    }
  }

  async validateConfig(): Promise<boolean> {
    try {
      // Test the API key by making a simple request
      const domains = await this.resend.domains.list();
      return true;
    } catch (error) {
      logger.error('Resend config validation failed:', error);
      return false;
    }
  }

  getProviderName(): string {
    return 'resend';
  }
}

/**
 * SMTP Provider (fallback for custom SMTP servers)
 */
export class SMTPProvider implements EmailProvider {
  private config: {
    host: string;
    port: number;
    secure: boolean;
    auth: {
      user: string;
      pass: string;
    };
  };
  private defaultFromEmail: string;
  private defaultFromName: string;

  constructor(config: {
    host: string;
    port: number;
    secure: boolean;
    auth: {
      user: string;
      pass: string;
    };
    defaultFromEmail: string;
    defaultFromName?: string;
  }) {
    this.config = {
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: config.auth
    };
    this.defaultFromEmail = config.defaultFromEmail;
    this.defaultFromName = config.defaultFromName || 'Findawise Empire';
  }

  async send(message: EmailMessage): Promise<EmailDeliveryResult> {
    const startTime = Date.now();

    try {
      // Dynamic import for nodemailer
      const nodemailer = await import('nodemailer');
      
      const transporter = nodemailer.createTransporter(this.config);

      const mailOptions = {
        from: `${this.defaultFromName} <${message.from || this.defaultFromEmail}>`,
        to: message.to,
        subject: message.subject,
        text: message.text,
        html: message.html,
        attachments: message.attachments,
        replyTo: message.replyTo,
        cc: message.cc,
        bcc: message.bcc,
        headers: message.headers
      };

      const info = await transporter.sendMail(mailOptions);

      return {
        success: true,
        messageId: info.messageId,
        provider: 'smtp',
        deliveryTime: Date.now() - startTime
      };
    } catch (error: any) {
      logger.error('SMTP send error:', error);
      
      return {
        success: false,
        provider: 'smtp',
        errorMessage: error.message || 'Unknown SMTP error',
        deliveryTime: Date.now() - startTime
      };
    }
  }

  async validateConfig(): Promise<boolean> {
    try {
      const nodemailer = await import('nodemailer');
      const transporter = nodemailer.createTransporter(this.config);
      await transporter.verify();
      return true;
    } catch (error) {
      logger.error('SMTP config validation failed:', error);
      return false;
    }
  }

  getProviderName(): string {
    return 'smtp';
  }
}