# New Relic Plugin

The New Relic plugin integrates Stratum's event catalog with New Relic's Browser SPA monitoring, enabling real-time tracking of user interactions and application events. What makes this plugin unique is its ability to process **any event in your catalog using only the base Stratum snapshot** - no additional plugin-specific data structures or configurations required.

## Key Differentiator

Unlike other plugins that may require specific event types or additional data structures, the New Relic plugin works exclusively with the base Stratum snapshot. This means:

- **Zero Configuration**: No need to define special event types or data structures
- **Universal Compatibility**: Works with any event in your catalog out of the box
- **Simplified Integration**: No need to modify your existing event definitions
- **Future-Proof**: Automatically works with new event types as they're added to your catalog

## Features

- **Base Snapshot Processing**: Works exclusively with the base Stratum snapshot data, without requiring additional plugin-specific data structures
- **Universal Event Processing**: Processes any event type defined in your Stratum catalog
- **Real-time Monitoring**: Converts Stratum events into New Relic Browser Interactions
- **Context Preservation**: Maintains event context and metadata across the integration
- **Custom Attributes**: Supports custom attributes and event naming
- **Session Tracking**: Automatically includes session information and component metadata
- **A/B Test Support**: Integrates with Stratum's A/B testing capabilities

## Installation

The New Relic plugin is included with Stratum Observability. However, you need to have the New Relic Browser SPA agent initialized in your application.

### Prerequisites

1. A New Relic Browser SPA account
2. The New Relic Browser SPA agent installed in your application
3. Stratum Observability installed in your project

## Usage

### Basic Setup

```typescript
import { StratumService } from '@capitalone/stratum-observability';
import { NewRelicPluginFactory } from '@capitalone/stratum-observability/plugins/new-relic';

// Initialize Stratum with the New Relic plugin
const stratum = new StratumService({
  productName: 'YourApp',
  productVersion: '1.0.0',
  plugins: [NewRelicPluginFactory()],
  catalog: {
    items: {
      'user-action': {
        eventType: 'base',
        data: {
          action: 'click',
          target: 'button'
        }
      }
    }
  }
});

// Publish an event - will be automatically sent to New Relic
// No special configuration needed - works with any event type!
stratum.publish('user-action');
```

### Global Registration

You can also register the plugin globally, making it available to all Stratum instances:

```typescript
import { addGlobalPlugin } from '@capitalone/stratum-observability';
import { NewRelicPluginFactory } from '@capitalone/stratum-observability/plugins/new-relic';

// Add the plugin to the global namespace
addGlobalPlugin(NewRelicPluginFactory());
```

## Event Processing

The plugin's simplicity is its strength - it processes all events using only the base Stratum snapshot data. This means:

1. **No Special Configuration Required**
   - Works with any event type in your catalog
   - No need to define plugin-specific event structures
   - No additional data transformations needed

2. **Direct Base Snapshot Processing**
   - All event data is processed directly from the base snapshot
   - No intermediate data structures or transformations
   - Preserves all original event data and context

3. **Automatic Metadata Handling**
   - Component information (name, version)
   - Catalog details (id, version, event type)
   - Product context (name, version)
   - Session identifiers
   - A/B test configurations

This approach ensures that any event in your catalog can be processed without requiring special configuration or additional data structures, making it the most flexible and easy-to-use New Relic integration available.

## Best Practices

1. **Event Naming**: Use clear, descriptive names for your events to make them easily identifiable in New Relic
2. **Context Data**: Leverage Stratum's global context to add relevant metadata to all events
3. **A/B Testing**: Use Stratum's A/B testing features to track experiment impact in New Relic
4. **Error Handling**: Include error information in your events for better error tracking
5. **Performance**: Be mindful of event frequency to avoid overwhelming New Relic's ingestion

## Example

```typescript
// Initialize Stratum with the New Relic plugin
const stratum = new StratumService({
  productName: 'MyApp',
  productVersion: '1.0.0',
  plugins: [NewRelicPluginFactory()],
  catalog: {
    items: {
      'form-submission': {
        eventType: 'base',
        data: {
          formId: 'login-form',
          success: true,
          fields: ['email', 'password']
        }
      }
    }
  }
});

// Publish an event - automatically processed using base snapshot data
stratum.publish('form-submission');
```

This will create a New Relic Browser Interaction with all the event data and context, using only the base snapshot data. No special configuration or additional data structures needed!

## Troubleshooting

If events are not appearing in New Relic:

1. Verify the New Relic Browser SPA agent is properly initialized
2. Check that the plugin is correctly registered in your Stratum configuration
3. Ensure events are being published correctly
4. Verify your New Relic account has the correct permissions
5. Check the browser console for any error messages

## Related

- [Stratum Observability Documentation](../../README.md)
- [Plugin Architecture Documentation](../../docs/plugins.md)
- [Event Catalog Documentation](../../docs/catalog.md)
- [New Relic Browser SPA Documentation](https://docs.newrelic.com/docs/browser/new-relic-browser/browser-agent-spa-api/) 