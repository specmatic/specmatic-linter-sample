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

Start at the top and go step by step. Each section below tells you:
- which files to inspect
- what to edit
- what command to run
- what output to expect

## 1. Rules Intro

This demo introduces the three kinds of rules:
- built-in rules
- configurable YAML rules
- custom JS rules

Supporting references:
- [demo/rules-intro/configurable-rule-anatomy.md](/Users/yogeshanandanikam/project/sample_projects/specmatic-linter-sample/demo/rules-intro/configurable-rule-anatomy.md)
- [demo/rules-intro/custom-js-rule-anatomy.md](/Users/yogeshanandanikam/project/sample_projects/specmatic-linter-sample/demo/rules-intro/custom-js-rule-anatomy.md)

### Step 1: Run Built-in Rules

```bash
docker run --rm -v ./demo/rules-intro:/usr/src/app specmatic/enterprise lint openapi.yaml --config specmatic-linter.yaml
```

```terminaloutput
"totals": {
  "errors": 7,
  "warnings": 22,
  "ignored": 0
}
```

At this point only built-in rules are active.

### Step 2: Enable Configurable Rules

Open [demo/rules-intro/specmatic-linter.yaml](/Users/yogeshanandanikam/project/sample_projects/specmatic-linter-sample/demo/rules-intro/specmatic-linter.yaml) and uncomment the `include:` block under the `Step 2` comment.

Run the same command again:

```bash
docker run --rm -v ./demo/rules-intro:/usr/src/app specmatic/enterprise lint openapi.yaml --config specmatic-linter.yaml
```

```terminaloutput
"totals": {
  "errors": 10,
  "warnings": 22,
  "ignored": 0
}
```

You have now enabled configurable YAML rules from the root rule inventory.

### Step 3: Enable Custom JS Rules

In the same `include:` list, add:
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
}
```

Those new findings come from JavaScript logic rather than the YAML rule DSL.

## 2. Maturity

This demo shows:
- maturity is configured per rule
- overall maturity is computed from failing error-level rules

### Step 1: Run The Initial Setup

```bash
docker run --rm -v ./demo/maturity:/usr/src/app specmatic/enterprise lint openapi.yaml --config specmatic-linter.yaml
```

```terminaloutput
"maturity": {
  "level": "baseline"
}
```

The overall maturity is `baseline` because the first failing participating rule is `operation-summary`, and it currently requires `bronze`.

### Step 2: Raise One Rule's Maturity Tier

In [demo/maturity/specmatic-linter.yaml](/Users/yogeshanandanikam/project/sample_projects/specmatic-linter-sample/demo/maturity/specmatic-linter.yaml), change:

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
"maturity": {
  "level": "bronze"
}
```

### Step 3: Remove One Rule From Maturity Participation

Change `operation-summary` from:

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
"maturity": {
  "level": "silver"
}
```

The rule still fails, but it no longer participates in maturity because it is now only a warning and maturity is computed only from rules with error severity.

## 3. Rule Types

This demo shows how `types` lets you filter rules.

Supported rule types:
- `security`
- `schema`
- `examples`
- `operations`
- `parameters`
- `metadata`

### Step 1: Run With `schema` + `parameters`

```bash
docker run --rm -v ./demo/rule-types:/usr/src/app specmatic/enterprise lint openapi.yaml --config specmatic-linter.yaml
```

```terminaloutput
"totals": {
  "errors": 5,
  "warnings": 1,
  "ignored": 0
}
```

### Step 2: Switch To `examples`

In [demo/rule-types/specmatic-linter.yaml](/Users/yogeshanandanikam/project/sample_projects/specmatic-linter-sample/demo/rule-types/specmatic-linter.yaml), replace:

```yaml
types:
  - schema
  - parameters
```

with:

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

### Step 3: Remove Type Filtering Entirely

Delete the whole `types:` block and run the same command again:

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

Now you get the full mix again. Try `security` or `operations` on your own and see how the output changes.

## 4. Profiles

This is the first demo that introduces `--profile`.

Profiles let different teams share the same rule inventory while adopting different governance levels.

### Step 1: Run The `internal` Profile

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

### Step 2: Run The `public-api` Profile

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

### Step 3: Run The `payment-api` Profile

```bash
docker run --rm -v ./demo/profiles:/usr/src/app specmatic/enterprise lint openapi.yaml --config specmatic-linter.yaml --profile payment-api
```

```terminaloutput
"totals": {
  "errors": 7,
  "warnings": 5,
  "ignored": 0
}
```

### Step 4: Tweak A Profile

In [demo/profiles/specmatic-linter.yaml](/Users/yogeshanandanikam/project/sample_projects/specmatic-linter-sample/demo/profiles/specmatic-linter.yaml), change this inside `internal`:

```yaml
operation-summary: warn
```

to:

```yaml
operation-summary: error
```

Rerun the `internal` command and observe that the same spec now fails more strictly without changing the spec itself.

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
  --config=configs/specmatic-linter.yaml \
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
