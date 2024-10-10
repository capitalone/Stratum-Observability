import type { AbTestSchema, TagCatalogMetadata } from '../../src/types';

export const STRATUM_LIBRARY_VERSION_PLACEHOLDER = '__stratumLibraryVersion__';

export const PRODUCT_NAME = 'my-product-name';
export const PRODUCT_VERSION = '1.0';
export const SESSION_ID = 'd308a2b6-477c-48f5-8107-8977c2a86b01';

export const AB_TEST_SCHEMA: AbTestSchema = {
  name: 'test-ab',
  variationIds: ['feature-toggle-1', 'feature-toggle-2'],
  testGroup: 'a',
  testWeight: '0.5'
};

export const CATALOG_METADATA: TagCatalogMetadata = {
  componentName: 'abc-component',
  componentVersion: 'component-version-2.3.4',
  catalogVersion: '7.8.9'
};
export const METADATA_CATALOG_ID = `${CATALOG_METADATA.componentName}:${CATALOG_METADATA.catalogVersion}`;

export const DEFAULT_CATALOG_ID = `${PRODUCT_NAME}:${PRODUCT_VERSION}`;

export const DEFAULT_CATALOG_ID_W_CATALOG_VERSION = `${PRODUCT_NAME}:${CATALOG_METADATA.catalogVersion}`;

export const GENERATED_DEFAULT_METADATA = {
  componentName: PRODUCT_NAME,
  componentVersion: PRODUCT_VERSION,
  catalogVersion: ''
};

/* eslint-disable @typescript-eslint/no-explicit-any */
export const globalWindow = window as any;
