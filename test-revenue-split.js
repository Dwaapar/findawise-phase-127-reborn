#!/usr/bin/env node

// Empire-Grade Revenue Split Manager Integration Test
// Tests the complete revenue split system without port conflicts

const { storage } = require('./server/storage.ts');
const { RevenueSplitManager } = require('./server/services/revenueSplit/revenueSplitManager.ts');
const { ProfitForecastEngine } = require('./server/services/revenueSplit/profitForecastEngine.ts');

async function testRevenueSplitIntegration() {
  console.log('🧪 Testing Revenue Split Manager Integration...');
  
  try {
    // Test 1: Initialize services
    console.log('📝 Test 1: Service initialization...');
    const revenueSplitManager = new RevenueSplitManager(storage);
    const profitForecastEngine = new ProfitForecastEngine(storage);
    
    await profitForecastEngine.initialize();
    console.log('✅ Services initialized successfully');
    
    // Test 2: Test affiliate partners integration
    console.log('📝 Test 2: Affiliate partners integration...');
    const affiliatePartners = await storage.getAffiliatePartners();
    console.log(`✅ Found ${affiliatePartners.length} affiliate partners`);
    
    // Test 3: Test revenue split processing
    console.log('📝 Test 3: Revenue split calculation...');
    const testTransaction = {
      orderId: 'test-order-123',
      affiliateCode: 'test-affiliate',
      originalAmount: 100.00,
      currency: 'USD',
      vertical: 'finance',
      productCategory: 'calculator',
      productId: 1,
      productName: 'Budget Calculator Pro',
      customerSegment: 'premium',
      customerCountry: 'US',
      isNewCustomer: true
    };
    
    const splitResults = await revenueSplitManager.processRevenueSplit(testTransaction);
    console.log(`✅ Revenue split calculated: ${splitResults.length} splits generated`);
    
    // Test 4: Test profit forecasting
    console.log('📝 Test 4: Profit forecasting...');
    const forecastData = await profitForecastEngine.generateForecast({
      timeframe: '3_months',
      vertical: 'finance',
      includeSeasonality: true
    });
    console.log('✅ Profit forecast generated successfully');
    console.log(`   Predicted revenue: $${forecastData.predictedRevenue}`);
    console.log(`   Confidence level: ${forecastData.confidenceLevel}%`);
    
    // Test 5: Test analytics integration
    console.log('📝 Test 5: Analytics integration...');
    const analytics = await revenueSplitManager.getRevenueAnalytics({
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      endDate: new Date(),
      partnerId: null,
      vertical: null
    });
    console.log('✅ Revenue analytics generated successfully');
    console.log(`   Total revenue: $${analytics.totalRevenue}`);
    console.log(`   Total partners: ${analytics.uniquePartners}`);
    
    console.log('\n🎉 All Revenue Split Integration Tests PASSED!');
    console.log('✅ Empire-Grade Revenue Split Manager & Profit Forecast Engine fully operational');
    
    return true;
    
  } catch (error) {
    console.error('❌ Revenue Split Integration Test FAILED:', error);
    return false;
  }
}

// Run the test
if (require.main === module) {
  testRevenueSplitIntegration()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Test execution failed:', error);
      process.exit(1);
    });
}

module.exports = { testRevenueSplitIntegration };