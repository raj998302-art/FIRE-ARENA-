# FIRE ARENA MAX Backend

This is the backend component of the FIRE ARENA MAX real-money esports platform.

## Features

- User authentication and authorization with JWT
- Role-based access control (RBAC) with fine-grained permissions
- Wallet system with secure ledger
- Razorpay payment integration with signature verification
- Tournament engine with solo/duo/squad modes
- Real-time chat with WebSocket support
- VIP subscription system
- Comprehensive admin panel
- Team system
- Notification system
- Audit logging for security and compliance
- Anti-fraud detection
- Rate limiting and security hardening

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- PostgreSQL (v13 or higher)
- Redis (optional, for caching and rate limiting)

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file based on `.env.example`
4. Set up your database:
   ```bash
   createdb fire_arena_max
   ```

5. Run the seed script to create initial data:
   ```bash
   npm run seed
   ```

6. Start the server:
   ```bash
   npm start
   ```

   For development:
   ```bash
   npm run dev
   ```

## API Documentation

API documentation is available at `/api-docs` when the server is running (Swagger/OpenAPI).

## Environment Variables

See `.env.example` for all required environment variables.

## Security Features

- Password hashing with bcrypt (salt rounds >= 12)
- JWT with short expiry (15 min) and refresh token rotation
- Role-based access control on all API endpoints
- Input validation using Zod
- Rate limiting per IP and per user
- Razorpay signature verification for all payments
- SQL injection prevention through Sequelize ORM
- HTTP security headers via Helmet
- CORS protection
- Audit logging for all significant actions
- Anti-fraud detection for suspicious activities

## Project Structure

```
src/
├── controllers/     # Request handlers
├── routes/          # API route definitions
├── models/          # Database models and associations
├── middleware/      # Custom middleware (auth, validation, etc.)
├── utils/           # Utility functions
├── websocket.js     # WebSocket server initialization
├── seeds/           # Database seeding scripts
└── config/          # Configuration files
```

## Testing

Run tests with:
```bash
npm test
```

## Deployment

The backend is designed to be deployed using Docker or traditional Node.js hosting.

See `DEPLOYMENT.md` for detailed deployment instructions.
