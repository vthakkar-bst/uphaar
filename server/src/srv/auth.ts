import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { auth } from '../config/firebase';

interface AuthRequest {
  idToken: string;
}

// Authentication middleware that can be used by any route
export const verifyFirebaseToken = async (request: FastifyRequest, _reply: FastifyReply) => {
  try {
    const authHeader = request.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('No auth header or invalid format');
      // Continue without user
      return;
    }
    
    const idToken = authHeader.split('Bearer ')[1];
    console.log('Verifying token:', idToken.substring(0, 10) + '...');
    
    const decodedToken = await auth().verifyIdToken(idToken);
    
    // Add user to request for use in route handlers
    request.user = decodedToken;
    console.log('User authenticated:', decodedToken.uid);
  } catch (error) {
    console.error('Auth error:', error);
    // Continue without user
  }
};

/**
 * Authentication related routes
 * @param fastify - Fastify instance
 * @param options - Route options
 */
export const authRoutes = async (fastify: FastifyInstance): Promise<void> => {
  // Register the auth middleware for all auth routes
  fastify.addHook('preHandler', verifyFirebaseToken);

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
