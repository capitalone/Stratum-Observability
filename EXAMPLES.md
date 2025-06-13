# Stratum Observability Examples

This document contains example implementations and usage patterns for Stratum Observability.

## Basic Implementation

A typical Stratum implementation consists of:
1. Stratum Catalog - single source of truth for the voice of your application
1. Shared StratumService instance to load plugins and publish events from
1. Functional code aka your application code! Any files containing logic you'd like to observe

```ts
  import { StratumService } from '@capitalone/stratum-observability';
  import { NewRelicPluginFactory } from '@capitalone/stratum-observability/plugins/new-relic';

  /**
   * Using enumerated keys afford the best chance of consistent references throughout your application. 
   * This replaces the need to hard code string values as reference.
   */
  export const EventKey = {
    LOADED: 'app-loaded'
  };

  /**
   * Initialize Stratum with required arguments, again 
   * typically within a shared file for re-use.
   * 
   * The StratumService is the engine for publishing.
   */
  export const stratumService = new StratumService({
    /**
     * 1+ plugins defining your standardized event schemas and how to
     * map these schemas when published to your data collectors
     * 
     * The NewRelicPlugin is available from the @capitalone/stratum-observability library
     */
    plugins: [NewRelicPluginFactory()],

    /**
     * The canonical name for referring to this capability
     */
    productName: 'stratumExampleApp',

    /**
     * Typically, this references the version of the application you're 
     * publishing observability events from
     */
    productVersion: 'REPLACE_WITH_PRODUCT_VERSION',

    /**
     * Your "catalog" or dictionary serves as the source-of-truth of events 
     * published by an application. This provides the structure for standardization.
     * 
     * Custom plugins allow you to define your own catalog events, attributes,
     * and custom validation rules.
     * 
     * We've added an example event for the sake of getting started.
     */
    catalog: {
      items: {
        [EventKey.LOADED]: {
          eventType: 'base', // The base event type for Stratum events
          description: 'This application has loaded for the first time',
          id: 1 // Very important reference identifier -- the key to simple queries
        }
      }
    }
  });

  /**
   * Publish your event via Stratum. In this example, Stratum will send your event
   * to New Relic's Browser Agent, if available on the webpage.
   * 
   * (see: https://docs.newrelic.com/docs/browser/browser-monitoring/getting-started/introduction-browser-monitoring/)
   */
  stratumService.publish(EventKey.LOADED);
```

## Creating a Custom Plugin

### Basic Plugin Structure

```javascript
import { BasePlugin } from '@capitalone/stratum-observability';

/**
 * For TypeScript support, BasePlugin accepts types for 
 */
export class SimplePlugin extends BasePlugin<never, never> {
  name: 'mySimplePlugin',
  eventTypes: {
    // Map catalog events with { eventType: 'simple' } to an instance of SimpleEventModel
    simple: SimpleEventModel
  },
  publishers: [ new SimplePublisher() ]
}
```

### Plugin Factories

```javascript title="Simple plugin factory"
import type { PluginFactory } from '@capitalone/stratum-observability';
const SimplePluginFactory: PluginFactory<SimplePlugin> = () => new SimplePlugin();
const myPluginInstance = SimplePluginFactory();
```

```javascript title="Plugin factory with *optional* options"
import type { PluginFactory } from '@capitalone/stratum-observability';

interface MyOptions {
  isLoggedIn: boolean
}

const SimplePluginFactoryWithOptions: PluginFactory<SimplePlugin> = (options) => {
  return options?.isLoggedIn ? new SimplePluginWAuthentication() : new SimplePlugin();
}

/**
 * In the above, options is optional so both of the
 * following implementations are allowed by the compiler.
 */
const myPluginInstance = SimplePluginFactoryWithOptions(); // Valid
const myPluginInstanceWithOptions = SimplePluginFactoryWithOptions({ isLoggedIn: true }); // Also valid
```

### Catalog Entries

```javascript
import { StratumCatalog, CatalogEvent } from '@capitalone/stratum-observability';

const SimpleEventType = 'my-simple-event';

/**
 * Creates a new event type with the base stratum event fields
 * and an additional "simpleValue" number attribute
 */
interface SimpleEvent extends StratumEvent<SimpleEventType> {
  simpleValue: number;
}

/**
 * A catalog composed of SimpleEvents can then
 * be defined.
 * 
 * If you do not provide your custom event type interface as a generic
 * to the StratumCatalog type, ype-hinting for required properties
 * will not be available. 
 * 
 * Multiple custom event type interfaces can be added as a union:
 * `StratumCatalog<SimpleEvent | ComplexEvent>`
 */
const catalog: StratumCatalog<SimpleEvent> = {
  {
    eventType: SimpleEventType,

    // Implement the required base properties required by Stratum
    description: 'My simple event that fires from the "mySimplePlugin" plugin',
    id: 1,

    // Additional fields defined by SimpleEvent
    simpleValue: 12345
  }
}
```

### Event Models

```javascript
import { BaseEventModel } from '@capitalone/stratum-observability';

// Pass your SimpleEvent interface into the base EventModel
export class SimpleEventModel extends BaseEventModel<SimpleEvent> {
  // Override to include any custom run-time validation rules
  protected checkValidity(): boolean {
    let isValid = super.checkValidity();

    if(!this.item.simpleValue || typeof this.item.simpleValue === 'number') {
      this.addValidationError('The "simpleValue" value provided is in an invalid format');
      isValid = false;
    }

    return isValid;
  }
}
```

### Publisher Models

```javascript
import { BasePublisher, EventOptions } from '@capitalone/stratum-observability';

interface ExternalEventSchema {
  id: number,
  simpleValue: number
}

export class SimplePublisher extends BasePublisher<ExternalEventSchema> {
  // Required
  name = 'SimplePublisher';

  /**
   * Required
   * Check if your publisher source is available (aka scripts installed, environment
   * is set up, etc.)
   * 
   * In this case, we make sure that console.log() is accessible.
   */
  async isAvailable(_model: SimpleEventModel) {
    return typeof console !== 'undefined';
  }

  /**
   * Required
   * Map the contents of your event model instance to your event schema
   */
  getModelOutput(model: SimpleEventModel, options?: Partial<EventOptions>): ExternalEventSchema {
    const data = model.getData(options);
    return {
      id: data.id,
      simpleValue: data.simpleValue
    };
  }

  /**
   * Required
   * Send your simple event content to the external publisher
   * 
   * In this, case we publish the event to the console log
   */
  async publish(event: ExternalEventSchema) {
    console.log('publishing simple event!', { id: event.id, simpleValue: event.simpleValue });
  }
}
``` 