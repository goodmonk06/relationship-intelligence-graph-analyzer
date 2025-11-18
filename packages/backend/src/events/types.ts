/**
 * Domain event types for the event system
 */

import { Entity, Relation, Activity, Tag } from '@prisma/client';

export enum EventType {
  ENTITY_CREATED = 'entity.created',
  ENTITY_UPDATED = 'entity.updated',
  ENTITY_DELETED = 'entity.deleted',
  RELATION_CREATED = 'relation.created',
  RELATION_UPDATED = 'relation.updated',
  RELATION_DELETED = 'relation.deleted',
  ACTIVITY_CREATED = 'activity.created',
  TAG_APPLIED = 'tag.applied',
  TAG_REMOVED = 'tag.removed',
  METRICS_COMPUTED = 'metrics.computed',
}

export interface DomainEvent<T = any> {
  type: EventType;
  timestamp: Date;
  data: T;
  metadata?: Record<string, any>;
}

export interface EntityCreatedEvent extends DomainEvent<Entity> {
  type: EventType.ENTITY_CREATED;
}

export interface EntityUpdatedEvent extends DomainEvent<Entity> {
  type: EventType.ENTITY_UPDATED;
}

export interface EntityDeletedEvent extends DomainEvent<{ id: string }> {
  type: EventType.ENTITY_DELETED;
}

export interface RelationCreatedEvent extends DomainEvent<Relation> {
  type: EventType.RELATION_CREATED;
}

export interface ActivityCreatedEvent extends DomainEvent<Activity> {
  type: EventType.ACTIVITY_CREATED;
}

export interface TagAppliedEvent extends DomainEvent<{ entityId: string; tagId: string }> {
  type: EventType.TAG_APPLIED;
}

export interface MetricsComputedEvent extends DomainEvent<{ nodeCount: number; edgeCount: number }> {
  type: EventType.METRICS_COMPUTED;
}

export type AnyDomainEvent =
  | EntityCreatedEvent
  | EntityUpdatedEvent
  | EntityDeletedEvent
  | RelationCreatedEvent
  | ActivityCreatedEvent
  | TagAppliedEvent
  | MetricsComputedEvent;
