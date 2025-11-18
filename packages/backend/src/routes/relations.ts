import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { CreateRelationRequest, UpdateRelationRequest } from '../types';

const prisma = new PrismaClient();

// Validation schemas
const createRelationSchema = z.object({
  fromId: z.string(),
  toId: z.string(),
  relationType: z.enum(['INTRODUCED_BY', 'WORKS_AT', 'INVOLVED_IN', 'REPORTS_TO', 'PARTNERS_WITH', 'BOUGHT_FROM', 'OTHER']),
  strength: z.number().min(0).max(1).optional().default(1.0),
  metaJson: z.record(z.any()).optional()
});

const updateRelationSchema = z.object({
  relationType: z.enum(['INTRODUCED_BY', 'WORKS_AT', 'INVOLVED_IN', 'REPORTS_TO', 'PARTNERS_WITH', 'BOUGHT_FROM', 'OTHER']).optional(),
  strength: z.number().min(0).max(1).optional(),
  metaJson: z.record(z.any()).optional()
});

export async function relationRoutes(fastify: FastifyInstance) {
  // Create relation
  fastify.post<{ Body: CreateRelationRequest }>('/relations', async (request, reply) => {
    try {
      const validatedData = createRelationSchema.parse(request.body);

      // Verify both entities exist
      const [fromEntity, toEntity] = await Promise.all([
        prisma.entity.findUnique({ where: { id: validatedData.fromId } }),
        prisma.entity.findUnique({ where: { id: validatedData.toId } })
      ]);

      if (!fromEntity || !toEntity) {
        reply.status(400).send({ error: 'One or both entities do not exist' });
        return;
      }

      const relation = await prisma.relation.create({
        data: {
          fromId: validatedData.fromId,
          toId: validatedData.toId,
          relationType: validatedData.relationType,
          strength: validatedData.strength,
          metaJson: validatedData.metaJson || null
        }
      });

      reply.status(201).send(relation);
    } catch (error) {
      if (error instanceof z.ZodError) {
        reply.status(400).send({ error: 'Validation error', details: error.errors });
      } else {
        reply.status(500).send({ error: 'Internal server error' });
      }
    }
  });

  // Get all relations with optional filters
  fastify.get<{ Querystring: { fromId?: string; toId?: string; relationType?: string } }>(
    '/relations',
    async (request, reply) => {
      try {
        const { fromId, toId, relationType } = request.query;

        const relations = await prisma.relation.findMany({
          where: {
            fromId: fromId || undefined,
            toId: toId || undefined,
            relationType: relationType as any
          },
          include: {
            from: true,
            to: true
          },
          orderBy: { createdAt: 'desc' }
        });

        reply.send(relations);
      } catch (error) {
        reply.status(500).send({ error: 'Internal server error' });
      }
    }
  );

  // Get relation by ID
  fastify.get<{ Params: { id: string } }>('/relations/:id', async (request, reply) => {
    try {
      const relation = await prisma.relation.findUnique({
        where: { id: request.params.id },
        include: {
          from: true,
          to: true
        }
      });

      if (!relation) {
        reply.status(404).send({ error: 'Relation not found' });
        return;
      }

      reply.send(relation);
    } catch (error) {
      reply.status(500).send({ error: 'Internal server error' });
    }
  });

  // Update relation
  fastify.put<{ Params: { id: string }; Body: UpdateRelationRequest }>(
    '/relations/:id',
    async (request, reply) => {
      try {
        const validatedData = updateRelationSchema.parse(request.body);

        const relation = await prisma.relation.update({
          where: { id: request.params.id },
          data: validatedData
        });

        reply.send(relation);
      } catch (error) {
        if (error instanceof z.ZodError) {
          reply.status(400).send({ error: 'Validation error', details: error.errors });
        } else {
          reply.status(404).send({ error: 'Relation not found' });
        }
      }
    }
  );

  // Delete relation
  fastify.delete<{ Params: { id: string } }>('/relations/:id', async (request, reply) => {
    try {
      await prisma.relation.delete({
        where: { id: request.params.id }
      });

      reply.status(204).send();
    } catch (error) {
      reply.status(404).send({ error: 'Relation not found' });
    }
  });

  // Upsert relation (by fromId, toId, and relationType)
  fastify.post<{ Body: CreateRelationRequest & { upsert?: boolean } }>(
    '/relations/upsert',
    async (request, reply) => {
      try {
        const validatedData = createRelationSchema.parse(request.body);

        // Try to find existing relation
        const existing = await prisma.relation.findFirst({
          where: {
            fromId: validatedData.fromId,
            toId: validatedData.toId,
            relationType: validatedData.relationType
          }
        });

        let relation;
        if (existing) {
          // Update existing
          relation = await prisma.relation.update({
            where: { id: existing.id },
            data: {
              strength: validatedData.strength,
              metaJson: validatedData.metaJson || existing.metaJson
            }
          });
        } else {
          // Create new
          relation = await prisma.relation.create({
            data: {
              fromId: validatedData.fromId,
              toId: validatedData.toId,
              relationType: validatedData.relationType,
              strength: validatedData.strength,
              metaJson: validatedData.metaJson || null
            }
          });
        }

        reply.status(existing ? 200 : 201).send(relation);
      } catch (error) {
        if (error instanceof z.ZodError) {
          reply.status(400).send({ error: 'Validation error', details: error.errors });
        } else {
          reply.status(500).send({ error: 'Internal server error' });
        }
      }
    }
  );
}
