# Browser Console Plugin

The Browser Console plugin is a development and debugging tool for Stratum Observability that logs events to the browser console. It's particularly useful during development and testing to monitor event flow and data structure.

## Features

- Logs all Stratum events to the browser console
- Provides detailed event information including:
  - Event type and ID
  - Event data
  - Plugin context
  - Global context
  - Catalog metadata
  - Session information

## Installation

The Browser Console plugin is included with Stratum Observability. No additional installation is required.

## Usage

### Basic Setup

```typescript
import { StratumService } from '@capitalone/stratum-observability';
import { BrowserConsolePluginFactory } from '@capitalone/stratum-observability/plugins/browser-console';

// Initialize Stratum with the Browser Console plugin
const stratum = new StratumService({
  productName: 'YourApp',
  productVersion: '1.0.0',
  plugins: [BrowserConsolePluginFactory()]
});
```

### Global Registration

You can also register the plugin globally, which will make it available to all Stratum instances:

```typescript
import { addGlobalPlugin } from '@capitalone/stratum-observability';
import { BrowserConsolePluginFactory } from '@capitalone/stratum-observability/plugins/browser-console';

// Add the plugin to the global namespace
addGlobalPlugin(BrowserConsolePluginFactory());
```

## Output Format

The plugin logs events in the following format:

```
BrowserConsolePlugin: {
  event: {
    eventType: string,
    id: string
  },
  data: any,
  plugins: {
    [pluginName: string]: {
      context: object,
      options: object
    }
  },
  globalContext: object,
  catalog: {
    metadata: object,
    id: string
  },
  stratumSessionId: string,
  productName: string,
  productVersion: string,
  stratumVersion: string
}
```

## Best Practices

1. **Development Only**: This plugin is primarily intended for development and debugging. Consider removing it in production environments.

2. **Console Filtering**: Use browser console filtering to focus on specific event types or data when debugging.

3. **Performance**: The plugin logs all events, which can be verbose. Use browser console filtering or remove the plugin when not needed.

## Example

```typescript
// Initialize Stratum with the Browser Console plugin
const stratum = new StratumService({
  productName: 'MyApp',
  productVersion: '1.0.0',
  plugins: [BrowserConsolePluginFactory()],
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

// Publish an event
stratum.publish('user-action');
```

This will output to the console:

```
BrowserConsolePlugin: {
  event: {
    eventType: "base",
    id: "user-action"
  },
  data: {
    action: "click",
    target: "button"
  },
  // ... additional context and metadata
}
```

## Troubleshooting

If you don't see console output:

1. Verify the plugin is properly registered in your Stratum configuration
2. Check that events are being published correctly
3. Ensure the browser console is open and not filtered
4. Verify that `console.log` is available in your environment

## Related

- [Stratum Observability Documentation](../../README.md)
- [Plugin Architecture Documentation](../../docs/plugins.md)
- [Event Catalog Documentation](../../docs/catalog.md)
