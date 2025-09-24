// Empire-Grade Checkout Engine
// Billion-Dollar Production Implementation

import crypto from 'crypto';
import { db } from '../../db';
import { storage } from '../../storage';
import { paymentProcessor } from './paymentProcessor';
import { digitalDelivery } from './digitalDelivery';
import { 
  orders, 
  shoppingCarts, 
  digitalProducts,
  promoCodes,
  storefrontAnalytics,
  type Order,
  type ShoppingCart,
  type PromoCode
} from '@shared/storefrontTables';
import { eq, and, desc, gte, lte } from 'drizzle-orm';

export interface CheckoutStep {
  step: 'customer' | 'shipping' | 'payment' | 'review' | 'processing' | 'complete';
  isValid: boolean;
  errors: string[];
  data: Record<string, any>;
}

export interface CheckoutSession {
  sessionId: string;
  userId?: string;
  email: string;
  currentStep: string;
  steps: Record<string, CheckoutStep>;
  cart: {
    items: CartItem[];
    totals: OrderTotals;
    promoCode?: string;
  };
  customer: CustomerInfo;
  billing: BillingAddress;
  payment: PaymentInfo;
  metadata: Record<string, any>;
  createdAt: Date;
  expiresAt: Date;
}

export interface CartItem {
  productId: number;
  variantId?: number;
  quantity: number;
  price: number;
  currency: string;
  title: string;
  imageUrl?: string;
  customization?: Record<string, any>;
}

export interface CustomerInfo {
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  company?: string;
  marketingOptIn: boolean;
}

export interface BillingAddress {
  firstName: string;
  lastName: string;
  company?: string;
  address1: string;
  address2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone?: string;
}

export interface PaymentInfo {
  method: 'stripe' | 'paypal' | 'razorpay' | 'crypto';
  provider: string;
  currency: string;
  amount: number;
  paymentIntentId?: string;
  paymentMethodId?: string;
  clientSecret?: string;
}

export interface OrderTotals {
  subtotal: number;
  tax: number;
  discount: number;
  shipping: number;
  total: number;
  currency: string;
}

export interface CheckoutResult {
  success: boolean;
  order?: Order;
  session?: CheckoutSession;
  paymentClientSecret?: string;
  redirectUrl?: string;
  error?: string;
  validationErrors?: Record<string, string[]>;
}

class CheckoutEngine {
  private sessionCache: Map<string, CheckoutSession> = new Map();
  private sessionTimeoutMinutes: number = 30;
  private supportedCountries: string[] = ['US', 'CA', 'GB', 'AU', 'DE', 'FR', 'ES', 'IT', 'NL'];
  private taxRates: Record<string, number> = {
    'US': 0.08,
    'CA': 0.13,
    'GB': 0.20,
    'AU': 0.10,
    'DE': 0.19,
    'FR': 0.20,
    'ES': 0.21,
    'IT': 0.22,
    'NL': 0.21
  };

  constructor() {
    this.initializeCheckoutEngine();
  }

  private async initializeCheckoutEngine(): Promise<void> {
    try {
      console.log('🛒 Initializing Checkout Engine...');
      
      // Setup checkout analytics
      await this.setupCheckoutAnalytics();
      
      // Initialize session cleanup
      this.startSessionCleanup();
      
      console.log('✅ Checkout Engine initialized successfully');
    } catch (error) {
      console.error('❌ Error initializing Checkout Engine:', error);
      throw error;
    }
  }

  // ===========================================
  // CHECKOUT SESSION MANAGEMENT
  // ===========================================

  async createCheckoutSession(cartSessionId: string): Promise<CheckoutResult> {
    try {
      // Get cart from storage
      const cart = await storage.getShoppingCart(cartSessionId);
      if (!cart || !cart.items || (cart.items as any[]).length === 0) {
        return {
          success: false,
          error: 'Cart is empty or not found'
        };
      }

      // Generate checkout session ID
      const checkoutSessionId = this.generateCheckoutSessionId();
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + this.sessionTimeoutMinutes);

      // Create checkout session
      const checkoutSession: CheckoutSession = {
        sessionId: checkoutSessionId,
        email: '',
        currentStep: 'customer',
        steps: {
          customer: { step: 'customer', isValid: false, errors: [], data: {} },
          shipping: { step: 'shipping', isValid: false, errors: [], data: {} },
          payment: { step: 'payment', isValid: false, errors: [], data: {} },
          review: { step: 'review', isValid: false, errors: [], data: {} },
          processing: { step: 'processing', isValid: false, errors: [], data: {} },
          complete: { step: 'complete', isValid: false, errors: [], data: {} }
        },
        cart: {
          items: await this.transformCartItems(cart.items as any[]),
          totals: await this.calculateTotals(cart.items as any[], cart.promoCode),
          promoCode: cart.promoCode
        },
        customer: {
          email: '',
          firstName: '',
          lastName: '',
          marketingOptIn: false
        },
        billing: {
          firstName: '',
          lastName: '',
          address1: '',
          city: '',
          state: '',
          postalCode: '',
          country: 'US'
        },
        payment: {
          method: 'stripe',
          provider: 'stripe',
          currency: 'USD',
          amount: 0
        },
        metadata: {
          cartSessionId,
          userAgent: '',
          ipAddress: '',
          referrer: ''
        },
        createdAt: new Date(),
        expiresAt
      };

      // Store session
      this.sessionCache.set(checkoutSessionId, checkoutSession);
      
      // Track analytics
      await this.trackCheckoutEvent('checkout_started', checkoutSessionId, {
        itemCount: checkoutSession.cart.items.length,
        cartValue: checkoutSession.cart.totals.total
      });

      console.log(`🛒 Created checkout session: ${checkoutSessionId}`);
      
      return {
        success: true,
        session: checkoutSession
      };
    } catch (error: any) {
      console.error('❌ Error creating checkout session:', error);
      return {
        success: false,
        error: `Failed to create checkout session: ${error?.message || 'Unknown error'}`
      };
    }
  }

  async getCheckoutSession(sessionId: string): Promise<CheckoutSession | null> {
    const session = this.sessionCache.get(sessionId);
    
    if (!session) {
      return null;
    }

    // Check if session expired
    if (new Date() > session.expiresAt) {
      this.sessionCache.delete(sessionId);
      return null;
    }

    return session;
  }

  async updateCheckoutStep(
    sessionId: string, 
    stepName: string, 
    stepData: Record<string, any>
  ): Promise<CheckoutResult> {
    try {
      const session = await this.getCheckoutSession(sessionId);
      if (!session) {
        return {
          success: false,
          error: 'Checkout session not found or expired'
        };
      }

      // Validate step data
      const validation = await this.validateStepData(stepName, stepData, session);
      if (!validation.isValid) {
        return {
          success: false,
          validationErrors: validation.errors
        };
      }

      // Update session step
      session.steps[stepName] = {
        step: stepName as any,
        isValid: true,
        errors: [],
        data: stepData
      };

      // Update session data based on step
      await this.updateSessionData(session, stepName, stepData);

      // Determine next step
      const nextStep = this.getNextStep(session);
      if (nextStep) {
        session.currentStep = nextStep;
      }

      // Update session in cache
      this.sessionCache.set(sessionId, session);

      // Track step completion
      await this.trackCheckoutEvent(`step_completed_${stepName}`, sessionId, stepData);

      return {
        success: true,
        session
      };
    } catch (error: any) {
      console.error('❌ Error updating checkout step:', error);
      return {
        success: false,
        error: `Failed to update checkout step: ${error?.message || 'Unknown error'}`
      };
    }
  }

  // ===========================================
  // STEP VALIDATION
  // ===========================================

  private async validateStepData(
    stepName: string, 
    data: Record<string, any>, 
    session: CheckoutSession
  ): Promise<{ isValid: boolean; errors: Record<string, string[]> }> {
    const errors: Record<string, string[]> = {};

    switch (stepName) {
      case 'customer':
        await this.validateCustomerStep(data, errors);
        break;
      case 'shipping':
        await this.validateShippingStep(data, errors);
        break;
      case 'payment':
        await this.validatePaymentStep(data, errors, session);
        break;
      case 'review':
        await this.validateReviewStep(data, errors, session);
        break;
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }

  private async validateCustomerStep(data: any, errors: Record<string, string[]>): Promise<void> {
    if (!data.email || !this.isValidEmail(data.email)) {
      errors.email = ['Valid email address is required'];
    }

    if (!data.firstName || data.firstName.trim().length < 2) {
      errors.firstName = ['First name must be at least 2 characters'];
    }

    if (!data.lastName || data.lastName.trim().length < 2) {
      errors.lastName = ['Last name must be at least 2 characters'];
    }

    if (data.phone && !this.isValidPhone(data.phone)) {
      errors.phone = ['Please enter a valid phone number'];
    }
  }

  private async validateShippingStep(data: any, errors: Record<string, string[]>): Promise<void> {
    if (!data.address1 || data.address1.trim().length < 5) {
      errors.address1 = ['Address is required and must be at least 5 characters'];
    }

    if (!data.city || data.city.trim().length < 2) {
      errors.city = ['City is required'];
    }

    if (!data.state || data.state.trim().length < 2) {
      errors.state = ['State/Province is required'];
    }

    if (!data.postalCode || !this.isValidPostalCode(data.postalCode, data.country)) {
      errors.postalCode = ['Valid postal code is required'];
    }

    if (!data.country || !this.supportedCountries.includes(data.country)) {
      errors.country = ['Please select a supported country'];
    }
  }

  private async validatePaymentStep(
    data: any, 
    errors: Record<string, string[]>, 
    session: CheckoutSession
  ): Promise<void> {
    if (!data.method || !['stripe', 'paypal', 'razorpay'].includes(data.method)) {
      errors.method = ['Please select a valid payment method'];
    }

    if (data.method === 'stripe' && !data.paymentMethodId) {
      errors.paymentMethodId = ['Payment method is required'];
    }

    if (!data.currency || data.currency !== session.cart.totals.currency) {
      errors.currency = ['Currency mismatch'];
    }

    if (!data.amount || data.amount !== session.cart.totals.total) {
      errors.amount = ['Amount mismatch'];
    }
  }

  private async validateReviewStep(
    data: any, 
    errors: Record<string, string[]>, 
    session: CheckoutSession
  ): Promise<void> {
    // Validate all previous steps are complete
    const requiredSteps = ['customer', 'shipping', 'payment'];
    
    for (const step of requiredSteps) {
      if (!session.steps[step] || !session.steps[step].isValid) {
        errors[step] = [`${step} information is incomplete`];
      }
    }

    if (!data.termsAccepted) {
      errors.terms = ['You must accept the terms and conditions'];
    }

    if (!data.privacyAccepted) {
      errors.privacy = ['You must accept the privacy policy'];
    }
  }

  // ===========================================
  // ORDER PROCESSING
  // ===========================================

  async processCheckoutPayment(sessionId: string): Promise<CheckoutResult> {
    try {
      const session = await this.getCheckoutSession(sessionId);
      if (!session) {
        return {
          success: false,
          error: 'Checkout session not found or expired'
        };
      }

      // Validate session is ready for payment
      if (!this.isSessionReadyForPayment(session)) {
        return {
          success: false,
          error: 'Checkout session is not ready for payment'
        };
      }

      // Create payment intent
      const paymentIntent = await paymentProcessor.createPaymentIntent(
        session.cart.totals.total,
        session.cart.totals.currency,
        {
          sessionId,
          customerEmail: session.customer.email,
          orderItems: session.cart.items.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price
          }))
        }
      );

      // Update session with payment info
      session.payment = {
        ...session.payment,
        paymentIntentId: paymentIntent.id,
        clientSecret: paymentIntent.clientSecret,
        amount: session.cart.totals.total
      };

      // Update session step
      session.currentStep = 'processing';
      session.steps.payment.isValid = true;

      this.sessionCache.set(sessionId, session);

      return {
        success: true,
        session,
        paymentClientSecret: paymentIntent.clientSecret
      };
    } catch (error: any) {
      console.error('❌ Error processing checkout payment:', error);
      return {
        success: false,
        error: `Failed to process payment: ${error?.message || 'Unknown error'}`
      };
    }
  }

  async confirmPaymentAndCreateOrder(
    sessionId: string, 
    paymentMethodId: string
  ): Promise<CheckoutResult> {
    try {
      const session = await this.getCheckoutSession(sessionId);
      if (!session) {
        return {
          success: false,
          error: 'Checkout session not found or expired'
        };
      }

      // Process payment
      const paymentResult = await paymentProcessor.processPayment(
        session.payment.paymentIntentId!,
        paymentMethodId,
        {
          email: session.customer.email,
          name: `${session.customer.firstName} ${session.customer.lastName}`,
          address: session.billing
        }
      );

      if (!paymentResult.success) {
        await this.trackCheckoutEvent('payment_failed', sessionId, {
          error: paymentResult.error,
          amount: session.cart.totals.total
        });

        return {
          success: false,
          error: paymentResult.error || 'Payment failed'
        };
      }

      // Create order
      const order = await this.createOrderFromSession(session, paymentResult);
      
      if (!order) {
        return {
          success: false,
          error: 'Failed to create order'
        };
      }

      // Process digital fulfillment
      await this.processDigitalFulfillment(order);

      // Update session to complete
      session.currentStep = 'complete';
      session.steps.complete.isValid = true;
      session.steps.complete.data = { orderId: order.id };

      this.sessionCache.set(sessionId, session);

      // Track successful conversion
      await this.trackCheckoutEvent('order_completed', sessionId, {
        orderId: order.id,
        amount: Number(order.total),
        itemCount: session.cart.items.length
      });

      console.log(`✅ Order completed successfully: ${order.orderNumber}`);

      return {
        success: true,
        order,
        session
      };
    } catch (error: any) {
      console.error('❌ Error confirming payment and creating order:', error);
      return {
        success: false,
        error: `Failed to complete order: ${error?.message || 'Unknown error'}`
      };
    }
  }

  // ===========================================
  // ORDER CREATION
  // ===========================================

  private async createOrderFromSession(
    session: CheckoutSession, 
    paymentResult: any
  ): Promise<Order | null> {
    try {
      const orderNumber = this.generateOrderNumber();
      
      const orderData = {
        orderNumber,
        sessionId: session.sessionId,
        userId: session.userId || undefined,
        email: session.customer.email,
        customerInfo: JSON.stringify(session.customer),
        billingAddress: JSON.stringify(session.billing),
        items: JSON.stringify(session.cart.items),
        subtotal: session.cart.totals.subtotal,
        taxAmount: session.cart.totals.tax,
        discountAmount: session.cart.totals.discount,
        shippingAmount: session.cart.totals.shipping,
        total: session.cart.totals.total,
        currency: session.cart.totals.currency,
        promoCode: session.cart.promoCode,
        paymentMethod: session.payment.method,
        paymentProvider: session.payment.provider,
        transactionId: paymentResult.transactionId,
        paymentStatus: 'paid',
        fulfillmentStatus: 'pending',
        deliveryMethod: 'digital',
        paidAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const [order] = await db.insert(orders).values(orderData).returning();
      return order;
    } catch (error) {
      console.error('❌ Error creating order from session:', error);
      return null;
    }
  }

  // ===========================================
  // DIGITAL FULFILLMENT
  // ===========================================

  private async processDigitalFulfillment(order: Order): Promise<void> {
    try {
      // Use digital delivery engine for fulfillment
      const deliveryResult = await digitalDelivery.deliverDigitalProduct(order.id);
      
      if (deliveryResult.success) {
        // Update order status
        await storage.updateOrder(order.id, {
          fulfillmentStatus: 'fulfilled',
          fulfilledAt: new Date()
        });

        console.log(`📦 Digital fulfillment completed for order ${order.orderNumber}`);
      } else {
        console.error(`❌ Digital fulfillment failed for order ${order.orderNumber}:`, deliveryResult.error);
        
        // Update order with fulfillment error
        await storage.updateOrder(order.id, {
          fulfillmentStatus: 'failed',
          fulfillmentError: deliveryResult.error
        });
      }
    } catch (error) {
      console.error('❌ Error processing digital fulfillment:', error);
    }
  }

  // ===========================================
  // HELPER METHODS
  // ===========================================

  private generateCheckoutSessionId(): string {
    return `checkout_${crypto.randomUUID()}_${Date.now()}`;
  }

  private generateOrderNumber(): string {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `ORD-${timestamp.substring(-6)}-${random}`;
  }

  private async transformCartItems(cartItems: any[]): Promise<CartItem[]> {
    const transformedItems: CartItem[] = [];

    for (const item of cartItems) {
      const product = await storage.getDigitalProduct(item.productId);
      if (product) {
        transformedItems.push({
          productId: item.productId,
          variantId: item.variantId,
          quantity: item.quantity,
          price: item.price,
          currency: item.currency || 'USD',
          title: product.title,
          imageUrl: product.featuredImage,
          customization: item.customization
        });
      }
    }

    return transformedItems;
  }

  private async calculateTotals(items: any[], promoCode?: string): Promise<OrderTotals> {
    let subtotal = 0;
    
    // Calculate subtotal
    for (const item of items) {
      subtotal += item.price * item.quantity;
    }

    // Apply discount
    let discount = 0;
    if (promoCode) {
      const promo = await this.getValidPromoCode(promoCode);
      if (promo) {
        if (promo.discountType === 'percentage') {
          discount = subtotal * (promo.discountValue / 100);
        } else {
          discount = promo.discountValue;
        }
        discount = Math.min(discount, subtotal);
      }
    }

    // Calculate tax (assume US for now)
    const taxableAmount = subtotal - discount;
    const tax = taxableAmount * this.taxRates['US'];
    
    // Shipping is free for digital products
    const shipping = 0;
    
    const total = subtotal + tax + shipping - discount;

    return {
      subtotal,
      tax,
      discount,
      shipping,
      total,
      currency: 'USD'
    };
  }

  private async getValidPromoCode(code: string): Promise<any> {
    try {
      const [promo] = await db.select()
        .from(promoCodes)
        .where(and(
          eq(promoCodes.code, code),
          eq(promoCodes.isActive, true),
          gte(promoCodes.validUntil, new Date())
        ))
        .limit(1);

      return promo;
    } catch (error) {
      console.error('❌ Error getting promo code:', error);
      return null;
    }
  }

  private async updateSessionData(
    session: CheckoutSession, 
    stepName: string, 
    data: Record<string, any>
  ): Promise<void> {
    switch (stepName) {
      case 'customer':
        session.customer = { ...session.customer, ...data };
        session.email = data.email;
        break;
      case 'shipping':
        session.billing = { ...session.billing, ...data };
        break;
      case 'payment':
        session.payment = { ...session.payment, ...data };
        break;
    }
  }

  private getNextStep(session: CheckoutSession): string | null {
    const stepOrder = ['customer', 'shipping', 'payment', 'review', 'processing', 'complete'];
    const currentIndex = stepOrder.indexOf(session.currentStep);
    
    if (currentIndex < stepOrder.length - 1) {
      return stepOrder[currentIndex + 1];
    }
    
    return null;
  }

  private isSessionReadyForPayment(session: CheckoutSession): boolean {
    return session.steps.customer.isValid && 
           session.steps.shipping.isValid && 
           session.cart.items.length > 0;
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private isValidPhone(phone: string): boolean {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    return phoneRegex.test(phone.replace(/\s|-|\(|\)/g, ''));
  }

  private isValidPostalCode(postalCode: string, country: string): boolean {
    const patterns: Record<string, RegExp> = {
      'US': /^\d{5}(-\d{4})?$/,
      'CA': /^[A-Z]\d[A-Z] \d[A-Z]\d$/,
      'GB': /^[A-Z]{1,2}\d[A-Z\d]? \d[A-Z]{2}$/,
      'AU': /^\d{4}$/
    };
    
    const pattern = patterns[country] || /^.{3,10}$/;
    return pattern.test(postalCode);
  }

  // ===========================================
  // ANALYTICS & TRACKING
  // ===========================================

  private async trackCheckoutEvent(
    eventType: string, 
    sessionId: string, 
    data?: Record<string, any>
  ): Promise<void> {
    try {
      await storage.recordStorefrontAnalytics({
        eventType: `checkout_${eventType}`,
        sessionId,
        metadata: JSON.stringify(data || {}),
        timestamp: new Date()
      });
    } catch (error) {
      console.error('❌ Error tracking checkout event:', error);
    }
  }

  private async setupCheckoutAnalytics(): Promise<void> {
    console.log('📊 Setting up checkout analytics...');
  }

  private startSessionCleanup(): void {
    // Clean up expired sessions every 5 minutes
    setInterval(() => {
      const now = new Date();
      for (const [sessionId, session] of this.sessionCache.entries()) {
        if (now > session.expiresAt) {
          this.sessionCache.delete(sessionId);
        }
      }
    }, 5 * 60 * 1000);
  }

  // ===========================================
  // PUBLIC API METHODS
  // ===========================================

  async getSessionSummary(sessionId: string): Promise<{
    session?: CheckoutSession;
    progress: number;
    nextStep?: string;
    canProceed: boolean;
  }> {
    const session = await this.getCheckoutSession(sessionId);
    
    if (!session) {
      return { progress: 0, canProceed: false };
    }

    const completedSteps = Object.values(session.steps).filter(step => step.isValid).length;
    const totalSteps = Object.keys(session.steps).length;
    const progress = (completedSteps / totalSteps) * 100;
    const nextStep = this.getNextStep(session);
    const canProceed = session.steps[session.currentStep]?.isValid || false;

    return {
      session,
      progress,
      nextStep,
      canProceed
    };
  }

  async abandonCheckout(sessionId: string, reason?: string): Promise<void> {
    try {
      const session = await this.getCheckoutSession(sessionId);
      if (session) {
        await this.trackCheckoutEvent('abandoned', sessionId, {
          step: session.currentStep,
          reason: reason || 'unknown',
          itemCount: session.cart.items.length,
          cartValue: session.cart.totals.total
        });

        this.sessionCache.delete(sessionId);
      }
    } catch (error) {
      console.error('❌ Error tracking checkout abandonment:', error);
    }
  }
}

export const checkoutEngine = new CheckoutEngine();