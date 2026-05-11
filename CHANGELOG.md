# Changelog

## v2.0.0

### Added

1. Catalog-level publishing via `catalog.publish(key)` with compile-time key safety
2. `PluginHooks` parameter on `onRegister`, exposing `hooks.addCatalog()` for plugin-owned catalogs
3. `addItems()` on `RegisteredStratumCatalog` to add items after catalog creation

### Changed

1. **Breaking:** `addCatalog()` returns a `RegisteredStratumCatalog` instance instead of a catalog ID string
2. Duplicate catalog IDs now merge items into the existing catalog instead of rejecting
3. Integrates BiomeJS and removes Prettier/Eslint/Lintstaged