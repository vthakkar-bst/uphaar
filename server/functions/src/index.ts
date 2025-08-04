import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin SDK
if (admin.apps.length === 0) {
  admin.initializeApp();
}

const firestore = admin.firestore;
const auth = admin.auth;

// Types
interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL: string;
  createdAt: any;
  updatedAt: any;
}

interface ItemBase {
  title: string;
  description: string;
  category: string;
  condition: string;
  imageUrls: string[];
  location: string;
  isAvailable: boolean;
  userId: string;
  createdAt: any;
  updatedAt: any;
}

interface Item extends ItemBase {
  id: string;
  claimCount: number;
  isGivenAway: boolean;
  claimedBy?: string;
  claimedAt?: any;
  completedAt?: any;
}

// Authentication middleware
const verifyToken = async (req: functions.https.Request): Promise<any> => {
  try {
    const authHeader = req.headers.authorization;

    const authHeaderValue = Array.isArray(authHeader) ? authHeader[0] : authHeader;
    if (!authHeaderValue || !authHeaderValue.startsWith('Bearer ')) {
      console.log('No auth header or invalid format');
      return null;
    }

    const token = authHeaderValue.split('Bearer ')[1];
    console.log('Verifying token:', token.substring(0, 10) + '...');

    const decodedToken = await auth().verifyIdToken(token);
    console.log('User authenticated:', decodedToken.uid);

    return decodedToken;
  } catch (error) {
    console.error('Auth error:', error);
    return null;
  }
};

// Route handlers
const handleGetAllItems = async (): Promise<{ statusCode: number; body: any }> => {
  try {
    const itemsSnapshot = await firestore()
      .collection('items')
      .where('isAvailable', '==', true)
      .orderBy('createdAt', 'desc')
      .get();

    const items: Item[] = [];
    itemsSnapshot.forEach((doc) => {
      items.push({id: doc.id, ...doc.data()} as Item);
    });

    return {statusCode: 200, body: {items}};
  } catch (error) {
    console.error('Error fetching items:', error);
    return {statusCode: 500, body: {error: 'Failed to fetch items'}};
  }
};

const handleGetUserItems = async (user: any): Promise<{ statusCode: number; body: any }> => {
  try {
    if (!user || !user.uid) {
      return {statusCode: 401, body: {error: 'Authentication required'}};
    }

    const itemsSnapshot = await firestore()
      .collection('items')
      .where('userId', '==', user.uid)
      .orderBy('createdAt', 'desc')
      .get();

    const items: Item[] = [];
    itemsSnapshot.forEach((doc) => {
      items.push({id: doc.id, ...doc.data()} as Item);
    });

    return {statusCode: 200, body: {items}};
  } catch (error) {
    console.error('Error fetching user items:', error);
    return {statusCode: 500, body: {error: 'Failed to fetch user items'}};
  }
};

const handleGetItem = async (itemId: string): Promise<{ statusCode: number; body: any }> => {
  try {
    const itemDoc = await firestore().collection('items').doc(itemId).get();

    if (!itemDoc.exists) {
      return {statusCode: 404, body: {error: 'Item not found'}};
    }

    const itemData = itemDoc.data();
    const item = {
      id: itemDoc.id,
      ...itemData,
      createdAt: itemData?.createdAt?.toDate?.()?.toISOString() || itemData?.createdAt,
      updatedAt: itemData?.updatedAt?.toDate?.()?.toISOString() || itemData?.updatedAt,
    };

    return {statusCode: 200, body: {item}};
  } catch (error) {
    console.error('Error fetching item:', error);
    return {statusCode: 500, body: {error: 'Failed to fetch item'}};
  }
};

const handleCreateItem = async (user: any, body: any): Promise<{ statusCode: number; body: any }> => {
  try {
    if (!user || !user.uid) {
      return {statusCode: 401, body: {error: 'Authentication required'}};
    }

    const newItem: ItemBase = {
      ...body,
      userId: user.uid,
      isAvailable: true,
      createdAt: firestore.Timestamp.now(),
      updatedAt: firestore.Timestamp.now(),
      claimCount: 0,
    };

    const docRef = await firestore().collection('items').add(newItem);
    const createdItem = {id: docRef.id, ...newItem} as Item;

    return {statusCode: 200, body: {item: createdItem}};
  } catch (error) {
    console.error('Error creating item:', error);
    return {statusCode: 500, body: {error: 'Failed to create item'}};
  }
};

const handleUpdateItem = async (user: any, itemId: string, body: any): Promise<{ statusCode: number; body: any }> => {
  try {
    if (!user || !user.uid) {
      return {statusCode: 401, body: {error: 'Authentication required'}};
    }

    const itemDoc = await firestore().collection('items').doc(itemId).get();

    if (!itemDoc.exists) {
      return {statusCode: 404, body: {error: 'Item not found'}};
    }

    const itemData = itemDoc.data();
    if (itemData?.userId !== user.uid) {
      return {statusCode: 403, body: {error: 'You can only update your own items'}};
    }

    const updatedItem = {
      ...body,
      userId: user.uid, // Ensure userId cannot be changed
      updatedAt: firestore.Timestamp.now(),
      createdAt: itemData?.createdAt, // Preserve original creation time
    };

    await firestore().collection('items').doc(itemId).update(updatedItem);

    const updatedItemWithId = {
      id: itemId,
      ...updatedItem,
      createdAt: updatedItem.createdAt?.toDate?.()?.toISOString() || updatedItem.createdAt,
      updatedAt: updatedItem.updatedAt?.toDate?.()?.toISOString() || updatedItem.updatedAt,
    };

    return {statusCode: 200, body: {item: updatedItemWithId}};
  } catch (error) {
    console.error('Error updating item:', error);
    return {statusCode: 500, body: {error: 'Failed to update item'}};
  }
};

const handleDeleteItem = async (user: any, itemId: string): Promise<{ statusCode: number; body: any }> => {
  try {
    if (!user || !user.uid) {
      return {statusCode: 401, body: {error: 'Authentication required'}};
    }

    const itemDoc = await firestore().collection('items').doc(itemId).get();

    if (!itemDoc.exists) {
      return {statusCode: 404, body: {error: 'Item not found'}};
    }

    const itemData = itemDoc.data();
    if (itemData?.userId !== user.uid) {
      return {statusCode: 403, body: {error: 'You can only delete your own items'}};
    }

    await firestore().collection('items').doc(itemId).delete();
    return {statusCode: 200, body: {success: true}};
  } catch (error) {
    console.error('Error deleting item:', error);
    return {statusCode: 500, body: {error: 'Failed to delete item'}};
  }
};

const handleClaimItem = async (user: any, itemId: string): Promise<{ statusCode: number; body: any }> => {
  try {
    if (!user || !user.uid) {
      return {statusCode: 401, body: {error: 'Authentication required'}};
    }

    const itemRef = firestore().collection('items').doc(itemId);
    const itemDoc = await itemRef.get();

    if (!itemDoc.exists) {
      return {statusCode: 404, body: {error: 'Item not found'}};
    }

    const itemData = itemDoc.data();

    // Check if item is available
    if (!itemData?.isAvailable) {
      return {statusCode: 400, body: {error: 'Item is no longer available'}};
    }

    // Check if user is trying to claim their own item
    if (itemData?.userId === user.uid) {
      return {statusCode: 400, body: {error: 'You cannot claim your own item'}};
    }

    // Check if item is already claimed by this user
    if (itemData?.claimedBy === user.uid) {
      return {statusCode: 400, body: {error: 'You have already claimed this item'}};
    }

    // Update item with claim information
    const updateData = {
      claimCount: (itemData?.claimCount || 0) + 1,
      claimedBy: user.uid,
      claimedAt: firestore.Timestamp.now(),
      isAvailable: false, // Mark as unavailable once claimed
      updatedAt: firestore.Timestamp.now(),
    };

    await itemRef.update(updateData);

    // Get updated item data
    const updatedDoc = await itemRef.get();
    const updatedItem = {
      id: updatedDoc.id,
      ...updatedDoc.data(),
    };

    return {statusCode: 200, body: {item: updatedItem, message: 'Item claimed successfully'}};
  } catch (error) {
    console.error('Error claiming item:', error);
    return {statusCode: 500, body: {error: 'Failed to claim item'}};
  }
};

const handleCompleteItem = async (user: any, itemId: string, body: any): Promise<{ statusCode: number; body: any }> => {
  try {
    if (!user || !user.uid) {
      return {statusCode: 401, body: {error: 'Authentication required'}};
    }

    const itemRef = firestore().collection('items').doc(itemId);
    const itemDoc = await itemRef.get();

    if (!itemDoc.exists) {
      return {statusCode: 404, body: {error: 'Item not found'}};
    }

    const itemData = itemDoc.data();
    // Check if user owns this item
    if (itemData?.userId !== user.uid) {
      return {statusCode: 403, body: {error: 'You can only complete your own items'}};
    }

    // Check if item is already completed
    if (itemData?.isGivenAway) {
      return {statusCode: 400, body: {error: 'Item is already marked as completed'}};
    }

    // Update item as completed
    const updateData: any = {
      isGivenAway: true,
      isAvailable: false,
      completedAt: firestore.Timestamp.now(),
      updatedAt: firestore.Timestamp.now(),
    };

    // If claimedByUserId is provided, use it; otherwise use existing claimedBy
    if (body.claimedByUserId) {
      updateData.claimedBy = body.claimedByUserId;
    }

    await itemRef.update(updateData);

    // Get updated item data
    const updatedDoc = await itemRef.get();
    const updatedItem = {
      id: updatedDoc.id,
      ...updatedDoc.data(),
    };

    return {statusCode: 200, body: {item: updatedItem, message: 'Item marked as completed successfully'}};
  } catch (error) {
    console.error('Error completing item:', error);
    return {statusCode: 500, body: {error: 'Failed to complete item'}};
  }
};

const handleCreateOrUpdateUserProfile = async (user: any): Promise<{ statusCode: number; body: any }> => {
  try {
    if (!user || !user.uid) {
      return {statusCode: 401, body: {error: 'Authentication required'}};
    }

    const userDoc = await firestore().collection('users').doc(user.uid).get();

    if (!userDoc.exists) {
      const userProfile: UserProfile = {
        uid: user.uid,
        displayName: user.name || '',
        email: user.email || '',
        photoURL: user.picture || '',
        createdAt: firestore.Timestamp.now(),
        updatedAt: firestore.Timestamp.now(),
      };

      await firestore().collection('users').doc(user.uid).set(userProfile);
      return {statusCode: 200, body: {profile: userProfile, isNew: true}};
    } else {
      const existingProfile = userDoc.data() as UserProfile;
      return {statusCode: 200, body: {profile: existingProfile, isNew: false}};
    }
  } catch (error) {
    console.error('Error creating/updating user profile:', error);
    return {statusCode: 500, body: {error: 'Failed to create/update user profile'}};
  }
};

const handleGetUser = async (userId: string): Promise<{ statusCode: number; body: any }> => {
  try {
    const userDoc = await firestore().collection('users').doc(userId).get();

    if (!userDoc.exists) {
      return {statusCode: 404, body: {error: 'User not found'}};
    }

    const userData = userDoc.data() as UserProfile;
    const userProfile = {
      uid: userDoc.id,
      ...userData,
    };

    return {statusCode: 200, body: {profile: userProfile}};
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return {statusCode: 500, body: {error: 'Failed to fetch user profile'}};
  }
};

const handleGetCurrentUserProfile = async (user: any): Promise<{ statusCode: number; body: any }> => {
  try {
    if (!user || !user.uid) {
      return {statusCode: 401, body: {error: 'Authentication required'}};
    }

    const userDoc = await firestore().collection('users').doc(user.uid).get();

    if (!userDoc.exists) {
      return {statusCode: 404, body: {error: 'User profile not found'}};
    }

    const userData = userDoc.data() as UserProfile;
    const userProfile = {
      uid: userDoc.id,
      ...userData,
    };

    return {statusCode: 200, body: {profile: userProfile}};
  } catch (error) {
    console.error('Error fetching current user profile:', error);
    return {statusCode: 500, body: {error: 'Failed to fetch user profile'}};
  }
};

// Main Firebase Function
export const api = functions.https.onRequest(async (req, res) => {
  // Set CORS headers
  const allowedOrigins = [
    'http://localhost:3000',
    'https://uphaar-41dc1.web.app',
    'https://uphaar-41dc1.firebaseapp.com',
  ];
  const origin = req.get('origin');
  if (allowedOrigins.includes(origin)) {
    res.set('Access-Control-Allow-Origin', origin);
  }
  res.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.set('Access-Control-Allow-Credentials', 'true');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  try {
    let user = null;

    // Debug logging
    console.log('Request method:', req.method);
    console.log('Request path:', req.path);
    console.log('Request URL:', req.url);

    // Verify authentication for protected routes
    if (req.path !== '/health') {
      user = await verifyToken(req);
    }

    let result: { statusCode: number; body: any };

    // Route handling
    if (req.method === 'GET' && req.path === '/health') {
      result = {statusCode: 200, body: {status: 'ok', timestamp: new Date().toISOString()}};
    } else if (req.method === 'GET' && req.path === '/items') {
      result = await handleGetAllItems();
    } else if (req.method === 'GET' && req.path === '/items/user') {
      result = await handleGetUserItems(user);
    } else if (req.method === 'GET' && req.path.startsWith('/items/') && req.path !== '/items/user') {
      const itemId = req.path.split('/').pop();
      if (itemId) {
        result = await handleGetItem(itemId);
      } else {
        result = {statusCode: 400, body: {error: 'Item ID required'}};
      }
    } else if (req.method === 'POST' && req.path === '/items') {
      result = await handleCreateItem(user, req.body);
    } else if (req.method === 'PUT' && req.path.startsWith('/items/')) {
      const itemId = req.path.split('/').pop();
      if (itemId) {
        result = await handleUpdateItem(user, itemId, req.body);
      } else {
        result = {statusCode: 400, body: {error: 'Item ID required'}};
      }
    } else if (req.method === 'DELETE' && req.path.startsWith('/items/')) {
      const itemId = req.path.split('/').pop();
      if (itemId) {
        result = await handleDeleteItem(user, itemId);
      } else {
        result = {statusCode: 400, body: {error: 'Item ID required'}};
      }
    } else if (req.method === 'POST' && req.path.match(/^\/items\/[^/]+\/claim$/)) {
      const pathParts = req.path.split('/');
      const itemId = pathParts[pathParts.length - 2]; // Get item ID from /items/{id}/claim
      if (itemId) {
        result = await handleClaimItem(user, itemId);
      } else {
        result = {statusCode: 400, body: {error: 'Item ID required'}};
      }
    } else if (req.method === 'POST' && req.path.match(/^\/items\/[^/]+\/complete$/)) {
      const pathParts = req.path.split('/');
      const itemId = pathParts[pathParts.length - 2]; // Get item ID from /items/{id}/complete
      if (itemId) {
        result = await handleCompleteItem(user, itemId, req.body);
      } else {
        result = {statusCode: 400, body: {error: 'Item ID required'}};
      }
    } else if (req.method === 'GET' && req.path === '/users/profile') {
      result = await handleGetCurrentUserProfile(user);
    } else if (req.method === 'POST' && req.path === '/users/profile') {
      result = await handleCreateOrUpdateUserProfile(user);
    } else if (req.method === 'GET' && req.path.startsWith('/users/') && req.path !== '/users/profile') {
      const userId = req.path.split('/').pop();
      if (userId) {
        result = await handleGetUser(userId);
      } else {
        result = {statusCode: 400, body: {error: 'User ID required'}};
      }
    } else {
      result = {statusCode: 404, body: {error: 'Route not found'}};
    }

    res.status(result.statusCode).json(result.body);
  } catch (error) {
    console.error('Firebase Function error:', error);
    res.status(500).json({error: 'Internal server error'});
  }
});
