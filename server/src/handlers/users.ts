import { firestore } from '../config/firebase';
import { HttpRequest, HttpResponse } from '../types/http';

interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL: string;
  createdAt: any;
  updatedAt: any;
}

export const getUserProfile = async (request: HttpRequest): Promise<HttpResponse> => {
  try {
    const { uid } = request.params || {};
    
    if (!uid) {
      return {
        statusCode: 400,
        body: { error: 'User ID is required' }
      };
    }

    const userDoc = await firestore().collection('users').doc(uid).get();
    
    if (!userDoc.exists) {
      return {
        statusCode: 404,
        body: { error: 'User not found' }
      };
    }

    const userData = userDoc.data() as UserProfile;
    return {
      statusCode: 200,
      body: { profile: userData }
    };
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return {
      statusCode: 500,
      body: { error: 'Failed to fetch user profile' }
    };
  }
};

export const createOrUpdateUserProfile = async (request: HttpRequest): Promise<HttpResponse> => {
  try {
    const user = request.user;
    
    // Check if user exists in the request (authentication successful)
    if (!user || !user.uid) {
      console.error('Error creating/updating user profile: User not authenticated');
      return {
        statusCode: 401,
        body: { error: 'Authentication required' }
      };
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
      return {
        statusCode: 200,
        body: { profile: userProfile, isNew: true }
      };
    } else {
      // Return existing profile
      const existingProfile = userDoc.data() as UserProfile;
      return {
        statusCode: 200,
        body: { profile: existingProfile, isNew: false }
      };
    }
  } catch (error) {
    console.error('Error creating/updating user profile:', error);
    return {
      statusCode: 500,
      body: { error: 'Failed to create/update user profile' }
    };
  }
};
