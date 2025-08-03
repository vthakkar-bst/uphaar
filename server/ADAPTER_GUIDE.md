# Uphaar Server - Multi-Adapter Architecture

This server supports both **Fastify** (for development) and **Firebase Functions** (for production) using the same business logic.

## Architecture Overview

```
src/
├── handlers/          # Pure business logic (framework-agnostic)
├── adapters/          # Framework-specific adapters
│   ├── fastify/       # Fastify server implementation
│   └── firebase/      # Firebase Functions implementation
├── middleware/        # Shared middleware logic
├── routes/           # Route definitions
├── config/           # Configuration
└── types/            # Shared types
```

## Running with Fastify (Development)

```bash
# Set environment variable (optional, default is fastify)
export ADAPTER_TYPE=fastify

# Start the server
npm start

# Server will run on http://localhost:8000
```

## Deploying with Firebase Functions (Production)

### 1. Setup Firebase Functions

```bash
# In the root project directory
firebase init functions

# Choose:
# - Use existing project: uphaar-41dc1
# - Language: TypeScript
# - Use ESLint: Yes
# - Install dependencies: Yes
```

### 2. Configure Functions

Create `functions/src/index.ts`:
```typescript
import { api } from '../../server/dist/functions';
export { api };
```

### 3. Deploy

```bash
# Build the server first
cd server && npm run build

# Deploy functions
firebase deploy --only functions
```

### 4. Update Client Configuration

Update your client's `.env` file:
```
REACT_APP_API_URL=https://us-central1-uphaar-41dc1.cloudfunctions.net
```

## Benefits of This Architecture

1. **Shared Business Logic**: All handlers, middleware, and business logic are reused
2. **Development Flexibility**: Use Fastify for fast local development
3. **Production Scalability**: Use Firebase Functions for automatic scaling
4. **Easy Switching**: Change adapters with a simple environment variable
5. **Type Safety**: Full TypeScript support across both adapters

## API Endpoints

Both adapters support the same endpoints:

- `GET /health` - Health check
- `POST /api/users/profile` - Create/update user profile
- `GET /api/users/:uid` - Get user profile
- `GET /api/items` - Get all items
- `GET /api/items/user` - Get current user's items
- `GET /api/items/:id` - Get specific item
- `POST /api/items` - Create new item
- `DELETE /api/items/:id` - Delete item

## Environment Variables

- `ADAPTER_TYPE`: `fastify` or `firebase` (default: `fastify`)
- `PORT`: Server port for Fastify (default: `8000`)
- `HOST`: Server host for Fastify (default: `0.0.0.0`)
- `CLIENT_URL`: Frontend URL for CORS (default: `http://localhost:3000`)
- Firebase configuration variables (same as before)
