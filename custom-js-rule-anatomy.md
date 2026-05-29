# Anatomy of a Custom JS Rule

Custom JS rules are for checks that need code, not just declarative assertions.

## Plugin Structure

The guided sample keeps the plugin in `demo/js-plugin/`:

- `index.js`: registers the plugin ID and exposed rules
- `rules/*.js`: implements each rule

The config enables the plugin like this:

```yaml
plugins:
  - ./js-plugin/index.js

rules:
  corp-standards/pagination-range: error
  corp-standards/operation-id-naming: warn
```

## Registration

`index.js` exports:

- `id`: the plugin namespace used in rule IDs such as `corp-standards/pagination-range`
- `rules.oas3` and `rules.oas3_1`: the rule factories for each supported OpenAPI version

## Rule Shape

A rule returns a visitor object. Each visitor hook receives the current OpenAPI node and a reporting context:

```javascript
function myRule() {
  return {
    Operation: {
      enter(operation, ctx) {
        if (shouldReport(operation)) {
          ctx.report({
            message: 'Custom violation message',
            location: ctx.location.child('parameters'),
          });
        }
      },
    },
  };
}
```

## Why the Demo Uses JS

The sample includes two JS rules:

- `pagination-range`
  Validates that `limit + offset` stays below a safety threshold. This requires reading two fields and computing a sum.
- `operation-id-naming`
  Derives the expected `operationId` from the HTTP method and path. This requires dynamic string construction from route data.

These are difficult to express cleanly in the YAML DSL because they depend on cross-field evaluation and computed expectations rather than a single static assertion.
