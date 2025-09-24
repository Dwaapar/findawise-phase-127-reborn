import { db } from "../server/db";
import { offerSources, offerFeed, offerComplianceRules } from "@shared/offerEngineTables";

async function seedOffers() {
  console.log("🌱 Seeding billion-dollar empire grade offers...");

  try {
    // 1. Create premium affiliate sources
    const sources = [
      {
        slug: "amazon-prime-deals",
        name: "Amazon Prime Exclusive Offers",
        type: "api" as const,
        description: "High-converting Amazon Prime member exclusive deals",
        baseUrl: "https://webservices.amazon.com/paapi5",
        apiConfig: {
          region: "US",
          trackingId: "findawise-20",
          productTypes: ["Electronics", "Books", "Software"]
        },
        syncFrequency: "hourly",
        isActive: true
      },
      {
        slug: "clickfunnels-platinum",
        name: "ClickFunnels Platinum Network",
        type: "affiliate" as const,
        description: "Premium marketing funnel and software offers",
        baseUrl: "https://affiliates.clickfunnels.com",
        apiConfig: {
          commissionType: "percentage",
          averageCommission: 40
        },
        syncFrequency: "daily",
        isActive: true
      },
      {
        slug: "saas-directory-premium",
        name: "Premium SaaS Directory",
        type: "curated" as const,
        description: "Hand-selected high-converting SaaS tools",
        baseUrl: "https://api.saasverse.com",
        apiConfig: {
          categories: ["Marketing", "Sales", "Productivity", "Finance"],
          minRating: 4.5
        },
        syncFrequency: "twice_daily",
        isActive: true
      }
    ];

    const insertedSources = [];
    for (const source of sources) {
      const [inserted] = await db.insert(offerSources).values(source).returning();
      insertedSources.push(inserted);
      console.log(`✅ Created source: ${source.name}`);
    }

    // 2. Create billion-dollar grade offers
    const premiumOffers = [
      // Amazon Premium Electronics
      {
        sourceId: insertedSources[0].id,
        title: "MacBook Pro M3 - Limited Time Deal",
        slug: "macbook-pro-m3-deal",
        merchant: "Amazon",
        price: 1799.99,
        oldPrice: 2199.99,
        currency: "USD",
        couponCode: "TECH25",
        discountType: "percentage",
        discountValue: 18.2,
        validTill: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        region: "US",
        emotion: "exclusive",
        category: "electronics",
        tags: ["laptop", "apple", "professional", "limited-time"],
        sourceType: "api",
        clickTrackingUrl: "https://amzn.to/macbook-pro-m3",
        apiSource: "amazon-prime-deals",
        commissionEstimate: 89.99,
        meta: {
          asin: "B0CM5JV268",
          rating: 4.8,
          reviews: 12847,
          isPrime: true,
          category: "Electronics",
          brand: "Apple"
        },
        llmSummary: "Professional-grade MacBook Pro with M3 chip, perfect for developers and creators. Exclusive Prime member pricing with free next-day delivery.",
        intentEmbedding: { vector: [0.92, 0.87, 0.94, 0.89], confidence: 0.95 },
        qualityScore: 96,
        ctr: 12.4,
        conversionRate: 8.7,
        isActive: true,
        isFeatured: true,
        priority: 10
      },
      // ClickFunnels High-Converting Offer
      {
        sourceId: insertedSources[1].id,
        title: "ClickFunnels 2.0 - 14-Day Free Trial + Bonuses Worth $2,997",
        slug: "clickfunnels-2-trial-bonuses",
        merchant: "ClickFunnels",
        price: 97.00,
        oldPrice: 297.00,
        currency: "USD",
        discountType: "trial",
        validTill: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        region: "Global",
        emotion: "urgent",
        category: "software",
        tags: ["marketing", "funnels", "saas", "trial", "bonus"],
        sourceType: "affiliate",
        clickTrackingUrl: "https://bit.ly/clickfunnels-empire-trial",
        apiSource: "clickfunnels-platinum",
        commissionEstimate: 38.80, // 40% commission
        meta: {
          productType: "Marketing Software",
          trialDuration: 14,
          bonusValue: 2997,
          conversionTracking: true
        },
        llmSummary: "Complete sales funnel builder with drag-and-drop editor, A/B testing, and email automation. Industry-leading 40% commission rate.",
        intentEmbedding: { vector: [0.89, 0.93, 0.91, 0.88], confidence: 0.92 },
        qualityScore: 94,
        ctr: 15.2,
        conversionRate: 12.1,
        isActive: true,
        isFeatured: true,
        priority: 10
      },
      // Premium Finance Tool
      {
        sourceId: insertedSources[2].id,
        title: "QuickBooks Online Advanced - 50% Off First 6 Months",
        slug: "quickbooks-advanced-50-off",
        merchant: "Intuit",
        price: 90.00,
        oldPrice: 180.00,
        currency: "USD",
        couponCode: "SAVE50NOW",
        discountType: "percentage",
        discountValue: 50,
        validTill: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
        region: "US",
        emotion: "trusted",
        category: "finance",
        tags: ["accounting", "business", "quickbooks", "discount"],
        sourceType: "partner",
        clickTrackingUrl: "https://qbo.intuit.com/empire-50off",
        apiSource: "saas-directory-premium",
        commissionEstimate: 45.00,
        meta: {
          softwareType: "Accounting",
          businessSize: "SMB",
          features: ["Advanced Reporting", "Inventory Tracking", "Custom User Permissions"],
          rating: 4.7
        },
        llmSummary: "Professional accounting software for growing businesses. Includes advanced reporting, inventory management, and multi-user access.",
        intentEmbedding: { vector: [0.86, 0.91, 0.87, 0.90], confidence: 0.88 },
        qualityScore: 91,
        ctr: 9.8,
        conversionRate: 15.3,
        isActive: true,
        isFeatured: false,
        priority: 8
      },
      // High-Converting Health & Wellness
      {
        sourceId: insertedSources[0].id,
        title: "Fitbit Sense 2 Health & Fitness Smartwatch - 30% Off",
        slug: "fitbit-sense-2-health-tracker",
        merchant: "Amazon",
        price: 199.95,
        oldPrice: 299.95,
        currency: "USD",
        discountType: "percentage",
        discountValue: 33.3,
        validTill: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days
        region: "Global",
        emotion: "popular",
        category: "health",
        tags: ["fitness", "smartwatch", "health", "tracking"],
        sourceType: "api",
        clickTrackingUrl: "https://amzn.to/fitbit-sense2-deal",
        apiSource: "amazon-prime-deals",
        commissionEstimate: 12.00,
        meta: {
          asin: "B0B4MWCFV4",
          rating: 4.4,
          reviews: 8924,
          isPrime: true,
          category: "Health & Fitness",
          brand: "Fitbit"
        },
        llmSummary: "Advanced health monitoring smartwatch with stress management, sleep tracking, and 6+ day battery life. Perfect for health-conscious individuals.",
        intentEmbedding: { vector: [0.84, 0.88, 0.82, 0.87], confidence: 0.85 },
        qualityScore: 88,
        ctr: 11.7,
        conversionRate: 7.9,
        isActive: true,
        isFeatured: false,
        priority: 7
      },
      // Premium Education Course
      {
        sourceId: insertedSources[1].id,
        title: "Complete Digital Marketing Mastery Course - 85% Off Launch Price",
        slug: "digital-marketing-mastery-course",
        merchant: "MasterClass Pro",
        price: 49.00,
        oldPrice: 329.00,
        currency: "USD",
        discountType: "launch_special",
        validTill: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days
        region: "Global",
        emotion: "exclusive",
        category: "education",
        tags: ["course", "marketing", "digital", "masterclass", "launch"],
        sourceType: "direct",
        clickTrackingUrl: "https://digitalmastery.pro/empire-launch",
        apiSource: "direct-partnerships",
        commissionEstimate: 24.50, // 50% commission
        meta: {
          courseLength: "12 hours",
          modules: 47,
          certificateIncluded: true,
          instructor: "Sarah Chen",
          rating: 4.9,
          students: 15420
        },
        llmSummary: "Comprehensive digital marketing course covering SEO, PPC, social media, email marketing, and analytics. Taught by industry expert with proven results.",
        intentEmbedding: { vector: [0.91, 0.85, 0.89, 0.92], confidence: 0.90 },
        qualityScore: 95,
        ctr: 18.5,
        conversionRate: 14.2,
        isActive: true,
        isFeatured: true,
        priority: 9
      }
    ];

    // Insert all premium offers
    for (const offer of premiumOffers) {
      await db.insert(offerFeed).values(offer);
      console.log(`✅ Created premium offer: ${offer.title}`);
    }

    // 3. Initialize compliance rules
    const complianceRules = [
      {
        name: "Amazon TOS Compliance",
        description: "Ensures compliance with Amazon affiliate program terms",
        ruleType: "merchant",
        conditions: {
          requiredDisclosure: true,
          blacklistedTerms: ["guaranteed", "miracle", "secret formula"]
        },
        action: "require_disclosure",
        severity: "high",
        isActive: true
      },
      {
        name: "FTC Affiliate Disclosure",
        description: "FTC-compliant affiliate link disclosures",
        ruleType: "content",
        conditions: {
          requiresDisclosure: true,
          disclosureText: "This post contains affiliate links. We may earn a commission if you make a purchase."
        },
        action: "require_disclosure",
        severity: "critical",
        isActive: true
      },
      {
        name: "Price Accuracy Standards",
        description: "Prevents unrealistic discount claims",
        ruleType: "price",
        conditions: {
          maxDiscountPercentage: 90,
          requirePriceVerification: true
        },
        action: "flag",
        severity: "medium",
        isActive: true
      }
    ];

    for (const rule of complianceRules) {
      await db.insert(offerComplianceRules).values(rule);
      console.log(`✅ Created compliance rule: ${rule.name}`);
    }

    console.log("\n🎯 BILLION-DOLLAR EMPIRE GRADE OFFERS SEEDED SUCCESSFULLY!");
    console.log(`📊 Summary:`);
    console.log(`   • ${sources.length} premium affiliate sources created`);
    console.log(`   • ${premiumOffers.length} high-converting offers seeded`);
    console.log(`   • ${complianceRules.length} compliance rules initialized`);
    console.log(`   • Total estimated revenue potential: $${premiumOffers.reduce((sum, o) => sum + o.commissionEstimate, 0).toFixed(2)}`);
    console.log(`\n💰 Ready for billion-dollar empire monetization!`);

  } catch (error) {
    console.error("❌ Error seeding offers:", error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedOffers().then(() => process.exit(0));
}

export { seedOffers };