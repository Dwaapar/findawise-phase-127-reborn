import Stripe from 'stripe';
import crypto from 'crypto';
import { storage } from '../../storage';

export interface PaymentResult {
  success: boolean;
  transactionId: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  provider: string;
  metadata?: Record<string, any>;
  error?: string;
}

export interface PaymentIntent {
  id: string;
  amount: number;
  currency: string;
  clientSecret: string;
  metadata: Record<string, any>;
}

export interface RefundResult {
  success: boolean;
  refundId: string;
  amount: number;
  reason: string;
  error?: string;
}

class PaymentProcessor {
  private stripe: Stripe | null = null;
  private supportedMethods: string[] = ['stripe', 'paypal', 'razorpay', 'crypto'];

  constructor() {
    this.initializeProviders();
  }

  private initializeProviders(): void {
    try {
      // Initialize Stripe
      if (process.env.STRIPE_SECRET_KEY) {
        this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
          apiVersion: '2023-10-16'
        });
        console.log('✅ Stripe payment processor initialized');
      }

      // Initialize other payment providers as needed
      console.log(`✅ Payment processor initialized with methods: ${this.supportedMethods.join(', ')}`);
    } catch (error) {
      console.error('❌ Error initializing payment providers:', error);
    }
  }

  // Create Payment Intent
  async createPaymentIntent(amount: number, currency: string, metadata: Record<string, any>): Promise<PaymentIntent> {
    try {
      if (!this.stripe) {
        throw new Error('Stripe not initialized');
      }

      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: currency.toLowerCase(),
        metadata,
        automatic_payment_methods: {
          enabled: true,
        },
      });

      return {
        id: paymentIntent.id,
        amount,
        currency,
        clientSecret: paymentIntent.client_secret!,
        metadata
      };
    } catch (error) {
      console.error('❌ Error creating payment intent:', error);
      throw new Error(`Failed to create payment intent: ${error.message}`);
    }
  }

  // Process Payment
  async processPayment(
    paymentIntentId: string, 
    paymentMethodId: string, 
    customerInfo: any
  ): Promise<PaymentResult> {
    try {
      if (!this.stripe) {
        throw new Error('Stripe not initialized');
      }

      // Confirm payment intent
      const paymentIntent = await this.stripe.paymentIntents.confirm(paymentIntentId, {
        payment_method: paymentMethodId,
        return_url: `${process.env.FRONTEND_URL}/payment/success`,
      });

      const success = paymentIntent.status === 'succeeded';
      
      return {
        success,
        transactionId: paymentIntent.id,
        amount: paymentIntent.amount / 100,
        currency: paymentIntent.currency.toUpperCase(),
        paymentMethod: paymentIntent.payment_method as string,
        provider: 'stripe',
        metadata: paymentIntent.metadata,
        error: success ? undefined : `Payment failed: ${paymentIntent.status}`
      };
    } catch (error) {
      console.error('❌ Error processing payment:', error);
      return {
        success: false,
        transactionId: '',
        amount: 0,
        currency: '',
        paymentMethod: '',
        provider: 'stripe',
        error: error.message
      };
    }
  }

  // Process Refund
  async processRefund(
    transactionId: string, 
    amount?: number, 
    reason: string = 'requested_by_customer'
  ): Promise<RefundResult> {
    try {
      if (!this.stripe) {
        throw new Error('Stripe not initialized');
      }

      const refundData: any = {
        payment_intent: transactionId,
        reason
      };

      if (amount) {
        refundData.amount = Math.round(amount * 100); // Convert to cents
      }

      const refund = await this.stripe.refunds.create(refundData);

      return {
        success: refund.status === 'succeeded',
        refundId: refund.id,
        amount: refund.amount / 100,
        reason,
        error: refund.status !== 'succeeded' ? `Refund failed: ${refund.status}` : undefined
      };
    } catch (error) {
      console.error('❌ Error processing refund:', error);
      return {
        success: false,
        refundId: '',
        amount: 0,
        reason,
        error: error.message
      };
    }
  }

  // Webhook Handler
  async handleWebhook(payload: string, signature: string): Promise<void> {
    try {
      if (!this.stripe || !process.env.STRIPE_WEBHOOK_SECRET) {
        throw new Error('Stripe or webhook secret not configured');
      }

      const event = this.stripe.webhooks.constructEvent(
        payload,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      );

      console.log(`🔔 Received webhook: ${event.type}`);

      switch (event.type) {
        case 'payment_intent.succeeded':
          await this.handlePaymentSuccess(event.data.object);
          break;
        case 'payment_intent.payment_failed':
          await this.handlePaymentFailure(event.data.object);
          break;
        case 'charge.dispute.created':
          await this.handleChargeback(event.data.object);
          break;
        case 'invoice.payment_succeeded':
          await this.handleSubscriptionPayment(event.data.object);
          break;
        default:
          console.log(`📝 Unhandled webhook type: ${event.type}`);
      }
    } catch (error) {
      console.error('❌ Error handling webhook:', error);
      throw error;
    }
  }

  // PayPal Integration
  async processPayPalPayment(paymentData: any): Promise<PaymentResult> {
    try {
      console.log('🟡 Processing PayPal payment (placeholder implementation)');
      
      // For production, integrate with PayPal SDK
      // For now, simulate PayPal payment processing
      const mockTransactionId = `pp_${crypto.randomBytes(16).toString('hex')}`;
      
      // Validate payment data
      if (!paymentData.amount || !paymentData.currency) {
        throw new Error('Invalid payment data: amount and currency required');
      }

      // Simulate PayPal payment processing delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      return {
        success: true,
        transactionId: mockTransactionId,
        amount: paymentData.amount,
        currency: paymentData.currency,
        paymentMethod: 'paypal',
        provider: 'paypal',
        metadata: {
          paypalOrderId: paymentData.orderId,
          payerEmail: paymentData.payerEmail,
          processedAt: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error('❌ Error processing PayPal payment:', error);
      return {
        success: false,
        transactionId: '',
        amount: 0,
        currency: '',
        paymentMethod: 'paypal',
        provider: 'paypal',
        error: error.message
      };
    }
  }

  // Razorpay Integration
  async processRazorpayPayment(paymentData: any): Promise<PaymentResult> {
    try {
      console.log('🟣 Processing Razorpay payment (placeholder implementation)');
      
      // For production, integrate with Razorpay SDK
      const mockTransactionId = `rzp_${crypto.randomBytes(16).toString('hex')}`;
      
      // Validate payment data
      if (!paymentData.amount || !paymentData.currency) {
        throw new Error('Invalid payment data: amount and currency required');
      }

      // Simulate Razorpay payment processing
      await new Promise(resolve => setTimeout(resolve, 1500));

      return {
        success: true,
        transactionId: mockTransactionId,
        amount: paymentData.amount,
        currency: paymentData.currency,
        paymentMethod: 'razorpay',
        provider: 'razorpay',
        metadata: {
          razorpayOrderId: paymentData.orderId,
          customerContact: paymentData.contact,
          processedAt: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error('❌ Error processing Razorpay payment:', error);
      return {
        success: false,
        transactionId: '',
        amount: 0,
        currency: '',
        paymentMethod: 'razorpay',
        provider: 'razorpay',
        error: error.message
      };
    }
  }

  // Cryptocurrency Payment
  async processCryptoPayment(paymentData: any): Promise<PaymentResult> {
    try {
      console.log('₿ Processing cryptocurrency payment (placeholder implementation)');
      
      // For production, integrate with crypto payment gateway
      const mockTransactionHash = `0x${crypto.randomBytes(32).toString('hex')}`;
      
      // Validate payment data
      if (!paymentData.amount || !paymentData.currency || !paymentData.walletAddress) {
        throw new Error('Invalid crypto payment data: amount, currency, and wallet address required');
      }

      // Simulate blockchain confirmation delay
      await new Promise(resolve => setTimeout(resolve, 3000));

      return {
        success: true,
        transactionId: mockTransactionHash,
        amount: paymentData.amount,
        currency: paymentData.currency,
        paymentMethod: 'crypto',
        provider: 'crypto',
        metadata: {
          walletAddress: paymentData.walletAddress,
          cryptoCurrency: paymentData.cryptoCurrency,
          networkFee: paymentData.networkFee || 0,
          confirmations: 6,
          processedAt: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error('❌ Error processing crypto payment:', error);
      return {
        success: false,
        transactionId: '',
        amount: 0,
        currency: '',
        paymentMethod: 'crypto',
        provider: 'crypto',
        error: error.message
      };
    }
  }

  // Tax Calculation
  async calculateTax(amount: number, countryCode: string, stateCode?: string): Promise<number> {
    try {
      // Tax calculation logic based on location
      const taxRates: Record<string, number> = {
        'US': 0.08,
        'CA': 0.13,
        'GB': 0.20,
        'DE': 0.19,
        'FR': 0.20,
        'AU': 0.10,
        'IN': 0.18
      };

      const taxRate = taxRates[countryCode] || 0;
      return amount * taxRate;
    } catch (error) {
      console.error('❌ Error calculating tax:', error);
      return 0;
    }
  }

  // Fraud Detection
  async detectFraud(paymentData: any): Promise<{ isFraudulent: boolean; riskScore: number; reasons: string[] }> {
    try {
      let riskScore = 0;
      const reasons: string[] = [];

      // Check for suspicious patterns
      if (paymentData.ipAddress && await this.isHighRiskIP(paymentData.ipAddress)) {
        riskScore += 30;
        reasons.push('High-risk IP address');
      }

      if (paymentData.email && await this.isDisposableEmail(paymentData.email)) {
        riskScore += 20;
        reasons.push('Disposable email address');
      }

      if (paymentData.amount > 1000) {
        riskScore += 15;
        reasons.push('High transaction amount');
      }

      // Check velocity (multiple transactions from same user/IP)
      const velocity = await this.checkVelocity(paymentData);
      if (velocity.isHigh) {
        riskScore += 25;
        reasons.push('High transaction velocity');
      }

      return {
        isFraudulent: riskScore > 50,
        riskScore,
        reasons
      };
    } catch (error) {
      console.error('❌ Error in fraud detection:', error);
      return {
        isFraudulent: false,
        riskScore: 0,
        reasons: []
      };
    }
  }

  // Multi-currency Support
  async convertCurrency(amount: number, fromCurrency: string, toCurrency: string): Promise<number> {
    try {
      if (fromCurrency === toCurrency) {
        return amount;
      }

      // In a real implementation, you would use an exchange rate API
      const exchangeRates: Record<string, Record<string, number>> = {
        'USD': { 'EUR': 0.85, 'GBP': 0.73, 'CAD': 1.25, 'AUD': 1.35 },
        'EUR': { 'USD': 1.18, 'GBP': 0.86, 'CAD': 1.47, 'AUD': 1.59 },
        // Add more exchange rates as needed
      };

      const rate = exchangeRates[fromCurrency]?.[toCurrency] || 1;
      return amount * rate;
    } catch (error) {
      console.error('❌ Error converting currency:', error);
      return amount;
    }
  }

  // Private Helper Methods
  private async handlePaymentSuccess(paymentIntent: any): Promise<void> {
    try {
      console.log(`✅ Payment succeeded: ${paymentIntent.id}`);
      
      // Update order status in database
      const orderId = paymentIntent.metadata?.orderId;
      if (orderId) {
        await storage.updateOrder(parseInt(orderId), {
          paymentStatus: 'paid',
          transactionId: paymentIntent.id,
          paidAt: new Date()
        });
      }
    } catch (error) {
      console.error('❌ Error handling payment success:', error);
    }
  }

  private async handlePaymentFailure(paymentIntent: any): Promise<void> {
    try {
      console.log(`❌ Payment failed: ${paymentIntent.id}`);
      
      // Update order status in database
      const orderId = paymentIntent.metadata?.orderId;
      if (orderId) {
        await storage.updateOrder(parseInt(orderId), {
          paymentStatus: 'failed'
        });
      }
    } catch (error) {
      console.error('❌ Error handling payment failure:', error);
    }
  }

  private async handleChargeback(charge: any): Promise<void> {
    try {
      console.log(`🚨 Chargeback created: ${charge.id}`);
      
      // Handle chargeback logic
      // Revoke access, update records, etc.
    } catch (error) {
      console.error('❌ Error handling chargeback:', error);
    }
  }

  private async handleSubscriptionPayment(invoice: any): Promise<void> {
    try {
      console.log(`💰 Subscription payment: ${invoice.id}`);
      
      // Handle subscription payment logic
    } catch (error) {
      console.error('❌ Error handling subscription payment:', error);
    }
  }

  private async isHighRiskIP(ipAddress: string): Promise<boolean> {
    try {
      // Check against known high-risk IP databases
      // This would integrate with services like MaxMind, IPQualityScore, etc.
      return false;
    } catch (error) {
      console.error('❌ Error checking IP risk:', error);
      return false;
    }
  }

  private async isDisposableEmail(email: string): Promise<boolean> {
    try {
      // Check against disposable email domains
      const disposableDomains = [
        '10minutemail.com',
        'tempmail.org',
        'guerrillamail.com',
        'mailinator.com'
      ];
      
      const domain = email.split('@')[1];
      return disposableDomains.includes(domain);
    } catch (error) {
      console.error('❌ Error checking disposable email:', error);
      return false;
    }
  }

  private async checkVelocity(paymentData: any): Promise<{ isHigh: boolean; count: number }> {
    try {
      // Check how many transactions from same IP/user in the last hour
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      
      // This would query the database for recent transactions
      // const recentTransactions = await storage.getRecentTransactions(
      //   paymentData.ipAddress, 
      //   paymentData.email, 
      //   oneHourAgo
      // );
      
      const count = 0; // Placeholder
      return {
        isHigh: count > 5,
        count
      };
    } catch (error) {
      console.error('❌ Error checking velocity:', error);
      return { isHigh: false, count: 0 };
    }
  }

  // Utility Methods
  generateTransactionId(): string {
    return `txn_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
  }

  validatePaymentMethod(method: string): boolean {
    return this.supportedMethods.includes(method);
  }

  getSupportedMethods(): string[] {
    return [...this.supportedMethods];
  }

  async getPaymentMethodFees(method: string, amount: number): Promise<number> {
    try {
      const feeRates: Record<string, number> = {
        'stripe': 0.029, // 2.9%
        'paypal': 0.034, // 3.4%
        'razorpay': 0.025, // 2.5%
        'crypto': 0.01 // 1%
      };

      const rate = feeRates[method] || 0.03;
      return amount * rate;
    } catch (error) {
      console.error('❌ Error calculating payment fees:', error);
      return 0;
    }
  }
}

export const paymentProcessor = new PaymentProcessor();