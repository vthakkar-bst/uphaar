import { DecodedIdToken } from 'firebase-admin/auth';
import 'fastify';

declare module 'fastify' {
  interface FastifyRequest {
    user: DecodedIdToken;
  }
}
