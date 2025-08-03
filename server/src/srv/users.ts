import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { firestore } from '../config/firebase';
import { verifyFirebaseToken } from './auth';

interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
  phone?: string;
  address?: string;
  bio?: string;
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
}

interface UpdateProfileRequest {
  Body: {
    displayName?: string;
    phone?: string;
    address?: string;
    bio?: string;
    photoURL?: string;
  };
}

/**
 * User related routes
 * @param fastify - Fastify instance
 */
export const userRoutes = async (fastify: FastifyInstance): Promise<void> => {
  // Apply the authentication middleware to all user routes
  fastify.addHook('preHandler', verifyFirebaseToken);
  // Get user profile
  fastify.get('/:uid', async (request: FastifyRequest<{ Params: { uid: string } }>, reply: FastifyReply) => {
    try {
      const { uid } = request.params;
      
      // Get user from Firestore
      const userDoc = await firestore().collection('users').doc(uid).get();
      
      if (!userDoc.exists) {
        return reply.code(404).send({ error: 'User not found' });
      }
      
      const userData = userDoc.data() as UserProfile;
      
      // Return only public information
      return {
        uid: userData.uid,
        displayName: userData.displayName,
        photoURL: userData.photoURL,
        bio: userData.bio
      };
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return reply.code(500).send({ error: 'Failed to fetch user profile' });
    }
  });

  // Update user profile
  fastify.put<UpdateProfileRequest>('/profile', async (request, reply) => {
    try {
      const user = (request as any).user;
      const updateData = request.body;
      
      // Update in Firestore
      await firestore().collection('users').doc(user.uid).update({
        ...updateData,
        updatedAt: firestore.Timestamp.now()
      });
      
      // Get updated profile
      const updatedDoc = await firestore().collection('users').doc(user.uid).get();
      const updatedProfile = updatedDoc.data() as UserProfile;
      
      return { profile: updatedProfile };
    } catch (error) {
      console.error('Error updating user profile:', error);
      return reply.code(500).send({ error: 'Failed to update user profile' });
    }
  });

  // Create or update user profile after authentication
  fastify.post('/profile', async (request, reply) => {
    try {
      const user = (request as any).user;
      
      // Check if user exists in the request (authentication successful)
      if (!user || !user.uid) {
        console.error('Error creating/updating user profile: User not authenticated');
        return reply.code(401).send({ error: 'Authentication required' });
      }
      
      // Check if user already exists in database
      const userDoc = await firestore().collection('users').doc(user.uid).get();
      
      if (!userDoc.exists) {
        // Create new user profile
        const userProfile: UserProfile = {
          uid: user.uid,
          displayName: user.name || '',
          email: user.email || '',
          photoURL: user.picture || '',
          createdAt: firestore.Timestamp.now(),
          updatedAt: firestore.Timestamp.now()
        };
        
        await firestore().collection('users').doc(user.uid).set(userProfile);
        return { profile: userProfile, isNew: true };
      } else {
        // Return existing profile
        const existingProfile = userDoc.data() as UserProfile;
        return { profile: existingProfile, isNew: false };
      }
    } catch (error) {
      console.error('Error creating/updating user profile:', error);
      return reply.code(500).send({ error: 'Failed to process user profile' });
    }
  });

  // Get user statistics
  fastify.get('/stats/:uid', async (request: FastifyRequest<{ Params: { uid: string } }>, reply: FastifyReply) => {
    try {
      const { uid } = request.params;
      
      // Count items given by user
      const givenItemsSnapshot = await firestore()
        .collection('items')
        .where('userId', '==', uid)
        .where('isAvailable', '==', false)
        .get();
      
      // Count items currently offered by user
      const offeredItemsSnapshot = await firestore()
        .collection('items')
        .where('userId', '==', uid)
        .where('isAvailable', '==', true)
        .get();
      
      return {
        givenItemsCount: givenItemsSnapshot.size,
        offeredItemsCount: offeredItemsSnapshot.size
      };
    } catch (error) {
      console.error('Error fetching user stats:', error);
      return reply.code(500).send({ error: 'Failed to fetch user statistics' });
    }
  });
};
