/**
 * Note routes - vertical slice for note management
 */

import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { NotFoundError } from '../lib/errors';
import { logger } from '../lib/logger';

const prisma = new PrismaClient();

// Validation schemas
const createNoteSchema = z.object({
  content: z.string().min(1),
  author: z.string().optional(),
});

const updateNoteSchema = z.object({
  content: z.string().min(1),
});

export async function noteRoutes(fastify: FastifyInstance) {
  // Create a note for an entity
  fastify.post<{ Params: { entityId: string } }>(
    '/entities/:entityId/notes',
    async (request, reply) => {
      const { entityId } = request.params;
      const validatedData = createNoteSchema.parse(request.body);

      // Verify entity exists
      const entity = await prisma.entity.findUnique({ where: { id: entityId } });
      if (!entity) {
        throw new NotFoundError('Entity', entityId);
      }

      const note = await prisma.note.create({
        data: {
          entityId,
          content: validatedData.content,
          author: validatedData.author,
        },
      });

      logger.info('Note created', { noteId: note.id, entityId });

      reply.status(201).send(note);
    }
  );

  // Get all notes for an entity
  fastify.get<{ Params: { entityId: string } }>(
    '/entities/:entityId/notes',
    async (request, reply) => {
      const { entityId } = request.params;

      const notes = await prisma.note.findMany({
        where: { entityId },
        orderBy: { createdAt: 'desc' },
      });

      reply.send(notes);
    }
  );

  // Get a specific note
  fastify.get<{ Params: { id: string } }>('/notes/:id', async (request, reply) => {
    const note = await prisma.note.findUnique({
      where: { id: request.params.id },
      include: { entity: true },
    });

    if (!note) {
      throw new NotFoundError('Note', request.params.id);
    }

    reply.send(note);
  });

  // Update a note
  fastify.put<{ Params: { id: string } }>('/notes/:id', async (request, reply) => {
    const validatedData = updateNoteSchema.parse(request.body);

    const note = await prisma.note.update({
      where: { id: request.params.id },
      data: { content: validatedData.content },
    });

    logger.info('Note updated', { noteId: note.id });

    reply.send(note);
  });

  // Delete a note
  fastify.delete<{ Params: { id: string } }>('/notes/:id', async (request, reply) => {
    await prisma.note.delete({
      where: { id: request.params.id },
    });

    logger.info('Note deleted', { noteId: request.params.id });

    reply.status(204).send();
  });
}
