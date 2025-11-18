#!/usr/bin/env node
/**
 * CLI tool for Relationship Intelligence Graph Analyzer
 * Provides common operations from the command line
 */

import { PrismaClient } from '@prisma/client';
import { computeGraphMetrics, getEntityMetrics } from '../services/graphMetrics';
import { logger } from '../lib/logger';

const prisma = new PrismaClient();

const commands = {
  'compute-metrics': computeMetricsCommand,
  'analyze': analyzeEntityCommand,
  'stats': statsCommand,
  'list-entities': listEntitiesCommand,
  'list-tags': listTagsCommand,
  'help': helpCommand,
};

async function computeMetricsCommand() {
  console.log('🔄 Computing graph metrics...');

  const metrics = await computeGraphMetrics();

  console.log('\n✅ Metrics computed successfully!');
  console.log(`📊 Total Nodes: ${metrics.totalNodes}`);
  console.log(`🔗 Total Edges: ${metrics.totalEdges}`);
  console.log(`📈 Average Degree: ${metrics.averageDegree.toFixed(2)}`);

  // Show top 5 entities
  const sortedNodes = Object.values(metrics.nodes)
    .sort((a, b) => b.importance - a.importance)
    .slice(0, 5);

  console.log('\n🏆 Top 5 Most Important Entities:');
  for (const node of sortedNodes) {
    const entity = await prisma.entity.findUnique({ where: { id: node.entityId } });
    if (entity) {
      console.log(`  - ${entity.name} (${entity.type}): ${(node.importance * 100).toFixed(1)}%`);
    }
  }
}

async function analyzeEntityCommand(entityId?: string) {
  if (!entityId) {
    console.error('❌ Entity ID is required');
    console.log('Usage: graph-cli analyze <entity-id>');
    process.exit(1);
  }

  console.log(`🔍 Analyzing entity: ${entityId}`);

  const entity = await prisma.entity.findUnique({
    where: { id: entityId },
    include: {
      relationsFrom: true,
      relationsTo: true,
      entityTags: {
        include: { tag: true },
      },
      notes: true,
      activitiesFrom: true,
      activitiesTo: true,
    },
  });

  if (!entity) {
    console.error('❌ Entity not found');
    process.exit(1);
  }

  console.log('\n📋 Entity Details:');
  console.log(`  Name: ${entity.name}`);
  console.log(`  Type: ${entity.type}`);
  console.log(`  Status: ${entity.status}`);
  console.log(`  Owner: ${entity.owner || 'None'}`);
  console.log(`  Source: ${entity.source}`);

  console.log('\n🔗 Relationships:');
  console.log(`  Outgoing: ${entity.relationsFrom.length}`);
  console.log(`  Incoming: ${entity.relationsTo.length}`);
  console.log(`  Total: ${entity.relationsFrom.length + entity.relationsTo.length}`);

  console.log('\n🏷️  Tags:');
  if (entity.entityTags.length > 0) {
    entity.entityTags.forEach((et) => {
      console.log(`  - ${et.tag.name}`);
    });
  } else {
    console.log('  None');
  }

  console.log('\n📝 Notes: ${entity.notes.length}');
  console.log(`📅 Activities: ${entity.activitiesFrom.length + entity.activitiesTo.length}`);

  // Get metrics
  const metrics = await getEntityMetrics(entityId);
  if (metrics) {
    console.log('\n📊 Graph Metrics:');
    console.log(`  Degree: ${metrics.degree}`);
    console.log(`  In-Degree: ${metrics.inDegree}`);
    console.log(`  Out-Degree: ${metrics.outDegree}`);
    console.log(`  Importance: ${(metrics.importance * 100).toFixed(1)}%`);
  }
}

async function statsCommand() {
  console.log('📊 Database Statistics\n');

  const [
    entityCount,
    relationCount,
    tagCount,
    noteCount,
    activityCount,
    segmentCount,
  ] = await Promise.all([
    prisma.entity.count(),
    prisma.relation.count(),
    prisma.tag.count(),
    prisma.note.count(),
    prisma.activity.count(),
    prisma.segment.count(),
  ]);

  console.log(`Entities: ${entityCount}`);
  console.log(`Relations: ${relationCount}`);
  console.log(`Tags: ${tagCount}`);
  console.log(`Notes: ${noteCount}`);
  console.log(`Activities: ${activityCount}`);
  console.log(`Segments: ${segmentCount}`);

  // Entity type breakdown
  const entityTypes = await prisma.entity.groupBy({
    by: ['type'],
    _count: true,
  });

  console.log('\n📦 Entity Types:');
  entityTypes.forEach((et) => {
    console.log(`  ${et.type}: ${et._count}`);
  });

  // Relation type breakdown
  const relationTypes = await prisma.relation.groupBy({
    by: ['relationType'],
    _count: true,
  });

  console.log('\n🔗 Relation Types:');
  relationTypes.forEach((rt) => {
    console.log(`  ${rt.relationType}: ${rt._count}`);
  });
}

async function listEntitiesCommand(type?: string) {
  const entities = await prisma.entity.findMany({
    where: type ? { type: type as any } : undefined,
    orderBy: { createdAt: 'desc' },
    take: 20,
  });

  console.log(`\n📋 Entities ${type ? `(Type: ${type})` : '(All Types)'}\n`);

  if (entities.length === 0) {
    console.log('No entities found');
    return;
  }

  entities.forEach((entity) => {
    console.log(`  ${entity.id.slice(0, 8)}... | ${entity.name.padEnd(30)} | ${entity.type.padEnd(10)} | ${entity.status}`);
  });

  console.log(`\nShowing ${entities.length} entities`);
}

async function listTagsCommand() {
  const tags = await prisma.tag.findMany({
    include: {
      _count: {
        select: { entityTags: true },
      },
    },
    orderBy: { name: 'asc' },
  });

  console.log('\n🏷️  Tags\n');

  if (tags.length === 0) {
    console.log('No tags found');
    return;
  }

  tags.forEach((tag) => {
    const count = tag._count.entityTags;
    console.log(`  ${tag.name.padEnd(25)} | ${count} entities | ${tag.color || 'No color'}`);
  });

  console.log(`\nTotal: ${tags.length} tags`);
}

function helpCommand() {
  console.log(`
🔍 Relationship Intelligence Graph Analyzer CLI

Usage: graph-cli <command> [options]

Commands:
  compute-metrics              Compute graph metrics
  analyze <entity-id>          Analyze a specific entity
  stats                        Show database statistics
  list-entities [type]         List entities (optionally filter by type)
  list-tags                    List all tags
  help                         Show this help message

Examples:
  graph-cli compute-metrics
  graph-cli analyze clv1x2y3z4
  graph-cli stats
  graph-cli list-entities CONTACT
  graph-cli list-tags
  `);
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  const commandArgs = args.slice(1);

  if (!command || command === 'help') {
    helpCommand();
    process.exit(0);
  }

  const commandFn = commands[command as keyof typeof commands];

  if (!commandFn) {
    console.error(`❌ Unknown command: ${command}`);
    console.log('Run "graph-cli help" for usage information');
    process.exit(1);
  }

  try {
    await commandFn(...commandArgs);
  } catch (error) {
    console.error('❌ Error:', error);
    logger.error('CLI command failed', error, { command, args: commandArgs });
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
