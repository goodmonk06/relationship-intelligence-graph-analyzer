/**
 * Activity routes - vertical slice for activity/interaction tracking
 */

import { FastifyInstance } from 'fastify';
import { PrismaClient, ActivityType } from '@prisma/client';
import { z } from 'zod';
import { NotFoundError, ValidationError } from '../lib/errors';
import { logger } from '../lib/logger';
import { metrics } from '../lib/metrics';

const prisma = new PrismaClient();

// Validation schemas
const createActivitySchema = z.object({
  type: z.enum(['CALL', 'EMAIL', 'MEETING', 'NOTE', 'TASK', 'EVENT', 'OTHER']),
  title: z.string().min(1),
  description: z.string().optional(),
  fromId: z.string(),
  toId: z.string().optional(),
  occurredAt: z.string().datetime().transform((val) => new Date(val)),
  duration: z.number().int().positive().optional(),
  metaJson: z.record(z.any()).optional(),
});

const updateActivitySchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  occurredAt: z.string().datetime().transform((val) => new Date(val)).optional(),
  duration: z.number().int().positive().optional(),
  metaJson: z.record(z.any()).optional(),
});

export async function activityRoutes(fastify: FastifyInstance) {
  // Create an activity
  fastify.post('/activities', async (request, reply) => {
    const validatedData = createActivitySchema.parse(request.body);

    // Verify entities exist
    const fromEntity = await prisma.entity.findUnique({
      where: { id: validatedData.fromId },
    });
    if (!fromEntity) {
      throw new NotFoundError('Entity (from)', validatedData.fromId);
    }

    if (validatedData.toId) {
      const toEntity = await prisma.entity.findUnique({ where: { id: validatedData.toId } });
      if (!toEntity) {
        throw new NotFoundError('Entity (to)', validatedData.toId);
      }
    }

    const activity = await prisma.activity.create({
      data: validatedData,
    });

    logger.info('Activity created', { activityId: activity.id, type: activity.type });
    metrics.incrementCounter('activities_created_total', 1, { type: activity.type });

    reply.status(201).send(activity);
  });

  // Get all activities (with optional filtering)
  fastify.get<{ Querystring: { type?: string; fromId?: string; toId?: string; limit?: string } }>(
    '/activities',
    async (request, reply) => {
      const { type, fromId, toId, limit } = request.query;

      const activities = await prisma.activity.findMany({
        where: {
          type: type as ActivityType | undefined,
          fromId,
          toId,
        },
        include: {
          from: true,
          to: true,
        },
        orderBy: { occurredAt: 'desc' },
        take: limit ? parseInt(limit) : 100,
      });

      reply.send(activities);
    }
  );

  // Get activity by ID
  fastify.get<{ Params: { id: string } }>('/activities/:id', async (request, reply) => {
    const activity = await prisma.activity.findUnique({
      where: { id: request.params.id },
      include: {
        from: true,
        to: true,
      },
    });

    if (!activity) {
      throw new NotFoundError('Activity', request.params.id);
    }

    reply.send(activity);
  });

  // Get activity timeline for an entity
  fastify.get<{ Params: { entityId: string }; Querystring: { limit?: string } }>(
    '/activities/timeline/:entityId',
    async (request, reply) => {
      const { entityId } = request.params;
      const limit = request.query.limit ? parseInt(request.query.limit) : 50;

      const activities = await prisma.activity.findMany({
        where: {
          OR: [{ fromId: entityId }, { toId: entityId }],
        },
        include: {
          from: true,
          to: true,
        },
        orderBy: { occurredAt: 'desc' },
        take: limit,
      });

      reply.send(activities);
    }
  );

  // Update activity
  fastify.put<{ Params: { id: string } }>('/activities/:id', async (request, reply) => {
    const validatedData = updateActivitySchema.parse(request.body);

    const activity = await prisma.activity.update({
      where: { id: request.params.id },
      data: validatedData,
    });

    logger.info('Activity updated', { activityId: activity.id });

    reply.send(activity);
  });

  // Delete activity
  fastify.delete<{ Params: { id: string } }>('/activities/:id', async (request, reply) => {
    await prisma.activity.delete({
      where: { id: request.params.id },
    });

    logger.info('Activity deleted', { activityId: request.params.id });

    reply.status(204).send();
  });

  // Get activity statistics for an entity
  fastify.get<{ Params: { entityId: string } }>(
    '/activities/stats/:entityId',
    async (request, reply) => {
      const { entityId } = request.params;

      const [totalActivities, activityTypeBreakdown, recentActivities] = await Promise.all([
        prisma.activity.count({
          where: {
            OR: [{ fromId: entityId }, { toId: entityId }],
          },
        }),
        prisma.activity.groupBy({
          by: ['type'],
          where: {
            OR: [{ fromId: entityId }, { toId: entityId }],
          },
          _count: true,
        }),
        prisma.activity.findMany({
          where: {
            OR: [{ fromId: entityId }, { toId: entityId }],
          },
          orderBy: { occurredAt: 'desc' },
          take: 10,
          include: {
            from: true,
            to: true,
          },
        }),
      ]);

      reply.send({
        totalActivities,
        activityTypeBreakdown,
        recentActivities,
      });
    }
  );
}
