# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ConnectKit is a full-stack contact management web application built with React, Node.js/Express, and PostgreSQL. The entire application is containerized using Docker for consistent development and deployment.

## Architecture

The application follows a three-tier architecture:
- **Frontend**: React application serving the user interface (port 3000)
- **Backend**: Express.js REST API server (port 3001)  
- **Database**: PostgreSQL for data persistence (port 5432)

All services are orchestrated via Docker Compose, enabling single-command deployment of the entire stack.

## Development Commands

### Full Stack Operations
```bash
# Start all services
docker-compose up --build

# Stop all services
docker-compose down

# View logs
docker-compose logs -f [service_name]

# Clean rebuild
docker-compose down -v && docker-compose up --build
```

### Frontend Development
```bash
cd frontend
npm install        # Install dependencies
npm start         # Start development server (port 3000)
npm test          # Run tests
npm run build     # Build for production
```

### Backend Development
```bash
cd backend
npm install       # Install dependencies
npm start         # Start server (port 3001)
npm test          # Run tests (when configured)
```

### Database Operations
```bash
# Access PostgreSQL CLI
docker exec -it connectkit-db psql -U admin -d contactdb

# Run migrations (from backend directory)
npm run migrate
```

## API Endpoints

- `GET /api/health` - Service health check
- `GET /api/contacts` - Retrieve all contacts
- `POST /api/contacts` - Create new contact (body: {name, email, message})
- `DELETE /api/contacts/:id` - Delete specific contact

## Environment Configuration

Backend environment variables (`.env`):
```
DB_HOST=db
DB_PORT=5432
DB_USER=admin
DB_PASSWORD=admin123
DB_NAME=contactdb
PORT=3001
```

## Project Structure

```
frontend/
  src/
    App.js         # Main React component with contact management UI
    index.js       # React entry point
backend/
  server.js        # Express server with API routes and database connection
database/
  init.sql         # Database schema and seed data
docker-compose.yml # Service orchestration configuration
```

## Key Implementation Patterns

1. **Database Connection**: Use connection pooling with pg.Pool for PostgreSQL connections
2. **Error Handling**: Implement try-catch blocks in all API routes with appropriate HTTP status codes
3. **CORS**: Configure CORS middleware to allow frontend-backend communication
4. **Environment Variables**: Use dotenv for configuration management
5. **Container Networking**: Services communicate via Docker network using service names as hostnames

## Testing Approach

- Frontend: Test component rendering and API interactions
- Backend: Test API endpoints and database operations
- Integration: Test full stack flow using Docker Compose environment

## Common Development Tasks

When implementing new features:
1. Define database schema changes in `database/init.sql`
2. Create backend API endpoint in `server.js`
3. Implement frontend UI components and API calls in React
4. Test locally with Docker Compose
5. Ensure proper error handling and loading states