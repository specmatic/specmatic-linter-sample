# Anatomy of a Configurable Rule

Configurable rules now live in the root `rules` inventory and are activated from a profile.

## Inventory entry

```yaml
rules:
  rule/no-error-param:
    severity: error
    type: parameters
    on:
      type: Parameter
      property: name
    must:
      pattern: '^(?!error$).*$'
    message: "Architectural violation: Parameter names must not be 'error'."
```

## Profile usage

```yaml
profiles:
  configurable-rules:
    rules:
      extends:
        - recommended
      include:
        - rule/no-error-param
```

## Demo examples

`demo/specmatic-linter.yaml` imports:

- `rule/no-error-param`
- `rule/parameter-description-required`
- `rule/force-oidc-auth`
