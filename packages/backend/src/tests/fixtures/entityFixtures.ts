/**
 * Entity test fixtures and factories
 */

import { EntityType } from '@prisma/client';
import { testPrisma } from '../helpers/testDb';

export const createTestAccount = async (overrides?: Partial<any>) => {
  return testPrisma.entity.create({
    data: {
      type: EntityType.ACCOUNT,
      name: overrides?.name || 'Test Account Corp',
      metaJson: overrides?.metaJson || {
        industry: 'Technology',
        revenue: 1000000,
        employees: 50,
      },
    },
  });
};

export const createTestContact = async (overrides?: Partial<any>) => {
  return testPrisma.entity.create({
    data: {
      type: EntityType.CONTACT,
      name: overrides?.name || 'Test Contact',
      metaJson: overrides?.metaJson || {
        email: 'test@example.com',
        title: 'Test Manager',
      },
    },
  });
};

export const createTestDeal = async (overrides?: Partial<any>) => {
  return testPrisma.entity.create({
    data: {
      type: EntityType.DEAL,
      name: overrides?.name || 'Test Deal',
      metaJson: overrides?.metaJson || {
        amount: 50000,
        stage: 'Negotiation',
        probability: 0.7,
      },
    },
  });
};

export const createTestEntities = async () => {
  const account = await createTestAccount();
  const contact = await createTestContact();
  const deal = await createTestDeal();

  return { account, contact, deal };
};
