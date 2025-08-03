import * as functions from 'firebase-functions';
import { setupFirebase } from '../../config/firebase';
import { routes } from '../../routes';
import { verifyToken } from '../../middleware/auth';
import { HttpRequest, RouteDefinition } from '../../types/http';

// Initialize Firebase
setupFirebase();

// Convert Firebase Functions request to our HttpRequest format
const convertFirebaseRequest = (req: functions.https.Request): HttpRequest => {
  return {
    method: req.method,
    url: req.url,
    headers: req.headers as Record<string, string>,
    body: req.body,
    params: {}, // Will be populated by route matching
    query: req.query as Record<string, string>
  };
};

// Simple route matcher
const matchRoute = (requestPath: string, routePath: string): { match: boolean; params: Record<string, string> } => {
  const requestSegments = requestPath.split('/').filter(Boolean);
  const routeSegments = routePath.split('/').filter(Boolean);
  
  if (requestSegments.length !== routeSegments.length) {
    return { match: false, params: {} };
  }
  
  const params: Record<string, string> = {};
  
  for (let i = 0; i < routeSegments.length; i++) {
    const routeSegment = routeSegments[i];
    const requestSegment = requestSegments[i];
    
    if (routeSegment.startsWith(':')) {
      // This is a parameter
      const paramName = routeSegment.slice(1);
      params[paramName] = requestSegment;
    } else if (routeSegment !== requestSegment) {
      // Segments don't match
      return { match: false, params: {} };
    }
  }
  
  return { match: true, params };
};

// Main Firebase Function
export const api = functions.https.onRequest(async (req, res) => {
  // Set CORS headers
  res.set('Access-Control-Allow-Origin', process.env.CLIENT_URL || 'http://localhost:3000');
  res.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.set('Access-Control-Allow-Credentials', 'true');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }
  
  try {
    // Find matching route
    let matchedRoute: RouteDefinition | null = null;
    let routeParams: Record<string, string> = {};
    
    for (const route of routes) {
      if (route.method === req.method) {
        const { match, params } = matchRoute(req.path, route.path);
        if (match) {
          matchedRoute = route;
          routeParams = params;
          break;
        }
      }
    }
    
    if (!matchedRoute) {
      res.status(404).json({ error: 'Route not found' });
      return;
    }
    
    let httpRequest = convertFirebaseRequest(req);
    httpRequest.params = routeParams;
    
    // Apply auth middleware if required
    if (matchedRoute.requiresAuth) {
      httpRequest = await verifyToken(httpRequest);
    }
    
    const response = await matchedRoute.handler(httpRequest);
    
    if (response.headers) {
      Object.entries(response.headers).forEach(([key, value]) => {
        res.set(key, value);
      });
    }
    
    res.status(response.statusCode).json(response.body);
  } catch (error) {
    console.error('Firebase Function error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
