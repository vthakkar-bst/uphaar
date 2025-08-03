import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { firestore } from '../config/firebase';
import { verifyFirebaseToken } from './auth';



// Define types for item data
interface ItemBase {
  title: string;
  description: string;
  imageUrls: string[];
  location: string;
  contactPhone?: string;
  contactEmail?: string;
  category: string;
  condition: 'new' | 'like-new' | 'good' | 'fair' | 'poor';
  isFree: boolean;
  price?: number;
}

interface Item extends ItemBase {
  id: string;
  userId: string;
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
  isAvailable: boolean;
  claimCount: number;
  claimedBy?: string;
  claimedAt?: FirebaseFirestore.Timestamp;
}

interface CreateItemRequest {
  Body: ItemBase;
}

interface UpdateItemRequest {
  Params: {
    id: string;
  };
  Body: Partial<ItemBase>;
}

interface ClaimItemRequest {
  Params: {
    id: string;
  };
}

/**
 * Item related routes
 * @param fastify - Fastify instance
 */
export const itemRoutes = async (fastify: FastifyInstance): Promise<void> => {
  // Apply the authentication middleware to all item routes
  fastify.addHook('preHandler', verifyFirebaseToken);
  // Get all available items
  fastify.get('/', async (_request: FastifyRequest, reply: FastifyReply) => {
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

      return { items };
    } catch (error) {
      console.error('Error fetching items:', error);
      return reply.code(500).send({ error: 'Failed to fetch items' });
    }
  });

  // Get a single item by ID
  fastify.get('/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const { id } = request.params;
      const itemDoc = await firestore().collection('items').doc(id).get();

      if (!itemDoc.exists) {
        return reply.code(404).send({ error: 'Item not found' });
      }

      const item = { id: itemDoc.id, ...itemDoc.data() } as Item;
      return { item };
    } catch (error) {
      console.error('Error fetching item:', error);
      return reply.code(500).send({ error: 'Failed to fetch item' });
    }
  });

  // Create a new item
  fastify.post<CreateItemRequest>('/', async (request, reply) => {
    try {
      const user = (request as any).user;
      const itemData = request.body;
      
      const newItem = {
        ...itemData,
        userId: user.uid,
        createdAt: firestore.Timestamp.now(),
        updatedAt: firestore.Timestamp.now(),
        isAvailable: true,
        claimCount: 0
      };

      const docRef = await firestore().collection('items').add(newItem);
      const createdItem = { id: docRef.id, ...newItem } as Item;

      return { item: createdItem };
    } catch (error) {
      console.error('Error creating item:', error);
      return reply.code(500).send({ error: 'Failed to create item' });
    }
  });

  // Update an item
  fastify.put<UpdateItemRequest>('/:id', async (request, reply) => {
    try {
      const { id } = request.params;
      const user = (request as any).user;
      const updateData = request.body;

      // Get the item to check ownership
      const itemDoc = await firestore().collection('items').doc(id).get();
      
      if (!itemDoc.exists) {
        return reply.code(404).send({ error: 'Item not found' });
      }

      const itemData = itemDoc.data();
      if (itemData?.userId !== user.uid) {
        return reply.code(403).send({ error: 'Not authorized to update this item' });
      }

      // Update the item
      await firestore().collection('items').doc(id).update({
        ...updateData,
        updatedAt: firestore.Timestamp.now()
      });

      // Get the updated item
      const updatedItemDoc = await firestore().collection('items').doc(id).get();
      const updatedItem = { id: updatedItemDoc.id, ...updatedItemDoc.data() } as Item;

      return { item: updatedItem };
    } catch (error) {
      console.error('Error updating item:', error);
      return reply.code(500).send({ error: 'Failed to update item' });
    }
  });

  // Delete an item
  fastify.delete('/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const { id } = request.params;
      const user = (request as any).user;

      // Get the item to check ownership
      const itemDoc = await firestore().collection('items').doc(id).get();
      
      if (!itemDoc.exists) {
        return reply.code(404).send({ error: 'Item not found' });
      }

      const itemData = itemDoc.data();
      if (itemData?.userId !== user.uid) {
        return reply.code(403).send({ error: 'Not authorized to delete this item' });
      }

      // Delete the item
      await firestore().collection('items').doc(id).delete();

      return { success: true, message: 'Item deleted successfully' };
    } catch (error) {
      console.error('Error deleting item:', error);
      return reply.code(500).send({ error: 'Failed to delete item' });
    }
  });

  // Claim an item
  fastify.post<ClaimItemRequest>('/:id/claim', async (request, reply) => {
    try {
      const { id } = request.params;
      const user = (request as any).user;

      // Get the item
      const itemDoc = await firestore().collection('items').doc(id).get();
      
      if (!itemDoc.exists) {
        return reply.code(404).send({ error: 'Item not found' });
      }

      const itemData = itemDoc.data();
      
      // Check if item is available
      if (!itemData?.isAvailable) {
        return reply.code(400).send({ error: 'Item is no longer available' });
      }

      // Check if user is trying to claim their own item
      if (itemData?.userId === user.uid) {
        return reply.code(400).send({ error: 'You cannot claim your own item' });
      }

      // Update the claim count
      await firestore().collection('items').doc(id).update({
        claimCount: firestore.FieldValue.increment(1)
      });

      return { success: true, message: 'Claim registered successfully' };
    } catch (error) {
      console.error('Error claiming item:', error);
      return reply.code(500).send({ error: 'Failed to claim item' });
    }
  });

  // Mark an item as completed/given away
  fastify.post<{
    Params: { id: string };
    Body: { claimedBy?: string };
  }>('/:id/complete', async (request, reply) => {
    try {
      const { id } = request.params;
      const { claimedBy } = request.body;
      const userId = request.user.uid;

      // Get the item
      const itemRef = firestore().collection('items').doc(id);
      const itemDoc = await itemRef.get();

      if (!itemDoc.exists) {
        return reply.code(404).send({ error: 'Item not found' });
      }

      const itemData = itemDoc.data();
      if (itemData?.userId !== userId) {
        return reply.code(403).send({ error: 'You can only complete your own items' });
      }

      // Update the item
      await itemRef.update({
        isAvailable: false,
        claimedBy: claimedBy || null,
        completedAt: firestore.Timestamp.now(),
        updatedAt: firestore.Timestamp.now(),
      });

      return reply.send({ success: true });
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({ error: 'Failed to complete item' });
    }
  });

  // Mark an item as given away
  fastify.post<{
    Params: { id: string };
  }>('/:id/given', async (request, reply) => {
    try {
      const { id } = request.params;
      const userId = request.user.uid;

      // Get the item
      const itemRef = firestore().collection('items').doc(id);
      const itemDoc = await itemRef.get();

      if (!itemDoc.exists) {
        return reply.code(404).send({ error: 'Item not found' });
      }

      const itemData = itemDoc.data();
      if (itemData?.userId !== userId) {
        return reply.code(403).send({ error: 'You can only mark your own items as given away' });
      }

      // Update the item
      await itemRef.update({
        isGivenAway: true,
        isAvailable: false,
        givenAwayAt: firestore.Timestamp.now(),
        updatedAt: firestore.Timestamp.now(),
      });

      return reply.send({ success: true });
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({ error: 'Failed to mark item as given away' });
    }
  });

  // Get current authenticated user's items
  fastify.get('/user', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const user = (request as any).user;
      
      if (!user || !user.uid) {
        return reply.code(401).send({ error: 'Authentication required' });
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

      return { items };
    } catch (error) {
      console.error('Error fetching user items:', error);
      return reply.code(500).send({ error: 'Failed to fetch user items' });
    }
  });

  // Get items by user ID
  fastify.get('/user/:userId', async (request: FastifyRequest<{ Params: { userId: string } }>, reply: FastifyReply) => {
    try {
      const { userId } = request.params;
      const itemsSnapshot = await firestore()
        .collection('items')
        .where('userId', '==', userId)
        .orderBy('createdAt', 'desc')
        .get();

      const items: Item[] = [];
      itemsSnapshot.forEach(doc => {
        items.push({ id: doc.id, ...doc.data() } as Item);
      });

      return { items };
    } catch (error) {
      console.error('Error fetching user items:', error);
      return reply.code(500).send({ error: 'Failed to fetch user items' });
    }
  });
};
