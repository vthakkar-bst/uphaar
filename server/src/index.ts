import fastify, { FastifyInstance } from 'fastify';
import { config } from 'dotenv';
import { setupRoutes } from './srv/routes';
import { setupFirebase } from './config/firebase';

// Load environment variables
config();

const server: FastifyInstance = fastify({
  logger: true
});

// Register CORS
server.register(require('@fastify/cors'), {
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
});

// Initialize Firebase
setupFirebase();

// Setup routes
setupRoutes(server);

// Run the server
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

start();
