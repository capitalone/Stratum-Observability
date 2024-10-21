# Stratum Observability | standardization as you publish

A no-dependency library defining a framework for sending analytics and observability events in a standardized format.
Stratum is a plugin-based framework that allows you to create your own custom plugins to define, validate, and publish events
to your observability stack. We also offer community-driven plugins for popular integrations.

**Common problems that Stratum helps solve:**
1. Standardized data for clean queries, clear ownership, and strongest possible signals for alerting/reporting
1. Being the first to know when your app is down, up, or sideways (let alone determining what any of those mean to you)
1. Clear cataloging of what your product is capable of and who's using what

## Getting started

A typical Stratum implementation consists of:
1. Tag Catalog - single source of truth for the voice of your application
1. Shared StratumService instance to load plugins and publish events from
1. Functional code aka your application code! Any files containing logic you'd like to observe

```ts
  import { StratumService } from '@capitalone/stratum-observability';
  import { NewRelicPluginFactory } from '@capitalone/stratum-observability/plugins/new-relic';

  /**
   * Tag Keys afford the best chance of consistent references throughout your application. 
   * This replaces the need to hard code string values as reference.
   */
  export const TagKey = {
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
     * Typically, this is your release tag or the version of the application you're 
     * getting observability from
     */
    productVersion: 'REPLACE_WITH_PRODUCT_VERSION',

    /**
     * Your "Tag Catalog" or dictionary serving as the source-of-truth of events 
     * published by an application. This provides the structure for standardization.
     * 
     * Custom plugins allow you to define your own tag catalog events, attributes,
     * and custom validation rules.
     * 
     * We've added an inline tag for the sake of getting started.
     */
    catalog: {
      tags: {
        [TagKey.LOADED]: {
          eventType: 'base', // The base event type for Stratum events
          tagDescription: 'This application has loaded for the first time',
          tagId: 1 // Very important reference identifier -- the key to simple queries
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
  stratumService.publishTag(TagKey.LOADED);
```

## Installation

**Via npm:**
```bash
npm install @capitalone/stratum-observability
```

**Via yarn:**
```bash
yarn add @capitalone/stratum-observability
```

## Creating a custom plugin

### Creating a new plugin

Plugins are composed of 3 pieces of data:
1. Name as a string identifier (required)
2. Map of tag eventTypes to the correspond TagModel class (optional)
3. One or more instantiated publishers to handle specific event type(s) (optional)

```javascript
import { BasePlugin } from '@capitalone/stratum-observability';

/**
 * For TypeScript support, BasePlugin accepts types for 
 */
export class SimplePlugin extends BasePlugin<never, never> {
  name: 'mySimplePlugin',
  eventTypes: {
    // Map tag catalog items with { eventType: 'simple' } to an instance of SimpleTagModel
    simple: SimpleTagModel
  },
  publishers: [ new SimplePublisher() ]
}
```

Each of the concepts above are explained in further detail in the following sections.

#### Plugin factories
If you have a configurable plugin that can be customized based on context, define your plugin as a PluginFactory instead of a static object. Plugin factories are a function that (optionally) take in arguments and return a new plugin instance on each execution.

Plugin factory options are good way to dynamically define plugins or pass initialization data to publishers at run-time. Use this in cases where your plugin needs to behave differently based on what application or environment is using it.

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

### Tag catalog entries
Through plugins, you may define custom event type which are referenced by the `eventType` property on your tags. Any tag loaded into your StratumService must have a corresponding eventType to TagModel relation defined via imported plugin.

```javascript
import { TagCatalog, TagObject } from '@capitalone/stratum-observability';

const SimpleEventType = 'my-simple-event';

/**
 * Creates a new event type with the base tag object fields
 * and an additional "simpleValue" number attribute
 */
interface SimpleTagObject extends TagObject<SimpleEventType> {
  simpleValue: number;
}

/**
 * A tag catalog composed of SimpleTagObjects can then
 * be defined.
 * 
 * If you do not provide your custom TagObject as a generic to the TagCatalog type, 
 * type-hinting for required properties will not be available. 
 * 
 * Multiple custom TagObjects can be added as a union:
 * `TagCatalog<MyCustomObject1 | MyCustomObject2>`
 */
const catalog = TagCatalog<SimpleTagObject> = {
  {
    eventType: SimpleEventType,

    // Implement the required TagObject properties
    tagDescription: 'My simple event that fires from the "mySimplePlugin" plugin',
    tagId: 1,

    // Additional fields defined by SimpleTagObject
    simpleValue: 12345
  }
}
```

### Tag models
```javascript
import { BaseTagModel } from '@capitalone/stratum-observability';

// Pass your TagObject interface into the parent TagModel
export class SimpleTagModel extends BaseTagModel<SimpleTagObject> {
  // Override to include custom tag validation rules
  protected checkValidity(): boolean {
    let isValid = super.checkValidity();

    if(!this.tag.simpleValue || typeof this.tag.simpleValue === 'number') {
      this.addValidationError('The "simpleValue" value provided is in an invalid format');
      isValid = false;
    }

    return isValid;
  }
}
```

### Publisher models
```javascript
import { BasePublisherModel, TagOptions } from '@capitalone/stratum-observability';

interface SimpleEvent {
  tagId: number,
  simpleValue: number
}

export class SimplePublisher extends BasePublisherModel<SimpleEvent> {
  // Required
  name = 'SimplePublisher';

  /**
   * Required
   * Check if your publisher source is available (aka scripts installed, environment
   * is set up, etc.)
   * 
   * In this case, we make sure that console.log() is accessible.
   */
  async isAvailable(_tag: SimpleTagModel) {
    return typeof console !== 'undefined';
  }

  /**
   * Required
   * Map the contents of your tag model instance to your event schema
   */
  getTagOutput(tag: SimpleTagModel, options?: Partial<TagOptions>): SimpleEvent {
    const tagData = tag.getData(options);
    return {
      tagId: tagData.tagId,
      simpleValue: tagData.simpleValue
    };
  }

  /**
   * Required
   * Send your simple event content to the external publisher
   * 
   * In this, case we publish the event to the console log
   */
  async publish(event: SimpleEvent) {
    console.log('publishing simple event!', { tagId: event.tagId, simpleValue: event.simpleValue });
  }
}
```

## Contributing
We welcome and appreciate your contributions! 

If you have suggestions or find a bug, please [open an issue](https://github.com/capitalone/Stratum-Observability/issues/new/choose).

If you want to contribute, visit the [contributing page](https://github.com/capitalone/Stratum-Observability/blob/main/CONTRIBUTING.md).
