/**
 * Relation test fixtures and factories
 */

import { RelationType } from '@prisma/client';
import { testPrisma } from '../helpers/testDb';

export const createTestRelation = async (
  fromId: string,
  toId: string,
  overrides?: Partial<any>
) => {
  return testPrisma.relation.create({
    data: {
      fromId,
      toId,
      relationType: overrides?.relationType || RelationType.WORKS_AT,
      strength: overrides?.strength || 1.0,
      metaJson: overrides?.metaJson || null,
    },
  });
};

export const createTestRelationNetwork = async () => {
  // Create entities
  const [contact1, contact2, account, deal] = await Promise.all([
    testPrisma.entity.create({
      data: {
        type: 'CONTACT',
        name: 'Alice Smith',
        metaJson: { email: 'alice@example.com' },
      },
    }),
    testPrisma.entity.create({
      data: {
        type: 'CONTACT',
        name: 'Bob Johnson',
        metaJson: { email: 'bob@example.com' },
      },
    }),
    testPrisma.entity.create({
      data: {
        type: 'ACCOUNT',
        name: 'Tech Corp',
        metaJson: { industry: 'Technology' },
      },
    }),
    testPrisma.entity.create({
      data: {
        type: 'DEAL',
        name: 'Big Deal',
        metaJson: { amount: 100000 },
      },
    }),
  ]);

  // Create relations
  const relations = await Promise.all([
    createTestRelation(contact1.id, account.id, { relationType: RelationType.WORKS_AT }),
    createTestRelation(contact2.id, account.id, { relationType: RelationType.WORKS_AT }),
    createTestRelation(contact1.id, deal.id, { relationType: RelationType.INVOLVED_IN }),
    createTestRelation(contact2.id, contact1.id, { relationType: RelationType.INTRODUCED_BY }),
  ]);

  return {
    entities: { contact1, contact2, account, deal },
    relations,
  };
};
