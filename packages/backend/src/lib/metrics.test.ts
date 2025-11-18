/**
 * Tests for metrics collector
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { metrics } from './metrics';

describe('MetricsCollector', () => {
  beforeEach(() => {
    metrics.reset();
  });

  describe('Counter', () => {
    it('should increment counter', () => {
      metrics.incrementCounter('test_counter', 1);
      expect(metrics.getCounter('test_counter')).toBe(1);

      metrics.incrementCounter('test_counter', 5);
      expect(metrics.getCounter('test_counter')).toBe(6);
    });

    it('should handle counter with labels', () => {
      metrics.incrementCounter('http_requests', 1, { method: 'GET', status: 200 });
      metrics.incrementCounter('http_requests', 1, { method: 'POST', status: 201 });

      expect(metrics.getCounter('http_requests', { method: 'GET', status: 200 })).toBe(1);
      expect(metrics.getCounter('http_requests', { method: 'POST', status: 201 })).toBe(1);
    });

    it('should return 0 for non-existent counter', () => {
      expect(metrics.getCounter('non_existent')).toBe(0);
    });
  });

  describe('Gauge', () => {
    it('should set gauge value', () => {
      metrics.setGauge('temperature', 25.5);
      expect(metrics.getGauge('temperature')).toBe(25.5);

      metrics.setGauge('temperature', 30.0);
      expect(metrics.getGauge('temperature')).toBe(30.0);
    });

    it('should handle gauge with labels', () => {
      metrics.setGauge('memory_usage', 1024, { service: 'api' });
      metrics.setGauge('memory_usage', 2048, { service: 'worker' });

      expect(metrics.getGauge('memory_usage', { service: 'api' })).toBe(1024);
      expect(metrics.getGauge('memory_usage', { service: 'worker' })).toBe(2048);
    });
  });

  describe('Histogram', () => {
    it('should record histogram values', () => {
      metrics.recordHistogram('request_duration', 100);
      metrics.recordHistogram('request_duration', 200);
      metrics.recordHistogram('request_duration', 150);

      const values = metrics.getHistogram('request_duration');
      expect(values).toEqual([100, 200, 150]);
    });

    it('should calculate histogram statistics', () => {
      metrics.recordHistogram('durations', 10);
      metrics.recordHistogram('durations', 20);
      metrics.recordHistogram('durations', 30);

      const allMetrics = metrics.getAllMetrics();
      const histogramStats = allMetrics.histograms.durations;

      expect(histogramStats.count).toBe(3);
      expect(histogramStats.sum).toBe(60);
      expect(histogramStats.avg).toBe(20);
      expect(histogramStats.min).toBe(10);
      expect(histogramStats.max).toBe(30);
    });
  });

  describe('Reset', () => {
    it('should reset all metrics', () => {
      metrics.incrementCounter('test', 10);
      metrics.setGauge('gauge', 100);
      metrics.recordHistogram('hist', 50);

      metrics.reset();

      expect(metrics.getCounter('test')).toBe(0);
      expect(metrics.getGauge('gauge')).toBeUndefined();
      expect(metrics.getHistogram('hist')).toEqual([]);
    });
  });
});
