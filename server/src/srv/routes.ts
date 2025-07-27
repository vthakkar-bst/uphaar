import { FastifyInstance } from 'fastify';
import { authRoutes } from './auth';
import { itemRoutes } from './items';
import { userRoutes } from './users';

/**
 * Setup all API routes
 * @param server - Fastify server instance
 */
export const setupRoutes = (server: FastifyInstance): void => {
  // Health check endpoint
  server.get('/health', async () => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  });

  // Register route modules
  server.register(authRoutes, { prefix: '/api/auth' });
  server.register(itemRoutes, { prefix: '/api/items' });
  server.register(userRoutes, { prefix: '/api/users' });
};
