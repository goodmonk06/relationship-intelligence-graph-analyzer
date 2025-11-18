/**
 * Simple in-memory event bus for domain events
 * Can be extended to use Redis, RabbitMQ, etc. in production
 */

import { EventType, DomainEvent, AnyDomainEvent } from './types';
import { logger } from '../lib/logger';

type EventHandler<T = any> = (event: DomainEvent<T>) => void | Promise<void>;

class EventBus {
  private handlers: Map<EventType, EventHandler[]> = new Map();

  /**
   * Subscribe to an event type
   */
  on<T = any>(eventType: EventType, handler: EventHandler<T>): void {
    const existing = this.handlers.get(eventType) || [];
    this.handlers.set(eventType, [...existing, handler as EventHandler]);

    logger.debug('Event handler registered', { eventType, handlersCount: existing.length + 1 });
  }

  /**
   * Unsubscribe from an event type
   */
  off<T = any>(eventType: EventType, handler: EventHandler<T>): void {
    const existing = this.handlers.get(eventType) || [];
    const filtered = existing.filter((h) => h !== handler);
    this.handlers.set(eventType, filtered);

    logger.debug('Event handler unregistered', { eventType, handlersCount: filtered.length });
  }

  /**
   * Publish an event
   */
  async emit(event: AnyDomainEvent): Promise<void> {
    const handlers = this.handlers.get(event.type) || [];

    logger.debug('Event emitted', {
      eventType: event.type,
      handlersCount: handlers.length,
    });

    // Execute all handlers in parallel
    await Promise.all(
      handlers.map(async (handler) => {
        try {
          await handler(event);
        } catch (error) {
          logger.error('Event handler error', error, {
            eventType: event.type,
            handler: handler.name,
          });
        }
      })
    );
  }

  /**
   * Get all registered event types
   */
  getEventTypes(): EventType[] {
    return Array.from(this.handlers.keys());
  }

  /**
   * Clear all handlers (useful for testing)
   */
  clear(): void {
    this.handlers.clear();
  }
}

// Export singleton instance
export const eventBus = new EventBus();
