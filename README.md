# Vibe Chat - Private Skype-like Chat Application

A self-hosted, private chat application with real-time messaging, group chats, and media sharing capabilities.

## Features

- User registration and authentication
- Contact management (add/remove contacts)
- Direct messaging with persistent history
- Group chats (up to 300 participants)
- Rich text support (bold/italic) and image sharing
- Emoji reactions for messages
- User profiles
- Full-text search across all chats
- Real-time communication via WebSockets (with polling fallback)

## Tech Stack

- **Backend**: Node.js with TypeScript, Express, Socket.IO
- **Frontend**: React with TypeScript, Redux
- **Database**: PostgreSQL
- **Storage**: AWS S3 (for image storage)
- **Deployment**: Docker, AWS, Terraform

## Quick Start

### Local Development

1. Clone the repository:
   ```
   git clone https://github.com/krasawa/vibe-coding-hack.git
   cd vibe-chat
   ```

2. Start the application with Docker Compose:
   ```
   docker-compose up
   ```

3. Access the application at http://localhost:3000

### Production Deployment to AWS

1. Configure AWS credentials:
   ```
   aws configure
   ```

2. Initialize and apply Terraform configuration:
   ```
   cd terraform
   terraform init
   terraform apply
   ```

3. Teardown infrastructure when no longer needed:
   ```
   terraform destroy
   ```

## Project Structure

The project follows a monorepo approach with all code contained in the `vibe-chat` directory:

```
vibe-chat/
├── backend/         # Node.js/Express backend
├── frontend/        # React frontend
├── terraform/       # AWS infrastructure with Terraform
└── docs/            # Documentation
```

For more details on the project structure, see the README.md in the vibe-chat directory.

## Development

### Backend

To run the backend service locally without Docker:

```
cd backend
npm install
npm run dev
```

### Frontend

To run the frontend service locally without Docker:

```
cd frontend
npm install
npm start
```

## License

MIT 