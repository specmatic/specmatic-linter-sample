# Rule Categorization Demo

This guided demo shows how to use Specmatic Linter's rule categorization feature to:

- run the normal resolved ruleset with no category filtering
- run only `documentation`, `security`, `schema`, or `governance` rules
- assign categories to configurable rules
- assign categories to JS plugin rules through config
- override the category of a built-in rule through config
- see the "no rules selected" behavior when a category matches nothing

Everything in this folder is self-contained.

## Folder Layout

- `openapi.yaml` contains a sample OpenAPI document with intentional issues
- `configs/` contains ready-to-run config variants
- `js-plugin/` contains a small custom JS rule used in the governance demo

## Prerequisites

- Docker Engine must be running

## How To Run

From this folder, run commands like:

```bash
docker run --rm -v "$PWD:/usr/src/app" specmatic/enterprise lint openapi.yaml --config configs/all-rules.yaml
```

## Step 1: Run Without Category Filtering

This config does not set the root-level `categories` key, so the normal resolved ruleset is used.

```bash
docker run --rm -v "$PWD:/usr/src/app" specmatic/enterprise lint openapi.yaml --config configs/all-rules.yaml
```

You should see a mixed set of issues, including rule IDs such as:

- `security-defined`
- `operation-summary`
- `no-required-schema-properties-undefined`
- `rule/parameter-description-required`
- `demo-categories/operation-risk-tier`

This is the baseline run for comparison.

## Step 2: Run Only Documentation Rules

```bash
docker run --rm -v "$PWD:/usr/src/app" specmatic/enterprise lint openapi.yaml --config configs/documentation-only.yaml
```

You should mainly see documentation-oriented issues such as:

- `operation-summary`
- `parameter-description`

You should not see security, schema, or governance-only rules in this run.

## Step 3: Run Only Security Rules

```bash
docker run --rm -v "$PWD:/usr/src/app" specmatic/enterprise lint openapi.yaml --config configs/security-only.yaml
```

You should mainly see:

- `security-defined`

This demonstrates a focused security-only validation pass.

## Step 4: Run Only Schema Rules

```bash
docker run --rm -v "$PWD:/usr/src/app" specmatic/enterprise lint openapi.yaml --config configs/schema-only.yaml
```

You should mainly see schema-oriented issues such as:

- `no-required-schema-properties-undefined`
- `specmatic/missing-schema-fallback`

## Step 5: Run Only Governance Rules

```bash
docker run --rm -v "$PWD:/usr/src/app" specmatic/enterprise lint openapi.yaml --config configs/governance-only.yaml
```

This config demonstrates three category sources working together:

- a configurable YAML DSL rule: `rule/parameter-description-required`
- a JS plugin rule categorized in config: `demo-categories/operation-risk-tier`
- a built-in rule whose category is overridden in config: `operation-summary`

You should mainly see those governance-focused findings in this run.

## Step 6: Inspect Categories In The Rule Catalog

Generate the resolved rule catalog:

```bash
docker run --rm -v "$PWD:/usr/src/app" specmatic/enterprise lint get-rules --config configs/governance-only.yaml
```

Then inspect the generated report under:

```text
configs/build/reports/specmatic/lint/openapi/rules-report.html
```

You should see category metadata for rules in the report, including the overridden category for `operation-summary`.

## Step 7: See The No-Match Behavior

```bash
docker run --rm -v "$PWD:/usr/src/app" specmatic/enterprise lint openapi.yaml --config configs/no-match.yaml
```

This config selects a category that no rule belongs to.

You should see a successful run with explanatory notes similar to:

- no rules belong to the requested category
- no rules were selected, executed, or evaluated
