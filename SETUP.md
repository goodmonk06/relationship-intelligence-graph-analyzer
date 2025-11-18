# Setup Guide

This guide will walk you through setting up the Relationship Intelligence Graph Analyzer on your local machine.

## Quick Start (5 minutes)

### 1. Prerequisites

Ensure you have installed:
- **Node.js 18+**: `node --version`
- **Docker**: `docker --version` (for PostgreSQL)
- **npm**: `npm --version`

### 2. Clone and Install

```bash
# Clone the repository
git clone <repository-url>
cd relationship-intelligence-graph-analyzer

# Install all dependencies (root + workspaces)
npm install
```

### 3. Start PostgreSQL

```bash
# Start PostgreSQL in Docker
docker-compose up -d

# Verify it's running
docker ps
```

The database will be accessible at `localhost:5432` with:
- Username: `postgres`
- Password: `postgres`
- Database: `relationship_graph`

### 4. Set Up the Database Schema

```bash
# Generate Prisma client
cd packages/backend
npm run db:generate

# Run migrations to create tables
npm run db:migrate

# Seed with sample CRM data
npm run db:seed
```

You should see output like:
```
✅ Created entities
✅ Created relations
📊 Database seeded successfully!
   - Entities: 18
   - Relations: 28
💡 Key insight: Jennifer Smith is a major hub in this network
```

### 5. Start the Application

From the root directory:

```bash
cd ../..
npm run dev
```

This will start:
- **Backend API**: http://localhost:3001
- **Frontend UI**: http://localhost:3000

### 6. Explore the Application

Open your browser to http://localhost:3000

You'll see:
- **Stats Dashboard**: Total entities, relations, and average connections
- **Top Entities Table**: Ranked by importance score
- **Graph Visualization**: Click any entity to see their relationship network

Try clicking on **Jennifer Smith** (the top hub) to see her extensive network connections!

## Troubleshooting

### Port Conflicts

If port 5432 is already in use:
```bash
# Stop the conflicting service or change the port in docker-compose.yml
docker-compose down
# Edit docker-compose.yml to use a different port like 5433:5432
# Update DATABASE_URL in .env accordingly
```

### Database Connection Issues

```bash
# Check if PostgreSQL is running
docker ps

# View logs
docker logs relationship-graph-db

# Restart the database
docker-compose restart
```

### Prisma Errors

If you see Prisma client errors:
```bash
cd packages/backend
npm run db:generate
```

### Missing Dependencies

```bash
# Clean install
rm -rf node_modules package-lock.json
rm -rf packages/*/node_modules packages/*/package-lock.json
npm install
```

## Development Workflow

### Working with the Database

```bash
# Open Prisma Studio (visual database browser)
cd packages/backend
npm run db:studio
# Opens at http://localhost:5555
```

### Making Schema Changes

1. Edit `packages/backend/prisma/schema.prisma`
2. Create and apply migration:
```bash
cd packages/backend
npm run db:migrate
```

### Resetting the Database

```bash
cd packages/backend
npx prisma migrate reset
npm run db:seed
```

### Backend Development

```bash
# Run backend only
npm run dev:backend

# View logs in packages/backend
```

### Frontend Development

```bash
# Run frontend only
npm run dev:frontend

# Frontend code is in packages/frontend/
```

## Testing API Endpoints

### Health Check
```bash
curl http://localhost:3001/health
```

### Get All Entities
```bash
curl http://localhost:3001/entities
```

### Get Top Entities
```bash
curl http://localhost:3001/metrics/top-entities?limit=5
```

### Create a New Contact
```bash
curl -X POST http://localhost:3001/entities \
  -H "Content-Type: application/json" \
  -d '{
    "type": "CONTACT",
    "name": "Alice Johnson",
    "metaJson": {
      "email": "alice@example.com",
      "title": "Account Executive"
    }
  }'
```

### Create a Relation
```bash
# Replace <entity-id-1> and <entity-id-2> with actual IDs
curl -X POST http://localhost:3001/relations \
  -H "Content-Type: application/json" \
  -d '{
    "fromId": "<entity-id-1>",
    "toId": "<entity-id-2>",
    "relationType": "INTRODUCED_BY",
    "strength": 0.8
  }'
```

### Compute Metrics
```bash
curl -X POST http://localhost:3001/metrics/compute
```

## Production Deployment

### Environment Variables

Create a production `.env` file:
```env
DATABASE_URL="postgresql://user:password@prod-host:5432/relationship_graph?schema=public"
PORT=3001
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
```

### Build for Production

```bash
# Build both backend and frontend
npm run build

# Start backend
cd packages/backend
npm start

# Start frontend (or use a static hosting service)
cd packages/frontend
npm start
```

### Database Setup

For production, use a managed PostgreSQL service:
- AWS RDS
- Google Cloud SQL
- Heroku Postgres
- Supabase
- Neon

Run migrations:
```bash
cd packages/backend
DATABASE_URL="<production-url>" npx prisma migrate deploy
```

## Next Steps

1. **Import Your Data**: Use the API endpoints to import your CRM data
2. **Customize Metrics**: Enhance the metrics computation in `packages/backend/src/services/graphMetrics.ts`
3. **Add Authentication**: Protect your API endpoints
4. **Extend Entity Types**: Add new entity types in the Prisma schema
5. **Custom Visualizations**: Modify the graph visualization in `packages/frontend/components/GraphView.tsx`

## Need Help?

- Check the main [README.md](./README.md) for API documentation
- Review the [Prisma documentation](https://www.prisma.io/docs)
- Open an issue on GitHub

Happy analyzing! 📊
