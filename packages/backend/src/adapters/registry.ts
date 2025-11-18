/**
 * Adapter registry for managing pluggable components
 */

import { INotificationAdapter, ConsoleNotificationAdapter } from './INotificationAdapter';
import { IDataImporter } from './IDataImporter';
import { IMetricsExporter, ConsoleMetricsExporter } from './IMetricsExporter';
import { logger } from '../lib/logger';

class AdapterRegistry {
  private notificationAdapters: Map<string, INotificationAdapter> = new Map();
  private dataImporters: Map<string, IDataImporter> = new Map();
  private metricsExporters: Map<string, IMetricsExporter> = new Map();

  constructor() {
    // Register default adapters
    this.registerNotificationAdapter('console', new ConsoleNotificationAdapter());
    this.registerMetricsExporter('console', new ConsoleMetricsExporter());
  }

  // Notification adapters
  registerNotificationAdapter(name: string, adapter: INotificationAdapter): void {
    this.notificationAdapters.set(name, adapter);
    logger.info('Notification adapter registered', { name });
  }

  getNotificationAdapter(name: string): INotificationAdapter | undefined {
    return this.notificationAdapters.get(name);
  }

  getDefaultNotificationAdapter(): INotificationAdapter {
    return this.notificationAdapters.get('console')!;
  }

  // Data importers
  registerDataImporter(name: string, importer: IDataImporter): void {
    this.dataImporters.set(name, importer);
    logger.info('Data importer registered', { name });
  }

  getDataImporter(name: string): IDataImporter | undefined {
    return this.dataImporters.get(name);
  }

  // Metrics exporters
  registerMetricsExporter(name: string, exporter: IMetricsExporter): void {
    this.metricsExporters.set(name, exporter);
    logger.info('Metrics exporter registered', { name });
  }

  getMetricsExporter(name: string): IMetricsExporter | undefined {
    return this.metricsExporters.get(name);
  }

  getDefaultMetricsExporter(): IMetricsExporter {
    return this.metricsExporters.get('console')!;
  }

  // Utility methods
  listRegisteredAdapters() {
    return {
      notificationAdapters: Array.from(this.notificationAdapters.keys()),
      dataImporters: Array.from(this.dataImporters.keys()),
      metricsExporters: Array.from(this.metricsExporters.keys()),
    };
  }
}

// Export singleton instance
export const adapterRegistry = new AdapterRegistry();
