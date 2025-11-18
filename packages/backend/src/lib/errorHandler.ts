/**
 * Fastify error handler plugin
 */

import { FastifyInstance, FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { ZodError } from 'zod';
import { AppError, ValidationError, formatErrorResponse, ErrorCode } from './errors';
import { logger } from './logger';
import { metrics, MetricNames } from './metrics';

export async function errorHandlerPlugin(fastify: FastifyInstance) {
  fastify.setErrorHandler(
    (error: FastifyError | AppError | Error, request: FastifyRequest, reply: FastifyReply) => {
      // Log the error
      logger.error('Request error', error, {
        method: request.method,
        url: request.url,
        ip: request.ip,
      });

      // Increment error metric
      metrics.incrementCounter(MetricNames.ERRORS, 1, {
        method: request.method,
        path: request.routerPath || request.url,
      });

      // Handle Zod validation errors
      if (error instanceof ZodError) {
        const validationError = new ValidationError('Validation failed', error.errors);
        return reply.status(validationError.statusCode).send(formatErrorResponse(validationError));
      }

      // Handle custom AppError
      if (error instanceof AppError) {
        return reply.status(error.statusCode).send(formatErrorResponse(error));
      }

      // Handle Fastify validation errors
      if ((error as FastifyError).validation) {
        const validationError = new ValidationError(
          'Request validation failed',
          (error as FastifyError).validation
        );
        return reply.status(validationError.statusCode).send(formatErrorResponse(validationError));
      }

      // Handle Prisma errors
      if (error.name === 'PrismaClientKnownRequestError') {
        const prismaError = error as any;
        if (prismaError.code === 'P2002') {
          const validationError = new ValidationError('Unique constraint violation', {
            fields: prismaError.meta?.target,
          });
          return reply
            .status(validationError.statusCode)
            .send(formatErrorResponse(validationError));
        }
        if (prismaError.code === 'P2025') {
          const appError = new AppError(
            ErrorCode.NOT_FOUND,
            'Record not found',
            404,
            prismaError.meta
          );
          return reply.status(appError.statusCode).send(formatErrorResponse(appError));
        }
      }

      // Default to 500 Internal Server Error
      const statusCode = (error as FastifyError).statusCode || 500;
      const internalError = new AppError(
        ErrorCode.INTERNAL_ERROR,
        process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message,
        statusCode,
        process.env.NODE_ENV === 'development' ? { stack: error.stack } : undefined
      );

      return reply.status(internalError.statusCode).send(formatErrorResponse(internalError));
    }
  );
}
