# Anatomy of a Configurable Rule

Configurable rules let you express organization-specific linting logic directly in `specmatic-linter.yaml`.

## Rule Shape

Each rule lives under `rules` and uses a `rule/<name>` identifier:

```yaml
rule/no-error-param:
  severity: error
  subject:
    type: Parameter
    property: name
  assertions:
    pattern: '^(?!error$).*$'
  message: "Architectural violation: Parameter names must not be 'error'."
```

## Parts of the Rule

- `rule/<name>`: a custom rule ID that distinguishes your DSL rule from built-in rules
- `severity`: whether the violation is reported as `error`, `warn`, or `info`
- `subject.type`: the OpenAPI node to inspect, such as `Parameter` or `SecurityScheme`
- `subject.property`: the specific field to validate when the full object is not needed
- `assertions`: the condition being enforced, such as `const`, `enum`, `pattern`, or `required`
- `message`: the user-facing explanation shown when the rule fails

You can also add a `where` clause when a rule should apply only in a narrower context.

## Demo Examples

The `demo/specmatic-linter.yaml` file includes three configurable rules you can uncomment:

- `rule/no-error-param`: rejects the literal parameter name `error`
- `rule/parameter-description-required`: requires every parameter to have a `description`
- `rule/force-oidc-auth`: enforces `openIdConnect` as the only allowed security scheme type

These rules are a good fit for the DSL because they inspect one node at a time and rely on direct assertions rather than computed logic.
