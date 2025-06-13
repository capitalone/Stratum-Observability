# Stratum Observability | standardization as you publish

> Your app speaks Stratum—observability platforms listen.

A no-dependency library defining a framework for sending analytics and observability events in a standardized format. Stratum is a plugin-based framework that allows you to create your own custom plugins to define, validate, and publish events to your observability stack. We also offer community-driven plugins for popular integrations.



## Background
### Guiding principles
1. Stratum does not replace existing tooling, but is meant to standardize how you use it.
   1. Example: Continue using your favorite analytics or observability platform, but unify event formats and publishing logic by wrapping it in a Stratum plugin shared across all your projects.
2. Events are first-class citizens—design and document them intentionally.
   1. Example: Create a catalog of well-defined event types (e.g., FormError, UserStep) with clear schemas, so everyone knows what data is available and how to use it.
3. Standardization enables better insights and faster problem resolution.
   1. Example: Use consistent event names and data structures everywhere, so dashboards and alerts are easy to build and maintain.
4. Flexibility through plugins—customize integrations without losing consistency.
   1. Example: Build a plugin for a new tool or workflow, but always emit events in the same standardized format as the rest of your stack.
5. Context is king—share and manage metadata easily, including for A/B testing.
   1. Example: Use Stratum's global context to automatically attach user IDs, session info, or A/B test group assignments to every event, making it easy to analyze feature experiments and user behavior across your system.


### Common problems that Stratum helps solve
1. Standardized data for clean queries, clear ownership, and strongest possible signals for alerting/reporting
1. Being the first to know when your app is down, up, or sideways (let alone determining what any of those mean to you)
1. Clear cataloging of what your product is capable of and who's using what

## Key Features

- **Plugin Architecture**: Extensible plugin system that allows for custom event models and publishers
- **Global Context**: Share context data across plugins with optional prefixing to avoid collisions
- **Event Validation**: Built-in validation for event models with customizable rules
- **Snapshot System**: Atomic snapshots of event data for consistent publishing
- **A/B Testing Support**: Built-in A/B testing capabilities through the AbTestManager
- **TypeScript Support**: Full TypeScript support with comprehensive type definitions

## Available Plugins

Stratum comes with several built-in plugins:

- **New Relic**: Send events to New Relic for real-time dashboards and alerting
- **New Relic Plus**: Enhanced New Relic integration with additional features
- **Browser Console**: Development plugin for logging events to the browser console

## Getting started

For detailed examples and implementation patterns, please see [EXAMPLES.md](EXAMPLES.md).

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

For detailed examples of creating custom plugins, including plugin factories, catalog entries, event models, and publisher models, please see [EXAMPLES.md](EXAMPLES.md).

## Architecture

Stratum is built around a core service class (`StratumService`) that manages:
- Plugin registration and lifecycle
- Event catalog management
- Event publishing pipeline
- Global context and state

The framework uses a publisher-subscriber pattern where:
1. Events are defined in catalogs
2. Plugins provide event models and publishers
3. Publishers handle the actual sending of events to external systems

## Contributing
We welcome and appreciate your contributions! 

If you have suggestions or find a bug, please [open an issue](https://github.com/capitalone/Stratum-Observability/issues/new/choose).

If you want to contribute, visit the [contributing page](https://github.com/capitalone/Stratum-Observability/blob/main/CONTRIBUTING.md).
