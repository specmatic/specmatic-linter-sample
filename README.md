# Specmatic Linter

Specmatic Linter provides a comprehensive linting solution for several major specification standards. It is designed to identify and report issues locally and in CI/CD pipelines to ensure consistency and compliance with both industry standards and custom organizational policies.

This sample project provides you a guided walkthrough of Specmatic Linter's capabilities.

## Specmatic Linter - Key Capabilities?
* **Semantic Intelligence**: We understand what your API means, not just what it says.
* **Executable Contracts**: We lint your specs and validate your examples to ensure they can act as executable, enforceable contracts.
* **Superior Performance**: High-performance concurrent engine built for enterprise-scale workloads.
* **Precision-engineered**: High-confidence validation with deterministic rules and low-noise results.
* **Mission-Critical Reliability**: Production-hardened validation designed for large-scale systems and CI/CD pipelines.
* **Extensibility**: Easy-to-use DSL for defining custom rules and organisation-specific policies.
* **Integration**: Shift left (get linting feedback during local development like CLI, IDEs) or run in CI/CD pipelines to block non-compliant specifications before they are published.
* **Auto-Fix**: Automatically identify and fix semantic and syntax issues.
* **Best-of-Breed Architecture**: Built on proven patterns while addressing the limitations of traditional linting approaches.

## Prerequisites

- Docker Engine should be running

## Guided Demo

The walkthrough lives in `demo/`:

- `demo/openapi.yaml` contains one spec with intentional violations
- `demo/specmatic-linter.yaml` starts with only semantic rules enabled
- `demo/js-plugin/` contains the custom JS plugin you enable later in the walkthrough

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

This lints the `openapi.yaml` spec file using the **`minimal` ruleset** containing **58 rules**. Plus **6 additional Specmatic semantic rules** which are configured in `specmatic-linter.yaml` config file

You should see the following semantic issues being reported:

- enum values that contradict the declared schema type
- numeric bounds that make a value impossible
- regex and length constraints that cannot both be satisfied
- array schemas without an `items` definition
- `$ref` definitions that incorrectly include sibling fields
- `GET` operations with request bodies
- security declarations shadowed by conflicting schema properties

### Step 2: Run recommended semantic linting

Update the `demo/specmatic-linter.yaml` config file, change:

```yaml
extends:
 - minimal
```

to

```yaml
extends:
 - recommended
```

Rerun the same command

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

This lints the `openapi.yaml` spec file using the **`recommended` ruleset** containing **84 rules**.

Specmatic Linter is capable of catching the following:

| Issue Type                  | Other Linters | Specmatic                            |
|-----------------------------|---------------|--------------------------------------|
| Constraint Contradictions   | Valid         | Error (Enum/schema contradiction)    |
| Regex Incompatibility       | Valid         | Error (Pattern vs Length)            |
| Boundary Violations         | Valid         | Error (Max < Min)                    |
| Incomplete Schema Shape     | Valid         | Error (Missing data type for arrays) |
| HTTP Semantic Conflicts     | Valid         | Error (Get with requestBody)         |
| Schema Composition Problems | Valid         | Error (Ref has siblings)             |
| Security Overlaps           | Valid         | Warning (Shadowed Schemes)           |

You can see the full list of Specmatic semantic rules in the `demo/specmatic-linter.yaml` config file under the `### Specmatic's Advanced Semantic Rules ###` section.

### Step 3: Customize severity of a given rule

Update the `demo/specmatic-linter.yaml` config file, change:

```yaml
specmatic/ref-has-siblings: error
```

to

```yaml
specmatic/ref-has-siblings: warn
```

Rerun the same command

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

As you can see, `errors` reduced from 8 to 7 and `warnings` increased from 21 to 22.

### Step 4: Enable configurable rules

Open `demo/specmatic-linter.yaml` and uncomment the block immediately below:

```yaml
### Configurable corporate rules ###
```

This would enable the following three rules:

- `rule/no-error-param`
- `rule/parameter-description-required`
- `rule/force-oidc-auth`

Rerun the same command

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

To understand how these rules are structured, read [configurable-rule-anatomy.md](configurable-rule-anatomy.md).

### Step 3: Enable custom JS plugin rules

In `demo/specmatic-linter.yaml`, uncomment the block below the following section:

```yaml
### Custom JS Rules ###
```

That will enable:

- the `plugins:` block and the following customer rules
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

- a derived `operationId` naming check - WARNING
- a pagination safety rule that validates `limit + offset` - ERROR

Custom JS rules are useful when the rule depends on cross-field logic, computed values, or dynamic expectations that the YAML DSL cannot express cleanly.

For more detail, read [custom-js-rule-anatomy.md](custom-js-rule-anatomy.md).

## High-Performance Engine

Specmatic Linter is
* **Architected for Scale**: Processes thousands of specs in seconds.
* **Designed for Parallel Execution**: Designed to handle massive enterprise workloads.
* **Precision-engineered**: High-confidence validation with deterministic rules and low-noise results.
* **CI/CD Ready**: Lightweight execution with detailed reporting.

### Performance Benchmark

`performance/` remains a separate sample for large-scale linting.

#### macOS / Linux:
```bash
cd performance
./scripts/run-performance-benchmark.sh
```

#### Windows:
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

The benchmark lints 50 large specs and reports timing plus generated result artifacts.

You must compare Specmatic Linter's performance (quality/depth of evaluation using out-of-box rules and speed) with your current (soon-to-change) favourite linter.

## Future Roadmap
* **Alpha version**: We are in the process of improving Specmatic Linter's architecture to out-perform its own benchmarks.
* **Support for other Specs**: Currently we only support OpenAPI 3.x version. We'll soon be releasing linting support for AsyncAPI, Arazzo, GraphQL SDL, Protobuf, Open-RPC, MCP, A2A, and more.
* **Auto-fix**: In the future, you would be able to automatically identify and fix semantic and syntax issues with your specs and examples.
* **Maturity Level**: Soon you would be able to define maturity levels for your specs and assign badges like Baseline, Bronze, Silver, Gold and Platinum.
* **Profiles**: Soon you would be able to define profiles with hand-picked rules, so you can decide which linting profile needs to be applied to which type of spec.
* **Rule Categories**: We are in the process of logically grouping each rule in a category so it is easier to understand violations based on category, but also use it as a filter to only run a given category like security. 
* **Expand Built-in Ruleset**: Extend the current built in rules with other industry standard rulesets from OWASP, JSONSchema, etc.