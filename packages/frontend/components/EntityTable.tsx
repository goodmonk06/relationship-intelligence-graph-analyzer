import { EntityWithMetrics, EntityType } from '@/lib/types';

interface EntityTableProps {
  entities: EntityWithMetrics[];
  selectedEntityId: string | null;
  onSelectEntity: (id: string) => void;
}

const entityTypeColors: Record<EntityType, string> = {
  [EntityType.ACCOUNT]: 'bg-blue-100 text-blue-800',
  [EntityType.CONTACT]: 'bg-green-100 text-green-800',
  [EntityType.DEAL]: 'bg-purple-100 text-purple-800',
  [EntityType.ORG]: 'bg-yellow-100 text-yellow-800',
  [EntityType.OTHER]: 'bg-gray-100 text-gray-800',
};

export default function EntityTable({
  entities,
  selectedEntityId,
  onSelectEntity,
}: EntityTableProps) {
  return (
    <div className="overflow-hidden">
      <div className="max-h-96 overflow-y-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50 sticky top-0">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Entity
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Connections
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Importance
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {entities.map((entity) => (
              <tr
                key={entity.id}
                onClick={() => onSelectEntity(entity.id)}
                className={`cursor-pointer hover:bg-gray-50 transition-colors ${
                  selectedEntityId === entity.id ? 'bg-blue-50' : ''
                }`}
              >
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {entity.name}
                  </div>
                  {entity.metaJson?.email && (
                    <div className="text-xs text-gray-500">
                      {entity.metaJson.email}
                    </div>
                  )}
                  {entity.metaJson?.title && (
                    <div className="text-xs text-gray-500">
                      {entity.metaJson.title}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span
                    className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      entityTypeColors[entity.type]
                    }`}
                  >
                    {entity.type}
                  </span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-center">
                  <div className="text-sm text-gray-900">
                    {entity.metrics.degree}
                  </div>
                  <div className="text-xs text-gray-500">
                    {entity.metrics.inDegree}↓ {entity.metrics.outDegree}↑
                  </div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-center">
                  <div className="flex items-center justify-center">
                    <div className="w-16 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${entity.metrics.importance * 100}%` }}
                      />
                    </div>
                    <span className="ml-2 text-sm text-gray-900">
                      {Math.round(entity.metrics.importance * 100)}%
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
