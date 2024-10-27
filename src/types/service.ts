import type { GenericPlugin } from './plugin';
import type { DefaultCatalogOptions } from './catalog';

/**
 * Options passed into the StratumService on initialization.
 */
export interface StratumServiceOptions {
  /**
   * Catalog metadata that can be optionally provided to
   * the service. The catalog registered via this property
   * will be stored as the default catalog.
   */
  catalog?: DefaultCatalogOptions;

  /**
   * Name of the application that is implementing Stratum.
   * This is a required value and is automatically populated based on
   * the respective value in StratumServiceOptions.
   */
  productName: string;

  /**
   * Version of the application that is implementing Stratum.
   * This is a required value and is automatically populated based on the
   * respective value in StratumServiceOptions.
   */
  productVersion: string;

  /**
   * Plugins to dynamically add to the service.
   *
   * A plugin is composed of one or more custom event models and
   * publisher models.
   *
   * Plugins can be used to leverage the catalog functionality
   * in new ways.
   */
  plugins?: GenericPlugin | GenericPlugin[];
}
