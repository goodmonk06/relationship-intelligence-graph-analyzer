/**
 * Test database helper
 * Provides utilities for setting up and tearing down test database
 */

import { PrismaClient } from '@prisma/client';

export const testPrisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/relationship_graph_test?schema=public',
    },
  },
});

/**
 * Clean all data from the database
 */
export async function cleanDatabase() {
  await testPrisma.relation.deleteMany();
  await testPrisma.entity.deleteMany();
  await testPrisma.graphMetricSnapshot.deleteMany();
}

/**
 * Disconnect from database
 */
export async function disconnectDatabase() {
  await testPrisma.$disconnect();
}
