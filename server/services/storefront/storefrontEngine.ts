import { storage } from '../../storage';
import { llmIntegration } from '../ai-ml/llmIntegration';
import { 
  digitalProducts, 
  orders, 
  shoppingCarts, 
  productLicenses, 
  promoCodes,
  affiliatePartners,
  affiliateTracking,
  storefrontAnalytics,
  type DigitalProduct,
  type Order,
  type ShoppingCart,
  type PromoCode
} from '@shared/storefrontTables';
import crypto from 'crypto';
import { db } from '../../db';
import { eq, and, desc, sql, gte, lte, inArray } from 'drizzle-orm';

export interface StorefrontConfig {
  currency: string;
  taxRates: Record<string, number>;
  paymentMethods: string[];
  enableAffiliates: boolean;
  enableABTesting: boolean;
  enableAIOptimization: boolean;
}

export interface CheckoutSession {
  sessionId: string;
  items: CartItem[];
  customer: CustomerInfo;
  shipping: ShippingInfo;
  payment: PaymentInfo;
  totals: OrderTotals;
  metadata: Record<string, any>;
}

export interface CartItem {
  productId: number;
  variantId?: number;
  quantity: number;
  price: number;
  currency: string;
  customization?: Record<string, any>;
}

export interface CustomerInfo {
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  company?: string;
}

export interface ShippingInfo {
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface PaymentInfo {
  method: string;
  provider: string;
  currency: string;
  amount: number;
}

export interface OrderTotals {
  subtotal: number;
  tax: number;
  discount: number;
  shipping: number;
  total: number;
  currency: string;
}

export interface PersonalizationContext {
  userId?: string;
  sessionId: string;
  archetype?: string;
  behavior: Record<string, any>;
  demographics: Record<string, any>;
  purchaseHistory: any[];
}

class StorefrontEngine {
  private config: StorefrontConfig;
  private aiOptimizationEnabled: boolean = true;

  constructor() {
    this.config = {
      currency: 'USD',
      taxRates: {
        'US': 0.08,
        'CA': 0.13,
        'EU': 0.20,
        'AU': 0.10
      },
      paymentMethods: ['stripe', 'paypal', 'razorpay'],
      enableAffiliates: true,
      enableABTesting: true,
      enableAIOptimization: true
    };
  }

  // Product Management
  async createProduct(productData: any): Promise<DigitalProduct> {
    try {
      // AI optimization for product content
      if (this.aiOptimizationEnabled && productData.title && productData.description) {
        const optimizedContent = await this.optimizeProductContent(
          productData.title,
          productData.description,
          productData.category
        );
        
        productData.aiOptimizedTitle = optimizedContent.title;
        productData.aiOptimizedDescription = optimizedContent.description;
        productData.personalizationTags = optimizedContent.tags;
      }

      // Generate unique slug
      productData.slug = this.generateSlug(productData.title);
      
      // Set default values
      productData.status = productData.status || 'draft';
      productData.currency = productData.currency || this.config.currency;
      productData.isDigital = productData.isDigital !== false;
      
      const product = await storage.createDigitalProduct(productData);
      
      // Initialize analytics for the product
      await this.initializeProductAnalytics(product.id);
      
      console.log(`✅ Created digital product: ${product.title} (ID: ${product.id})`);
      return product;
    } catch (error: any) {
      console.error('❌ Error creating product:', error);
      throw new Error(`Failed to create product: ${error?.message || 'Unknown error'}`);
    }
  }

  async updateProduct(productId: number, updates: any): Promise<DigitalProduct> {
    try {
      // AI optimization for updated content
      if (this.aiOptimizationEnabled && (updates.title || updates.description)) {
        const product = await storage.getDigitalProduct(productId);
        if (product) {
          const optimizedContent = await this.optimizeProductContent(
            updates.title || product.title,
            updates.description || product.description,
            updates.category || product.category
          );
          
          updates.aiOptimizedTitle = optimizedContent.title;
          updates.aiOptimizedDescription = optimizedContent.description;
          updates.personalizationTags = optimizedContent.tags;
        }
      }

      updates.updatedAt = new Date();
      const product = await storage.updateDigitalProduct(productId, updates);
      
      console.log(`✅ Updated product: ${product.title} (ID: ${productId})`);
      return product;
    } catch (error: any) {
      console.error('❌ Error updating product:', error);
      throw new Error(`Failed to update product: ${error?.message || 'Unknown error'}`);
    }
  }

  async getProducts(filters: any = {}): Promise<DigitalProduct[]> {
    try {
      const products = await storage.getDigitalProducts(filters);
      
      // Apply personalization if context provided
      if (filters.personalizationContext) {
        return await this.personalizeProductList(products, filters.personalizationContext);
      }
      
      return products;
    } catch (error: any) {
      console.error('❌ Error fetching products:', error);
      throw new Error(`Failed to fetch products: ${error?.message || 'Unknown error'}`);
    }
  }

  async getPersonalizedRecommendations(context: PersonalizationContext): Promise<DigitalProduct[]> {
    try {
      // Get user's purchase history and behavior
      const userBehavior = await this.analyzeUserBehavior(context);
      
      // Get products that match user's interests
      const candidateProducts = await this.getCandidateProducts(userBehavior);
      
      // AI-powered recommendation scoring
      const scoredProducts = await this.scoreProductsForUser(candidateProducts, context);
      
      // Return top recommendations
      return scoredProducts.slice(0, 10);
    } catch (error: any) {
      console.error('❌ Error getting recommendations:', error);
      return [];
    }
  }

  // Shopping Cart Management
  async addToCart(sessionId: string, item: CartItem): Promise<ShoppingCart> {
    try {
      const cart = await this.getOrCreateCart(sessionId);
      
      // Validate product and pricing
      const product = await storage.getDigitalProduct(item.productId);
      if (!product || product.status !== 'active') {
        throw new Error('Product not available');
      }

      // Update cart items
      const existingItems = cart.items as any[] || [];
      const existingItemIndex = existingItems.findIndex(
        (i: any) => i.productId === item.productId && i.variantId === item.variantId
      );

      if (existingItemIndex >= 0) {
        existingItems[existingItemIndex].quantity += item.quantity;
      } else {
        existingItems.push({
          ...item,
          addedAt: new Date().toISOString()
        });
      }

      // Recalculate totals
      const totals = await this.calculateCartTotals(existingItems, cart.promoCode || undefined);
      
      const updatedCart = await storage.updateShoppingCart(cart.id, {
        items: existingItems,
        subtotal: totals.subtotal,
        taxAmount: totals.tax,
        discountAmount: totals.discount,
        total: totals.total,
        updatedAt: new Date()
      });

      // Track analytics
      await this.trackCartEvent('add_to_cart', sessionId, item.productId);
      
      console.log(`✅ Added product ${item.productId} to cart ${sessionId}`);
      return updatedCart;
    } catch (error: any) {
      console.error('❌ Error adding to cart:', error);
      throw new Error(`Failed to add to cart: ${error?.message || 'Unknown error'}`);
    }
  }

  async removeFromCart(sessionId: string, productId: number, variantId?: number): Promise<ShoppingCart> {
    try {
      const cart = await this.getCart(sessionId);
      if (!cart) {
        throw new Error('Cart not found');
      }

      const items = (cart.items as any[]).filter(
        (item: any) => !(item.productId === productId && item.variantId === variantId)
      );

      const totals = await this.calculateCartTotals(items, cart.promoCode || undefined);
      
      const updatedCart = await storage.updateShoppingCart(cart.id, {
        items,
        subtotal: totals.subtotal,
        taxAmount: totals.tax,
        discountAmount: totals.discount,
        total: totals.total,
        updatedAt: new Date()
      });

      // Track analytics
      await this.trackCartEvent('remove_from_cart', sessionId, productId);
      
      return updatedCart;
    } catch (error: any) {
      console.error('❌ Error removing from cart:', error);
      throw new Error(`Failed to remove from cart: ${error?.message || 'Unknown error'}`);
    }
  }

  async applyPromoCode(sessionId: string, code: string): Promise<ShoppingCart> {
    try {
      const cart = await this.getCart(sessionId);
      if (!cart) {
        throw new Error('Cart not found');
      }

      const promoCode = await this.validatePromoCode(code, cart);
      
      const totals = await this.calculateCartTotals(cart.items as any[], code);
      
      const updatedCart = await storage.updateShoppingCart(cart.id, {
        promoCode: code,
        subtotal: totals.subtotal,
        taxAmount: totals.tax,
        discountAmount: totals.discount,
        total: totals.total,
        updatedAt: new Date()
      });

      // Update promo code usage
      await storage.updatePromoCodeUsage(promoCode.id, (promoCode.currentUses || 0) + 1);
      
      console.log(`✅ Applied promo code ${code} to cart ${sessionId}`);
      return updatedCart;
    } catch (error: any) {
      console.error('❌ Error applying promo code:', error);
      throw new Error(`Failed to apply promo code: ${error?.message || 'Unknown error'}`);
    }
  }

  // Checkout and Order Processing
  async createCheckoutSession(sessionId: string, customerInfo: CustomerInfo): Promise<CheckoutSession> {
    try {
      const cart = await this.getCart(sessionId);
      if (!cart || !cart.items || (cart.items as any[]).length === 0) {
        throw new Error('Cart is empty');
      }

      const totals = await this.calculateCartTotals(cart.items as any[], cart.promoCode || undefined);
      
      const checkoutSession: CheckoutSession = {
        sessionId,
        items: cart.items as CartItem[],
        customer: customerInfo,
        shipping: {
          address: '',
          city: '',
          state: '',
          zipCode: '',
          country: 'US'
        },
        payment: {
          method: 'stripe',
          provider: 'stripe',
          currency: this.config.currency,
          amount: totals.total
        },
        totals,
        metadata: {
          cartId: cart.id,
          createdAt: new Date().toISOString()
        }
      };

      // Store checkout session temporarily
      await this.storeCheckoutSession(checkoutSession);
      
      // Track analytics
      await this.trackCartEvent('checkout_initiated', sessionId);
      
      return checkoutSession;
    } catch (error: any) {
      console.error('❌ Error creating checkout session:', error);
      throw new Error(`Failed to create checkout session: ${error?.message || 'Unknown error'}`);
    }
  }

  async processOrder(checkoutSession: CheckoutSession, paymentResult: any): Promise<Order> {
    try {
      // Generate unique order number
      const orderNumber = this.generateOrderNumber();
      
      // Create order record
      const orderData = {
        orderNumber,
        sessionId: checkoutSession.sessionId,
        userId: checkoutSession.metadata.userId,
        email: checkoutSession.customer.email,
        customerInfo: checkoutSession.customer,
        billingAddress: checkoutSession.shipping,
        items: checkoutSession.items,
        subtotal: checkoutSession.totals.subtotal,
        taxAmount: checkoutSession.totals.tax,
        discountAmount: checkoutSession.totals.discount,
        total: checkoutSession.totals.total,
        currency: checkoutSession.totals.currency,
        paymentMethod: checkoutSession.payment.method,
        paymentProvider: checkoutSession.payment.provider,
        transactionId: paymentResult.transactionId,
        paymentStatus: paymentResult.success ? 'paid' : 'failed',
        fulfillmentStatus: 'pending',
        deliveryMethod: 'digital',
        paidAt: paymentResult.success ? new Date() : null
      };

      const order = await storage.createOrder(orderData);
      
      if (paymentResult.success) {
        // Process digital fulfillment
        await this.fulfillDigitalOrder(order);
        
        // Process affiliate commissions
        await this.processAffiliateCommissions(order);
        
        // Clear cart
        await this.clearCart(checkoutSession.sessionId);
        
        // Track conversion
        await this.trackConversion(order);
      }
      
      console.log(`✅ Processed order ${order.orderNumber} - Status: ${order.paymentStatus}`);
      return order;
    } catch (error: any) {
      console.error('❌ Error processing order:', error);
      throw new Error(`Failed to process order: ${error?.message || 'Unknown error'}`);
    }
  }

  // Digital Product Fulfillment
  async fulfillDigitalOrder(order: Order): Promise<void> {
    try {
      const items = order.items as any[];
      const licenses: any[] = [];
      const downloadLinks: any[] = [];

      for (const item of items) {
        const product = await storage.getDigitalProduct(item.productId);
        if (!product) continue;

        // Generate license key
        const licenseKey = this.generateLicenseKey();
        
        const license = await storage.createProductLicense({
          orderId: order.id,
          productId: product.id,
          userId: order.userId,
          licenseKey,
          licenseType: product.licenseType || 'single',
          maxActivations: product.licenseType === 'multi' ? 5 : 1,
          maxDownloads: product.maxDownloads || -1,
          expiresAt: product.expirationDays 
            ? new Date(Date.now() + product.expirationDays * 24 * 60 * 60 * 1000)
            : null
        });

        licenses.push({
          productId: product.id,
          licenseKey,
          downloadUrl: product.downloadUrl,
          accessInstructions: this.generateAccessInstructionsText(product, license)
        });

        if (product.downloadUrl) {
          downloadLinks.push({
            productId: product.id,
            productTitle: product.title,
            downloadUrl: this.generateSecureDownloadUrl(product.downloadUrl, licenseKey),
            expiresAt: license.expiresAt
          });
        }
      }

      // Update order with fulfillment data
      await storage.updateOrder(order.id, {
        fulfillmentStatus: 'delivered',
        deliveredAt: new Date(),
        downloadLinks,
        accessKeys: licenses.map(l => ({ 
          productId: l.productId, 
          licenseKey: l.licenseKey 
        }))
      });

      // Send fulfillment email
      await this.sendFulfillmentEmail(order, licenses);
      
      console.log(`✅ Fulfilled digital order ${order.orderNumber} with ${licenses.length} licenses`);
    } catch (error: any) {
      console.error('❌ Error fulfilling digital order:', error);
      throw new Error(`Failed to fulfill order: ${error?.message || 'Unknown error'}`);
    }
  }

  // Promo Code Management
  async createPromoCode(promoData: any): Promise<PromoCode> {
    try {
      // Ensure unique code
      const existingCode = await storage.getPromoCodeByCode(promoData.code);
      if (existingCode) {
        throw new Error('Promo code already exists');
      }

      promoData.code = promoData.code.toUpperCase();
      promoData.isActive = promoData.isActive !== false;
      
      const promoCode = await storage.createPromoCode(promoData);
      
      console.log(`✅ Created promo code: ${promoCode.code}`);
      return promoCode;
    } catch (error: any) {
      console.error('❌ Error creating promo code:', error);
      throw new Error(`Failed to create promo code: ${error?.message || 'Unknown error'}`);
    }
  }

  async validatePromoCode(code: string, cart: ShoppingCart): Promise<PromoCode> {
    try {
      const promoCode = await storage.getPromoCodeByCode(code.toUpperCase());
      if (!promoCode) {
        throw new Error('Invalid promo code');
      }

      if (!promoCode.isActive) {
        throw new Error('Promo code is not active');
      }

      if (promoCode.validFrom && new Date() < promoCode.validFrom) {
        throw new Error('Promo code is not yet valid');
      }

      if (promoCode.validUntil && new Date() > promoCode.validUntil) {
        throw new Error('Promo code has expired');
      }

      if (promoCode.maxUses > 0 && promoCode.currentUses >= promoCode.maxUses) {
        throw new Error('Promo code usage limit reached');
      }

      // Check minimum order amount
      if (promoCode.minOrderAmount && cart.subtotal < parseFloat(promoCode.minOrderAmount)) {
        throw new Error(`Minimum order amount of ${promoCode.minOrderAmount} required`);
      }

      // Check product restrictions
      if (promoCode.applicableProducts && promoCode.applicableProducts.length > 0) {
        const cartItems = cart.items as any[];
        const hasApplicableProduct = cartItems.some(item => 
          promoCode.applicableProducts.includes(item.productId)
        );
        if (!hasApplicableProduct) {
          throw new Error('Promo code not applicable to cart items');
        }
      }

      return promoCode;
    } catch (error: any) {
      console.error('❌ Error validating promo code:', error);
      throw error;
    }
  }

  // Analytics and Optimization
  async trackProductView(productId: number, sessionId: string, userId?: string): Promise<void> {
    try {
      await this.trackEvent('product_view', {
        productId,
        sessionId,
        userId,
        timestamp: new Date()
      });

      // Update daily analytics
      await this.updateDailyAnalytics(productId, 'product_views', 1);
    } catch (error) {
      console.error('❌ Error tracking product view:', error);
    }
  }

  async trackCartEvent(eventType: string, sessionId: string, productId?: number): Promise<void> {
    try {
      await this.trackEvent(eventType, {
        productId,
        sessionId,
        timestamp: new Date()
      });

      if (productId) {
        const analyticsField = eventType === 'add_to_cart' ? 'add_to_cart_rate' : 'checkout_rate';
        await this.updateDailyAnalytics(productId, analyticsField, 1);
      }
    } catch (error) {
      console.error('❌ Error tracking cart event:', error);
    }
  }

  async trackConversion(order: Order): Promise<void> {
    try {
      await this.trackEvent('purchase', {
        orderId: order.id,
        sessionId: order.sessionId,
        userId: order.userId,
        value: parseFloat(order.total),
        currency: order.currency,
        items: order.items,
        timestamp: new Date()
      });

      // Update product analytics
      const items = order.items as any[];
      for (const item of items) {
        await this.updateDailyAnalytics(item.productId, 'total_orders', 1);
        await this.updateDailyAnalytics(item.productId, 'total_revenue', item.price * item.quantity);
      }
    } catch (error) {
      console.error('❌ Error tracking conversion:', error);
    }
  }

  // AI-Powered Optimization
  async optimizeProductContent(title: string, description: string, category?: string): Promise<any> {
    try {
      const prompt = `
Optimize this product content for conversions and SEO:

Title: ${title}
Description: ${description}
Category: ${category || 'General'}

Provide optimized versions and suggest personalization tags for better targeting.
Return JSON with: optimizedTitle, optimizedDescription, tags[]
`;

      const response = await llmIntegration.generateResponse(prompt, {
        provider: 'openai',
        model: 'gpt-4',
        maxTokens: 500,
        temperature: 0.7
      });

      return JSON.parse(response);
    } catch (error) {
      console.error('❌ Error optimizing product content:', error);
      return {
        title,
        description,
        tags: []
      };
    }
  }

  async generateProductRecommendations(productId: number): Promise<number[]> {
    try {
      // Get product and similar products
      const product = await storage.getDigitalProduct(productId);
      if (!product) return [];

      // AI-powered similarity analysis
      const prompt = `
Analyze this product and recommend similar products:
Product: ${product.title}
Category: ${product.category}
Tags: ${product.tags?.join(', ')}
Description: ${product.description}

Return product IDs that would be good recommendations.
`;

      const response = await llmIntegration.generateResponse(prompt, {
        provider: 'openai',
        model: 'gpt-4',
        maxTokens: 200
      });

      // Parse and validate recommendations
      const recommendations = this.parseRecommendations(response);
      return recommendations.slice(0, 5);
    } catch (error) {
      console.error('❌ Error generating recommendations:', error);
      return [];
    }
  }

  // Utility Methods
  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 100);
  }

  private generateOrderNumber(): string {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `ORD-${timestamp}-${random}`;
  }

  private generateLicenseKey(): string {
    return crypto.randomBytes(16).toString('hex').toUpperCase();
  }

  private generateSecureDownloadUrl(baseUrl: string, licenseKey: string): string {
    const token = crypto.createHmac('sha256', process.env.LICENSE_SECRET || 'fallback-secret')
      .update(`${licenseKey}-${Date.now()}`)
      .digest('hex');
    
    return `${baseUrl}?license=${licenseKey}&token=${token}`;
  }

  private async getOrCreateCart(sessionId: string): Promise<ShoppingCart> {
    let cart = await this.getCart(sessionId);
    
    if (!cart) {
      cart = await storage.createShoppingCart({
        sessionId,
        items: [],
        subtotal: 0,
        taxAmount: 0,
        discountAmount: 0,
        total: 0,
        currency: this.config.currency
      });
    }
    
    return cart;
  }

  private async getCart(sessionId: string): Promise<ShoppingCart | null> {
    return await storage.getShoppingCartBySession(sessionId);
  }

  private async calculateCartTotals(items: any[], promoCode?: string): Promise<OrderTotals> {
    let subtotal = 0;
    
    for (const item of items) {
      subtotal += item.price * item.quantity;
    }

    let discount = 0;
    if (promoCode) {
      const promo = await storage.getPromoCodeByCode(promoCode);
      if (promo && promo.isActive) {
        if (promo.discountType === 'percentage') {
          discount = subtotal * (parseFloat(promo.discountValue) / 100);
        } else if (promo.discountType === 'fixed') {
          discount = parseFloat(promo.discountValue);
        }
        
        if (promo.maxDiscountAmount) {
          discount = Math.min(discount, parseFloat(promo.maxDiscountAmount));
        }
      }
    }

    const discountedSubtotal = subtotal - discount;
    const tax = discountedSubtotal * (this.config.taxRates['US'] || 0);
    const total = discountedSubtotal + tax;

    return {
      subtotal,
      tax,
      discount,
      shipping: 0, // Digital products don't have shipping
      total,
      currency: this.config.currency
    };
  }

  private async clearCart(sessionId: string): Promise<void> {
    const cart = await this.getCart(sessionId);
    if (cart) {
      await storage.updateShoppingCart(cart.id, {
        items: [],
        subtotal: 0,
        taxAmount: 0,
        discountAmount: 0,
        total: 0,
        updatedAt: new Date()
      });
    }
  }

  // Advanced AI-Powered Features Implementation
  private async personalizeProductList(products: DigitalProduct[], context: PersonalizationContext): Promise<DigitalProduct[]> {
    try {
      if (!products.length || !context.archetype) return products;

      // AI-powered personalization scoring
      const prompt = `
Personalize this product list for user archetype "${context.archetype}":
Products: ${products.map(p => `ID:${p.id} Title:"${p.title}" Category:"${p.category}" Price:${p.price}`).join(', ')}
User Context: ${JSON.stringify(context.behavior)}
Demographics: ${JSON.stringify(context.demographics)}

Score each product 0-100 for relevance. Return JSON array: [{"productId": number, "score": number, "reason": "string"}]
`;

      const response = await llmIntegration.generateResponse(prompt, {
        provider: 'openai',
        model: 'gpt-4',
        maxTokens: 800,
        temperature: 0.3
      });

      const scores = JSON.parse(response);
      
      // Sort products by AI score
      return products.sort((a, b) => {
        const scoreA = scores.find((s: any) => s.productId === a.id)?.score || 50;
        const scoreB = scores.find((s: any) => s.productId === b.id)?.score || 50;
        return scoreB - scoreA;
      });
    } catch (error) {
      console.error('❌ Error personalizing product list:', error);
      return products;
    }
  }

  private async analyzeUserBehavior(context: PersonalizationContext): Promise<any> {
    try {
      // Analyze viewing patterns
      const viewingPatterns = await db.select()
        .from(storefrontAnalytics)
        .where(and(
          eq(storefrontAnalytics.sessionId, context.sessionId),
          eq(storefrontAnalytics.eventType, 'product_view')
        ))
        .orderBy(desc(storefrontAnalytics.createdAt))
        .limit(50);

      // Analyze cart behavior
      const cartBehavior = await db.select()
        .from(storefrontAnalytics)
        .where(and(
          eq(storefrontAnalytics.sessionId, context.sessionId),
          inArray(storefrontAnalytics.eventType, ['add_to_cart', 'remove_from_cart'])
        ))
        .orderBy(desc(storefrontAnalytics.createdAt));

      return {
        viewedCategories: [...new Set(viewingPatterns.map(p => p.metadata?.category).filter(Boolean))],
        avgSessionDuration: this.calculateAvgSessionDuration(viewingPatterns),
        cartAbandonment: this.calculateCartAbandonmentRate(cartBehavior),
        priceRange: this.analyzePricePreferences(viewingPatterns),
        interests: [...new Set(viewingPatterns.map(p => p.metadata?.tags).flat().filter(Boolean))],
        engagementScore: this.calculateEngagementScore(viewingPatterns, cartBehavior)
      };
    } catch (error) {
      console.error('❌ Error analyzing user behavior:', error);
      return { engagementScore: 50 };
    }
  }

  private async getCandidateProducts(userBehavior: any): Promise<DigitalProduct[]> {
    try {
      const filters: any = { status: 'active', limit: 50 };

      // Filter by viewed categories
      if (userBehavior.viewedCategories?.length > 0) {
        filters.categories = userBehavior.viewedCategories;
      }

      // Filter by price range preferences
      if (userBehavior.priceRange) {
        filters.minPrice = userBehavior.priceRange.min;
        filters.maxPrice = userBehavior.priceRange.max;
      }

      return await storage.getDigitalProducts(filters);
    } catch (error) {
      console.error('❌ Error getting candidate products:', error);
      return [];
    }
  }

  private async scoreProductsForUser(products: DigitalProduct[], context: PersonalizationContext): Promise<DigitalProduct[]> {
    try {
      if (!products.length) return [];

      const userBehavior = await this.analyzeUserBehavior(context);
      
      const scoredProducts = products.map(product => {
        let score = 50; // Base score

        // Category match bonus
        if (userBehavior.viewedCategories?.includes(product.category)) {
          score += 20;
        }

        // Price preference match
        if (userBehavior.priceRange) {
          const price = parseFloat(product.price);
          if (price >= userBehavior.priceRange.min && price <= userBehavior.priceRange.max) {
            score += 15;
          }
        }

        // Interest tag matches
        const productTags = product.tags || [];
        const matchingInterests = userBehavior.interests?.filter((interest: string) => 
          productTags.includes(interest)
        ).length || 0;
        score += matchingInterests * 5;

        // Popularity boost
        score += (product.totalOrders || 0) * 0.1;

        // Rating boost
        score += (parseFloat(product.averageRating || '0') - 3) * 5;

        return { ...product, aiScore: Math.min(100, Math.max(0, score)) };
      });

      return scoredProducts.sort((a, b) => (b as any).aiScore - (a as any).aiScore);
    } catch (error) {
      console.error('❌ Error scoring products:', error);
      return products;
    }
  }

  private async initializeProductAnalytics(productId: number): Promise<void> {
    try {
      const analyticsData = {
        productId,
        sessionId: 'system',
        eventType: 'product_created',
        timestamp: new Date(),
        metadata: JSON.stringify({
          createdAt: new Date().toISOString(),
          initialViews: 0,
          initialOrders: 0
        })
      };

      await db.insert(storefrontAnalytics).values(analyticsData);
      console.log(`📊 Initialized analytics for product ${productId}`);
    } catch (error) {
      console.error('❌ Error initializing product analytics:', error);
    }
  }

  private async storeCheckoutSession(session: CheckoutSession): Promise<void> {
    try {
      // Store in database with expiration
      const sessionData = {
        sessionId: session.sessionId,
        data: JSON.stringify(session),
        expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes
        createdAt: new Date()
      };

      // Would need a checkout_sessions table - using storage for now
      await storage.storeData(`checkout_session_${session.sessionId}`, sessionData);
      console.log(`💾 Stored checkout session: ${session.sessionId}`);
    } catch (error) {
      console.error('❌ Error storing checkout session:', error);
    }
  }

  private async processAffiliateCommissions(order: Order): Promise<void> {
    try {
      const items = order.items as any[];
      
      for (const item of items) {
        // Check if order has affiliate tracking
        const affiliateCode = order.metadata?.affiliateCode;
        if (!affiliateCode) continue;

        // Get affiliate partner
        const affiliate = await db.select()
          .from(affiliatePartners)
          .where(eq(affiliatePartners.code, affiliateCode))
          .limit(1);

        if (affiliate.length === 0) continue;

        const partner = affiliate[0];
        const commission = (item.price * item.quantity) * (parseFloat(partner.commissionRate) / 100);

        // Record commission
        await db.insert(affiliateTracking).values({
          affiliateId: partner.id,
          orderId: order.id,
          productId: item.productId,
          clickId: order.metadata?.clickId || crypto.randomUUID(),
          commission: commission.toString(),
          status: 'pending',
          metadata: JSON.stringify({
            orderNumber: order.orderNumber,
            customerEmail: order.email,
            processedAt: new Date().toISOString()
          })
        });

        console.log(`💰 Processed affiliate commission: $${commission.toFixed(2)} for ${partner.name}`);
      }
    } catch (error) {
      console.error('❌ Error processing affiliate commissions:', error);
    }
  }

  private async sendFulfillmentEmail(order: Order, licenses: any[]): Promise<void> {
    try {
      const emailContent = this.generateFulfillmentEmailContent(order, licenses);
      
      // Use notification engine for email sending
      await storage.storeData(`fulfillment_email_${order.id}`, {
        to: order.email,
        subject: `Your Digital Products - Order ${order.orderNumber}`,
        content: emailContent,
        licenses,
        sentAt: new Date().toISOString()
      });

      console.log(`📧 Prepared fulfillment email for order ${order.orderNumber}`);
    } catch (error) {
      console.error('❌ Error sending fulfillment email:', error);
    }
  }

  private generateFulfillmentEmailContent(order: Order, licenses: any[]): string {
    return `
    <h2>Thank you for your purchase!</h2>
    <p>Your order ${order.orderNumber} has been processed successfully.</p>
    
    <h3>Your Digital Products:</h3>
    ${licenses.map(license => `
      <div>
        <h4>${license.productId}</h4>
        <p><strong>License Key:</strong> ${license.licenseKey}</p>
        <p><strong>Download Link:</strong> <a href="${license.downloadUrl}">Download Now</a></p>
        <p>${license.accessInstructions}</p>
      </div>
    `).join('')}
    
    <p>If you have any questions, please contact our support team.</p>
    `;
  }

  private async trackEvent(eventType: string, data: any): Promise<void> {
    try {
      const eventData = {
        sessionId: data.sessionId || 'unknown',
        eventType,
        productId: data.productId || null,
        userId: data.userId || null,
        timestamp: data.timestamp || new Date(),
        metadata: JSON.stringify(data)
      };

      await db.insert(storefrontAnalytics).values(eventData);
    } catch (error) {
      console.error('❌ Error tracking event:', error);
    }
  }

  private async updateDailyAnalytics(productId: number, metric: string, value: number): Promise<void> {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Update or create daily analytics record
      const existing = await db.select()
        .from(storefrontAnalytics)
        .where(and(
          eq(storefrontAnalytics.productId, productId),
          eq(storefrontAnalytics.eventType, 'daily_metrics'),
          gte(storefrontAnalytics.timestamp, new Date(today))
        ))
        .limit(1);

      if (existing.length > 0) {
        const currentMetrics = JSON.parse(existing[0].metadata || '{}');
        currentMetrics[metric] = (currentMetrics[metric] || 0) + value;
        
        await db.update(storefrontAnalytics)
          .set({ metadata: JSON.stringify(currentMetrics) })
          .where(eq(storefrontAnalytics.id, existing[0].id));
      } else {
        const metrics = { [metric]: value };
        await db.insert(storefrontAnalytics).values({
          productId,
          sessionId: 'system',
          eventType: 'daily_metrics',
          timestamp: new Date(),
          metadata: JSON.stringify(metrics)
        });
      }
    } catch (error) {
      console.error('❌ Error updating daily analytics:', error);
    }
  }

  private parseRecommendations(content: string): number[] {
    try {
      // Extract product IDs from AI response
      const matches = content.match(/\b\d+\b/g);
      return matches ? matches.map(Number).filter(id => id > 0) : [];
    } catch (error) {
      console.error('❌ Error parsing recommendations:', error);
      return [];
    }
  }

  // Missing utility methods
  private generateAccessInstructionsText(product: any, license: any): string {
    let instructions = `Access Instructions for ${product.title}\n\n`;
    instructions += `Product: ${product.title}\n`;
    instructions += `License Key: ${license.licenseKey}\n`;
    instructions += `License Type: ${license.licenseType}\n`;
    if (license.maxActivations && license.maxActivations > 0) {
      instructions += `Max Activations: ${license.maxActivations}\n`;
    }
    if (license.expiresAt) {
      instructions += `Expires: ${new Date(license.expiresAt).toLocaleDateString()}\n`;
    }
    instructions += `\nKeep your license key secure and do not share it.`;
    return instructions;
  }

  private generateSecureDownloadUrl(baseUrl: string, licenseKey: string): string {
    const params = new URLSearchParams({
      key: licenseKey,
      timestamp: Date.now().toString(),
      token: this.generateSecureToken()
    });
    return `${baseUrl}?${params.toString()}`;
  }

  private generateSecureToken(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  private generateLicenseKey(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 16; i++) {
      if (i > 0 && i % 4 === 0) result += '-';
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  private generateOrderNumber(): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `ORD-${timestamp}-${random}`;
  }

  // Utility methods for behavior analysis
  private calculateAvgSessionDuration(views: any[]): number {
    if (views.length < 2) return 0;
    const duration = new Date(views[0].timestamp).getTime() - new Date(views[views.length - 1].timestamp).getTime();
    return Math.max(0, duration / 1000 / 60); // minutes
  }

  private calculateCartAbandonmentRate(cartEvents: any[]): number {
    const addEvents = cartEvents.filter(e => e.eventType === 'add_to_cart').length;
    const removeEvents = cartEvents.filter(e => e.eventType === 'remove_from_cart').length;
    return addEvents > 0 ? (removeEvents / addEvents) * 100 : 0;
  }

  private analyzePricePreferences(views: any[]): { min: number; max: number } {
    const prices = views.map(v => parseFloat(v.metadata?.price || '0')).filter(p => p > 0);
    if (prices.length === 0) return { min: 0, max: 1000 };
    
    prices.sort((a, b) => a - b);
    const q1 = prices[Math.floor(prices.length * 0.25)];
    const q3 = prices[Math.floor(prices.length * 0.75)];
    
    return { min: q1 * 0.8, max: q3 * 1.2 };
  }

  private calculateEngagementScore(views: any[], cartEvents: any[]): number {
    let score = 0;
    score += Math.min(views.length * 2, 20); // Max 20 for views
    score += Math.min(cartEvents.length * 10, 30); // Max 30 for cart actions
    score += Math.min(this.calculateAvgSessionDuration(views) * 2, 50); // Max 50 for duration
    return Math.min(100, score);
  }
}

export const storefrontEngine = new StorefrontEngine();