// Framework-agnostic HTTP types
export interface HttpRequest {
  method: string;
  url: string;
  headers: Record<string, string | string[] | undefined>;
  body?: any;
  params?: Record<string, string>;
  query?: Record<string, string>;
  user?: any; // Authenticated user from middleware
}

export interface HttpResponse {
  statusCode: number;
  headers?: Record<string, string>;
  body: any;
}

export type HttpHandler = (request: HttpRequest) => Promise<HttpResponse>;

export interface RouteDefinition {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  handler: HttpHandler;
  requiresAuth?: boolean;
}
