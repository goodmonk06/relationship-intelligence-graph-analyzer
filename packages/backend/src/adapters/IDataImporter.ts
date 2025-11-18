/**
 * Data importer adapter interface
 * Implement this to import data from various sources
 */

import { EntityType, RelationType, SourceType } from '@prisma/client';

export interface ImportedEntity {
  externalId: string;
  type: EntityType;
  name: string;
  metaJson?: Record<string, any>;
}

export interface ImportedRelation {
  fromExternalId: string;
  toExternalId: string;
  relationType: RelationType;
  strength?: number;
}

export interface ImportResult {
  entitiesImported: number;
  relationsImported: number;
  errors: string[];
}

export interface IDataImporter {
  /**
   * Get the source type for this importer
   */
  getSourceType(): SourceType;

  /**
   * Import entities and relations from the data source
   */
  import(config?: Record<string, any>): Promise<ImportResult>;

  /**
   * Validate that the importer is properly configured
   */
  isConfigured(): boolean;
}

/**
 * CSV Data Importer
 */
export class CSVImporter implements IDataImporter {
  getSourceType(): SourceType {
    return SourceType.IMPORT_CSV;
  }

  async import(config?: Record<string, any>): Promise<ImportResult> {
    // TODO: Implement CSV parsing and import logic
    throw new Error('CSV import not yet implemented');
  }

  isConfigured(): boolean {
    return true;
  }
}

/**
 * Salesforce Data Importer
 */
export class SalesforceImporter implements IDataImporter {
  constructor(
    private apiUrl: string,
    private clientId: string,
    private clientSecret: string
  ) {}

  getSourceType(): SourceType {
    return SourceType.IMPORT_SALESFORCE;
  }

  async import(config?: Record<string, any>): Promise<ImportResult> {
    // TODO: Implement Salesforce API integration
    throw new Error('Salesforce import not yet implemented');
  }

  isConfigured(): boolean {
    return !!(this.apiUrl && this.clientId && this.clientSecret);
  }
}
