# FIRE ARENA MAX Web Application

This is the web component of the FIRE ARENA MAX real-money esports platform, built with Next.js 13, TypeScript, and Tailwind CSS.

## Features

- Modern, responsive UI with neon gaming theme
- Authentication system with JWT tokens
- Wallet management with deposit/withdrawal functionality
- Tournament browsing and participation
- Team creation and management
- Real-time chat interface (WebSocket integration)
- VIP subscription system
- Notification center
- Dark theme with neon accents
- Mobile-responsive design

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create a `.env.local` file based on the example below:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:5000/api
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Environment Variables

Create a `.env.local` file in the root directory with:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

## Project Structure

```
src/
├── app/                 # Next.js app router
│   ├── (auth)/          # Authentication routes (login, register)
│   ├── dashboard/       # Dashboard and feature pages
│   ├── layout.tsx       # Root layout with providers
│   └── page.tsx         # Home page
├── components/          # Reusable UI components
├── contexts/            # React contexts (Auth, etc.)
├── lib/                 # Utility libraries (API service, etc.)
├── hooks/               # Custom React hooks
├── styles/              # CSS and Tailwind configuration
├── types/               # TypeScript type definitions
└── utils/               # Utility functions
```

## Design System

- **Theme**: Dark background (`#0a0a0a`) with neon blue/purple accents
- **Colors**: 
  - Primary neon blue: `#3b82f6`
  - Primary neon purple: `#8b5cf6`
  - Accent neon pink: `#ec4899`
  - Accent neon cyan: `#00ffff`
- **Effects**: 
  - Glowing neon shadows
  - Pulse animations
  - Glassmorphism cards
  - Smooth transitions

## Available Pages

- `/` - Home page
- `/auth/login` - Login page
- `/auth/register` - Register page
- `/dashboard` - User dashboard
- `/dashboard/wallet` - Wallet management
- `/dashboard/tournaments` - Tournament browsing
- `/dashboard/team` - Team management
- `/dashboard/chat` - Chat interface
- `/dashboard/vip` - VIP features

## Development

The application uses:
- Next.js 13 with App Router
- TypeScript for type safety
- Tailwind CSS for styling
- Zustand for state management (planned)
- Axios for API requests
- Socket.io-client for WebSocket communication

## Deployment

The web application can be deployed to:
- Vercel (recommended for Next.js)
- Netlify
- Traditional Node.js hosting
- Docker containers

See `DEPLOYMENT.md` for detailed deployment instructions.
