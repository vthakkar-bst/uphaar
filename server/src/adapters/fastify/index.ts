import fastify, { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { config } from 'dotenv';
import { setupFirebase } from '../../config/firebase';
import { routes } from '../../routes';
import { verifyToken } from '../../middleware/auth';
import { HttpRequest, RouteDefinition } from '../../types/http';

// Load environment variables
config();

const server: FastifyInstance = fastify({
  logger: true
});

// Register CORS
server.register(require('@fastify/cors'), {
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS']
});

// Initialize Firebase
setupFirebase();

// Convert Fastify request to our HttpRequest format
const convertFastifyRequest = (request: FastifyRequest): HttpRequest => {
  return {
    method: request.method,
    url: request.url,
    headers: request.headers as Record<string, string>,
    body: request.body,
    params: request.params as Record<string, string>,
    query: request.query as Record<string, string>
  };
};

// Register routes
routes.forEach((route: RouteDefinition) => {
  const { method, path, handler, requiresAuth } = route;
  
  const fastifyHandler = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      let httpRequest = convertFastifyRequest(request);
      
      // Apply auth middleware if required
      if (requiresAuth) {
        httpRequest = await verifyToken(httpRequest);
      }
      
      const response = await handler(httpRequest);
      
      if (response.headers) {
        Object.entries(response.headers).forEach(([key, value]) => {
          reply.header(key, value);
        });
      }
      
      return reply.code(response.statusCode).send(response.body);
    } catch (error) {
      console.error('Route handler error:', error);
      return reply.code(500).send({ error: 'Internal server error' });
    }
  };

  // Register the route with Fastify
  switch (method.toLowerCase()) {
    case 'get':
      server.get(path, fastifyHandler);
      break;
    case 'post':
      server.post(path, fastifyHandler);
      break;
    case 'put':
      server.put(path, fastifyHandler);
      break;
    case 'delete':
      server.delete(path, fastifyHandler);
      break;
    case 'patch':
      server.patch(path, fastifyHandler);
      break;
  }
});

// Start server
const start = async () => {
  try {
    const port = process.env.PORT ? parseInt(process.env.PORT) : 8000;
    const host = process.env.HOST || '0.0.0.0';
    
    await server.listen({ port, host });
    console.log(`Server is running on ${host}:${port}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

export { start, server };
