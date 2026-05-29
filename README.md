# Specmatic Linter Sample

This sample is organized around one guided walkthrough and one optional performance benchmark.

## Prerequisites

- Docker Engine should be running

## Guided Demo

The walkthrough lives in `demo/`:

- `demo/openapi.yaml` contains one spec with intentional violations
- `demo/specmatic-linter.yaml` starts with only semantic rules enabled
- `demo/js-plugin/` contains the custom JS plugin you enable later in the walkthrough

### Step 1: Run semantic linting

From the repository root, run:

```bash
docker run --rm -v ./demo:/usr/src/app specmatic/enterprise lint openapi.yaml --config specmatic-linter.yaml
```

```terminaloutput
  "totals": {
    "errors": 6,
    "warnings": 0,
    "ignored": 0
  }
```

This first run should catch built-in semantic issues such as:

- enum values that contradict the declared schema type
- numeric bounds that make a value impossible
- regex and length constraints that cannot both be satisfied
- array schemas without an `items` definition
- `$ref` definitions that incorrectly include sibling fields
- `GET` operations with request bodies
- security declarations shadowed by conflicting schema properties

### Step 2: Enable configurable rules

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
    "errors": 9,
    "warnings": 0,
    "ignored": 0
  }
```

You should now see additional violations from organization-specific YAML DSL rules, including:

- forbidding the parameter name `error`
- requiring every parameter to include a description
- allowing only OIDC-based security schemes

To understand how these rules are structured, read [configurable-rule-anatomy.md](configurable-rule-anatomy.md).

### Step 3: Enable custom JS plugin rules

In `demo/specmatic-linter.yaml`, uncomment the blocks below the following sections:

```yaml
### Custom JS plugin ###
```

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
    "errors": 10,
    "warnings": 1,
    "ignored": 0
  }
```

You should now see violations that require JavaScript-based evaluation, including:

- a derived `operationId` naming check - WARNING
- a pagination safety rule that validates `limit + offset` - ERROR

Custom JS rules are useful when the rule depends on cross-field logic, computed values, or dynamic expectations that the YAML DSL cannot express cleanly.

For more detail, read [custom-js-rule-anatomy.md](custom-js-rule-anatomy.md).

## Performance Benchmark

`performance/` remains a separate sample for large-scale linting.

macOS / Linux:
```bash
cd performance
./scripts/run-performance-benchmark.sh
```

Windows:
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
Peak CPU Usage:    854.46%

✅ SUCCESS: Linted 50 specifications (~12550 paths)
⏱️  Total Execution Time: 6991ms

📂 Detailed reports saved to: results/
```

The benchmark lints 50 large specs and reports timing plus generated result artifacts.
