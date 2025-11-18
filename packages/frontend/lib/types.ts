export enum EntityType {
  ACCOUNT = 'ACCOUNT',
  CONTACT = 'CONTACT',
  DEAL = 'DEAL',
  ORG = 'ORG',
  OTHER = 'OTHER',
}

export enum RelationType {
  INTRODUCED_BY = 'INTRODUCED_BY',
  WORKS_AT = 'WORKS_AT',
  INVOLVED_IN = 'INVOLVED_IN',
  REPORTS_TO = 'REPORTS_TO',
  PARTNERS_WITH = 'PARTNERS_WITH',
  BOUGHT_FROM = 'BOUGHT_FROM',
  OTHER = 'OTHER',
}

export interface Entity {
  id: string;
  type: EntityType;
  name: string;
  metaJson: Record<string, any> | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface Relation {
  id: string;
  fromId: string;
  toId: string;
  relationType: RelationType;
  strength: number;
  metaJson?: Record<string, any> | null;
  createdAt?: string;
}

export interface NodeMetrics {
  entityId: string;
  degree: number;
  inDegree: number;
  outDegree: number;
  importance: number;
}

export interface EntityWithMetrics extends Entity {
  metrics: NodeMetrics;
}

export interface GraphNeighborhood {
  centerEntity: Entity;
  entities: Entity[];
  relations: Relation[];
}

export interface GraphMetrics {
  nodes: Record<string, NodeMetrics>;
  totalNodes: number;
  totalEdges: number;
  averageDegree: number;
  computedAt: string;
}
