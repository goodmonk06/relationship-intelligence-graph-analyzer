import { PrismaClient } from '@prisma/client';
import { GraphMetrics, NodeMetrics } from '../types';

const prisma = new PrismaClient();

/**
 * Computes graph metrics for all entities in the database
 * Calculates: degree, inDegree, outDegree, and importance score
 */
export async function computeGraphMetrics(): Promise<GraphMetrics> {
  // Fetch all entities and relations
  const [entities, relations] = await Promise.all([
    prisma.entity.findMany({ select: { id: true } }),
    prisma.relation.findMany({ select: { fromId: true, toId: true, strength: true } })
  ]);

  const totalNodes = entities.length;
  const totalEdges = relations.length;

  // Initialize metrics for each node
  const nodeMetrics: Record<string, NodeMetrics> = {};

  entities.forEach(entity => {
    nodeMetrics[entity.id] = {
      entityId: entity.id,
      degree: 0,
      inDegree: 0,
      outDegree: 0,
      importance: 0
    };
  });

  // Count degrees
  relations.forEach(relation => {
    const { fromId, toId, strength } = relation;

    if (nodeMetrics[fromId]) {
      nodeMetrics[fromId].outDegree += 1;
      nodeMetrics[fromId].degree += 1;
    }

    if (nodeMetrics[toId]) {
      nodeMetrics[toId].inDegree += 1;
      nodeMetrics[toId].degree += 1;
    }
  });

  // Calculate importance score
  // Simple approach: normalize degree by max degree, weighted by relation strength
  const maxDegree = Math.max(...Object.values(nodeMetrics).map(m => m.degree), 1);

  Object.values(nodeMetrics).forEach(metrics => {
    // Importance = normalized degree score
    // Could be enhanced with PageRank, betweenness centrality, etc.
    metrics.importance = metrics.degree / maxDegree;
  });

  const averageDegree = totalNodes > 0 ? totalEdges * 2 / totalNodes : 0;

  const graphMetrics: GraphMetrics = {
    nodes: nodeMetrics,
    totalNodes,
    totalEdges,
    averageDegree,
    computedAt: new Date()
  };

  // Save snapshot to database
  await prisma.graphMetricSnapshot.create({
    data: {
      metricsJson: nodeMetrics as any
    }
  });

  return graphMetrics;
}

/**
 * Get the latest computed metrics from the database
 */
export async function getLatestMetrics(): Promise<GraphMetrics | null> {
  const snapshot = await prisma.graphMetricSnapshot.findFirst({
    orderBy: { createdAt: 'desc' }
  });

  if (!snapshot) {
    return null;
  }

  const metricsJson = snapshot.metricsJson as Record<string, NodeMetrics>;
  const nodeCount = Object.keys(metricsJson).length;

  // Calculate total edges and average degree from metrics
  let totalDegreeSum = 0;
  Object.values(metricsJson).forEach(m => {
    totalDegreeSum += m.degree;
  });

  const totalEdges = totalDegreeSum / 2; // Each edge counted twice
  const averageDegree = nodeCount > 0 ? totalDegreeSum / nodeCount : 0;

  return {
    nodes: metricsJson,
    totalNodes: nodeCount,
    totalEdges,
    averageDegree,
    computedAt: snapshot.createdAt
  };
}

/**
 * Get metrics for a specific entity
 */
export async function getEntityMetrics(entityId: string): Promise<NodeMetrics | null> {
  const latest = await getLatestMetrics();

  if (!latest || !latest.nodes[entityId]) {
    // Compute on-the-fly if no snapshot exists
    const metrics = await computeGraphMetrics();
    return metrics.nodes[entityId] || null;
  }

  return latest.nodes[entityId];
}

/**
 * Get top N entities by importance score
 */
export async function getTopEntitiesByImportance(limit: number = 10): Promise<Array<{ entityId: string; metrics: NodeMetrics }>> {
  let metrics = await getLatestMetrics();

  if (!metrics) {
    metrics = await computeGraphMetrics();
  }

  const ranked = Object.values(metrics.nodes)
    .sort((a, b) => b.importance - a.importance)
    .slice(0, limit)
    .map(m => ({
      entityId: m.entityId,
      metrics: m
    }));

  return ranked;
}
