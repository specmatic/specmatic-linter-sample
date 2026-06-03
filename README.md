# Specmatic Linter Interactive Lab

This sample project is a guided, hands-on lab for learning Specmatic Linter in the following order:

<!-- TOC -->
* [Specmatic Linter Interactive Lab](#specmatic-linter-interactive-lab)
  * [Prerequisites](#prerequisites)
  * [Folder Layout](#folder-layout)
  * [1. Rules Intro](#1-rules-intro)
    * [Step 1: Run Built-in Rules](#step-1-run-built-in-rules)
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
  * [6. Performance](#6-performance)
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

This demo introduces the three kinds of rules:
- built-in rules
- configurable YAML rules
- custom JS rules

### Step 1: Run Built-in Rules

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
    "level": "non_compliant"
  }
```

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

You have now enabled configurable YAML rules, which results in 3 additional errors.

Supporting references:
- [demo/rules-intro/configurable-rule-anatomy.md](demo/rules-intro/configurable-rule-anatomy.md)

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

Those new findings (1 error and 1 warning) come from JavaScript logic rather than from the YAML rule DSL.

Supporting references:
- [demo/rules-intro/custom-js-rule-anatomy.md](demo/rules-intro/custom-js-rule-anatomy.md)

## 2. Maturity Levels

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

Not every API needs the same level of linting rigor. Using profiles, teams can share the same rule catalog while adapting governance levels to the API type.

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

## 6. Performance

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
