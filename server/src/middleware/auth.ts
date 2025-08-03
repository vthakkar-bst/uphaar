import { auth } from '../config/firebase';
import { HttpRequest } from '../types/http';

export const verifyToken = async (request: HttpRequest): Promise<HttpRequest> => {
  try {
    const authHeader = request.headers.authorization;
    
    const authHeaderValue = Array.isArray(authHeader) ? authHeader[0] : authHeader;
    if (!authHeaderValue || !authHeaderValue.startsWith('Bearer ')) {
      console.log('No auth header or invalid format');
      return request;
    }
    
    const token = authHeaderValue.split('Bearer ')[1];
    console.log('Verifying token:', token.substring(0, 10) + '...');
    
    const decodedToken = await auth().verifyIdToken(token);
    
    // Add user to request for use in route handlers
    request.user = decodedToken;
    console.log('User authenticated:', decodedToken.uid);
    
    return request;
  } catch (error) {
    console.error('Auth error:', error);
    return request;
  }
};
