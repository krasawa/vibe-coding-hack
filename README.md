# Vibe Chat - Private Skype-like Chat Application

A self-hosted, private chat application with real-time messaging, group chats, and media sharing capabilities.

## Features

- User registration and authentication
- Contact management (add/remove contacts)
- Direct and group messaging with persistent history
- Real-time updates with WebSockets
- Rich text support and image sharing
- Typing indicators
- Read receipts
- Online/offline status
- User profiles
- Full-text search across all chats

## Tech Stack

### Backend
- Node.js with TypeScript
- Express
- Socket.IO for real-time communication
- Prisma ORM
- PostgreSQL database
- JWT authentication

### Frontend
- React with TypeScript
- Redux for state management
- Material-UI for components
- Socket.IO client

### Infrastructure
- Docker for containerization
- Terraform for infrastructure provisioning
- AWS deployment (ECS, RDS, S3)
- NGINX for serving frontend and proxying API requests

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
├── deploy.sh        # Deployment script for AWS
├── docker-compose.yml # Local development configuration
└── docs/           # Documentation files
```

## Quick Start

### Local Development

1. Clone the repository:
   ```
   git clone https://github.com/krasawa/vibe-coding-hack.git
   cd vibe-coding-hack
   ```

2. Start the application with Docker Compose:
   ```
   docker-compose up
   ```

3. Access the application at http://localhost:3000

This will start:
- PostgreSQL database
- LocalStack for S3 emulation
- Backend API server
- Frontend development server

### Running Services Without Docker

#### Backend

```bash
cd vibe-chat/backend
npm install
npm run dev
```

#### Frontend

```bash
cd vibe-chat/frontend
npm install
npm start
```

## AWS Deployment

For deployment to AWS, use the deployment script:

```bash
cd vibe-chat

# Test Docker builds locally without deploying to AWS
./deploy.sh --local-only

# Full deployment to AWS
./deploy.sh
```

The script will:
1. Build Docker images for the frontend and backend
2. When not using --local-only:
   - Create an ECR repository if it doesn't exist
   - Push Docker images to ECR
   - Create a terraform.tfvars file with appropriate values
   - Initialize and apply Terraform configuration
   - Handle AWS credentials if not already configured

### Terraform Deployment Details

The AWS deployment includes:
- VPC with public, private, and database subnets
- RDS PostgreSQL database
- S3 bucket for storing uploaded images
- ECS Fargate for running containerized services
- Application Load Balancer (ALB) for routing traffic

### Teardown Infrastructure

To destroy all AWS resources when no longer needed:

```bash
cd vibe-chat/terraform
terraform destroy
```

## License

MIT 