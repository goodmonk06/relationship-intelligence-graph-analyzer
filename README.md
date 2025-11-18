# Relationship Intelligence Graph Analyzer

A powerful relationship intelligence platform that ingests CRM entities (accounts, contacts, opportunities), links them via relations, computes graph metrics, and visualizes key relationships.

## 🎯 Overview

This system helps you discover hidden patterns and influential nodes in your CRM data by:
- **Analyzing relationship networks** between accounts, contacts, deals, and organizations
- **Computing graph metrics** like degree centrality and importance scores
- **Identifying hub connectors** - key people who bridge different parts of your network
- **Visualizing relationships** in an interactive graph interface

## 🏗️ Architecture

### Tech Stack
- **Backend**: Node.js, Fastify, TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Frontend**: Next.js 14 with React and TailwindCSS
- **Visualization**: react-force-graph-2d

### Domain Model

#### Entity
Represents nodes in the relationship graph:
- `id`: Unique identifier
- `type`: EntityType (ACCOUNT, CONTACT, DEAL, ORG, OTHER)
- `name`: Display name
- `metaJson`: Flexible JSON field for custom attributes

#### Relation
Represents edges between entities:
- `id`: Unique identifier
- `fromId`: Source entity
- `toId`: Target entity
- `relationType`: Type of relationship (INTRODUCED_BY, WORKS_AT, INVOLVED_IN, etc.)
- `strength`: Numeric weight (0.0 - 1.0)
- `metaJson`: Additional relationship metadata

#### GraphMetricSnapshot
Stores computed graph analytics:
- `id`: Unique identifier
- `createdAt`: Computation timestamp
- `metricsJson`: Per-node metrics (degree, inDegree, outDegree, importance)

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- npm or yarn

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd relationship-intelligence-graph-analyzer
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp .env.example .env
```

Edit `.env` with your database credentials:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/relationship_graph?schema=public"
PORT=3001
NEXT_PUBLIC_API_URL=http://localhost:3001
```

4. **Set up the database**
```bash
# Generate Prisma client
cd packages/backend
npm run db:generate

# Run migrations
npm run db:migrate

# Seed with sample data
npm run db:seed
```

5. **Start the development servers**

From the root directory:
```bash
npm run dev
```

This starts:
- Backend API at http://localhost:3001
- Frontend UI at http://localhost:3000

## 📊 Features

### 1. Entity & Relation Ingestion

**Create Entities**
```bash
POST /entities
{
  "type": "CONTACT",
  "name": "John Smith",
  "metaJson": {
    "email": "john@example.com",
    "title": "VP of Sales"
  }
}
```

**Create Relations**
```bash
POST /relations
{
  "fromId": "entity-1-id",
  "toId": "entity-2-id",
  "relationType": "INTRODUCED_BY",
  "strength": 0.8
}
```

**Upsert Operations**
```bash
POST /entities/upsert
POST /relations/upsert
```

### 2. Graph Metrics Computation

The system computes:
- **Degree**: Total number of connections
- **In-Degree**: Number of incoming connections
- **Out-Degree**: Number of outgoing connections
- **Importance Score**: Normalized centrality measure (0-1)

**Compute Metrics**
```bash
POST /metrics/compute
```

**Get Latest Metrics**
```bash
GET /metrics/latest
GET /metrics/entity/:entityId
GET /metrics/top-entities?limit=20
```

### 3. Neighborhood Queries

Retrieve the relationship network around a specific entity:

```bash
GET /metrics/neighborhood/:entityId
```

Returns all connected entities and their relationships for visualization.

### 4. Interactive UI

The frontend provides:
- **Stats Dashboard**: Overview of total entities, relations, and average connectivity
- **Top Entities Table**: Ranked list of most influential entities
- **Graph Visualization**: Interactive force-directed graph showing relationship networks
- **Real-time Filtering**: Click entities to explore their connections

## 🗺️ Mapping CRM Data

### From Salesforce

```typescript
// Account → ACCOUNT Entity
{
  type: "ACCOUNT",
  name: account.Name,
  metaJson: {
    industry: account.Industry,
    revenue: account.AnnualRevenue,
    employees: account.NumberOfEmployees,
    website: account.Website,
    salesforceId: account.Id
  }
}

// Contact → CONTACT Entity
{
  type: "CONTACT",
  name: contact.Name,
  metaJson: {
    email: contact.Email,
    phone: contact.Phone,
    title: contact.Title,
    linkedin: contact.LinkedIn__c,
    salesforceId: contact.Id
  }
}

// Opportunity → DEAL Entity
{
  type: "DEAL",
  name: opportunity.Name,
  metaJson: {
    amount: opportunity.Amount,
    stage: opportunity.StageName,
    closeDate: opportunity.CloseDate,
    probability: opportunity.Probability,
    salesforceId: opportunity.Id
  }
}

// AccountContactRelation → WORKS_AT Relation
{
  fromId: contactEntityId,
  toId: accountEntityId,
  relationType: "WORKS_AT",
  strength: acr.IsDirect ? 1.0 : 0.5
}

// OpportunityContactRole → INVOLVED_IN Relation
{
  fromId: contactEntityId,
  toId: opportunityEntityId,
  relationType: "INVOLVED_IN",
  strength: ocr.IsPrimary ? 1.0 : 0.6
}
```

### From HubSpot

```typescript
// Company → ACCOUNT Entity
{
  type: "ACCOUNT",
  name: company.name,
  metaJson: {
    domain: company.domain,
    industry: company.industry,
    employees: company.numberofemployees,
    hubspotId: company.id
  }
}

// Contact → CONTACT Entity
{
  type: "CONTACT",
  name: `${contact.firstname} ${contact.lastname}`,
  metaJson: {
    email: contact.email,
    phone: contact.phone,
    title: contact.jobtitle,
    hubspotId: contact.id
  }
}

// Deal → DEAL Entity
{
  type: "DEAL",
  name: deal.dealname,
  metaJson: {
    amount: deal.amount,
    stage: deal.dealstage,
    closeDate: deal.closedate,
    hubspotId: deal.id
  }
}

// Company-Contact Association → WORKS_AT
{
  fromId: contactEntityId,
  toId: companyEntityId,
  relationType: "WORKS_AT",
  strength: 1.0
}

// Deal-Contact Association → INVOLVED_IN
{
  fromId: contactEntityId,
  toId: dealEntityId,
  relationType: "INVOLVED_IN",
  strength: 0.8
}
```

### Custom Relationship Types

You can extend the relationship model by using the `OTHER` relation type with metadata:

```typescript
{
  fromId: contact1Id,
  toId: contact2Id,
  relationType: "OTHER",
  strength: 0.7,
  metaJson: {
    customType: "mentors",
    startDate: "2024-01-15",
    context: "Professional development"
  }
}
```

## 📈 Sample Insights

After seeding the database, you'll discover insights like:

### Hub Analysis
**Jennifer Smith** emerges as a key hub with:
- **Degree: 8** - Most connected person in the network
- **Importance: 100%** - Maximum centrality score
- **Role**: VP of Sales who introduced multiple key contacts and is involved in 3 major deals

### Network Patterns
- **Star Networks**: Identify individuals like Jennifer who connect disparate groups
- **Deal Involvement**: See which contacts are involved in multiple opportunities
- **Organizational Structure**: Visualize reporting relationships and company affiliations
- **Partnership Networks**: Discover which accounts collaborate frequently

## 🔧 API Reference

### Entities

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/entities` | GET | List all entities |
| `/entities` | POST | Create entity |
| `/entities/:id` | GET | Get entity by ID |
| `/entities/:id` | PUT | Update entity |
| `/entities/:id` | DELETE | Delete entity |
| `/entities/upsert` | POST | Create or update entity |

### Relations

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/relations` | GET | List all relations |
| `/relations` | POST | Create relation |
| `/relations/:id` | GET | Get relation by ID |
| `/relations/:id` | PUT | Update relation |
| `/relations/:id` | DELETE | Delete relation |
| `/relations/upsert` | POST | Create or update relation |

### Metrics

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/metrics/compute` | POST | Compute new metrics snapshot |
| `/metrics/latest` | GET | Get latest metrics |
| `/metrics/entity/:id` | GET | Get metrics for specific entity |
| `/metrics/top-entities` | GET | Get top entities by importance |
| `/metrics/neighborhood/:id` | GET | Get entity neighborhood for viz |

## 🎨 Visualization Features

- **Force-Directed Layout**: Entities naturally cluster based on relationships
- **Color Coding**: Different entity types have distinct colors
  - Blue: Accounts
  - Green: Contacts
  - Purple: Deals
  - Yellow: Organizations
- **Node Sizing**: More important entities appear larger
- **Directional Arrows**: Show relationship flow
- **Interactive Labels**: Hover to see entity details
- **Center Highlighting**: Selected entity is highlighted with a border

## 🔐 Security Considerations

For production deployment:
1. Add authentication/authorization to API endpoints
2. Implement rate limiting
3. Validate and sanitize all inputs
4. Use parameterized queries (Prisma handles this)
5. Enable CORS only for trusted origins
6. Use environment variables for sensitive configuration
7. Set up SSL/TLS for API and database connections

## 📝 Future Enhancements

- **Advanced Metrics**: PageRank, Betweenness Centrality, Community Detection
- **Temporal Analysis**: Track how relationships evolve over time
- **Recommendation Engine**: Suggest introductions based on network analysis
- **Data Import**: Bulk import from CSV, Salesforce, HubSpot APIs
- **Export**: Generate reports and network visualizations
- **Filtering**: Advanced search and filtering on entity/relation properties
- **Multi-depth Visualization**: Explore networks beyond immediate neighbors
- **AI Insights**: Use LLMs to generate natural language insights from graph patterns

## 🤝 Contributing

Contributions are welcome! Please follow these steps:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Write or update tests
5. Submit a pull request

## 📄 License

MIT License - feel free to use this project for your own CRM analytics needs.

## 🙋 Support

For issues, questions, or suggestions, please open a GitHub issue.

---

Built with ❤️ for better relationship intelligence
