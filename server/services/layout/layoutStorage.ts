/**
 * Layout Storage Service
 * Billion-Dollar Empire Grade - Database operations for layout management
 */

import { db } from '../../db';
import {
  layoutTemplates,
  layoutInstances,
  layoutMutations,
  layoutAnalytics,
  layoutPersonalization,
  userLayoutPreferences,
  layoutAbTests,
  type LayoutTemplate,
  type LayoutInstance,
  type LayoutMutation,
  type NewLayoutTemplate,
  type NewLayoutInstance,
  type NewLayoutMutation,
  type NewLayoutAnalytics,
  type NewLayoutPersonalization,
  type NewUserLayoutPreference,
  type NewLayoutAbTest
} from '../../../shared/layoutTables';
import { eq, desc, and, gte, lte, sql } from 'drizzle-orm';

export class LayoutStorageService {
  
  /**
   * Template Management
   */
  async createTemplate(templateData: NewLayoutTemplate): Promise<LayoutTemplate> {
    const [template] = await db.insert(layoutTemplates).values(templateData).returning();
    return template;
  }

  async getTemplate(templateId: string): Promise<LayoutTemplate | null> {
    const templates = await db.select().from(layoutTemplates)
      .where(eq(layoutTemplates.id, templateId));
    return templates[0] || null;
  }

  async getTemplates(filters: {
    category?: string;
    active?: boolean;
    limit?: number;
  } = {}): Promise<LayoutTemplate[]> {
    let query = db.select().from(layoutTemplates);
    
    const conditions = [];
    if (filters.category) {
      conditions.push(eq(layoutTemplates.category, filters.category));
    }
    if (filters.active !== undefined) {
      conditions.push(eq(layoutTemplates.isActive, filters.active));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    query = query.orderBy(desc(layoutTemplates.createdAt));

    if (filters.limit) {
      query = query.limit(filters.limit);
    }

    return await query;
  }

  async updateTemplate(templateId: string, updates: Partial<NewLayoutTemplate>): Promise<LayoutTemplate | null> {
    const [updated] = await db.update(layoutTemplates)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(layoutTemplates.id, templateId))
      .returning();
    return updated || null;
  }

  async deleteTemplate(templateId: string): Promise<boolean> {
    const result = await db.update(layoutTemplates)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(layoutTemplates.id, templateId));
    return result.rowCount > 0;
  }

  /**
   * Instance Management
   */
  async createInstance(instanceData: NewLayoutInstance): Promise<LayoutInstance> {
    const [instance] = await db.insert(layoutInstances).values(instanceData).returning();
    return instance;
  }

  async getInstance(instanceId: string): Promise<LayoutInstance | null> {
    const instances = await db.select().from(layoutInstances)
      .where(eq(layoutInstances.id, instanceId));
    return instances[0] || null;
  }

  async getInstancesBySession(sessionId: string): Promise<LayoutInstance[]> {
    return await db.select().from(layoutInstances)
      .where(eq(layoutInstances.sessionId, sessionId))
      .orderBy(desc(layoutInstances.generatedAt));
  }

  async getInstancesByUser(userId: string): Promise<LayoutInstance[]> {
    return await db.select().from(layoutInstances)
      .where(eq(layoutInstances.userId, userId))
      .orderBy(desc(layoutInstances.generatedAt));
  }

  async updateInstance(instanceId: string, updates: Partial<NewLayoutInstance>): Promise<LayoutInstance | null> {
    const [updated] = await db.update(layoutInstances)
      .set({ ...updates, lastMutated: new Date() })
      .where(eq(layoutInstances.id, instanceId))
      .returning();
    return updated || null;
  }

  /**
   * Mutation Management
   */
  async logMutation(mutationData: NewLayoutMutation): Promise<LayoutMutation> {
    const [mutation] = await db.insert(layoutMutations).values(mutationData).returning();
    return mutation;
  }

  async getMutations(instanceId: string, limit: number = 50): Promise<LayoutMutation[]> {
    return await db.select().from(layoutMutations)
      .where(eq(layoutMutations.instanceId, instanceId))
      .orderBy(desc(layoutMutations.appliedAt))
      .limit(limit);
  }

  async getMutationsByElement(instanceId: string, elementId: string): Promise<LayoutMutation[]> {
    return await db.select().from(layoutMutations)
      .where(and(
        eq(layoutMutations.instanceId, instanceId),
        eq(layoutMutations.elementId, elementId)
      ))
      .orderBy(desc(layoutMutations.appliedAt));
  }

  async revertMutation(mutationId: string): Promise<boolean> {
    const [updated] = await db.update(layoutMutations)
      .set({ reverted: true, revertedAt: new Date() })
      .where(eq(layoutMutations.id, mutationId))
      .returning();
    return !!updated;
  }

  /**
   * Analytics Management
   */
  async recordAnalytics(analyticsData: NewLayoutAnalytics): Promise<void> {
    await db.insert(layoutAnalytics).values(analyticsData);
  }

  async getAnalytics(instanceId: string, options: {
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  } = {}): Promise<any[]> {
    let query = db.select().from(layoutAnalytics)
      .where(eq(layoutAnalytics.instanceId, instanceId));

    const conditions = [eq(layoutAnalytics.instanceId, instanceId)];

    if (options.startDate) {
      conditions.push(gte(layoutAnalytics.timestamp, options.startDate));
    }
    if (options.endDate) {
      conditions.push(lte(layoutAnalytics.timestamp, options.endDate));
    }

    query = query.where(and(...conditions)).orderBy(desc(layoutAnalytics.timestamp));

    if (options.limit) {
      query = query.limit(options.limit);
    }

    return await query;
  }

  async getAggregatedAnalytics(templateId: string, period: string = '24h'): Promise<any> {
    const endDate = new Date();
    const startDate = new Date();
    
    switch (period) {
      case '1h':
        startDate.setHours(startDate.getHours() - 1);
        break;
      case '24h':
        startDate.setDate(startDate.getDate() - 1);
        break;
      case '7d':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(startDate.getDate() - 30);
        break;
    }

    const result = await db.select({
      totalViews: sql<number>`count(*)`,
      avgTimeOnPage: sql<number>`avg(${layoutAnalytics.timeOnPage})`,
      avgLoadTime: sql<number>`avg(${layoutAnalytics.loadTime})`,
      avgBounceRate: sql<number>`avg(${layoutAnalytics.bounceRate})`,
      avgConversionRate: sql<number>`avg(${layoutAnalytics.conversionRate})`,
      totalInteractions: sql<number>`sum(jsonb_array_length(${layoutAnalytics.interactions}))`,
      totalConversions: sql<number>`sum(jsonb_array_length(${layoutAnalytics.conversions}))`
    })
    .from(layoutAnalytics)
    .where(and(
      eq(layoutAnalytics.templateId, templateId),
      gte(layoutAnalytics.timestamp, startDate),
      lte(layoutAnalytics.timestamp, endDate)
    ));

    return result[0] || {
      totalViews: 0,
      avgTimeOnPage: 0,
      avgLoadTime: 0,
      avgBounceRate: 0,
      avgConversionRate: 0,
      totalInteractions: 0,
      totalConversions: 0
    };
  }

  /**
   * Personalization Rules Management
   */
  async createPersonalizationRule(ruleData: NewLayoutPersonalization): Promise<any> {
    const [rule] = await db.insert(layoutPersonalization).values(ruleData).returning();
    return rule;
  }

  async getPersonalizationRules(active: boolean = true): Promise<any[]> {
    let query = db.select().from(layoutPersonalization);
    
    if (active) {
      query = query.where(eq(layoutPersonalization.isActive, true));
    }

    return await query.orderBy(desc(layoutPersonalization.priority));
  }

  async updatePersonalizationRule(ruleId: string, updates: Partial<NewLayoutPersonalization>): Promise<any | null> {
    const [updated] = await db.update(layoutPersonalization)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(layoutPersonalization.id, ruleId))
      .returning();
    return updated || null;
  }

  async deletePersonalizationRule(ruleId: string): Promise<boolean> {
    const result = await db.update(layoutPersonalization)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(layoutPersonalization.id, ruleId));
    return result.rowCount > 0;
  }

  /**
   * User Preferences Management
   */
  async saveUserPreference(preferenceData: NewUserLayoutPreference): Promise<any> {
    // Check if preference already exists
    const existing = await db.select().from(userLayoutPreferences)
      .where(and(
        eq(userLayoutPreferences.userId, preferenceData.userId),
        eq(userLayoutPreferences.layoutId, preferenceData.layoutId),
        eq(userLayoutPreferences.elementId, preferenceData.elementId),
        eq(userLayoutPreferences.preferenceType, preferenceData.preferenceType)
      ));

    if (existing.length > 0) {
      // Update existing preference
      const [updated] = await db.update(userLayoutPreferences)
        .set({
          preferences: preferenceData.preferences,
          strength: preferenceData.strength,
          updatedAt: new Date(),
          lastUsed: new Date(),
          usageCount: sql`${userLayoutPreferences.usageCount} + 1`
        })
        .where(eq(userLayoutPreferences.id, existing[0].id))
        .returning();
      return updated;
    } else {
      // Create new preference
      const [preference] = await db.insert(userLayoutPreferences).values(preferenceData).returning();
      return preference;
    }
  }

  async getUserPreferences(userId: string, layoutId?: string): Promise<any[]> {
    let query = db.select().from(userLayoutPreferences)
      .where(eq(userLayoutPreferences.userId, userId));

    if (layoutId) {
      query = query.where(and(
        eq(userLayoutPreferences.userId, userId),
        eq(userLayoutPreferences.layoutId, layoutId)
      ));
    }

    return await query.orderBy(desc(userLayoutPreferences.strength));
  }

  /**
   * A/B Test Management
   */
  async createAbTest(testData: NewLayoutAbTest): Promise<any> {
    const [test] = await db.insert(layoutAbTests).values(testData).returning();
    return test;
  }

  async getAbTests(filters: {
    templateId?: string;
    status?: string;
  } = {}): Promise<any[]> {
    let query = db.select().from(layoutAbTests);
    
    const conditions = [];
    if (filters.templateId) {
      conditions.push(eq(layoutAbTests.templateId, filters.templateId));
    }
    if (filters.status) {
      conditions.push(eq(layoutAbTests.status, filters.status));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    return await query.orderBy(desc(layoutAbTests.createdAt));
  }

  async updateAbTest(testId: string, updates: Partial<NewLayoutAbTest>): Promise<any | null> {
    const [updated] = await db.update(layoutAbTests)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(layoutAbTests.id, testId))
      .returning();
    return updated || null;
  }

  async incrementAbTestParticipants(testId: string): Promise<void> {
    await db.update(layoutAbTests)
      .set({ participants: sql`${layoutAbTests.participants} + 1` })
      .where(eq(layoutAbTests.id, testId));
  }

  /**
   * Cleanup and maintenance
   */
  async cleanupOldInstances(daysOld: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await db.update(layoutInstances)
      .set({ isActive: false })
      .where(and(
        lte(layoutInstances.generatedAt, cutoffDate),
        eq(layoutInstances.isActive, true)
      ));

    return result.rowCount;
  }

  async cleanupOldAnalytics(daysOld: number = 90): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await db.delete(layoutAnalytics)
      .where(lte(layoutAnalytics.timestamp, cutoffDate));

    return result.rowCount;
  }

  /**
   * Migration and backup utilities
   */
  async exportLayoutData(): Promise<{
    templates: LayoutTemplate[];
    instances: LayoutInstance[];
    rules: any[];
    abTests: any[];
  }> {
    const [templates, instances, rules, abTests] = await Promise.all([
      this.getTemplates({ active: true }),
      db.select().from(layoutInstances).where(eq(layoutInstances.isActive, true)),
      this.getPersonalizationRules(true),
      this.getAbTests({ status: 'running' })
    ]);

    return { templates, instances, rules, abTests };
  }

  async importLayoutData(data: {
    templates?: NewLayoutTemplate[];
    rules?: NewLayoutPersonalization[];
    abTests?: NewLayoutAbTest[];
  }): Promise<{
    templatesImported: number;
    rulesImported: number;
    abTestsImported: number;
  }> {
    let templatesImported = 0;
    let rulesImported = 0;
    let abTestsImported = 0;

    if (data.templates?.length) {
      for (const template of data.templates) {
        try {
          await this.createTemplate(template);
          templatesImported++;
        } catch (error) {
          console.warn('Failed to import template:', error);
        }
      }
    }

    if (data.rules?.length) {
      for (const rule of data.rules) {
        try {
          await this.createPersonalizationRule(rule);
          rulesImported++;
        } catch (error) {
          console.warn('Failed to import rule:', error);
        }
      }
    }

    if (data.abTests?.length) {
      for (const test of data.abTests) {
        try {
          await this.createAbTest(test);
          abTestsImported++;
        } catch (error) {
          console.warn('Failed to import A/B test:', error);
        }
      }
    }

    return { templatesImported, rulesImported, abTestsImported };
  }

  /**
   * Health checks and validation
   */
  async validateDatabaseHealth(): Promise<{
    tablesAccessible: boolean;
    totalTemplates: number;
    totalInstances: number;
    totalMutations: number;
    errors: string[];
  }> {
    const errors: string[] = [];
    let tablesAccessible = true;
    let totalTemplates = 0;
    let totalInstances = 0;
    let totalMutations = 0;

    try {
      const templates = await db.select().from(layoutTemplates).limit(1);
      totalTemplates = templates.length;
    } catch (error) {
      errors.push('Failed to access layout_templates table');
      tablesAccessible = false;
    }

    try {
      const instances = await db.select().from(layoutInstances).limit(1);
      totalInstances = instances.length;
    } catch (error) {
      errors.push('Failed to access layout_instances table');
      tablesAccessible = false;
    }

    try {
      const mutations = await db.select().from(layoutMutations).limit(1);
      totalMutations = mutations.length;
    } catch (error) {
      errors.push('Failed to access layout_mutations table');
      tablesAccessible = false;
    }

    return {
      tablesAccessible,
      totalTemplates,
      totalInstances,
      totalMutations,
      errors
    };
  }
}

// Export singleton instance
export const layoutStorageService = new LayoutStorageService();
export default layoutStorageService;