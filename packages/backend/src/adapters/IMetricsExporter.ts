/**
 * Metrics exporter adapter interface
 * Implement this to export metrics to Prometheus, DataDog, etc.
 */

export interface MetricData {
  name: string;
  value: number;
  labels?: Record<string, string | number>;
  timestamp?: Date;
}

export interface IMetricsExporter {
  /**
   * Export a single metric
   */
  exportMetric(metric: MetricData): Promise<void>;

  /**
   * Export multiple metrics at once
   */
  exportBatch(metrics: MetricData[]): Promise<void>;

  /**
   * Check if the exporter is properly configured
   */
  isConfigured(): boolean;
}

/**
 * Console metrics exporter (for development)
 */
export class ConsoleMetricsExporter implements IMetricsExporter {
  async exportMetric(metric: MetricData): Promise<void> {
    console.log('📊 Metric:', metric);
  }

  async exportBatch(metrics: MetricData[]): Promise<void> {
    console.log(`📊 Metrics (${metrics.length}):`, metrics);
  }

  isConfigured(): boolean {
    return true;
  }
}

/**
 * Prometheus metrics exporter
 */
export class PrometheusExporter implements IMetricsExporter {
  private metrics: MetricData[] = [];

  async exportMetric(metric: MetricData): Promise<void> {
    this.metrics.push(metric);
  }

  async exportBatch(metrics: MetricData[]): Promise<void> {
    this.metrics.push(...metrics);
  }

  /**
   * Get metrics in Prometheus format
   */
  getPrometheusFormat(): string {
    return this.metrics
      .map((metric) => {
        const labels = metric.labels
          ? Object.entries(metric.labels)
              .map(([key, value]) => `${key}="${value}"`)
              .join(',')
          : '';

        const metricName = metric.name;
        const metricValue = metric.value;

        return labels
          ? `${metricName}{${labels}} ${metricValue}`
          : `${metricName} ${metricValue}`;
      })
      .join('\n');
  }

  isConfigured(): boolean {
    return true;
  }
}
