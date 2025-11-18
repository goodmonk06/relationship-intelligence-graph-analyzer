import { PrismaClient, EntityType, RelationType } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Seed the database with sample CRM data showing relationship intelligence
 * Demonstrates which contacts are "hubs" in the network
 */
async function seed() {
  console.log('🌱 Seeding database with CRM data...');

  // Clear existing data
  await prisma.relation.deleteMany();
  await prisma.entity.deleteMany();
  await prisma.graphMetricSnapshot.deleteMany();

  // Create Accounts (Companies)
  const techCorp = await prisma.entity.create({
    data: {
      type: EntityType.ACCOUNT,
      name: 'TechCorp Solutions',
      metaJson: {
        industry: 'Technology',
        revenue: 5000000,
        employees: 50,
        website: 'techcorp.example.com'
      }
    }
  });

  const salesInc = await prisma.entity.create({
    data: {
      type: EntityType.ACCOUNT,
      name: 'SalesForce Inc',
      metaJson: {
        industry: 'Software',
        revenue: 10000000,
        employees: 120,
        website: 'salesforce.example.com'
      }
    }
  });

  const marketingPro = await prisma.entity.create({
    data: {
      type: EntityType.ACCOUNT,
      name: 'Marketing Pro Agency',
      metaJson: {
        industry: 'Marketing',
        revenue: 2000000,
        employees: 25,
        website: 'marketingpro.example.com'
      }
    }
  });

  const cloudVentures = await prisma.entity.create({
    data: {
      type: EntityType.ACCOUNT,
      name: 'Cloud Ventures',
      metaJson: {
        industry: 'Cloud Services',
        revenue: 8000000,
        employees: 80
      }
    }
  });

  // Create Contacts (People) - Jennifer is a "hub" connector
  const jennifer = await prisma.entity.create({
    data: {
      type: EntityType.CONTACT,
      name: 'Jennifer Smith',
      metaJson: {
        title: 'VP of Sales',
        email: 'jennifer.smith@techcorp.example',
        phone: '+1-555-0101',
        linkedin: 'linkedin.com/in/jennifersmith'
      }
    }
  });

  const michael = await prisma.entity.create({
    data: {
      type: EntityType.CONTACT,
      name: 'Michael Chen',
      metaJson: {
        title: 'CEO',
        email: 'michael.chen@salesforce.example',
        phone: '+1-555-0102'
      }
    }
  });

  const sarah = await prisma.entity.create({
    data: {
      type: EntityType.CONTACT,
      name: 'Sarah Johnson',
      metaJson: {
        title: 'Marketing Director',
        email: 'sarah.j@marketingpro.example',
        phone: '+1-555-0103'
      }
    }
  });

  const david = await prisma.entity.create({
    data: {
      type: EntityType.CONTACT,
      name: 'David Williams',
      metaJson: {
        title: 'CTO',
        email: 'david.w@cloudventures.example',
        phone: '+1-555-0104'
      }
    }
  });

  const emma = await prisma.entity.create({
    data: {
      type: EntityType.CONTACT,
      name: 'Emma Rodriguez',
      metaJson: {
        title: 'Sales Manager',
        email: 'emma.r@techcorp.example',
        phone: '+1-555-0105'
      }
    }
  });

  const robert = await prisma.entity.create({
    data: {
      type: EntityType.CONTACT,
      name: 'Robert Taylor',
      metaJson: {
        title: 'VP of Engineering',
        email: 'robert.t@salesforce.example',
        phone: '+1-555-0106'
      }
    }
  });

  const lisa = await prisma.entity.create({
    data: {
      type: EntityType.CONTACT,
      name: 'Lisa Anderson',
      metaJson: {
        title: 'Account Executive',
        email: 'lisa.a@marketingpro.example',
        phone: '+1-555-0107'
      }
    }
  });

  // Create Deals (Opportunities)
  const deal1 = await prisma.entity.create({
    data: {
      type: EntityType.DEAL,
      name: 'Enterprise Software License Q1',
      metaJson: {
        amount: 250000,
        stage: 'Negotiation',
        closeDate: '2024-03-31',
        probability: 0.75
      }
    }
  });

  const deal2 = await prisma.entity.create({
    data: {
      type: EntityType.DEAL,
      name: 'Cloud Migration Project',
      metaJson: {
        amount: 500000,
        stage: 'Proposal',
        closeDate: '2024-04-15',
        probability: 0.60
      }
    }
  });

  const deal3 = await prisma.entity.create({
    data: {
      type: EntityType.DEAL,
      name: 'Marketing Automation Setup',
      metaJson: {
        amount: 150000,
        stage: 'Closed Won',
        closeDate: '2024-02-28',
        probability: 1.0
      }
    }
  });

  console.log('✅ Created entities');

  // Create Relations - Jennifer is the central hub
  const relations = [
    // Jennifer works at TechCorp
    { from: jennifer.id, to: techCorp.id, type: RelationType.WORKS_AT, strength: 1.0 },

    // Emma also works at TechCorp and reports to Jennifer
    { from: emma.id, to: techCorp.id, type: RelationType.WORKS_AT, strength: 1.0 },
    { from: emma.id, to: jennifer.id, type: RelationType.REPORTS_TO, strength: 0.9 },

    // Jennifer introduced Michael to Sarah - key connector role
    { from: michael.id, to: jennifer.id, type: RelationType.INTRODUCED_BY, strength: 0.8 },
    { from: sarah.id, to: jennifer.id, type: RelationType.INTRODUCED_BY, strength: 0.8 },

    // Michael works at SalesForce Inc
    { from: michael.id, to: salesInc.id, type: RelationType.WORKS_AT, strength: 1.0 },

    // Robert works at SalesForce Inc and reports to Michael
    { from: robert.id, to: salesInc.id, type: RelationType.WORKS_AT, strength: 1.0 },
    { from: robert.id, to: michael.id, type: RelationType.REPORTS_TO, strength: 0.9 },

    // Sarah works at Marketing Pro
    { from: sarah.id, to: marketingPro.id, type: RelationType.WORKS_AT, strength: 1.0 },

    // Lisa works at Marketing Pro and reports to Sarah
    { from: lisa.id, to: marketingPro.id, type: RelationType.WORKS_AT, strength: 1.0 },
    { from: lisa.id, to: sarah.id, type: RelationType.REPORTS_TO, strength: 0.9 },

    // David works at Cloud Ventures
    { from: david.id, to: cloudVentures.id, type: RelationType.WORKS_AT, strength: 1.0 },

    // Jennifer also introduced David - another hub connection
    { from: david.id, to: jennifer.id, type: RelationType.INTRODUCED_BY, strength: 0.7 },

    // Deal involvement - Jennifer involved in multiple deals (hub behavior)
    { from: jennifer.id, to: deal1.id, type: RelationType.INVOLVED_IN, strength: 1.0 },
    { from: jennifer.id, to: deal2.id, type: RelationType.INVOLVED_IN, strength: 0.8 },
    { from: jennifer.id, to: deal3.id, type: RelationType.INVOLVED_IN, strength: 1.0 },

    // Emma involved in deal 1
    { from: emma.id, to: deal1.id, type: RelationType.INVOLVED_IN, strength: 0.7 },

    // Michael involved in deal 1 and 2
    { from: michael.id, to: deal1.id, type: RelationType.INVOLVED_IN, strength: 0.9 },
    { from: michael.id, to: deal2.id, type: RelationType.INVOLVED_IN, strength: 0.6 },

    // Sarah involved in deal 3
    { from: sarah.id, to: deal3.id, type: RelationType.INVOLVED_IN, strength: 0.9 },

    // David involved in deal 2 (cloud migration)
    { from: david.id, to: deal2.id, type: RelationType.INVOLVED_IN, strength: 0.8 },

    // Deals bought from accounts
    { from: deal1.id, to: salesInc.id, type: RelationType.BOUGHT_FROM, strength: 1.0 },
    { from: deal2.id, to: cloudVentures.id, type: RelationType.BOUGHT_FROM, strength: 1.0 },
    { from: deal3.id, to: marketingPro.id, type: RelationType.BOUGHT_FROM, strength: 1.0 },

    // Partnership relations
    { from: techCorp.id, to: salesInc.id, type: RelationType.PARTNERS_WITH, strength: 0.7 },
    { from: techCorp.id, to: cloudVentures.id, type: RelationType.PARTNERS_WITH, strength: 0.6 }
  ];

  for (const rel of relations) {
    await prisma.relation.create({
      data: {
        fromId: rel.from,
        toId: rel.to,
        relationType: rel.type,
        strength: rel.strength
      }
    });
  }

  console.log('✅ Created relations');

  // Count total entities and relations
  const entityCount = await prisma.entity.count();
  const relationCount = await prisma.relation.count();

  console.log(`\n📊 Database seeded successfully!`);
  console.log(`   - Entities: ${entityCount}`);
  console.log(`   - Relations: ${relationCount}`);
  console.log(`\n💡 Key insight: Jennifer Smith is a major hub in this network`);
  console.log(`   She introduced multiple key contacts and is involved in many deals.`);
  console.log(`\n🚀 Run "npm run dev" to start the server and explore the graph!`);
}

seed()
  .catch(e => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
