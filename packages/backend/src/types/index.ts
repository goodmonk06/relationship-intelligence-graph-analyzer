import { EntityType, RelationType } from '@prisma/client';

// Request/Response types for API

export interface CreateEntityRequest {
  type: EntityType;
  name: string;
  metaJson?: Record<string, any>;
}

export interface UpdateEntityRequest {
  name?: string;
  metaJson?: Record<string, any>;
}

export interface CreateRelationRequest {
  fromId: string;
  toId: string;
  relationType: RelationType;
  strength?: number;
  metaJson?: Record<string, any>;
}

export interface UpdateRelationRequest {
  relationType?: RelationType;
  strength?: number;
  metaJson?: Record<string, any>;
}

// Graph metrics types

export interface NodeMetrics {
  entityId: string;
  degree: number;
  inDegree: number;
  outDegree: number;
  importance: number; // Normalized score
  pageRank?: number;  // Optional: if implementing PageRank
}

export interface GraphMetrics {
  nodes: Record<string, NodeMetrics>;
  totalNodes: number;
  totalEdges: number;
  averageDegree: number;
  computedAt: Date;
}

// Entity with computed metrics
export interface EntityWithMetrics {
  id: string;
  type: EntityType;
  name: string;
  metaJson: Record<string, any> | null;
  metrics: NodeMetrics;
}

// Graph neighborhood for visualization
export interface GraphNeighborhood {
  centerEntity: {
    id: string;
    type: EntityType;
    name: string;
    metaJson: Record<string, any> | null;
  };
  entities: Array<{
    id: string;
    type: EntityType;
    name: string;
    metaJson: Record<string, any> | null;
  }>;
  relations: Array<{
    id: string;
    fromId: string;
    toId: string;
    relationType: RelationType;
    strength: number;
  }>;
}
