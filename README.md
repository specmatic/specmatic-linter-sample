# Specmatic Linter Interactive Lab

This sample project is a guided, hands-on lab for learning Specmatic Linter in this order:

1. basic ruleset intro
2. maturity
3. rule types
4. profiles
5. central config repo
6. performance

## Prerequisites

- Docker Engine must be running.

## Folder Layout

- `demo/rules-intro/`
- `demo/maturity/`
- `demo/rule-types/`
- `demo/profiles/`
- `demo/central-config-repo/`
- `performance/`

Start at the top and go step by step. Each section below explains:
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

You have now enabled configurable YAML rules, which has resulted in 3 more errors.

Supporting references:
- [demo/rules-intro/configurable-rule-anatomy.md](demo/rules-intro/configurable-rule-anatomy.md)

### Step 3: Enable Custom JS Rules

Open [demo/rules-intro/specmatic-linter.yaml](demo/rules-intro/specmatic-linter.yaml) and uncomment the block under the `Step 3` comment.

This will add the following 2 more custom JS rules:
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

Those new findings (1 error and 1 warning) have come from JavaScript logic rather than the YAML rule DSL.

Supporting references:
- [demo/rules-intro/custom-js-rule-anatomy.md](demo/rules-intro/custom-js-rule-anatomy.md)

## 2. Maturity levels

This demo shows:
- maturity is configured per rule
- overall maturity is computed from failing error-level rules
- Maturity has the following hierarchy:
  - Non Compliant
  - Baseline
  - Bronze
  - Silver
  - Gold 
  - Platinum

### Step 1: Run The Initial Setup

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
- `info-license` which is at `Gold level`
- `operation-summary` which is at `Bronze level`

Since a rule at the Bronze level failed, the maturity is set to `baseline` which is has all passing rules.

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

Now you see the same 2 rules have failed, but since we bumped up the maturity level of the failing rule, the overall spec's linting maturity has moved up to `bronze`.

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

Since the `operation-summary` rule is no longer reporting an error (instead it is reporting a warning), it does not participate in the maturity computation. Only rule with severity error participate in maturity computation.

## 3. Rule Types

This demo shows how `types` lets you filter rules.

Built-in rule types:
- `security`
- `schema`
- `examples`
- `operations`
- `parameters`
- `metadata`

### Step 1: Run all rules

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

Not every API needs the same level of linting rigor. Using profiles teams can share the same rule catalogue while adapting governance levels based on API type.

### Step 1: Run without any Profile

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

### Step 2: Run The `internal` Profile

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

### Step 3: Run The `public-api` Profile

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

Rerun the `public-api` command 

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

Locally, you keep only the spec. The rule config lives in a central git repo, and the only thing you switch is `--profile`.

This walkthrough uses the public repo:
- [specmatic/central-linter-config.git](https://github.com/specmatic/central-linter-config.git)

If your central config repo is private, set:

```bash
export CENTRAL_CONFIG_REPO_TOKEN=<your-pat>
```

The PAT should have access to that private repo.

### Step 1: Run With `internal-api`

```bash
docker run --rm -v "./demo/central-config-repo:/usr/src/app" specmatic/enterprise lint openapi.yaml \
  --config-repo-url=https://github.com/specmatic/central-linter-config.git \
  --config=specmatic-linter.yaml \
  --profile=internal-api
```

```terminaloutput
"totals": {
  "errors": 6,
  "warnings": 7,
  "ignored": 2
}
```

### Step 2: Change Only The Profile

Run the same command, but change only:

```text
--profile=public-api
```

```bash
docker run --rm -v "./demo/central-config-repo:/usr/src/app" specmatic/enterprise lint openapi.yaml \
  --config-repo-url=https://github.com/specmatic/central-linter-config.git \
  --config=configs/specmatic-linter.yaml \
  --profile=public-api
```

```terminaloutput
"totals": {
  "errors": 7,
  "warnings": 10,
  "ignored": 0
}
```

### Step 3: Change Only The Profile Again

Now change only:

```text
--profile=payment-api
```

```bash
docker run --rm -v "./demo/central-config-repo:/usr/src/app" specmatic/enterprise lint openapi.yaml \
  --config-repo-url=https://github.com/specmatic/central-linter-config.git \
  --config=configs/specmatic-linter.yaml \
  --profile=payment-api
```

```terminaloutput
"totals": {
  "errors": 9,
  "warnings": 9,
  "ignored": 0
}
```

This is the value of the central config repo flow:
- no local rule file
- no rule tuning by every team
- only profile selection changes locally
- the central platform team owns the governance logic
- one place to manage rules, profiles, severities, and maturity gates
- simpler org-wide rollout of new standards
- consistent behavior across local development and CI
- easier auditing because governance changes are versioned in one repo

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
