import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
import {
  computeGraphMetrics,
  getLatestMetrics,
  getEntityMetrics,
  getTopEntitiesByImportance
} from '../services/graphMetrics';
import { GraphNeighborhood } from '../types';

const prisma = new PrismaClient();

export async function metricsRoutes(fastify: FastifyInstance) {
  // Compute new metrics snapshot
  fastify.post('/metrics/compute', async (request, reply) => {
    try {
      const metrics = await computeGraphMetrics();
      reply.send(metrics);
    } catch (error) {
      reply.status(500).send({ error: 'Failed to compute metrics' });
    }
  });

  // Get latest metrics snapshot
  fastify.get('/metrics/latest', async (request, reply) => {
    try {
      let metrics = await getLatestMetrics();

      if (!metrics) {
        // Compute if none exists
        metrics = await computeGraphMetrics();
      }

      reply.send(metrics);
    } catch (error) {
      reply.status(500).send({ error: 'Failed to retrieve metrics' });
    }
  });

  // Get metrics for a specific entity
  fastify.get<{ Params: { entityId: string } }>(
    '/metrics/entity/:entityId',
    async (request, reply) => {
      try {
        const metrics = await getEntityMetrics(request.params.entityId);

        if (!metrics) {
          reply.status(404).send({ error: 'Entity not found or no metrics available' });
          return;
        }

        reply.send(metrics);
      } catch (error) {
        reply.status(500).send({ error: 'Failed to retrieve entity metrics' });
      }
    }
  );

  // Get top entities by importance
  fastify.get<{ Querystring: { limit?: string } }>(
    '/metrics/top-entities',
    async (request, reply) => {
      try {
        const limit = parseInt(request.query.limit || '10');
        const topEntities = await getTopEntitiesByImportance(limit);

        // Enrich with entity details
        const entityIds = topEntities.map(e => e.entityId);
        const entities = await prisma.entity.findMany({
          where: { id: { in: entityIds } }
        });

        const entityMap = new Map(entities.map(e => [e.id, e]));

        const enrichedResults = topEntities
          .map(item => {
            const entity = entityMap.get(item.entityId);
            if (!entity) return null;

            return {
              id: entity.id,
              type: entity.type,
              name: entity.name,
              metaJson: entity.metaJson,
              metrics: item.metrics
            };
          })
          .filter(Boolean);

        reply.send(enrichedResults);
      } catch (error) {
        reply.status(500).send({ error: 'Failed to retrieve top entities' });
      }
    }
  );

  // Get graph neighborhood for an entity (for visualization)
  fastify.get<{ Params: { entityId: string }; Querystring: { depth?: string } }>(
    '/metrics/neighborhood/:entityId',
    async (request, reply) => {
      try {
        const { entityId } = request.params;
        const depth = parseInt(request.query.depth || '1');

        // Get center entity
        const centerEntity = await prisma.entity.findUnique({
          where: { id: entityId }
        });

        if (!centerEntity) {
          reply.status(404).send({ error: 'Entity not found' });
          return;
        }

        // Get immediate neighbors (depth 1 for now)
        const relationsFrom = await prisma.relation.findMany({
          where: { fromId: entityId },
          include: { to: true }
        });

        const relationsTo = await prisma.relation.findMany({
          where: { toId: entityId },
          include: { from: true }
        });

        // Collect unique entities
        const entityMap = new Map();
        entityMap.set(centerEntity.id, centerEntity);

        relationsFrom.forEach(r => entityMap.set(r.to.id, r.to));
        relationsTo.forEach(r => entityMap.set(r.from.id, r.from));

        // Collect all relations in neighborhood
        const neighborIds = Array.from(entityMap.keys());
        const allRelations = await prisma.relation.findMany({
          where: {
            OR: [
              { fromId: { in: neighborIds }, toId: { in: neighborIds } }
            ]
          }
        });

        const neighborhood: GraphNeighborhood = {
          centerEntity: {
            id: centerEntity.id,
            type: centerEntity.type,
            name: centerEntity.name,
            metaJson: centerEntity.metaJson as any
          },
          entities: Array.from(entityMap.values()).map(e => ({
            id: e.id,
            type: e.type,
            name: e.name,
            metaJson: e.metaJson as any
          })),
          relations: allRelations.map(r => ({
            id: r.id,
            fromId: r.fromId,
            toId: r.toId,
            relationType: r.relationType,
            strength: r.strength
          }))
        };

        reply.send(neighborhood);
      } catch (error) {
        reply.status(500).send({ error: 'Failed to retrieve neighborhood' });
      }
    }
  );
}
