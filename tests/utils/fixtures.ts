import type { StratumSnapshot, UserDefinedEventOptions } from '../../src/types';
import {
  AB_TEST_SCHEMA,
  PRODUCT_NAME,
  PRODUCT_VERSION,
  STRATUM_LIBRARY_VERSION_PLACEHOLDER,
  DEFAULT_CATALOG_ID,
  GENERATED_DEFAULT_METADATA,
  SESSION_ID,
  CATALOG_METADATA,
  METADATA_CATALOG_ID,
  PLACEHOLDERS
} from './constants';

export const SAMPLE_EVENT_OPTIONS: Partial<UserDefinedEventOptions> = {
  replacements: PLACEHOLDERS
};

export const NR_MOCK = {
  event: {
    abTests: [AB_TEST_SCHEMA],
    catalogEventType: 'nrEvent',
    catalogId: DEFAULT_CATALOG_ID,
    catalogVersion: GENERATED_DEFAULT_METADATA.catalogVersion,
    componentName: GENERATED_DEFAULT_METADATA.componentName,
    componentVersion: GENERATED_DEFAULT_METADATA.componentVersion,
    isValid: undefined,
    message: 'abc',
    productName: PRODUCT_NAME,
    productVersion: PRODUCT_VERSION,
    stratumLibraryVersion: STRATUM_LIBRARY_VERSION_PLACEHOLDER,
    stratumSessionId: SESSION_ID,
    stratumEventId: '100'
  },
  api: {
    abTests: [AB_TEST_SCHEMA],
    catalogEventType: 'nrApiResponse',
    catalogId: DEFAULT_CATALOG_ID,
    catalogVersion: GENERATED_DEFAULT_METADATA.catalogVersion,
    componentName: GENERATED_DEFAULT_METADATA.componentName,
    componentVersion: GENERATED_DEFAULT_METADATA.componentVersion,
    featureName: 'featureName',
    isValid: undefined,
    message: 'abc',
    productName: PRODUCT_NAME,
    productVersion: PRODUCT_VERSION,
    requestHeaders: 'requestHeaders',
    requestUri: 'requestUri',
    statusCode: 'statusCode',
    statusText: 'statusText',
    stratumLibraryVersion: STRATUM_LIBRARY_VERSION_PLACEHOLDER,
    stratumSessionId: SESSION_ID,
    stratumEventId: '102'
  },
  error: {
    abTests: [AB_TEST_SCHEMA],
    catalogEventType: 'nrError',
    catalogId: DEFAULT_CATALOG_ID,
    catalogVersion: GENERATED_DEFAULT_METADATA.catalogVersion,
    componentName: GENERATED_DEFAULT_METADATA.componentName,
    componentVersion: GENERATED_DEFAULT_METADATA.componentVersion,
    errorCode: 'myerrorcode',
    errorText: 'errortext',
    featureName: 'featureName',
    isValid: undefined,
    isVisual: false,
    message: 'errormessage',
    productName: PRODUCT_NAME,
    productVersion: PRODUCT_VERSION,
    reason: 'myreason',
    stratumLibraryVersion: STRATUM_LIBRARY_VERSION_PLACEHOLDER,
    stratumSessionId: SESSION_ID,
    stratumEventId: '104'
  },
  sampleA: {
    abTests: [AB_TEST_SCHEMA],
    catalogEventType: 'a',
    catalogId: METADATA_CATALOG_ID,
    catalogVersion: CATALOG_METADATA.catalogVersion,
    componentName: CATALOG_METADATA.componentName,
    componentVersion: CATALOG_METADATA.componentVersion,
    isValid: undefined,
    pluginA_var1: 'var1',
    pluginA_var2: 'var2',
    productName: PRODUCT_NAME,
    productVersion: PRODUCT_VERSION,
    prop1: 'prop1',
    prop2: 'prop2',
    stratumLibraryVersion: STRATUM_LIBRARY_VERSION_PLACEHOLDER,
    stratumSessionId: SESSION_ID,
    stratumEventId: '1'
  }
};

export const BASE_EVENT_MOCK: StratumSnapshot = {
  abTestSchemas: [],
  catalog: {
    id: DEFAULT_CATALOG_ID,
    metadata: {
      catalogVersion: '',
      componentName: PRODUCT_NAME,
      componentVersion: PRODUCT_VERSION
    }
  },
  data: {
    eventType: 'base',
    description: 'base event 1',
    id: 1
  },
  globalContext: {},
  plugins: {},
  productName: PRODUCT_NAME,
  productVersion: PRODUCT_VERSION,
  stratumSessionId: SESSION_ID,
  stratumVersion: STRATUM_LIBRARY_VERSION_PLACEHOLDER,
  event: {
    eventType: 'base',
    id: 1,
    key: '1'
  }
};
