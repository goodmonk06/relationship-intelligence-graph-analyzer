/**
 * Tag routes - vertical slice for tag management
 */

import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { NotFoundError, ValidationError } from '../lib/errors';
import { logger } from '../lib/logger';
import { metrics, MetricNames } from '../lib/metrics';

const prisma = new PrismaClient();

// Validation schemas
const createTagSchema = z.object({
  name: z.string().min(1).max(50),
  description: z.string().optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
});

const updateTagSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  description: z.string().optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
});

const applyTagsSchema = z.object({
  tagIds: z.array(z.string()),
});

export async function tagRoutes(fastify: FastifyInstance) {
  // Create a tag
  fastify.post('/tags', async (request, reply) => {
    const validatedData = createTagSchema.parse(request.body);

    const tag = await prisma.tag.create({
      data: validatedData,
    });

    logger.info('Tag created', { tagId: tag.id, name: tag.name });
    metrics.incrementCounter('tags_created_total', 1);

    reply.status(201).send(tag);
  });

  // Get all tags
  fastify.get('/tags', async (request, reply) => {
    const tags = await prisma.tag.findMany({
      include: {
        _count: {
          select: { entityTags: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    const enrichedTags = tags.map((tag) => ({
      ...tag,
      entityCount: tag._count.entityTags,
      _count: undefined,
    }));

    reply.send(enrichedTags);
  });

  // Get tag by ID
  fastify.get<{ Params: { id: string } }>('/tags/:id', async (request, reply) => {
    const tag = await prisma.tag.findUnique({
      where: { id: request.params.id },
      include: {
        entityTags: {
          include: {
            entity: true,
          },
        },
      },
    });

    if (!tag) {
      throw new NotFoundError('Tag', request.params.id);
    }

    reply.send(tag);
  });

  // Update tag
  fastify.put<{ Params: { id: string } }>('/tags/:id', async (request, reply) => {
    const validatedData = updateTagSchema.parse(request.body);

    const tag = await prisma.tag.update({
      where: { id: request.params.id },
      data: validatedData,
    });

    logger.info('Tag updated', { tagId: tag.id });

    reply.send(tag);
  });

  // Delete tag
  fastify.delete<{ Params: { id: string } }>('/tags/:id', async (request, reply) => {
    await prisma.tag.delete({
      where: { id: request.params.id },
    });

    logger.info('Tag deleted', { tagId: request.params.id });

    reply.status(204).send();
  });

  // Apply tags to an entity
  fastify.post<{ Params: { entityId: string } }>(
    '/entities/:entityId/tags',
    async (request, reply) => {
      const { entityId } = request.params;
      const { tagIds } = applyTagsSchema.parse(request.body);

      // Verify entity exists
      const entity = await prisma.entity.findUnique({ where: { id: entityId } });
      if (!entity) {
        throw new NotFoundError('Entity', entityId);
      }

      // Verify all tags exist
      const tags = await prisma.tag.findMany({
        where: { id: { in: tagIds } },
      });

      if (tags.length !== tagIds.length) {
        throw new ValidationError('One or more tags not found');
      }

      // Create entity-tag relationships (upsert to handle duplicates)
      const entityTags = await Promise.all(
        tagIds.map((tagId) =>
          prisma.entityTag.upsert({
            where: {
              entityId_tagId: { entityId, tagId },
            },
            create: { entityId, tagId },
            update: {},
          })
        )
      );

      logger.info('Tags applied to entity', { entityId, tagCount: tagIds.length });

      reply.status(201).send(entityTags);
    }
  );

  // Remove a tag from an entity
  fastify.delete<{ Params: { entityId: string; tagId: string } }>(
    '/entities/:entityId/tags/:tagId',
    async (request, reply) => {
      const { entityId, tagId } = request.params;

      await prisma.entityTag.deleteMany({
        where: {
          entityId,
          tagId,
        },
      });

      logger.info('Tag removed from entity', { entityId, tagId });

      reply.status(204).send();
    }
  );

  // Get all entities with a specific tag
  fastify.get<{ Params: { tagId: string } }>(
    '/tags/:tagId/entities',
    async (request, reply) => {
      const { tagId } = request.params;

      const entityTags = await prisma.entityTag.findMany({
        where: { tagId },
        include: {
          entity: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      const entities = entityTags.map((et) => et.entity);

      reply.send(entities);
    }
  );
}
