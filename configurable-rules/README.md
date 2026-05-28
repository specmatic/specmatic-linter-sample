# Anatomy of a Configurable Rule

Specmatic Linter allows you to enforce custom corporate standards using a simple, YAML-based Domain Specific Language (DSL). This guide explains how to construct your own rules.

## 🏗 Rule Structure

Each custom rule is defined under the `rules` key in your `specmatic-linter.yaml` file using the following anatomy:

```yaml
rule/your-rule-name:
  severity: error | warn | info
  subject:
    type: <NodeType>
    property: <PropertyName> (optional)
  assertions:
    <AssertionType>: <Value>
  message: "Custom violation message"
```

---

### 1. `severity`
Defines the impact of the violation.
- `error`: Fails the linting process (non-zero exit code).
- `warn`: Reports the issue but allows the process to pass.
- `info`: Logged for informational purposes only.

### 2. `subject`
Identifies **what** part of the OpenAPI specification is being inspected.

| Field | Description | Examples |
|-------|-------------|----------|
| `type` | The type of OpenAPI object to visit. | `Parameter`, `Operation`, `SecurityScheme`, `Schema`, `Info` |
| `property` | (Optional) A specific field within that object. | `name`, `type`, `description`, `key`, `in` |

> **Note:** Use `property: key` to target the name of a component (e.g., the name of a schema or security scheme).

### 3. `assertions`
Defines the **logic** used to validate the subject.

| Assertion | Description | Example |
|-----------|-------------|---------|
| `const` | Exact value match. | `const: openIdConnect` |
| `enum` | Value must be one of the listed items. | `enum: [userId, orderId]` |
| `pattern` | Value must match a Regular Expression. | `pattern: '^(?!error$).*$'` |
| `required`| Ensures specific sub-properties exist. | `required: [description]` |

### 4. `message`
The text displayed to the user when the rule is violated. Use this to provide architectural context or links to corporate documentation.

---

## 💡 Practical Examples

### Enforce Naming Conventions
Ensure all security schemes start with "Corp":
```yaml
rule/corp-security-prefix:
  severity: warn
  subject:
    type: SecurityScheme
    property: key
  assertions:
    pattern: '^Corp.*$'
  message: "Corporate Style: Security scheme names must start with 'Corp'."
```

### Prohibit Specific Data Types
Disallow the use of `integer` in specific parameters:
```yaml
rule/no-integers:
  severity: error
  subject:
    type: Parameter
    property: type
  assertions:
    pattern: '^(?!integer$).*$'
  message: "Architecture: Integers are not permitted for this parameter type."
```

### Mandatory Fields
Ensure every Info object has a license:
```yaml
rule/mandatory-license:
  severity: error
  subject:
    type: Info
  assertions:
    required:
      - license
  message: "Governance: Every API must define a license."
```
