/**
 * Segment routes - vertical slice for entity segmentation
 */

import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { NotFoundError, ValidationError } from '../lib/errors';
import { logger } from '../lib/logger';

const prisma = new PrismaClient();

// Validation schemas
const createSegmentSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  criteria: z.record(z.any()).optional(),
  isStatic: z.boolean().default(true),
});

const updateSegmentSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  criteria: z.record(z.any()).optional(),
});

const addMembersSchema = z.object({
  entityIds: z.array(z.string()),
});

export async function segmentRoutes(fastify: FastifyInstance) {
  // Create a segment
  fastify.post('/segments', async (request, reply) => {
    const validatedData = createSegmentSchema.parse(request.body);

    const segment = await prisma.segment.create({
      data: validatedData,
    });

    logger.info('Segment created', { segmentId: segment.id, name: segment.name });

    reply.status(201).send(segment);
  });

  // Get all segments
  fastify.get('/segments', async (request, reply) => {
    const segments = await prisma.segment.findMany({
      include: {
        _count: {
          select: { members: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const enrichedSegments = segments.map((segment) => ({
      ...segment,
      memberCount: segment._count.members,
      _count: undefined,
    }));

    reply.send(enrichedSegments);
  });

  // Get segment by ID
  fastify.get<{ Params: { id: string } }>('/segments/:id', async (request, reply) => {
    const segment = await prisma.segment.findUnique({
      where: { id: request.params.id },
      include: {
        members: {
          include: {
            entity: true,
          },
          orderBy: {
            addedAt: 'desc',
          },
        },
      },
    });

    if (!segment) {
      throw new NotFoundError('Segment', request.params.id);
    }

    reply.send(segment);
  });

  // Update segment
  fastify.put<{ Params: { id: string } }>('/segments/:id', async (request, reply) => {
    const validatedData = updateSegmentSchema.parse(request.body);

    const segment = await prisma.segment.update({
      where: { id: request.params.id },
      data: validatedData,
    });

    logger.info('Segment updated', { segmentId: segment.id });

    reply.send(segment);
  });

  // Delete segment
  fastify.delete<{ Params: { id: string } }>('/segments/:id', async (request, reply) => {
    await prisma.segment.delete({
      where: { id: request.params.id },
    });

    logger.info('Segment deleted', { segmentId: request.params.id });

    reply.status(204).send();
  });

  // Add entities to segment
  fastify.post<{ Params: { segmentId: string } }>(
    '/segments/:segmentId/members',
    async (request, reply) => {
      const { segmentId } = request.params;
      const { entityIds } = addMembersSchema.parse(request.body);

      // Verify segment exists
      const segment = await prisma.segment.findUnique({ where: { id: segmentId } });
      if (!segment) {
        throw new NotFoundError('Segment', segmentId);
      }

      // Verify all entities exist
      const entities = await prisma.entity.findMany({
        where: { id: { in: entityIds } },
      });

      if (entities.length !== entityIds.length) {
        throw new ValidationError('One or more entities not found');
      }

      // Add entities to segment (upsert to handle duplicates)
      const members = await Promise.all(
        entityIds.map((entityId) =>
          prisma.segmentMember.upsert({
            where: {
              segmentId_entityId: { segmentId, entityId },
            },
            create: { segmentId, entityId },
            update: {},
          })
        )
      );

      logger.info('Members added to segment', { segmentId, memberCount: entityIds.length });

      reply.status(201).send(members);
    }
  );

  // Remove entity from segment
  fastify.delete<{ Params: { segmentId: string; entityId: string } }>(
    '/segments/:segmentId/members/:entityId',
    async (request, reply) => {
      const { segmentId, entityId } = request.params;

      await prisma.segmentMember.deleteMany({
        where: {
          segmentId,
          entityId,
        },
      });

      logger.info('Member removed from segment', { segmentId, entityId });

      reply.status(204).send();
    }
  );

  // Get entities in a segment
  fastify.get<{ Params: { segmentId: string } }>(
    '/segments/:segmentId/entities',
    async (request, reply) => {
      const { segmentId } = request.params;

      const members = await prisma.segmentMember.findMany({
        where: { segmentId },
        include: {
          entity: true,
        },
        orderBy: {
          addedAt: 'desc',
        },
      });

      const entities = members.map((member) => ({
        ...member.entity,
        addedAt: member.addedAt,
      }));

      reply.send(entities);
    }
  );
}
