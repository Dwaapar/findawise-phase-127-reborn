import { logger } from "../../utils/logger";

export interface PerformanceMetric {
  name: string;
  duration: number;
  timestamp: Date;
  metadata?: Record<string, any>;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private activeTimers: Map<string, number> = new Map();

  startTimer(name: string, metadata?: Record<string, any>): string {
    const timerId = `${name}_${Date.now()}`;
    this.activeTimers.set(timerId, performance.now());
    return timerId;
  }

  endTimer(timerId: string, metadata?: Record<string, any>): PerformanceMetric | null {
    const startTime = this.activeTimers.get(timerId);
    if (!startTime) return null;

    const duration = performance.now() - startTime;
    const metric: PerformanceMetric = {
      name: timerId.split('_')[0],
      duration,
      timestamp: new Date(),
      metadata
    };

    this.metrics.push(metric);
    this.activeTimers.delete(timerId);
    
    logger.debug('Performance metric recorded', { 
      component: 'PerformanceMonitor', 
      metric 
    });

    return metric;
  }

  measure<T>(name: string, fn: () => T, metadata?: Record<string, any>): T {
    const timerId = this.startTimer(name, metadata);
    try {
      const result = fn();
      this.endTimer(timerId, metadata);
      return result;
    } catch (error) {
      this.endTimer(timerId, { ...metadata, error: true });
      throw error;
    }
  }

  async measureAsync<T>(name: string, fn: () => Promise<T>, metadata?: Record<string, any>): Promise<T> {
    const timerId = this.startTimer(name, metadata);
    try {
      const result = await fn();
      this.endTimer(timerId, metadata);
      return result;
    } catch (error) {
      this.endTimer(timerId, { ...metadata, error: true });
      throw error;
    }
  }

  getMetrics(name?: string): PerformanceMetric[] {
    if (name) {
      return this.metrics.filter(m => m.name === name);
    }
    return this.metrics;
  }

  getAverageMetric(name: string): number {
    const metrics = this.getMetrics(name);
    if (metrics.length === 0) return 0;
    return metrics.reduce((sum, m) => sum + m.duration, 0) / metrics.length;
  }
}

export const performanceMonitor = new PerformanceMonitor();