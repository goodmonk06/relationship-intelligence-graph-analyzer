/**
 * Metrics abstraction
 * Provides a simple interface for recording metrics
 * Can be swapped with Prometheus, StatsD, etc. in production
 */

import { logger } from './logger';

export interface MetricLabels {
  [key: string]: string | number;
}

class MetricsCollector {
  private counters: Map<string, number> = new Map();
  private gauges: Map<string, number> = new Map();
  private histograms: Map<string, number[]> = new Map();

  /**
   * Increment a counter
   */
  incrementCounter(name: string, value: number = 1, labels?: MetricLabels) {
    const key = this.buildKey(name, labels);
    const current = this.counters.get(key) || 0;
    this.counters.set(key, current + value);

    if (process.env.NODE_ENV === 'development') {
      logger.debug('Counter incremented', { metric: name, value, labels });
    }
  }

  /**
   * Set a gauge value
   */
  setGauge(name: string, value: number, labels?: MetricLabels) {
    const key = this.buildKey(name, labels);
    this.gauges.set(key, value);

    if (process.env.NODE_ENV === 'development') {
      logger.debug('Gauge set', { metric: name, value, labels });
    }
  }

  /**
   * Record a histogram value
   */
  recordHistogram(name: string, value: number, labels?: MetricLabels) {
    const key = this.buildKey(name, labels);
    const values = this.histograms.get(key) || [];
    values.push(value);
    this.histograms.set(key, values);

    if (process.env.NODE_ENV === 'development') {
      logger.debug('Histogram recorded', { metric: name, value, labels });
    }
  }

  /**
   * Get current counter value
   */
  getCounter(name: string, labels?: MetricLabels): number {
    const key = this.buildKey(name, labels);
    return this.counters.get(key) || 0;
  }

  /**
   * Get current gauge value
   */
  getGauge(name: string, labels?: MetricLabels): number | undefined {
    const key = this.buildKey(name, labels);
    return this.gauges.get(key);
  }

  /**
   * Get histogram values
   */
  getHistogram(name: string, labels?: MetricLabels): number[] {
    const key = this.buildKey(name, labels);
    return this.histograms.get(key) || [];
  }

  /**
   * Get all metrics (for debugging/export)
   */
  getAllMetrics() {
    return {
      counters: Object.fromEntries(this.counters),
      gauges: Object.fromEntries(this.gauges),
      histograms: Object.fromEntries(
        Array.from(this.histograms.entries()).map(([key, values]) => [
          key,
          {
            count: values.length,
            sum: values.reduce((a, b) => a + b, 0),
            avg: values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0,
            min: Math.min(...values),
            max: Math.max(...values),
          },
        ])
      ),
    };
  }

  /**
   * Reset all metrics
   */
  reset() {
    this.counters.clear();
    this.gauges.clear();
    this.histograms.clear();
  }

  private buildKey(name: string, labels?: MetricLabels): string {
    if (!labels || Object.keys(labels).length === 0) {
      return name;
    }
    const labelStr = Object.entries(labels)
      .map(([k, v]) => `${k}=${v}`)
      .join(',');
    return `${name}{${labelStr}}`;
  }
}

// Export singleton instance
export const metrics = new MetricsCollector();

// Common metric names
export const MetricNames = {
  HTTP_REQUESTS: 'http_requests_total',
  HTTP_REQUEST_DURATION: 'http_request_duration_ms',
  DB_QUERIES: 'db_queries_total',
  DB_QUERY_DURATION: 'db_query_duration_ms',
  GRAPH_COMPUTE_DURATION: 'graph_compute_duration_ms',
  ENTITIES_CREATED: 'entities_created_total',
  RELATIONS_CREATED: 'relations_created_total',
  ERRORS: 'errors_total',
};
