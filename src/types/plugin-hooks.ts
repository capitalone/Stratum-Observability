import type { RegisteredStratumCatalog } from '../utils/catalog';
import type { CatalogEvent, CatalogKey, UserDefinedCatalogOptions } from './catalog';

/**
 * Scoped set of service capabilities exposed to plugins via onRegister.
 * Provides access to stratum internals without exposing the full service.
 */
export interface PluginHooks {
  /**
   * Register a new catalog and receive the catalog instance for direct publishing.
   *
   * @param {RegisteredStratumCatalog<T, K>} options - Catalog items and optional metadata
   * @returns The registered catalog instance
   */
  addCatalog<T extends CatalogEvent, K extends CatalogKey = CatalogKey>(
    options: UserDefinedCatalogOptions<T, K>
  ): RegisteredStratumCatalog<T, K>;
}
