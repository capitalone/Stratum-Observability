# New Relic Plus Plugin

> Domain-specific event tracking for New Relic

## Overview

The New Relic Plus plugin extends Stratum's New Relic integration with specialized event types for tracking application behavior. It provides a structured way to capture and analyze application-specific events in New Relic.

## Event Types

### General Event (`nrEvent`)
Track feature usage and application state:
```typescript
{
  name: string;           // What happened
  featureName?: string;   // Where it happened
  message?: string;       // Additional context
}
```

### API Response Event (`nrApiResponse`)
Monitor API performance and reliability:
```typescript
{
  requestUri: string;     // Endpoint
  statusCode: string;     // Response status
  statusText?: string;    // Response details
  retryNumber?: string;   // Retry tracking
}
```

### Error Event (`nrError`)
Track application errors with user impact:
```typescript
{
  errorCode: string;      // Error identifier
  errorText?: string;     // Error details
  reason?: string;        // User impact
  isVisual?: boolean;     // UI feedback
}
```

## Usage

```typescript
import { NewRelicPlusPluginFactory } from '@stratum/new-relic-plus';

const newRelicPlus = NewRelicPlusPluginFactory({
  defaultContext: {
    environment: 'production',
    version: '1.0.0'
  }
});

stratum.registerPlugin(newRelicPlus);
```

## Adding New Event Types

To add a new event type to the plugin:

1. Add the event type to `constants.ts`:
```typescript
export enum NewRelicEventType {
  CUSTOM = 'nrCustom',
  // ... existing types
}
```

2. Define your event structure in `types.ts`:
```typescript
export interface NewRelicCustomEvent extends NewRelicEvent<NewRelicEventType.CUSTOM> {
  // Your custom fields here
  customField: string;
}
```

3. Create a model in `model.ts`:
```typescript
export class NewRelicCustomEventModel extends NewRelicEventModel<NewRelicCustomEvent> {
  protected checkValidity(): boolean {
    let isValid = super.checkValidity();
    // Add your validation rules
    return isValid;
  }

  getData(options?: Partial<EventOptions>) {
    const item = super.getData(options);
    return {
      ...item,
      customField: this.processedNewRelicData.customField
    };
  }
}
```

The `processedNewRelicData` property contains the event data after it has been processed by the base model. This includes:
- Dynamic placeholder replacement
- Context enrichment
- Data validation
- Type coercion

Use this property in your `getData` method to access the processed values that will be sent to New Relic.

4. Register the new event type in the plugin:
```typescript
eventTypes = {
  [NewRelicEventType.CUSTOM]: NewRelicCustomEventModel,
  // ... existing types
};
```