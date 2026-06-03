# Specmatic Linter Interactive Lab

Specmatic Linter is an enterprise-grade linting solution for modern API and interface specifications. It helps teams detect and report issues during local development and in CI/CD pipelines, enabling consistent quality, stronger governance, and compliance with both industry standards and organization-specific policies.

It provides a scalable way to enforce shared standards with rules, maturity levels, types, profiles, and central configuration, while still adapting linting rigor to different API contexts.

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

This sample project is a guided, hands-on lab for learning Specmatic Linter in the following order:

<!-- TOC -->
* [Specmatic Linter Interactive Lab](#specmatic-linter-interactive-lab)
  * [Key Capabilities](#key-capabilities)
  * [Prerequisites](#prerequisites)
  * [Folder Layout](#folder-layout)
  * [1. Rules Intro](#1-rules-intro)
    * [Step 1: Run Built-in Rules](#step-1-run-built-in-rules)
      * [Minimal rule-set](#minimal-rule-set)
      * [Recommended rule-set](#recommended-rule-set)
    * [Step 2: Enable Configurable Rules](#step-2-enable-configurable-rules)
    * [Step 3: Enable Custom JS Rules](#step-3-enable-custom-js-rules)
  * [2. Maturity Levels](#2-maturity-levels)
    * [Step 1: Run the Initial Setup](#step-1-run-the-initial-setup)
    * [Step 2: Raise One Rule's Maturity Level](#step-2-raise-one-rules-maturity-level)
    * [Step 3: Remove One Rule From Maturity Participation](#step-3-remove-one-rule-from-maturity-participation)
  * [3. Rule Types](#3-rule-types)
    * [Step 1: Run All Rules](#step-1-run-all-rules)
    * [Step 2: Run rules only of type `examples`](#step-2-run-rules-only-of-type-examples)
    * [Step 3: Run rules of type `examples` or `schema`](#step-3-run-rules-of-type-examples-or-schema)
  * [4. Profiles](#4-profiles)
    * [Step 1: Run Without Any Profile](#step-1-run-without-any-profile)
    * [Step 2: Run the `internal` Profile](#step-2-run-the-internal-profile)
    * [Step 3: Run the `public-api` Profile](#step-3-run-the-public-api-profile)
    * [Step 4: Tweak A Profile](#step-4-tweak-a-profile)
  * [5. Central Config Repo](#5-central-config-repo)
    * [Step 1: Run with the Default Profile](#step-1-run-with-the-default-profile)
    * [Step 2: Run with `internal-api` profile](#step-2-run-with-internal-api-profile)
    * [Why the Central Config Repo Flow Helps](#why-the-central-config-repo-flow-helps)
  * [6. High-Performance Engine](#6-high-performance-engine)
      * [macOS / Linux](#macos--linux)
      * [Windows](#windows)
<!-- TOC -->

## Prerequisites

- Docker Engine must be running.

## Folder Layout

- `demo/rules-intro/`
- `demo/maturity/`
- `demo/rule-types/`
- `demo/profiles/`
- `demo/central-config-repo/`
- `performance/`

Start at the top and work through the lab step by step. Each section below explains:
- which files to inspect
- what to edit
- which command to run
- what output to expect

## 1. Rules Intro

Problem: Teams need more than one kind of linting rule because some standards are universal, some are organization-specific, and some require contextual/custom logic.

Benefit: Specmatic Linter lets you combine built-in, configurable, and custom JavaScript rules in one governance flow.

This demo introduces the three kinds of rules:
- built-in rules
- configurable rules
- custom JS rules

### Step 1: Run Built-in Rules

#### Minimal rule-set

```bash
docker run --rm -v ./demo/rules-intro:/usr/src/app specmatic/enterprise lint openapi.yaml --config specmatic-linter.yaml
```

```terminaloutput
  "totals": {
    "errors": 5,
    "warnings": 4,
    "ignored": 0
  },
  "maturity": {
    "level": "Gold"
  }
```

This command lints `openapi.yaml` using the built-in **`minimal` ruleset**, which contains **54 rules**, configured in `specmatic-linter.yaml`.

You should see the following semantic issues being reported:

- enum values that contradict the declared schema type
- numeric bounds that make a value impossible
- regex and length constraints that cannot both be satisfied
- array schemas without an `items` definition
- `$ref` definitions that incorrectly include sibling fields
- `GET` operations with request bodies

#### Recommended rule-set

Open [demo/rules-intro/specmatic-linter.yaml](demo/rules-intro/specmatic-linter.yaml) and update 

```yaml
      extends:
        - minimal
```

to

```yaml
      extends:
        - recommended
```

Run the same command again:
```bash
docker run --rm -v ./demo/rules-intro:/usr/src/app specmatic/enterprise lint openapi.yaml --config specmatic-linter.yaml
```

```terminaloutput
  "totals": {
    "errors": 7,
    "warnings": 22,
    "ignored": 0
  },
  "maturity": {
    "level": "Non compliant"
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

You can review the full list of Specmatic semantic rules in `demo/rules-intro/specmatic-linter.yaml` under the `### Specmatic's Advanced Semantic Rules ###` section.

At this point only built-in rules are active.

### Step 2: Enable Configurable Rules

Open [demo/rules-intro/specmatic-linter.yaml](demo/rules-intro/specmatic-linter.yaml) and uncomment the `include:` block under the `Step 2` comment.

Run the same command again:

```bash
docker run --rm -v ./demo/rules-intro:/usr/src/app specmatic/enterprise lint openapi.yaml --config specmatic-linter.yaml
```

```terminaloutput
  "totals": {
    "errors": 10,
    "warnings": 22,
    "ignored": 0
  },
  "maturity": {
    "level": "non_compliant"
  }
```

You should now see 3 additional violations (errors) from organization-specific YAML DSL rules, including:

- forbidding the parameter name `error`
- requiring every parameter to include a description
- allowing only OIDC-based security schemes

To understand how these rules are structured, see [demo/rules-intro/configurable-rule-anatomy.md](demo/rules-intro/configurable-rule-anatomy.md).

### Step 3: Enable Custom JS Rules

Open [demo/rules-intro/specmatic-linter.yaml](demo/rules-intro/specmatic-linter.yaml) and uncomment the block under the `Step 3` comment.

This adds 2 more custom JS rules:
- `corp-standards/pagination-range`
- `corp-standards/operation-id-naming`

Run the same command again:

```bash
docker run --rm -v ./demo/rules-intro:/usr/src/app specmatic/enterprise lint openapi.yaml --config specmatic-linter.yaml
```

```terminaloutput
  "totals": {
    "errors": 11,
    "warnings": 23,
    "ignored": 0
  },
  "maturity": {
    "level": "non_compliant"
  }
```

You should now see violations that require JavaScript-based evaluation, including:

- a derived `operationId` naming check reported as a warning
- a pagination safety rule that validates `limit + offset` reported as an error

Custom JavaScript rules are useful when a rule depends on cross-field logic, computed values, or dynamic expectations that the YAML DSL cannot express cleanly.

For more detail, see [demo/rules-intro/custom-js-rule-anatomy.md](demo/rules-intro/custom-js-rule-anatomy.md).

## 2. Maturity Levels

Problem: Teams often need a way to measure API quality progressively instead of treating all governance rules as equally mandatory from day one.

Benefit: Maturity levels help teams roll out standards in stages and clearly show the highest quality bar a specification currently satisfies.

This demo shows:
- maturity is configured per rule
- overall maturity is computed from failing error-level rules
- maturity uses the following hierarchy:
  - Non Compliant
  - Baseline
  - Bronze
  - Silver
  - Gold
  - Platinum

### Step 1: Run the Initial Setup

```bash
docker run --rm -v ./demo/maturity:/usr/src/app specmatic/enterprise lint openapi.yaml --config specmatic-linter.yaml
```

```terminaloutput
  "totals": {
    "errors": 2,
    "warnings": 0,
    "ignored": 0
  },
  "maturity": {
    "level": "baseline"
  }
```

There are 2 errors reported here:
- `info-license`, which is at the `Gold` level
- `operation-summary`, which is at the `Bronze` level

Since a rule at the bronze level failed, the maturity is set to `baseline`, the highest level at which all rules are passing.

### Step 2: Raise One Rule's Maturity Level

In [demo/maturity/specmatic-linter.yaml](demo/maturity/specmatic-linter.yaml), change:

```yaml
maturity: bronze
```

to:

```yaml
maturity: silver
```

Run the same command again:

```bash
docker run --rm -v ./demo/maturity:/usr/src/app specmatic/enterprise lint openapi.yaml --config specmatic-linter.yaml
```

```terminaloutput
  "totals": {
    "errors": 2,
    "warnings": 0,
    "ignored": 0
  },
  "maturity": {
    "level": "bronze"
  }
```

The same 2 rules still fail, but because the failing rule now has a higher maturity level, the overall spec maturity moves up to `bronze`.

### Step 3: Remove One Rule From Maturity Participation

Change the severity for rule `operation-summary` from:

```yaml
severity: error
```

to:

```yaml
severity: warn
```

Run the same command again:

```bash
docker run --rm -v ./demo/maturity:/usr/src/app specmatic/enterprise lint openapi.yaml --config specmatic-linter.yaml
```

```terminaloutput
  "totals": {
    "errors": 1,
    "warnings": 1,
    "ignored": 0
  },
  "maturity": {
    "level": "silver"
  }
```

Since `operation-summary` no longer reports an error as it now reports a warning, it no longer participates in the maturity computation. Only rules with severity `error` participate.

## 3. Rule Types

Problem: Running every rule for every use case can create noise when teams want to focus on a specific quality area such as examples, schema, or security.

Benefit: Rule types let teams filter the active ruleset so linting stays targeted, relevant, and easier to adopt.

This demo shows how `types` lets you filter rules.

Built-in rule types:
- `security`
- `schema`
- `examples`
- `operations`
- `parameters`
- `metadata`

### Step 1: Run All Rules

```bash
docker run --rm -v ./demo/rule-types:/usr/src/app specmatic/enterprise lint openapi.yaml --config specmatic-linter.yaml
```

```terminaloutput
"totals": {
  "errors": 9,
  "warnings": 12,
  "ignored": 0
}
```

### Step 2: Run rules only of type `examples`

In [demo/rule-types/specmatic-linter.yaml](demo/rule-types/specmatic-linter.yaml), uncomment:

```yaml
    types:
      - examples
```

Run the same command again:

```bash
docker run --rm -v ./demo/rule-types:/usr/src/app specmatic/enterprise lint openapi.yaml --config specmatic-linter.yaml
```

```terminaloutput
"totals": {
  "errors": 1,
  "warnings": 2,
  "ignored": 0
}
```

### Step 3: Run rules of type `examples` or `schema`

In [demo/rule-types/specmatic-linter.yaml](demo/rule-types/specmatic-linter.yaml), update:

```yaml
    types:
      - examples
``` 
with

```yaml
    types:
      - examples
      - schema
``` 

Run the same command again:

```bash
docker run --rm -v ./demo/rule-types:/usr/src/app specmatic/enterprise lint openapi.yaml --config specmatic-linter.yaml
```

```terminaloutput
"totals": {
  "errors": 5,
  "warnings": 2,
  "ignored": 0
}
```

## 4. Profiles

Problem: Different APIs often need different governance levels, but maintaining separate rule files for each API type quickly becomes hard to manage.

Benefit: Profiles let teams reuse the same base ruleset while adjusting severities and applicability for contexts such as internal and public APIs.

Profiles let teams share one rule catalog while varying enforcement by API type.

### Step 1: Run Without Any Profile

```bash
docker run --rm -v ./demo/profiles:/usr/src/app specmatic/enterprise lint openapi.yaml --config specmatic-linter.yaml
```

```terminaloutput
"totals": {
  "errors": 2,
  "warnings": 8,
  "ignored": 0
}
```

### Step 2: Run the `internal` Profile

```bash
docker run --rm -v ./demo/profiles:/usr/src/app specmatic/enterprise lint openapi.yaml --config specmatic-linter.yaml --profile internal
```

```terminaloutput
"totals": {
  "errors": 2,
  "warnings": 7,
  "ignored": 2
}
```

### Step 3: Run the `public-api` Profile

```bash
docker run --rm -v ./demo/profiles:/usr/src/app specmatic/enterprise lint openapi.yaml --config specmatic-linter.yaml --profile public-api
```

```terminaloutput
"totals": {
  "errors": 6,
  "warnings": 6,
  "ignored": 0
}
```

### Step 4: Tweak A Profile

In [demo/profiles/specmatic-linter.yaml](demo/profiles/specmatic-linter.yaml), change this inside `public-api`:

```yaml
operation-summary: error
```

to:

```yaml
operation-summary: warn
```

Rerun the `public-api` command:

```bash
docker run --rm -v ./demo/profiles:/usr/src/app specmatic/enterprise lint openapi.yaml --config specmatic-linter.yaml --profile public-api
```

```terminaloutput
"totals": {
  "errors": 5,
  "warnings": 7,
  "ignored": 0
}
```

## 5. Central Config Repo

Problem: Governance breaks down when every team copies and edits its own lint configuration, creating drift across local development and CI.

Benefit: A central config repository keeps rule ownership and versioning in one place while allowing teams to opt into the right policy through profile selection.

This demo shows the central governance model.

Locally, you keep only the spec. The rule config lives in a central Git repository, and the only thing you change is `--profile`.

This walkthrough uses the public repo:
- [specmatic/central-linter-config.git](https://github.com/specmatic/central-linter-config.git)

### Step 1: Run with the Default Profile

```bash
docker run --rm -v "./demo/central-config-repo:/usr/src/app" specmatic/enterprise lint openapi.yaml \
  --config-repo-url=https://github.com/specmatic/central-linter-config.git 
```

```terminaloutput
"totals": {
  "errors": 2,
  "warnings": 9,
  "ignored": 0
}
```

If your Specmatic linter config file, `specmatic-linter.yaml`, is not at the top level, pass its path like this:

```bash
docker run --rm -v "./demo/central-config-repo:/usr/src/app" specmatic/enterprise lint openapi.yaml \
  --config-repo-url=https://github.com/specmatic/central-linter-config.git \
  --config=specmatic-linter.yaml
```

If your central config repo is private, set:

```bash
export CENTRAL_CONFIG_REPO_TOKEN=<your-pat>
```

The PAT should have access to that private repo.

### Step 2: Run with `internal-api` profile

```bash
docker run --rm -v "./demo/central-config-repo:/usr/src/app" specmatic/enterprise lint openapi.yaml \
  --config-repo-url=https://github.com/specmatic/central-linter-config.git \
  --profile=internal-api
```

```terminaloutput
"totals": {
  "errors": 6,
  "warnings": 7,
  "ignored": 2
}
```

### Why the Central Config Repo Flow Helps
- no local rule file
- avoid duplication - each team does not need to tune and maintain rules
- only profile selection changes locally
- the central platform or API governance team owns the linting rules
- one place to manage rules, profiles, severities, and maturity gates
- simpler org-wide rollout of new standards
- consistent behavior across local development and CI
- easier auditing because governance changes are versioned in one repository

## 6. High-Performance Engine

Specmatic Linter is designed for demanding validation workloads:
* **Architected for scale**: Processes thousands of specifications in seconds.
* **Built for parallel execution**: Handles large enterprise workloads efficiently.
* **Precision-engineered**: Provides deterministic validation and low-noise output.
* **CI/CD ready**: Delivers lightweight execution with detailed reporting.

The performance benchmark sample demonstrates that our linter can perform equally well for larger workloads without slowing you down.

`performance/` remains the large benchmark sample.

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
* **Expanded built-in rulesets**: Broader coverage through additional industry-standard rulesets, including OWASP and JSON Schema-aligned validations.
