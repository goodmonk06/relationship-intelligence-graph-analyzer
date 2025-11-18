import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { CreateEntityRequest, UpdateEntityRequest } from '../types';

const prisma = new PrismaClient();

// Validation schemas
const createEntitySchema = z.object({
  type: z.enum(['ACCOUNT', 'CONTACT', 'DEAL', 'ORG', 'OTHER']),
  name: z.string().min(1),
  metaJson: z.record(z.any()).optional()
});

const updateEntitySchema = z.object({
  name: z.string().min(1).optional(),
  metaJson: z.record(z.any()).optional()
});

export async function entityRoutes(fastify: FastifyInstance) {
  // Create entity
  fastify.post<{ Body: CreateEntityRequest }>('/entities', async (request, reply) => {
    try {
      const validatedData = createEntitySchema.parse(request.body);

      const entity = await prisma.entity.create({
        data: {
          type: validatedData.type,
          name: validatedData.name,
          metaJson: validatedData.metaJson || null
        }
      });

      reply.status(201).send(entity);
    } catch (error) {
      if (error instanceof z.ZodError) {
        reply.status(400).send({ error: 'Validation error', details: error.errors });
      } else {
        reply.status(500).send({ error: 'Internal server error' });
      }
    }
  });

  // Get all entities with optional type filter
  fastify.get<{ Querystring: { type?: string } }>('/entities', async (request, reply) => {
    try {
      const { type } = request.query;

      const entities = await prisma.entity.findMany({
        where: type ? { type: type as any } : undefined,
        orderBy: { createdAt: 'desc' }
      });

      reply.send(entities);
    } catch (error) {
      reply.status(500).send({ error: 'Internal server error' });
    }
  });

  // Get entity by ID
  fastify.get<{ Params: { id: string } }>('/entities/:id', async (request, reply) => {
    try {
      const entity = await prisma.entity.findUnique({
        where: { id: request.params.id },
        include: {
          relationsFrom: true,
          relationsTo: true
        }
      });

      if (!entity) {
        reply.status(404).send({ error: 'Entity not found' });
        return;
      }

      reply.send(entity);
    } catch (error) {
      reply.status(500).send({ error: 'Internal server error' });
    }
  });

  // Update entity
  fastify.put<{ Params: { id: string }; Body: UpdateEntityRequest }>(
    '/entities/:id',
    async (request, reply) => {
      try {
        const validatedData = updateEntitySchema.parse(request.body);

        const entity = await prisma.entity.update({
          where: { id: request.params.id },
          data: validatedData
        });

        reply.send(entity);
      } catch (error) {
        if (error instanceof z.ZodError) {
          reply.status(400).send({ error: 'Validation error', details: error.errors });
        } else {
          reply.status(404).send({ error: 'Entity not found' });
        }
      }
    }
  );

  // Delete entity
  fastify.delete<{ Params: { id: string } }>('/entities/:id', async (request, reply) => {
    try {
      await prisma.entity.delete({
        where: { id: request.params.id }
      });

      reply.status(204).send();
    } catch (error) {
      reply.status(404).send({ error: 'Entity not found' });
    }
  });

  // Upsert entity (by name and type)
  fastify.post<{ Body: CreateEntityRequest & { upsert?: boolean } }>(
    '/entities/upsert',
    async (request, reply) => {
      try {
        const validatedData = createEntitySchema.parse(request.body);

        // Try to find existing entity with same name and type
        const existing = await prisma.entity.findFirst({
          where: {
            name: validatedData.name,
            type: validatedData.type
          }
        });

        let entity;
        if (existing) {
          // Update existing
          entity = await prisma.entity.update({
            where: { id: existing.id },
            data: {
              metaJson: validatedData.metaJson || existing.metaJson
            }
          });
        } else {
          // Create new
          entity = await prisma.entity.create({
            data: {
              type: validatedData.type,
              name: validatedData.name,
              metaJson: validatedData.metaJson || null
            }
          });
        }

        reply.status(existing ? 200 : 201).send(entity);
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
