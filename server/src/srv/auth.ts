import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { auth } from '../config/firebase';

interface AuthRequest {
  idToken: string;
}

/**
 * Authentication related routes
 * @param fastify - Fastify instance
 * @param options - Route options
 */
export const authRoutes = async (fastify: FastifyInstance): Promise<void> => {
  // Middleware to verify Firebase ID token
  const verifyToken = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const authHeader = request.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        reply.code(401).send({ error: 'Unauthorized: No token provided' });
        return;
      }
      
      const idToken = authHeader.split('Bearer ')[1];
      const decodedToken = await auth().verifyIdToken(idToken);
      
      // Add user to request for use in route handlers
      request.user = decodedToken;
    } catch (error) {
      reply.code(401).send({ error: 'Unauthorized: Invalid token' });
    }
  };

  // Register the auth middleware
  fastify.addHook('preHandler', verifyToken);

  // Verify token and return user data
  fastify.post<{ Body: AuthRequest }>('/verify', {
    // Skip the global auth middleware for this route
    preHandler: (_request, _reply, done) => done(),
    handler: async (request, reply) => {
      try {
        const { idToken } = request.body;
        
        if (!idToken) {
          return reply.code(400).send({ error: 'ID token is required' });
        }
        
        const decodedToken = await auth().verifyIdToken(idToken);
        const user = await auth().getUser(decodedToken.uid);
        
        return {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL
        };
      } catch (error) {
        console.error('Error verifying token:', error);
        return reply.code(401).send({ error: 'Invalid token' });
      }
    }
  });

  // Get current user profile
  fastify.get('/me', async (request, reply) => {
    try {
      const user = (request as any).user;
      return { user };
    } catch (error) {
      console.error('Error getting user profile:', error);
      return reply.code(500).send({ error: 'Server error' });
    }
  });
};
