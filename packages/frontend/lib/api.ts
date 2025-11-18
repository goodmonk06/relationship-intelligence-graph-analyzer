import { EntityWithMetrics, GraphNeighborhood, GraphMetrics } from './types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export async function fetchTopEntities(limit: number = 10): Promise<EntityWithMetrics[]> {
  const response = await fetch(`${API_URL}/metrics/top-entities?limit=${limit}`);
  if (!response.ok) {
    throw new Error('Failed to fetch top entities');
  }
  return response.json();
}

export async function fetchGraphMetrics(): Promise<GraphMetrics> {
  const response = await fetch(`${API_URL}/metrics/latest`);
  if (!response.ok) {
    throw new Error('Failed to fetch graph metrics');
  }
  return response.json();
}

export async function computeMetrics(): Promise<GraphMetrics> {
  const response = await fetch(`${API_URL}/metrics/compute`, {
    method: 'POST',
  });
  if (!response.ok) {
    throw new Error('Failed to compute metrics');
  }
  return response.json();
}

export async function fetchNeighborhood(entityId: string): Promise<GraphNeighborhood> {
  const response = await fetch(`${API_URL}/metrics/neighborhood/${entityId}`);
  if (!response.ok) {
    throw new Error('Failed to fetch neighborhood');
  }
  return response.json();
}
