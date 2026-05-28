# Custom Rules in JavaScript

While the YAML DSL is powerful for simple field checks, some architectural standards require complex logic, cross-field comparisons, or dynamic string manipulation. For these scenarios, Specmatic Linter supports **JavaScript Plugins**.

## 🏗 Plugin Structure

A plugin consists of an `index.js` file that exports a rule collection, and individual rule implementation files.

### 1. The Rule Implementation
A rule is a function that returns a **Visitor Object**. The visitor defines hooks for different OpenAPI nodes.

```javascript
function myComplexRule() {
  return {
    Operation: {
      enter(operation, ctx) {
        // Your logic here
        if (someCondition(operation)) {
          ctx.report({
            message: "Custom violation message",
            location: ctx.location.child('someField')
          });
        }
      }
    }
  };
}
```

### 2. The Plugin Index (`index.js`)
Maps your rules to a namespace and specific OpenAPI versions.

```javascript
const { myRule } = require('./rules/my-rule');

module.exports = {
  id: 'my-namespace', // Used in config as my-namespace/my-rule
  rules: {
    oas3: {
      'my-rule': myRule
    }
  }
};
```

---

## 💡 Examples in this Sample

### Cross-Field Validation (`pagination-range.js`)
Ensures the sum of `limit` and `offset` default values doesn't exceed a safety threshold.
*   **Why JS?** Requires mathematical addition of two different parameters, which the DSL cannot perform.

### Dynamic Naming Standards (`operation-id-naming.js`)
Enforces that `operationId` must be derived from the path (e.g., `/users` -> `getUsers`).
*   **Why JS?** Requires string manipulation (concatenation, capitalization) based on dynamic path values.

---

## 🚀 How to use
1. Define your rules in the `rules/` directory.
2. Register them in `index.js`.
3. Load the plugin and enable rules in `specmatic-linter.yaml`:
   ```yaml
   plugins:
     - ./index.js
   rules:
     my-namespace/my-rule: error
   ```
