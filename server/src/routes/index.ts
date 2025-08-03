import { RouteDefinition } from '../types/http';
import * as userHandlers from '../handlers/users';
import * as itemHandlers from '../handlers/items';

export const routes: RouteDefinition[] = [
  // Health check
  {
    method: 'GET',
    path: '/health',
    handler: async () => ({
      statusCode: 200,
      body: { status: 'ok', timestamp: new Date().toISOString() }
    })
  },

  // User routes
  {
    method: 'GET',
    path: '/api/users/:uid',
    handler: userHandlers.getUserProfile,
    requiresAuth: true
  },
  {
    method: 'POST',
    path: '/api/users/profile',
    handler: userHandlers.createOrUpdateUserProfile,
    requiresAuth: true
  },

  // Item routes
  {
    method: 'GET',
    path: '/api/items',
    handler: itemHandlers.getAllItems,
    requiresAuth: true
  },
  {
    method: 'GET',
    path: '/api/items/user',
    handler: itemHandlers.getUserItems,
    requiresAuth: true
  },
  {
    method: 'GET',
    path: '/api/items/:id',
    handler: itemHandlers.getItemById,
    requiresAuth: true
  },
  {
    method: 'POST',
    path: '/api/items',
    handler: itemHandlers.createItem,
    requiresAuth: true
  },
  {
    method: 'DELETE',
    path: '/api/items/:id',
    handler: itemHandlers.deleteItem,
    requiresAuth: true
  }
];
