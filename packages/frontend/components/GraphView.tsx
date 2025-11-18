'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { fetchNeighborhood } from '@/lib/api';
import { GraphNeighborhood, EntityType, RelationType } from '@/lib/types';

// Dynamic import to avoid SSR issues with force-graph
const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), {
  ssr: false,
});

interface GraphViewProps {
  entityId: string;
}

const entityTypeColors: Record<EntityType, string> = {
  [EntityType.ACCOUNT]: '#3B82F6',
  [EntityType.CONTACT]: '#10B981',
  [EntityType.DEAL]: '#8B5CF6',
  [EntityType.ORG]: '#F59E0B',
  [EntityType.OTHER]: '#6B7280',
};

const relationTypeLabels: Record<RelationType, string> = {
  [RelationType.INTRODUCED_BY]: 'introduced by',
  [RelationType.WORKS_AT]: 'works at',
  [RelationType.INVOLVED_IN]: 'involved in',
  [RelationType.REPORTS_TO]: 'reports to',
  [RelationType.PARTNERS_WITH]: 'partners with',
  [RelationType.BOUGHT_FROM]: 'bought from',
  [RelationType.OTHER]: 'related to',
};

export default function GraphView({ entityId }: GraphViewProps) {
  const [graphData, setGraphData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadGraph = async () => {
      try {
        setLoading(true);
        setError(null);
        const neighborhood = await fetchNeighborhood(entityId);

        // Transform data for react-force-graph
        const nodes = neighborhood.entities.map((entity) => ({
          id: entity.id,
          name: entity.name,
          type: entity.type,
          val: entity.id === neighborhood.centerEntity.id ? 20 : 10,
          color: entityTypeColors[entity.type],
          isCenter: entity.id === neighborhood.centerEntity.id,
        }));

        const links = neighborhood.relations.map((relation) => ({
          source: relation.fromId,
          target: relation.toId,
          label: relationTypeLabels[relation.relationType],
          strength: relation.strength,
        }));

        setGraphData({ nodes, links });
      } catch (err) {
        setError('Failed to load graph data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadGraph();
  }, [entityId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Loading graph...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  if (!graphData) {
    return null;
  }

  return (
    <div className="relative">
      <div className="mb-4 p-3 bg-gray-50 rounded">
        <h3 className="text-sm font-semibold mb-2">Legend</h3>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center">
            <div
              className="w-3 h-3 rounded-full mr-2"
              style={{ backgroundColor: entityTypeColors[EntityType.ACCOUNT] }}
            />
            <span>Account</span>
          </div>
          <div className="flex items-center">
            <div
              className="w-3 h-3 rounded-full mr-2"
              style={{ backgroundColor: entityTypeColors[EntityType.CONTACT] }}
            />
            <span>Contact</span>
          </div>
          <div className="flex items-center">
            <div
              className="w-3 h-3 rounded-full mr-2"
              style={{ backgroundColor: entityTypeColors[EntityType.DEAL] }}
            />
            <span>Deal</span>
          </div>
          <div className="flex items-center">
            <div
              className="w-3 h-3 rounded-full mr-2"
              style={{ backgroundColor: entityTypeColors[EntityType.ORG] }}
            />
            <span>Org</span>
          </div>
        </div>
      </div>

      <div className="border border-gray-200 rounded">
        <ForceGraph2D
          graphData={graphData}
          nodeLabel="name"
          nodeColor="color"
          nodeRelSize={6}
          linkLabel="label"
          linkDirectionalArrowLength={3.5}
          linkDirectionalArrowRelPos={1}
          linkWidth={(link: any) => link.strength * 2}
          linkColor={() => '#999'}
          width={550}
          height={400}
          nodeCanvasObject={(node: any, ctx: any, globalScale: number) => {
            const label = node.name;
            const fontSize = 12 / globalScale;
            ctx.font = `${fontSize}px Sans-Serif`;
            const textWidth = ctx.measureText(label).width;
            const bckgDimensions = [textWidth, fontSize].map(
              (n) => n + fontSize * 0.2
            );

            // Draw node
            ctx.fillStyle = node.color;
            ctx.beginPath();
            ctx.arc(node.x, node.y, node.val / 2, 0, 2 * Math.PI, false);
            ctx.fill();

            // Add highlight for center node
            if (node.isCenter) {
              ctx.strokeStyle = '#000';
              ctx.lineWidth = 2 / globalScale;
              ctx.stroke();
            }

            // Draw label background
            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.fillRect(
              node.x - bckgDimensions[0] / 2,
              node.y + node.val / 2 + fontSize * 0.2,
              bckgDimensions[0],
              bckgDimensions[1]
            );

            // Draw label text
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            ctx.fillStyle = '#000';
            ctx.fillText(
              label,
              node.x,
              node.y + node.val / 2 + fontSize * 0.3
            );
          }}
        />
      </div>

      <div className="mt-2 text-xs text-gray-600">
        <p>
          Showing direct connections. Larger node = selected entity. Arrow
          direction shows relationship flow.
        </p>
      </div>
    </div>
  );
}
