# Vibe Chat

A Skype-like chat application with real-time messaging capabilities.

## Project Structure

This is a monorepo containing both the frontend and backend of the Vibe Chat application.

```
vibe-chat/
├── backend/         # Node.js/Express/TypeScript backend
│   ├── prisma/      # Prisma ORM schema and migrations
│   ├── src/         # Backend source code
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── index.ts # Main entry point
│   │   └── socket.ts # WebSocket handling
│   ├── Dockerfile
│   ├── Dockerfile.dev
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/        # React/TypeScript frontend
│   ├── public/      # Static assets
│   ├── src/         # Frontend source code
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── store/   # Redux store
│   │   └── types/   # TypeScript type definitions
│   ├── Dockerfile
│   ├── Dockerfile.dev
│   ├── nginx.conf
│   ├── package.json
│   └── tsconfig.json
│
├── terraform/       # Infrastructure as Code using Terraform
│   ├── main.tf      # Main Terraform configuration
│   └── variables.tf # Terraform variables
│
└── docs/           # Documentation files
```

## Features

- User authentication and registration
- Contact management
- Direct and group messaging
- Real-time updates with WebSockets
- Image sharing
- Typing indicators
- Read receipts
- Online/offline status

## Technology Stack

### Backend
- Node.js
- Express
- TypeScript
- Socket.IO for real-time communication
- Prisma ORM
- PostgreSQL database
- JWT authentication

### Frontend
- React
- TypeScript
- Redux for state management
- Material-UI for components
- Socket.IO client

### Infrastructure
- Docker for containerization
- Terraform for infrastructure provisioning
- AWS deployment (ECS, RDS, S3)
- NGINX for serving frontend and proxying API requests

## Development

The application can be started locally using Docker Compose:

```bash
docker-compose up
```

This will start:
- PostgreSQL database
- LocalStack for S3 emulation
- Backend API server
- Frontend development server

Visit http://localhost:3000 to access the application. 