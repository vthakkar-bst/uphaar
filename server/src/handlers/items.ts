import { firestore } from '../config/firebase';
import { HttpRequest, HttpResponse } from '../types/http';

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
}

export const getAllItems = async (_request: HttpRequest): Promise<HttpResponse> => {
  try {
    const itemsSnapshot = await firestore()
      .collection('items')
      .where('isAvailable', '==', true)
      .orderBy('createdAt', 'desc')
      .get();

    const items: Item[] = [];
    itemsSnapshot.forEach(doc => {
      items.push({ id: doc.id, ...doc.data() } as Item);
    });

    return {
      statusCode: 200,
      body: { items }
    };
  } catch (error) {
    console.error('Error fetching items:', error);
    return {
      statusCode: 500,
      body: { error: 'Failed to fetch items' }
    };
  }
};

export const getItemById = async (request: HttpRequest): Promise<HttpResponse> => {
  try {
    const { id } = request.params || {};
    
    if (!id) {
      return {
        statusCode: 400,
        body: { error: 'Item ID is required' }
      };
    }

    const itemDoc = await firestore().collection('items').doc(id).get();
    
    if (!itemDoc.exists) {
      return {
        statusCode: 404,
        body: { error: 'Item not found' }
      };
    }

    const itemData = { id: itemDoc.id, ...itemDoc.data() } as Item;
    return {
      statusCode: 200,
      body: { item: itemData }
    };
  } catch (error) {
    console.error('Error fetching item:', error);
    return {
      statusCode: 500,
      body: { error: 'Failed to fetch item' }
    };
  }
};

export const createItem = async (request: HttpRequest): Promise<HttpResponse> => {
  try {
    const user = request.user;
    
    if (!user || !user.uid) {
      return {
        statusCode: 401,
        body: { error: 'Authentication required' }
      };
    }

    const itemData = request.body;
    
    const newItem: ItemBase = {
      ...itemData,
      userId: user.uid,
      isAvailable: true,
      createdAt: firestore.Timestamp.now(),
      updatedAt: firestore.Timestamp.now(),
      claimCount: 0
    };

    const docRef = await firestore().collection('items').add(newItem);
    const createdItem = { id: docRef.id, ...newItem } as Item;

    return {
      statusCode: 200,
      body: { item: createdItem }
    };
  } catch (error) {
    console.error('Error creating item:', error);
    return {
      statusCode: 500,
      body: { error: 'Failed to create item' }
    };
  }
};

export const getUserItems = async (request: HttpRequest): Promise<HttpResponse> => {
  try {
    const user = request.user;
    
    if (!user || !user.uid) {
      return {
        statusCode: 401,
        body: { error: 'Authentication required' }
      };
    }

    const itemsSnapshot = await firestore()
      .collection('items')
      .where('userId', '==', user.uid)
      .orderBy('createdAt', 'desc')
      .get();

    const items: Item[] = [];
    itemsSnapshot.forEach(doc => {
      items.push({ id: doc.id, ...doc.data() } as Item);
    });

    return {
      statusCode: 200,
      body: { items }
    };
  } catch (error) {
    console.error('Error fetching user items:', error);
    return {
      statusCode: 500,
      body: { error: 'Failed to fetch user items' }
    };
  }
};

export const deleteItem = async (request: HttpRequest): Promise<HttpResponse> => {
  try {
    const { id } = request.params || {};
    const user = request.user;
    
    if (!user || !user.uid) {
      return {
        statusCode: 401,
        body: { error: 'Authentication required' }
      };
    }

    if (!id) {
      return {
        statusCode: 400,
        body: { error: 'Item ID is required' }
      };
    }

    // Get the item to check ownership
    const itemDoc = await firestore().collection('items').doc(id).get();
    
    if (!itemDoc.exists) {
      return {
        statusCode: 404,
        body: { error: 'Item not found' }
      };
    }

    const itemData = itemDoc.data();
    if (itemData?.userId !== user.uid) {
      return {
        statusCode: 403,
        body: { error: 'You can only delete your own items' }
      };
    }

    await firestore().collection('items').doc(id).delete();

    return {
      statusCode: 200,
      body: { success: true }
    };
  } catch (error) {
    console.error('Error deleting item:', error);
    return {
      statusCode: 500,
      body: { error: 'Failed to delete item' }
    };
  }
};
