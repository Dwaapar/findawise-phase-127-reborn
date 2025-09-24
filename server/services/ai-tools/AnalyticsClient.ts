import { EventEmitter } from 'events';

interface AnalyticsEvent {
  event: string;
  sessionId: string;
  timestamp?: Date;
  toolId?: number;
  categoryId?: number;
  contentId?: number;
  offerId?: number;
  userArchetype?: string;
  deviceType?: string;
  source?: string;
  data?: Record<string, any>;
  value?: number;
}

interface AnalyticsOptions {
  apiUrl: string;
  neuronId: string;
  token: string;
  batchSize: number;
  flushInterval: number; // in milliseconds
  maxRetries: number;
}

export class AnalyticsClient extends EventEmitter {
  private options: AnalyticsOptions;
  private eventQueue: AnalyticsEvent[] = [];
  private flushTimer?: NodeJS.Timeout;
  private isRunning = false;
  private retryQueue: { events: AnalyticsEvent[]; retryCount: number }[] = [];

  constructor(options: AnalyticsOptions) {
    super();
    this.options = options;
  }

  async start(): Promise<void> {
    if (this.isRunning) {
      console.log('📊 AnalyticsClient already running');
      return;
    }

    this.isRunning = true;
    console.log('🚀 Starting AI Tools Analytics Client...');

    // Set up periodic flush
    this.flushTimer = setInterval(async () => {
      await this.flush();
    }, this.options.flushInterval);

    // Process retry queue
    setInterval(() => {
      this.processRetryQueue();
    }, this.options.flushInterval * 2);

    console.log(`✅ AnalyticsClient started with ${this.options.flushInterval}ms flush interval`);
    this.emit('started');
  }

  async stop(): Promise<void> {
    if (!this.isRunning) return;

    console.log('🛑 Stopping AnalyticsClient...');
    
    // Flush remaining events
    if (this.eventQueue.length > 0) {
      await this.flush();
    }

    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = undefined;
    }

    this.isRunning = false;
    console.log('✅ AnalyticsClient stopped');
    this.emit('stopped');
  }

  // Track single event
  track(event: Omit<AnalyticsEvent, 'timestamp'>): void {
    if (!this.isRunning) {
      console.warn('⚠️ AnalyticsClient not running, event dropped');
      return;
    }

    const analyticsEvent: AnalyticsEvent = {
      ...event,
      timestamp: new Date()
    };

    this.eventQueue.push(analyticsEvent);
    this.emit('event_queued', analyticsEvent);

    // Auto-flush if queue is full
    if (this.eventQueue.length >= this.options.batchSize) {
      this.flush().catch(error => {
        console.error('❌ Auto-flush failed:', error);
      });
    }
  }

  // Track multiple events
  trackBatch(events: Omit<AnalyticsEvent, 'timestamp'>[]): void {
    events.forEach(event => this.track(event));
  }

  // Convenient tracking methods
  trackToolView(toolId: number, sessionId: string, archetype?: string, source?: string): void {
    this.track({
      event: 'tool_view',
      toolId,
      sessionId,
      userArchetype: archetype,
      source,
      data: { timestamp: new Date().toISOString() }
    });
  }

  trackOfferClick(offerId: number, sessionId: string, archetype?: string, toolId?: number): void {
    this.track({
      event: 'offer_click',
      offerId,
      toolId,
      sessionId,
      userArchetype: archetype,
      value: 1,
      data: { 
        timestamp: new Date().toISOString(),
        clickType: 'affiliate_link'
      }
    });
  }

  trackQuizComplete(sessionId: string, archetype: string, score: Record<string, number>): void {
    this.track({
      event: 'quiz_complete',
      sessionId,
      userArchetype: archetype,
      data: {
        scores: score,
        completedAt: new Date().toISOString()
      }
    });
  }

  trackSubscription(email: string, sessionId: string, source: string, archetype?: string): void {
    this.track({
      event: 'newsletter_subscribe',
      sessionId,
      userArchetype: archetype,
      source,
      value: 1,
      data: {
        email: this.hashEmail(email),
        timestamp: new Date().toISOString()
      }
    });
  }

  trackDownload(magnetId: string, sessionId: string, archetype?: string, hasEmail: boolean = false): void {
    this.track({
      event: 'resource_download',
      sessionId,
      userArchetype: archetype,
      value: hasEmail ? 2 : 1, // Higher value if email provided
      data: {
        magnetId,
        hasEmail,
        timestamp: new Date().toISOString()
      }
    });
  }

  trackSearch(query: string, sessionId: string, resultsCount: number, archetype?: string): void {
    this.track({
      event: 'tool_search',
      sessionId,
      userArchetype: archetype,
      data: {
        query: query.toLowerCase(),
        resultsCount,
        timestamp: new Date().toISOString()
      }
    });
  }

  trackContentView(contentId: number, sessionId: string, archetype?: string, timeOnPage?: number): void {
    this.track({
      event: 'content_view',
      contentId,
      sessionId,
      userArchetype: archetype,
      value: timeOnPage || 0,
      data: {
        timeOnPage,
        timestamp: new Date().toISOString()
      }
    });
  }

  trackComparison(comparisonId: number, toolIds: number[], sessionId: string, archetype?: string): void {
    this.track({
      event: 'comparison_view',
      sessionId,
      userArchetype: archetype,
      data: {
        comparisonId,
        toolIds,
        toolCount: toolIds.length,
        timestamp: new Date().toISOString()
      }
    });
  }

  trackExperiment(experimentId: string, variant: string, sessionId: string, archetype?: string): void {
    this.track({
      event: 'experiment_participate',
      sessionId,
      userArchetype: archetype,
      data: {
        experimentId,
        variant,
        timestamp: new Date().toISOString()
      }
    });
  }

  trackConversion(offerId: number, sessionId: string, value: number, archetype?: string): void {
    this.track({
      event: 'affiliate_conversion',
      offerId,
      sessionId,
      userArchetype: archetype,
      value,
      data: {
        revenue: value,
        timestamp: new Date().toISOString()
      }
    });
  }

  // Flush events to server
  private async flush(): Promise<void> {
    if (this.eventQueue.length === 0) return;

    const events = [...this.eventQueue];
    this.eventQueue = [];

    try {
      await this.sendEvents(events);
      this.emit('events_sent', { count: events.length });
    } catch (error) {
      console.error('❌ Failed to send analytics events:', error);
      
      // Add to retry queue
      if (events.length > 0) {
        this.retryQueue.push({ events, retryCount: 0 });
      }
      
      this.emit('send_error', error);
    }
  }

  private async sendEvents(events: AnalyticsEvent[]): Promise<void> {
    const payload = {
      neuronId: this.options.neuronId,
      timestamp: new Date().toISOString(),
      events: events.map(event => ({
        ...event,
        timestamp: event.timestamp?.toISOString()
      }))
    };

    const response = await fetch(`${this.options.apiUrl}/api/analytics/report`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.options.token}`,
        'Content-Type': 'application/json',
        'X-Neuron-ID': this.options.neuronId
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Analytics send failed: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    console.log(`📊 Analytics sent: ${events.length} events, processed: ${result.processed || 0}`);
  }

  private async processRetryQueue(): Promise<void> {
    if (this.retryQueue.length === 0) return;

    const itemsToRetry = [...this.retryQueue];
    this.retryQueue = [];

    for (const item of itemsToRetry) {
      if (item.retryCount >= this.options.maxRetries) {
        console.warn(`⚠️ Dropping ${item.events.length} events after ${this.options.maxRetries} retries`);
        this.emit('events_dropped', { count: item.events.length });
        continue;
      }

      try {
        await this.sendEvents(item.events);
        this.emit('events_retried', { count: item.events.length, attempt: item.retryCount + 1 });
      } catch (error) {
        console.error(`❌ Retry ${item.retryCount + 1} failed:`, error);
        this.retryQueue.push({ events: item.events, retryCount: item.retryCount + 1 });
      }
    }
  }

  // Force flush (useful for immediate sending)
  async forceFlush(): Promise<void> {
    if (!this.isRunning) {
      throw new Error('AnalyticsClient is not running');
    }

    console.log('🔄 Forcing analytics flush...');
    await this.flush();
  }

  // Get queue status
  getStatus(): {
    isRunning: boolean;
    queueSize: number;
    retryQueueSize: number;
    totalPendingEvents: number;
  } {
    const retryEvents = this.retryQueue.reduce((sum, item) => sum + item.events.length, 0);
    
    return {
      isRunning: this.isRunning,
      queueSize: this.eventQueue.length,
      retryQueueSize: this.retryQueue.length,
      totalPendingEvents: this.eventQueue.length + retryEvents
    };
  }

  // Hash email for privacy (simple hash for demo)
  private hashEmail(email: string): string {
    let hash = 0;
    for (let i = 0; i < email.length; i++) {
      const char = email.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  // Get analytics summary
  getAnalyticsSummary(): {
    eventsSent: number;
    eventsQueued: number;
    eventsDropped: number;
    lastFlush?: Date;
  } {
    // This would typically be stored in instance variables
    // For now, return current queue status
    return {
      eventsSent: 0, // Would track this
      eventsQueued: this.eventQueue.length,
      eventsDropped: 0, // Would track this
      lastFlush: undefined // Would track this
    };
  }
}