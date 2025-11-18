'use client';

import { useEffect, useState } from 'react';
import { EntityWithMetrics, GraphMetrics } from '@/lib/types';
import { fetchTopEntities, fetchGraphMetrics, computeMetrics } from '@/lib/api';
import EntityTable from '@/components/EntityTable';
import GraphView from '@/components/GraphView';
import StatsPanel from '@/components/StatsPanel';

export default function Home() {
  const [topEntities, setTopEntities] = useState<EntityWithMetrics[]>([]);
  const [graphMetrics, setGraphMetrics] = useState<GraphMetrics | null>(null);
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [computing, setComputing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [entities, metrics] = await Promise.all([
        fetchTopEntities(20),
        fetchGraphMetrics(),
      ]);
      setTopEntities(entities);
      setGraphMetrics(metrics);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleComputeMetrics = async () => {
    try {
      setComputing(true);
      await computeMetrics();
      await loadData();
    } catch (err) {
      setError('Failed to compute metrics');
      console.error('Error computing metrics:', err);
    } finally {
      setComputing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading relationship graph...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 text-lg">{error}</p>
          <button
            onClick={loadData}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Relationship Intelligence Graph Analyzer
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                Analyze and visualize relationship networks in your CRM data
              </p>
            </div>
            <button
              onClick={handleComputeMetrics}
              disabled={computing}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {computing ? 'Computing...' : 'Recompute Metrics'}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {graphMetrics && <StatsPanel metrics={graphMetrics} />}

        <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Top Entities by Importance</h2>
            <p className="text-sm text-gray-600 mb-4">
              These are the most connected and influential entities in your network.
              Click to visualize their connections.
            </p>
            <EntityTable
              entities={topEntities}
              selectedEntityId={selectedEntityId}
              onSelectEntity={setSelectedEntityId}
            />
          </div>

          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">
              {selectedEntityId ? 'Relationship Network' : 'Select an Entity'}
            </h2>
            {selectedEntityId ? (
              <GraphView entityId={selectedEntityId} />
            ) : (
              <div className="flex items-center justify-center h-96 text-gray-400">
                Select an entity from the table to view their relationship network
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
