import { DatabaseStorage } from "../../storage";
import { 
  profitForecastModels, 
  profitForecasts,
  revenueSplitTransactions,
  revenueSplitPartners,
  type InsertProfitForecastModel,
  type InsertProfitForecast,
  type ProfitForecastModel,
  type ProfitForecast
} from "../../../shared/revenueSplitTables";
import { and, eq, gte, lte, desc, sum, count, avg } from "drizzle-orm";
import { db } from "../../db";

export interface ForecastPrediction {
  date: string;
  revenue: number;
  commissions: number;
  netProfit: number;
  confidence: {
    lower: number;
    upper: number;
  };
}

export interface ScenarioAnalysis {
  bestCase: {
    revenue: number;
    growth: number;
    probability: number;
  };
  mostLikely: {
    revenue: number;
    growth: number;
    probability: number;
  };
  worstCase: {
    revenue: number;
    growth: number;
    probability: number;
  };
}

export interface ForecastResult {
  forecastId: string;
  modelId: number;
  period: { start: Date; end: Date };
  predictions: ForecastPrediction[];
  totalRevenueForecast: number;
  partnerSplitForecast: number;
  netProfitForecast: number;
  scenarioAnalysis: ScenarioAnalysis;
  riskFactors: string[];
  accuracy: number;
}

export interface HistoricalData {
  date: Date;
  revenue: number;
  commissions: number;
  transactions: number;
  partners: number;
  averageOrderValue: number;
  conversionRate: number;
}

export class ProfitForecastEngine {
  private storage: DatabaseStorage;
  private defaultModel: ProfitForecastModel | null = null;

  constructor(storage: DatabaseStorage) {
    this.storage = storage;
  }

  /**
   * Initialize the forecast engine with default models
   */
  async initialize(): Promise<void> {
    try {
      // Check if default model exists
      const existingModels = await db.select()
        .from(profitForecastModels)
        .where(eq(profitForecastModels.isDefault, true))
        .limit(1);

      if (existingModels.length === 0) {
        // Create default linear regression model
        await this.createDefaultModel();
      } else {
        this.defaultModel = existingModels[0];
      }

      console.log('✅ Profit Forecast Engine initialized');

    } catch (error) {
      console.error('❌ Error initializing Profit Forecast Engine:', error);
    }
  }

  /**
   * Create default forecasting model
   */
  private async createDefaultModel(): Promise<void> {
    try {
      const modelData: InsertProfitForecastModel = {
        modelId: `default_linear_${Date.now()}`,
        modelName: 'Default Linear Regression Model',
        modelType: 'linear_regression',
        forecastHorizon: 90,
        historicalPeriod: 365,
        dataFeatures: [
          'revenue_trend',
          'seasonality',
          'partner_count',
          'transaction_volume',
          'average_order_value'
        ],
        targetMetrics: [
          'total_revenue',
          'commission_payouts',
          'net_profit'
        ],
        modelParameters: JSON.stringify({
          algorithm: 'linear_regression',
          features: ['revenue', 'commissions', 'transactions', 'seasonality'],
          smoothing: 0.1,
          trend_weight: 0.3,
          seasonal_weight: 0.2
        }),
        hyperparameters: JSON.stringify({
          learning_rate: 0.01,
          regularization: 0.001,
          validation_split: 0.2
        }),
        status: 'active',
        isDefault: true,
        trainingFrequency: 'weekly'
      };

      const [model] = await db.insert(profitForecastModels).values(modelData).returning();
      this.defaultModel = model;

      console.log('✅ Created default profit forecast model');

    } catch (error) {
      console.error('❌ Error creating default model:', error);
    }
  }

  /**
   * Generate revenue forecast for a given period
   */
  async generateForecast(
    forecastDays: number = 90,
    scope?: {
      partnerId?: number;
      vertical?: string;
      productCategory?: string;
    }
  ): Promise<ForecastResult | null> {
    try {
      if (!this.defaultModel) {
        await this.initialize();
        if (!this.defaultModel) {
          throw new Error('No forecasting model available');
        }
      }

      // Get historical data
      const historicalData = await this.getHistoricalData(
        this.defaultModel.historicalPeriod || 365,
        scope
      );

      if (historicalData.length < 30) {
        console.warn('⚠️ Insufficient historical data for accurate forecast');
      }

      // Generate predictions using linear regression
      const predictions = this.generateLinearRegressionForecast(
        historicalData,
        forecastDays
      );

      // Calculate scenario analysis
      const scenarioAnalysis = this.calculateScenarioAnalysis(predictions, historicalData);

      // Identify risk factors
      const riskFactors = this.identifyRiskFactors(historicalData, predictions);

      // Calculate aggregated metrics
      const totalRevenueForecast = predictions.reduce((sum, p) => sum + p.revenue, 0);
      const partnerSplitForecast = predictions.reduce((sum, p) => sum + p.commissions, 0);
      const netProfitForecast = predictions.reduce((sum, p) => sum + p.netProfit, 0);

      // Create forecast record
      const forecastId = `forecast_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(startDate.getDate() + forecastDays);

      const forecastData: InsertProfitForecast = {
        forecastId,
        modelId: this.defaultModel.id,
        modelVersion: this.defaultModel.version || '1.0',
        forecastType: scope?.partnerId ? 'partner' : scope?.vertical ? 'vertical' : 'overall',
        scope: JSON.stringify(scope || {}),
        forecastPeriod: JSON.stringify({ start: startDate, end: endDate }),
        predictions: JSON.stringify(predictions),
        confidence: JSON.stringify({
          method: 'linear_regression',
          averageConfidence: predictions.reduce((sum, p) => 
            sum + (p.confidence.upper - p.confidence.lower), 0) / predictions.length
        }),
        seasonalFactors: JSON.stringify(this.extractSeasonalFactors(historicalData)),
        trendAnalysis: JSON.stringify(this.analyzeTrends(historicalData)),
        totalRevenueForecast: totalRevenueForecast.toString(),
        partnerSplitForecast: partnerSplitForecast.toString(),
        netProfitForecast: netProfitForecast.toString(),
        riskFactors: JSON.stringify(riskFactors),
        scenarioAnalysis: JSON.stringify(scenarioAnalysis),
        volatilityMetrics: JSON.stringify(this.calculateVolatility(historicalData)),
        accuracyScore: this.calculateModelAccuracy(historicalData)
      };

      await db.insert(profitForecasts).values(forecastData);

      console.log(`📈 Generated profit forecast: ${forecastDays} days, Revenue: $${totalRevenueForecast.toFixed(2)}`);

      return {
        forecastId,
        modelId: this.defaultModel.id,
        period: { start: startDate, end: endDate },
        predictions,
        totalRevenueForecast,
        partnerSplitForecast,
        netProfitForecast,
        scenarioAnalysis,
        riskFactors,
        accuracy: forecastData.accuracyScore || 0
      };

    } catch (error) {
      console.error('❌ Error generating forecast:', error);
      return null;
    }
  }

  /**
   * Get historical revenue data for forecasting
   */
  private async getHistoricalData(
    days: number,
    scope?: {
      partnerId?: number;
      vertical?: string;
      productCategory?: string;
    }
  ): Promise<HistoricalData[]> {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - days);

      const whereClause = [
        gte(revenueSplitTransactions.transactionDate, startDate),
        lte(revenueSplitTransactions.transactionDate, endDate)
      ];

      if (scope?.partnerId) {
        whereClause.push(eq(revenueSplitTransactions.partnerId, scope.partnerId));
      }
      if (scope?.vertical) {
        whereClause.push(eq(revenueSplitTransactions.vertical, scope.vertical));
      }
      if (scope?.productCategory) {
        whereClause.push(eq(revenueSplitTransactions.productCategory, scope.productCategory));
      }

      // Get daily aggregated data
      const dailyData = await db.select({
        date: revenueSplitTransactions.transactionDate,
        revenue: sum(revenueSplitTransactions.originalAmount),
        commissions: sum(revenueSplitTransactions.commissionAmount),
        transactions: count(revenueSplitTransactions.id),
        averageOrderValue: avg(revenueSplitTransactions.originalAmount)
      })
      .from(revenueSplitTransactions)
      .where(and(...whereClause))
      .groupBy(revenueSplitTransactions.transactionDate)
      .orderBy(revenueSplitTransactions.transactionDate);

      // Convert to HistoricalData format and fill gaps
      const dataMap = new Map<string, HistoricalData>();
      
      for (const row of dailyData) {
        const dateKey = row.date?.toISOString().split('T')[0] || '';
        dataMap.set(dateKey, {
          date: row.date || new Date(),
          revenue: parseFloat(row.revenue || '0'),
          commissions: parseFloat(row.commissions || '0'),
          transactions: parseInt(row.transactions?.toString() || '0'),
          partners: 1, // Simplified - would need separate query for accurate count
          averageOrderValue: parseFloat(row.averageOrderValue?.toString() || '0'),
          conversionRate: 0 // Would need click data to calculate accurately
        });
      }

      // Fill missing days with zero values
      const result: HistoricalData[] = [];
      const currentDate = new Date(startDate);
      
      while (currentDate <= endDate) {
        const dateKey = currentDate.toISOString().split('T')[0];
        const data = dataMap.get(dateKey) || {
          date: new Date(currentDate),
          revenue: 0,
          commissions: 0,
          transactions: 0,
          partners: 0,
          averageOrderValue: 0,
          conversionRate: 0
        };
        
        result.push(data);
        currentDate.setDate(currentDate.getDate() + 1);
      }

      return result;

    } catch (error) {
      console.error('❌ Error getting historical data:', error);
      return [];
    }
  }

  /**
   * Generate linear regression forecast
   */
  private generateLinearRegressionForecast(
    historicalData: HistoricalData[],
    forecastDays: number
  ): ForecastPrediction[] {
    const predictions: ForecastPrediction[] = [];

    try {
      if (historicalData.length === 0) {
        return predictions;
      }

      // Calculate trend using simple linear regression
      const n = historicalData.length;
      let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;

      historicalData.forEach((data, index) => {
        sumX += index;
        sumY += data.revenue;
        sumXY += index * data.revenue;
        sumXX += index * index;
      });

      const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
      const intercept = (sumY - slope * sumX) / n;

      // Calculate seasonal factors (simplified)
      const seasonalFactors = this.calculateSeasonalFactors(historicalData);

      // Generate predictions
      const lastDate = historicalData[historicalData.length - 1]?.date || new Date();
      
      for (let i = 1; i <= forecastDays; i++) {
        const forecastDate = new Date(lastDate);
        forecastDate.setDate(lastDate.getDate() + i);

        // Base trend prediction
        const basePrediction = intercept + slope * (n + i);
        
        // Apply seasonal adjustment
        const dayOfWeek = forecastDate.getDay();
        const seasonalAdjustment = seasonalFactors[dayOfWeek] || 1;
        
        const adjustedRevenue = Math.max(0, basePrediction * seasonalAdjustment);
        
        // Calculate commissions (assume average rate from historical data)
        const avgCommissionRate = this.calculateAverageCommissionRate(historicalData);
        const commissions = adjustedRevenue * avgCommissionRate;
        const netProfit = adjustedRevenue - commissions;

        // Calculate confidence intervals (simplified)
        const variance = this.calculateVariance(historicalData);
        const standardError = Math.sqrt(variance / n);
        const confidenceRange = standardError * 1.96; // 95% confidence

        predictions.push({
          date: forecastDate.toISOString().split('T')[0],
          revenue: adjustedRevenue,
          commissions,
          netProfit,
          confidence: {
            lower: Math.max(0, adjustedRevenue - confidenceRange),
            upper: adjustedRevenue + confidenceRange
          }
        });
      }

    } catch (error) {
      console.error('❌ Error generating linear regression forecast:', error);
    }

    return predictions;
  }

  /**
   * Calculate seasonal factors from historical data
   */
  private calculateSeasonalFactors(historicalData: HistoricalData[]): number[] {
    const dayOfWeekTotals = new Array(7).fill(0);
    const dayOfWeekCounts = new Array(7).fill(0);

    historicalData.forEach(data => {
      const dayOfWeek = data.date.getDay();
      dayOfWeekTotals[dayOfWeek] += data.revenue;
      dayOfWeekCounts[dayOfWeek]++;
    });

    const averages = dayOfWeekTotals.map((total, i) => 
      dayOfWeekCounts[i] > 0 ? total / dayOfWeekCounts[i] : 0
    );

    const overallAverage = averages.reduce((sum, avg) => sum + avg, 0) / 7;

    return averages.map(avg => overallAverage > 0 ? avg / overallAverage : 1);
  }

  /**
   * Calculate average commission rate from historical data
   */
  private calculateAverageCommissionRate(historicalData: HistoricalData[]): number {
    const totalRevenue = historicalData.reduce((sum, data) => sum + data.revenue, 0);
    const totalCommissions = historicalData.reduce((sum, data) => sum + data.commissions, 0);
    
    return totalRevenue > 0 ? totalCommissions / totalRevenue : 0.1; // Default 10%
  }

  /**
   * Calculate variance for confidence intervals
   */
  private calculateVariance(historicalData: HistoricalData[]): number {
    const revenues = historicalData.map(data => data.revenue);
    const mean = revenues.reduce((sum, revenue) => sum + revenue, 0) / revenues.length;
    const squaredDifferences = revenues.map(revenue => Math.pow(revenue - mean, 2));
    
    return squaredDifferences.reduce((sum, diff) => sum + diff, 0) / revenues.length;
  }

  /**
   * Generate scenario analysis (best case, worst case, most likely)
   */
  private calculateScenarioAnalysis(
    predictions: ForecastPrediction[],
    historicalData: HistoricalData[]
  ): ScenarioAnalysis {
    const totalPredictedRevenue = predictions.reduce((sum, p) => sum + p.revenue, 0);
    const historicalTrend = this.calculateGrowthTrend(historicalData);

    return {
      bestCase: {
        revenue: totalPredictedRevenue * 1.3, // 30% above prediction
        growth: historicalTrend * 1.5,
        probability: 0.15
      },
      mostLikely: {
        revenue: totalPredictedRevenue,
        growth: historicalTrend,
        probability: 0.70
      },
      worstCase: {
        revenue: totalPredictedRevenue * 0.7, // 30% below prediction
        growth: historicalTrend * 0.5,
        probability: 0.15
      }
    };
  }

  /**
   * Calculate growth trend from historical data
   */
  private calculateGrowthTrend(historicalData: HistoricalData[]): number {
    if (historicalData.length < 2) return 0;

    const firstPeriod = historicalData.slice(0, historicalData.length / 2);
    const secondPeriod = historicalData.slice(historicalData.length / 2);

    const firstPeriodAvg = firstPeriod.reduce((sum, d) => sum + d.revenue, 0) / firstPeriod.length;
    const secondPeriodAvg = secondPeriod.reduce((sum, d) => sum + d.revenue, 0) / secondPeriod.length;

    return firstPeriodAvg > 0 ? ((secondPeriodAvg - firstPeriodAvg) / firstPeriodAvg) * 100 : 0;
  }

  /**
   * Identify risk factors based on data analysis
   */
  private identifyRiskFactors(
    historicalData: HistoricalData[],
    predictions: ForecastPrediction[]
  ): string[] {
    const risks: string[] = [];

    try {
      // Check for high volatility
      const variance = this.calculateVariance(historicalData);
      const avgRevenue = historicalData.reduce((sum, d) => sum + d.revenue, 0) / historicalData.length;
      const coefficientOfVariation = avgRevenue > 0 ? Math.sqrt(variance) / avgRevenue : 0;

      if (coefficientOfVariation > 0.3) {
        risks.push('High revenue volatility detected - forecasts may be less reliable');
      }

      // Check for declining trend
      const trend = this.calculateGrowthTrend(historicalData);
      if (trend < -10) {
        risks.push('Declining revenue trend - negative growth may continue');
      }

      // Check for seasonal dependencies
      const seasonality = this.calculateSeasonalFactors(historicalData);
      const seasonalVariation = Math.max(...seasonality) - Math.min(...seasonality);
      if (seasonalVariation > 0.5) {
        risks.push('High seasonal variation - performance heavily dependent on timing');
      }

      // Check for partner concentration risk
      // This would require additional data about partner distribution
      risks.push('Partner concentration risk - performance may depend on few key partners');

      // Check data quality
      if (historicalData.length < 90) {
        risks.push('Limited historical data - forecast accuracy may be reduced');
      }

    } catch (error) {
      console.error('❌ Error identifying risk factors:', error);
      risks.push('Unable to assess all risk factors due to data processing errors');
    }

    return risks;
  }

  /**
   * Extract seasonal factors for analysis
   */
  private extractSeasonalFactors(historicalData: HistoricalData[]): any {
    const factors = this.calculateSeasonalFactors(historicalData);
    
    return {
      dayOfWeek: factors,
      peakDay: factors.indexOf(Math.max(...factors)),
      lowDay: factors.indexOf(Math.min(...factors)),
      seasonalStrength: Math.max(...factors) - Math.min(...factors)
    };
  }

  /**
   * Analyze trends in historical data
   */
  private analyzeTrends(historicalData: HistoricalData[]): any {
    const growthTrend = this.calculateGrowthTrend(historicalData);
    const recentTrend = this.calculateGrowthTrend(historicalData.slice(-30)); // Last 30 days

    return {
      overallGrowth: growthTrend,
      recentGrowth: recentTrend,
      trendDirection: growthTrend > 0 ? 'positive' : growthTrend < 0 ? 'negative' : 'flat',
      momentum: recentTrend > growthTrend ? 'accelerating' : recentTrend < growthTrend ? 'decelerating' : 'stable'
    };
  }

  /**
   * Calculate volatility metrics
   */
  private calculateVolatility(historicalData: HistoricalData[]): any {
    const variance = this.calculateVariance(historicalData);
    const avgRevenue = historicalData.reduce((sum, d) => sum + d.revenue, 0) / historicalData.length;
    const standardDeviation = Math.sqrt(variance);
    const coefficientOfVariation = avgRevenue > 0 ? standardDeviation / avgRevenue : 0;

    return {
      variance,
      standardDeviation,
      coefficientOfVariation,
      volatilityLevel: coefficientOfVariation > 0.3 ? 'high' : coefficientOfVariation > 0.15 ? 'medium' : 'low'
    };
  }

  /**
   * Calculate model accuracy based on historical performance
   */
  private calculateModelAccuracy(historicalData: HistoricalData[]): number {
    // Simplified accuracy calculation
    // In a real implementation, this would compare previous predictions with actual results
    
    if (historicalData.length < 30) {
      return 0.6; // Low confidence due to insufficient data
    }
    
    const variance = this.calculateVariance(historicalData);
    const avgRevenue = historicalData.reduce((sum, d) => sum + d.revenue, 0) / historicalData.length;
    const coefficientOfVariation = avgRevenue > 0 ? Math.sqrt(variance) / avgRevenue : 1;
    
    // Higher variation = lower accuracy
    const baseAccuracy = Math.max(0.5, 1 - coefficientOfVariation);
    
    // Adjust based on data quality
    const dataQualityFactor = Math.min(1, historicalData.length / 90);
    
    return Math.min(0.95, baseAccuracy * dataQualityFactor);
  }

  /**
   * Get existing forecast by ID
   */
  async getForecast(forecastId: string): Promise<ProfitForecast | null> {
    try {
      const forecasts = await db.select()
        .from(profitForecasts)
        .where(eq(profitForecasts.forecastId, forecastId))
        .limit(1);

      return forecasts.length > 0 ? forecasts[0] : null;

    } catch (error) {
      console.error('❌ Error getting forecast:', error);
      return null;
    }
  }

  /**
   * Get all forecasts for a period
   */
  async getRecentForecasts(days: number = 30): Promise<ProfitForecast[]> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      return await db.select()
        .from(profitForecasts)
        .where(gte(profitForecasts.generatedAt, cutoffDate))
        .orderBy(desc(profitForecasts.generatedAt));

    } catch (error) {
      console.error('❌ Error getting recent forecasts:', error);
      return [];
    }
  }

  /**
   * Simulate "what if" scenarios
   */
  async simulateScenario(scenarioParams: {
    partnerChanges?: Array<{ partnerId: number; commissionRateChange: number; }>;
    offerChanges?: Array<{ category: string; volumeChange: number; }>;
    marketConditions?: 'growth' | 'stable' | 'decline';
    timeFrame?: number;
  }): Promise<ForecastResult | null> {
    try {
      // Generate base forecast
      const baseForecast = await this.generateForecast(scenarioParams.timeFrame || 90);
      if (!baseForecast) return null;

      // Apply scenario modifications
      let modifiedPredictions = [...baseForecast.predictions];

      // Apply market conditions
      if (scenarioParams.marketConditions) {
        const marketMultiplier = {
          'growth': 1.2,
          'stable': 1.0,
          'decline': 0.8
        }[scenarioParams.marketConditions];

        modifiedPredictions = modifiedPredictions.map(p => ({
          ...p,
          revenue: p.revenue * marketMultiplier,
          commissions: p.commissions * marketMultiplier,
          netProfit: p.netProfit * marketMultiplier
        }));
      }

      // Apply partner commission changes
      if (scenarioParams.partnerChanges) {
        const avgCommissionChange = scenarioParams.partnerChanges.reduce(
          (sum, change) => sum + change.commissionRateChange, 0
        ) / scenarioParams.partnerChanges.length;

        modifiedPredictions = modifiedPredictions.map(p => {
          const newCommissions = p.commissions * (1 + avgCommissionChange / 100);
          return {
            ...p,
            commissions: newCommissions,
            netProfit: p.revenue - newCommissions
          };
        });
      }

      // Recalculate totals
      const totalRevenueForecast = modifiedPredictions.reduce((sum, p) => sum + p.revenue, 0);
      const partnerSplitForecast = modifiedPredictions.reduce((sum, p) => sum + p.commissions, 0);
      const netProfitForecast = modifiedPredictions.reduce((sum, p) => sum + p.netProfit, 0);

      return {
        ...baseForecast,
        forecastId: `scenario_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        predictions: modifiedPredictions,
        totalRevenueForecast,
        partnerSplitForecast,
        netProfitForecast
      };

    } catch (error) {
      console.error('❌ Error simulating scenario:', error);
      return null;
    }
  }
}