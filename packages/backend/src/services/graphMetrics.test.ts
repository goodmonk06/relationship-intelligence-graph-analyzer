/**
 * Tests for graph metrics service
 */

import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { computeGraphMetrics, getTopEntitiesByImportance } from './graphMetrics';
import { cleanDatabase, disconnectDatabase } from '../tests/helpers/testDb';
import { createTestRelationNetwork } from '../tests/fixtures/relationFixtures';

describe('GraphMetrics Service', () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  describe('computeGraphMetrics', () => {
    it('should compute metrics for a simple network', async () => {
      // Create a test network
      const { entities } = await createTestRelationNetwork();

      // Compute metrics
      const metrics = await computeGraphMetrics();

      expect(metrics.totalNodes).toBe(4);
      expect(metrics.totalEdges).toBe(4);
      expect(metrics.nodes).toBeDefined();
      expect(Object.keys(metrics.nodes)).toHaveLength(4);

      // Check that all entities have metrics
      expect(metrics.nodes[entities.contact1.id]).toBeDefined();
      expect(metrics.nodes[entities.contact2.id]).toBeDefined();
      expect(metrics.nodes[entities.account.id]).toBeDefined();
      expect(metrics.nodes[entities.deal.id]).toBeDefined();
    });

    it('should calculate correct degree counts', async () => {
      const { entities } = await createTestRelationNetwork();
      const metrics = await computeGraphMetrics();

      // contact1: works_at account (out), involved_in deal (out), introduced contact2 (in)
      const contact1Metrics = metrics.nodes[entities.contact1.id];
      expect(contact1Metrics.degree).toBe(3);
      expect(contact1Metrics.outDegree).toBe(2);
      expect(contact1Metrics.inDegree).toBe(1);

      // account: has 2 works_at relations (in)
      const accountMetrics = metrics.nodes[entities.account.id];
      expect(accountMetrics.degree).toBe(2);
      expect(accountMetrics.inDegree).toBe(2);
      expect(accountMetrics.outDegree).toBe(0);
    });

    it('should calculate importance scores', async () => {
      const { entities } = await createTestRelationNetwork();
      const metrics = await computeGraphMetrics();

      // All importance scores should be between 0 and 1
      Object.values(metrics.nodes).forEach((node) => {
        expect(node.importance).toBeGreaterThanOrEqual(0);
        expect(node.importance).toBeLessThanOrEqual(1);
      });

      // The node with highest degree should have importance of 1
      const maxDegree = Math.max(...Object.values(metrics.nodes).map((n) => n.degree));
      const maxImportanceNode = Object.values(metrics.nodes).find((n) => n.degree === maxDegree);
      expect(maxImportanceNode?.importance).toBe(1);
    });

    it('should handle empty graph', async () => {
      const metrics = await computeGraphMetrics();

      expect(metrics.totalNodes).toBe(0);
      expect(metrics.totalEdges).toBe(0);
      expect(Object.keys(metrics.nodes)).toHaveLength(0);
    });
  });

  describe('getTopEntitiesByImportance', () => {
    it('should return entities sorted by importance', async () => {
      await createTestRelationNetwork();
      await computeGraphMetrics();

      const topEntities = await getTopEntitiesByImportance(3);

      expect(topEntities).toHaveLength(3);

      // Verify they are sorted by importance (descending)
      for (let i = 0; i < topEntities.length - 1; i++) {
        expect(topEntities[i].metrics.importance).toBeGreaterThanOrEqual(
          topEntities[i + 1].metrics.importance
        );
      }
    });

    it('should limit results correctly', async () => {
      await createTestRelationNetwork();
      await computeGraphMetrics();

      const topTwo = await getTopEntitiesByImportance(2);
      expect(topTwo).toHaveLength(2);

      const topTen = await getTopEntitiesByImportance(10);
      expect(topTen).toHaveLength(4); // Only 4 entities exist
    });
  });
});
