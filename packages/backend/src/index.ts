import Fastify from 'fastify';
import cors from '@fastify/cors';
import { entityRoutes } from './routes/entities';
import { relationRoutes } from './routes/relations';
import { metricsRoutes } from './routes/metrics';

const PORT = parseInt(process.env.PORT || '3001');
const HOST = process.env.HOST || '0.0.0.0';

const fastify = Fastify({
  logger: {
    level: process.env.LOG_LEVEL || 'info'
  }
});

async function start() {
  try {
    // Register CORS
    await fastify.register(cors, {
      origin: true // Allow all origins in development
    });

    // Health check
    fastify.get('/health', async () => {
      return { status: 'ok', timestamp: new Date().toISOString() };
    });

    // Register routes
    await fastify.register(entityRoutes);
    await fastify.register(relationRoutes);
    await fastify.register(metricsRoutes);

    // Start server
    await fastify.listen({ port: PORT, host: HOST });
    console.log(`🚀 Server running at http://${HOST}:${PORT}`);
    console.log(`📊 Health check: http://${HOST}:${PORT}/health`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

start();
