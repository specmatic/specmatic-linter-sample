# Anatomy of a Custom JS Rule

JS rules are registered through a root plugin and exposed through the root `rules` inventory.

## Plugin config

```yaml
plugins:
  - ./js-plugin/index.js

rules:
  corp-standards/pagination-range:
    severity: error
    type: parameters

  corp-standards/operation-id-naming:
    severity: warn
    type: operations
```

## Profile usage

```yaml
profiles:
  js-rules:
    rules:
      extends:
        - recommended
      include:
        - corp-standards/pagination-range
        - corp-standards/operation-id-naming
```

## Demo rules

The main demo enables:

- `corp-standards/pagination-range`
- `corp-standards/operation-id-naming`
