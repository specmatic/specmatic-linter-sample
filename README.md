# Specmatic Linter

Specmatic Linter is an enterprise-grade linting solution for modern API and interface specifications. It helps teams detect and report issues during local development and in CI/CD pipelines, enabling consistent quality, stronger governance, and compliance with both industry standards and organization-specific policies.

This sample project provides a guided walkthrough of Specmatic Linter's core capabilities.

## Key Capabilities
* **Semantic intelligence**: Understands the intent of your API, not just its syntax.
* **Executable contracts**: Lints specifications and validates examples so they can serve as enforceable contracts.
* **High performance**: Uses a concurrent engine designed for enterprise-scale workloads.
* **Precision-engineered**: Delivers high-confidence validation with deterministic rules and low-noise results.
* **Mission-critical reliability**: Supports large-scale systems and CI/CD-driven governance workflows.
* **Extensibility**: Provides an approachable DSL for custom rules and organization-specific policies.
* **Flexible integration**: Supports shift-left feedback in local development environments and enforcement in CI/CD pipelines.
* **Auto-fix**: Establishes the foundation for automated remediation of semantic and syntax issues.
* **Best-of-breed architecture**: Built on proven patterns to address the practical limitations of conventional linting approaches.

## Prerequisites

- Docker Engine must be running.

## Guided Demo

The walkthrough lives in `demo/`:

- `demo/openapi.yaml` contains a sample specification with intentional violations.
- `demo/specmatic-linter.yaml` starts with only semantic rules enabled.
- `demo/js-plugin/` contains the custom JavaScript plugin.

### Step 1: Run minimal semantic linting

From the repository root, run:

```bash
docker run --rm -v ./demo:/usr/src/app specmatic/enterprise lint openapi.yaml --config specmatic-linter.yaml
```

```terminaloutput
  "totals": {
    "errors": 6,
    "warnings": 3,
    "ignored": 0
  }
```

This command lints `openapi.yaml` using the **`minimal` ruleset**, which contains **58 rules**, along with **6 additional Specmatic semantic rules** configured in `specmatic-linter.yaml`.

You should see the following semantic issues being reported:

- enum values that contradict the declared schema type
- numeric bounds that make a value impossible
- regex and length constraints that cannot both be satisfied
- array schemas without an `items` definition
- `$ref` definitions that incorrectly include sibling fields
- `GET` operations with request bodies
- security declarations shadowed by conflicting schema properties

### Step 2: Run recommended semantic linting

Update `demo/specmatic-linter.yaml` config file as follows:

```yaml
extends:
 - minimal
```

to

```yaml
extends:
 - recommended
```

Rerun the same command:

```bash
docker run --rm -v ./demo:/usr/src/app specmatic/enterprise lint openapi.yaml --config specmatic-linter.yaml
```

```terminaloutput
  "totals": {
    "errors": 8,
    "warnings": 21,
    "ignored": 0
  }
```

This lints `openapi.yaml` spec file using the **`recommended` ruleset**, which contains **84 rules**.

Specmatic Linter can detect issues such as the following:

| Issue Type                  | Other Linters | Specmatic                            |
|-----------------------------|---------------|--------------------------------------|
| Constraint Contradictions   | Valid         | Error (Enum/schema contradiction)    |
| Regex Incompatibility       | Valid         | Error (Pattern vs Length)            |
| Boundary Violations         | Valid         | Error (Max < Min)                    |
| Incomplete Schema Shape     | Valid         | Error (Missing data type for arrays) |
| HTTP Semantic Conflicts     | Valid         | Error (Get with requestBody)         |
| Schema Composition Problems | Valid         | Error (Ref has siblings)             |
| Security Overlaps           | Valid         | Warning (Shadowed Schemes)           |

You can review the full list of Specmatic semantic rules in `demo/specmatic-linter.yaml` under the `### Specmatic's Advanced Semantic Rules ###` section.

### Step 3: Customize the severity of a specific rule

Update `demo/specmatic-linter.yaml` as follows:

```yaml
specmatic/ref-has-siblings: error
```

to

```yaml
specmatic/ref-has-siblings: warn
```

Rerun the same command:

```bash
docker run --rm -v ./demo:/usr/src/app specmatic/enterprise lint openapi.yaml --config specmatic-linter.yaml
```

```terminaloutput
  "totals": {
    "errors": 7,
    "warnings": 22,
    "ignored": 0
  }
```

As expected, the number of `errors` decreases from 8 to 7, while `warnings` increases from 21 to 22.

### Step 4: Enable configurable rules

Open `demo/specmatic-linter.yaml` and uncomment the block immediately below:

```yaml
### Configurable corporate rules ###
```

This enables the following three rules:

- `rule/no-error-param`
- `rule/parameter-description-required`
- `rule/force-oidc-auth`

Rerun the same command:

```bash
docker run --rm -v ./demo:/usr/src/app specmatic/enterprise lint openapi.yaml --config specmatic-linter.yaml
```

```terminaloutput
  "totals": {
    "errors": 10,
    "warnings": 22,
    "ignored": 0
  }
```

You should now see 3 additional violations (errors) from organization-specific YAML DSL rules, including:

- forbidding the parameter name `error`
- requiring every parameter to include a description
- allowing only OIDC-based security schemes

To understand how these rules are structured, see [configurable-rule-anatomy.md](configurable-rule-anatomy.md).

### Step 5: Enable custom JS plugin rules

In `demo/specmatic-linter.yaml`, uncomment the block below the following section:

```yaml
### Custom JS Rules ###
```

This enables:

- the `plugins:` block and the following custom rules
- `corp-standards/pagination-range`
- `corp-standards/operation-id-naming`

Rerun the same command.

```bash
docker run --rm -v ./demo:/usr/src/app specmatic/enterprise lint openapi.yaml --config specmatic-linter.yaml
```

```terminaloutput
  "totals": {
    "errors": 11,
    "warnings": 23,
    "ignored": 0
  }
```

You should now see violations that require JavaScript-based evaluation, including:

- a derived `operationId` naming check reported as a warning
- a pagination safety rule that validates `limit + offset` reported as an error

Custom JavaScript rules are useful when a rule depends on cross-field logic, computed values, or dynamic expectations that the YAML DSL cannot express cleanly.

For more detail, see [custom-js-rule-anatomy.md](custom-js-rule-anatomy.md).

## High-Performance Engine

Specmatic Linter is designed for demanding validation workloads:
* **Architected for scale**: Processes thousands of specifications in seconds.
* **Built for parallel execution**: Handles large enterprise workloads efficiently.
* **Precision-engineered**: Provides deterministic validation and low-noise output.
* **CI/CD ready**: Delivers lightweight execution with detailed reporting.

### Performance Benchmark

`performance/` remains a separate sample for large-scale linting.

#### macOS / Linux
```bash
cd performance
./scripts/run-performance-benchmark.sh
```

#### Windows
```bat
cd performance
.\scripts\run-performance-benchmark.cmd
```

```terminaloutput
--- Starting Performance Benchmark (Enterprise Estate) ---
Note: Detailed results for each spec will be saved to performance/results/
Specification File        |    Lines |   Errors |   Warnings
--------------------------+----------+----------+-----------
spec-1.yaml               |     3409 |      651 |       1902
...
...
spec-50.yaml              |     2167 |      383 |       1384
--------------------------+----------+----------+-----------
TOTAL ESTATE              |   102713 |    18041 |      68343

Resource Utilization
Average CPU Usage: 589.25%
Peak CPU Usage:    754.46%

✅ SUCCESS: Linted 50 specifications (~12550 paths)
⏱️  Total Execution Time: 3991ms

📂 Detailed reports saved to: results/
```

The benchmark lints 50 large specifications and reports execution time, resource utilization, and generated result artifacts.

For a meaningful evaluation, compare both the depth of validation and the execution speed of Specmatic Linter against your current linting solution.

## Future Roadmap
* **Architecture improvements**: Continued investment in the underlying architecture to further improve performance and scalability.
* **Broader specification support**: Current support focuses on OpenAPI 3.x, with planned linting support for AsyncAPI, Arazzo, GraphQL SDL, Protobuf, Open-RPC, MCP, A2A, and additional formats.
* **Auto-fix capabilities**: Planned support for automatic remediation of semantic and syntax issues in specifications and examples.
* **Maturity levels**: Planned support for maturity tiers such as Baseline, Bronze, Silver, Gold, and Platinum.
* **Profiles**: Planned support for curated rule profiles tailored to different specification types and governance needs.
* **Rule categorization**: Improved logical grouping of rules to simplify triage and enable category-based execution, such as security-only validation.
* **Expanded built-in rulesets**: Broader coverage through additional industry-standard rulesets, including OWASP and JSON Schema-aligned validations.
