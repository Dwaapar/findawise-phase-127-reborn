// Content Feed Notification Engine - Alert system for content changes and updates
import { db } from "../../db";
import { 
  contentFeedNotifications,
  type InsertContentFeedNotification 
} from "../../../shared/contentFeedTables";
import { eq, and, desc } from "drizzle-orm";

export interface NotificationOptions {
  contentId?: number;
  sourceId?: number;
  notificationType: string;
  title: string;
  message: string;
  severity?: 'info' | 'warning' | 'error' | 'critical';
  metadata?: any;
}

export interface NotificationFilter {
  isRead?: boolean;
  severity?: string[];
  notificationType?: string[];
  dateRange?: { start: Date; end: Date };
}

export class ContentFeedNotificationEngine {
  
  async createNotification(options: NotificationOptions): Promise<void> {
    try {
      const notificationData: InsertContentFeedNotification = {
        contentId: options.contentId || null,
        sourceId: options.sourceId || null,
        notificationType: options.notificationType,
        title: options.title,
        message: options.message,
        severity: options.severity || 'info',
        metadata: options.metadata || null
      };

      await db.insert(contentFeedNotifications).values(notificationData);

      // Log critical notifications
      if (options.severity === 'critical' || options.severity === 'error') {
        console.error(`🚨 Content Feed Alert [${options.severity}]: ${options.title} - ${options.message}`);
      } else {
        console.log(`📢 Content Feed Notification [${options.severity}]: ${options.title}`);
      }

      // Here you could integrate with external notification services
      // await this.sendExternalNotification(options);

    } catch (error) {
      console.error('Error creating notification:', error);
    }
  }

  async getNotifications(filter: NotificationFilter = {}, limit: number = 50): Promise<any[]> {
    try {
      let query = db.select().from(contentFeedNotifications);
      const conditions = [];

      if (filter.isRead !== undefined) {
        conditions.push(eq(contentFeedNotifications.isRead, filter.isRead));
      }

      if (filter.severity?.length) {
        // For simplicity, just check first severity
        conditions.push(eq(contentFeedNotifications.severity, filter.severity[0]));
      }

      if (filter.notificationType?.length) {
        conditions.push(eq(contentFeedNotifications.notificationType, filter.notificationType[0]));
      }

      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }

      return await query
        .orderBy(desc(contentFeedNotifications.createdAt))
        .limit(limit);

    } catch (error) {
      console.error('Error getting notifications:', error);
      return [];
    }
  }

  async markAsRead(notificationId: number): Promise<boolean> {
    try {
      await db
        .update(contentFeedNotifications)
        .set({ isRead: true })
        .where(eq(contentFeedNotifications.id, notificationId));

      return true;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return false;
    }
  }

  async markAllAsRead(): Promise<number> {
    try {
      const result = await db
        .update(contentFeedNotifications)
        .set({ isRead: true })
        .where(eq(contentFeedNotifications.isRead, false));

      return result.rowCount || 0;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      return 0;
    }
  }

  async deleteNotification(notificationId: number): Promise<boolean> {
    try {
      await db
        .delete(contentFeedNotifications)
        .where(eq(contentFeedNotifications.id, notificationId));

      return true;
    } catch (error) {
      console.error('Error deleting notification:', error);
      return false;
    }
  }

  async getNotificationCounts(): Promise<{
    total: number;
    unread: number;
    bySeverity: { severity: string; count: number }[];
  }> {
    try {
      const notifications = await db.select().from(contentFeedNotifications);
      
      const total = notifications.length;
      const unread = notifications.filter(n => !n.isRead).length;
      
      const severityCounts = new Map<string, number>();
      notifications.forEach(n => {
        severityCounts.set(n.severity || 'info', (severityCounts.get(n.severity || 'info') || 0) + 1);
      });

      const bySeverity = Array.from(severityCounts.entries())
        .map(([severity, count]) => ({ severity, count }));

      return { total, unread, bySeverity };

    } catch (error) {
      console.error('Error getting notification counts:', error);
      return { total: 0, unread: 0, bySeverity: [] };
    }
  }

  // Notification type helpers
  async notifyPriceDrop(contentId: number, oldPrice: number, newPrice: number): Promise<void> {
    const discount = Math.round(((oldPrice - newPrice) / oldPrice) * 100);
    
    await this.createNotification({
      contentId,
      notificationType: 'price_drop',
      title: `Price Drop Alert: ${discount}% off`,
      message: `Price dropped from $${oldPrice} to $${newPrice} (${discount}% savings)`,
      severity: 'info',
      metadata: { oldPrice, newPrice, discount }
    });
  }

  async notifyNewContent(sourceId: number, count: number): Promise<void> {
    await this.createNotification({
      sourceId,
      notificationType: 'new_content',
      title: `New Content Available`,
      message: `${count} new items have been added from content source`,
      severity: 'info',
      metadata: { count }
    });
  }

  async notifyExpiredContent(contentId: number, title: string): Promise<void> {
    await this.createNotification({
      contentId,
      notificationType: 'content_expired',
      title: `Content Expired`,
      message: `"${title}" has expired and been removed from active listings`,
      severity: 'warning',
      metadata: { title }
    });
  }

  async notifySyncError(sourceId: number, error: string): Promise<void> {
    await this.createNotification({
      sourceId,
      notificationType: 'sync_error',
      title: `Content Sync Failed`,
      message: `Failed to sync content: ${error}`,
      severity: 'error',
      metadata: { error }
    });
  }

  async notifyQualityIssue(contentId: number, issues: string[]): Promise<void> {
    await this.createNotification({
      contentId,
      notificationType: 'quality_issue',
      title: `Content Quality Issues Detected`,
      message: `Quality issues found: ${issues.join(', ')}`,
      severity: 'warning',
      metadata: { issues }
    });
  }

  // Future: Integration with external notification services
  private async sendExternalNotification(options: NotificationOptions): Promise<void> {
    // Integration points for:
    // - Email notifications
    // - Slack/Discord alerts  
    // - Push notifications
    // - SMS alerts for critical issues
    // - Webhook notifications to external systems
  }
}