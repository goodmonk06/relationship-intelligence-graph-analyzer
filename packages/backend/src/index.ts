import Fastify from 'fastify';
import cors from '@fastify/cors';
import { entityRoutes } from './routes/entities';
import { relationRoutes } from './routes/relations';
import { metricsRoutes } from './routes/metrics';
import { tagRoutes } from './routes/tags';
import { noteRoutes } from './routes/notes';
import { activityRoutes } from './routes/activities';
import { segmentRoutes } from './routes/segments';
import { errorHandlerPlugin } from './lib/errorHandler';
import { logger } from './lib/logger';
import { metrics, MetricNames } from './lib/metrics';

const PORT = parseInt(process.env.PORT || '3001');
const HOST = process.env.HOST || '0.0.0.0';

export const fastify = Fastify({
  logger: false, // Use custom logger
});

// Request logging and metrics middleware
fastify.addHook('onRequest', async (request, reply) => {
  const startTime = Date.now();

  // Store start time for duration calculation
  (request as any).startTime = startTime;

  logger.info('Incoming request', {
    method: request.method,
    url: request.url,
    ip: request.ip,
  });
});

fastify.addHook('onResponse', async (request, reply) => {
  const duration = Date.now() - ((request as any).startTime || Date.now());

  logger.info('Request completed', {
    method: request.method,
    url: request.url,
    statusCode: reply.statusCode,
    duration,
  });

  // Record metrics
  metrics.incrementCounter(MetricNames.HTTP_REQUESTS, 1, {
    method: request.method,
    path: request.routerPath || request.url,
    status: reply.statusCode,
  });

  metrics.recordHistogram(MetricNames.HTTP_REQUEST_DURATION, duration, {
    method: request.method,
    path: request.routerPath || request.url,
  });
});

async function buildApp() {
  try {
    // Register error handler
    await fastify.register(errorHandlerPlugin);

    // Register CORS
    await fastify.register(cors, {
      origin: true, // Allow all origins in development
    });

    // Health check
    fastify.get('/health', async () => {
      return { status: 'ok', timestamp: new Date().toISOString() };
    });

    // Register routes
    await fastify.register(entityRoutes);
    await fastify.register(relationRoutes);
    await fastify.register(metricsRoutes);
    await fastify.register(tagRoutes);
    await fastify.register(noteRoutes);
    await fastify.register(activityRoutes);
    await fastify.register(segmentRoutes);

    return fastify;
  } catch (err) {
    logger.error('Failed to build app', err);
    throw err;
  }
}

async function start() {
  try {
    await buildApp();

    // Start server
    await fastify.listen({ port: PORT, host: HOST });
    logger.info('Server started', {
      port: PORT,
      host: HOST,
      url: `http://${HOST}:${PORT}`,
    });
    console.log(`🚀 Server running at http://${HOST}:${PORT}`);
    console.log(`📊 Health check: http://${HOST}:${PORT}/health`);
  } catch (err) {
    logger.error('Failed to start server', err);
    process.exit(1);
  }
}

// Start server if this is the main module
if (require.main === module) {
  start();
}

export { buildApp };
