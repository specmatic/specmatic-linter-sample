# Specmatic Linter Config And Redocly Migration Guide

This guide is for teams migrating existing Redocly lint configurations to the current profile-first `specmatic-linter.yaml` format.

The goal is practical migration, not perfect compatibility. For rule-centric Redocly configs, you should usually be able to get to a working Specmatic Linter config quickly. For some setups, especially ones that depended on Redocly API alias workflows, you will still need a small amount of manual adjustment.

## Table Of Contents

- [What `specmatic-linter.yaml` Looks Like Now](#what-specmatic-linteryaml-looks-like-now)
- [How To Migrate A Redocly Config Manually](#how-to-migrate-a-redocly-config-manually)
- [Unsupported And Partial-Parity Cases](#unsupported-and-partial-parity-cases)
- [Troubleshooting](#troubleshooting)
- [Validation Checklist After Migration](#validation-checklist-after-migration)
- [Step-By-Step Migration Example](#step-by-step-migration-example)

## What `specmatic-linter.yaml` Looks Like Now

The current config format is profile-first. The accepted top-level keys are:

- `plugins`
- `rules`
- `profiles`

### Top-Level Keys

#### `plugins`

`plugins` is a list of JavaScript plugin references.

Use this when your rules or presets depend on plugin-provided behavior.

```yaml
plugins:
  - ./company-linter-plugin.cjs
```

Plugin references are resolved relative to the config file location.

#### `rules`

Root `rules` is a shared rule inventory. It is mainly useful for:

- configurable rules such as `rule/...`
- shared plugin rule configuration
- shared reusable rule definitions that profiles can `include` or override

Do not use root `rules` for built-in rules such as `operation-summary` or `info-license`. Built-in rules belong inside profiles, typically through `profiles.<name>.rules.extends` or `profiles.<name>.rules.override`.

#### `profiles`

`profiles` is required. Each profile defines a runnable lint policy.

Each profile supports these keys:

- `extends`
- `types`
- `rules`

### Profile Keys

#### `profiles.<name>.extends`

This is profile-to-profile inheritance.

Use it when one profile should inherit another profile's effective policy.

```yaml
profiles:
  default:
    rules:
      extends:
        - recommended

  internal:
    extends:
      - default
    rules:
      override:
        operation-summary: warn
```

Profile `extends` only references other profile names in the same file.

#### `profiles.<name>.types`

This filters the active rules by rule type.

Built-in rule types currently include:

- `metadata`
- `operations`
- `parameters`
- `schema`
- `examples`
- `security`

If `types` is present, only rules whose type matches the configured list remain active.

```yaml
profiles:
  metadata-only:
    types:
      - metadata
    rules:
      extends:
        - recommended
```

#### `profiles.<name>.rules`

This block controls rule selection and rule overrides inside a profile.

It supports:

- `extends`
- `include`
- `exclude`
- `override`

### Rule Selection Keys

#### `profiles.<name>.rules.extends`

This pulls in a built-in preset or plugin-provided preset.

Built-in presets currently available are:

- `minimal`
- `recommended`
- `recommended-strict`
- `all`

```yaml
profiles:
  default:
    rules:
      extends:
        - recommended
```

#### `profiles.<name>.rules.include`

This explicitly includes built-in rules or rules from the root `rules` inventory.

Use this when you want to include a rule as is from the `rules` inventory or the `built-in rules` inventory.

```yaml
profiles:
  focused:
    rules:
      include:
        - operation-summary
        - info-license
        - rule/non-built-in-configured-rule
```

#### `profiles.<name>.rules.exclude`

This explicitly turns rules off after preset selection.

```yaml
profiles:
  default:
    rules:
      extends:
        - recommended
      exclude:
        - operation-summary
```

#### `profiles.<name>.rules.override`

This applies final per-profile rule settings.

Use this for:

- changing severity
- changing message text
- setting maturity
- setting rule type

```yaml
profiles:
  default:
    rules:
      extends:
        - recommended
      override:
        operation-summary: warn
        info-license:
          severity: error
          message: License information is required.
          maturity: bronze
          type: metadata
```

### Rule Value Forms

Rules can be written in scalar or object form.

#### Scalar form

Use scalar form when you only want to set severity.

```yaml
operation-summary: error
info-license: warn
security-defined: off
```

The common values are:

- `error`
- `warn`
- `off`

`true` behaves like `error`, and `false` behaves like `off`.

#### Object form

Use object form when you need more than severity.

Supported standard fields are:

- `severity`
- `message`
- `maturity`
- `type`

Any additional fields are treated as rule-specific options.

```yaml
rule/summary-approved:
  severity: error
  type: operations
  message: Summary must use the approved text.
  subject:
    type: Operation
    property: summary
  assertions:
    const: approved summary
```

### Profile Selection Behavior

Profile selection is runtime behavior, so it matters during migration.

- If the config contains exactly one profile, that profile is selected automatically.
- If the config contains multiple profiles and one of them is named `default`, `default` is selected automatically.
- Otherwise the user must explicitly select the intended profile at lint time.

### Plugins In Config Authoring

For most users, plugins matter in only three places:

- root `plugins` declares the plugin files to load
- `profiles.<name>.rules.extends` can reference plugin-provided presets
- `profiles.<name>.rules.override` or `include` can reference plugin rule IDs

Example:

```yaml
plugins:
  - ./company-plugin.cjs

profiles:
  default:
    rules:
      extends:
        - recommended
        - company-plugin/internal
      override:
        company-plugin/operation-extra: error
```

### Canonical Examples

#### Minimal Single-Profile Config

```yaml
profiles:
  default:
    rules:
      extends:
        - recommended
```

#### Multi-Profile Config With `default`

```yaml
profiles:
  default:
    rules:
      extends:
        - recommended

  public-api:
    extends:
      - default

  internal:
    extends:
      - default
    rules:
      override:
        operation-summary: warn
```

#### Profile Using `include`, `exclude`, `override`, And `types`

```yaml
rules:
  rule/summary-approved:
    severity: error
    type: metadata
    subject:
      type: Operation
      property: summary
    assertions:
      const: approved summary

profiles:
  default:
    types:
      - metadata
    rules:
      extends:
        - recommended
      include:
        - rule/summary-approved
      exclude:
        - security-defined
      override:
        operation-summary:
          severity: error
          type: metadata
```

## How To Migrate A Redocly Config Manually

This section is intentionally manual-first. It explains how to rewrite a Redocly lint config into the current Specmatic Linter structure without relying on any in-progress migration tooling.

### Migration Scope

This manual migration flow is designed for Redocly configs that mainly use:

- `extends`
- `rules`
- `plugins`
- `apis` for aliasing or per-API rule policy

The following are out of scope for this guide:

- `decorators`
- `preprocessors`
- `resolve`
- non-lint Redocly sections

### Deterministic Rewrite Procedure

Follow this sequence:

1. Copy Redocly root `plugins` as-is into Specmatic root `plugins`.
2. If there is no Redocly `apis` block, create one Specmatic profile named `default`.
3. Treat Redocly root `extends` as the starting preset list for each target Specmatic profile.
4. Convert Redocly root `rules` into each profile's `rules.override`.
5. If there is a Redocly `apis` block, create one Specmatic profile per Redocly API alias.
6. For each API alias, merge the Redocly root `rules` with that alias's rule overrides and write the merged result into that profile's `rules.override`.
7. Preserve Redocly API alias names as Specmatic profile names, and select the matching profile whenever you want that policy.

### Mapping Table

| Redocly config | Specmatic Linter config |
| --- | --- |
| `plugins` | root `plugins` |
| root `extends` | `profiles.<name>.rules.extends` |
| root `rules` | `profiles.<name>.rules.override` |
| `apis.<alias>` | `profiles.<alias>` |
| `apis.<alias>.rules` | merged into `profiles.<alias>.rules.override` |
| `apis.<alias>.root` | not modeled in config; pass the spec file path to the CLI |

### Rule Form Mapping

| Redocly rule form | Specmatic rule form |
| --- | --- |
| `operation-summary: error` | `operation-summary: error` |
| `operation-summary: off` | `operation-summary: off` |
| `operation-summary: { severity: warn }` | `operation-summary: { severity: warn }` |
| rule object with extra options | same object shape under `override` |

### API Alias Mapping

| Redocly | Specmatic Linter |
| --- | --- |
| `apis.core` | `profiles.core` |
| `apis.public` | `profiles.public` |
| `apis.<alias>.root` | lint target path passed on the command line |
| alias-driven policy | explicit profile selection during linting |

### Worked Migration: Root-Only Redocly Config

Redocly:

```yaml
extends:
  - recommended
plugins:
  - ./company-plugin.cjs
rules:
  operation-summary: error
  info-license: warn
```

Specmatic Linter:

```yaml
plugins:
  - ./company-plugin.cjs

profiles:
  default:
    rules:
      extends:
        - recommended
      override:
        operation-summary: error
        info-license: warn
```

### Worked Migration: Multi-API Redocly Config

Redocly:

```yaml
extends:
  - recommended
rules:
  operation-summary: error
  info-license: warn

apis:
  public:
    root: ./specs/public.yaml
    rules:
      operation-summary: warn

  internal:
    root: ./specs/internal.yaml
    rules:
      security-defined: off
```

Specmatic Linter:

```yaml
profiles:
  public:
    rules:
      extends:
        - recommended
      override:
        operation-summary: warn
        info-license: warn

  internal:
    rules:
      extends:
        - recommended
      override:
        operation-summary: error
        info-license: warn
        security-defined: off
```

When these profiles are used, each spec path must still be paired with the intended profile during linting.

### Optional Shared-Parent Profile Pattern

If several API aliases share the same base Redocly policy, you can factor that into a shared parent profile.

```yaml
profiles:
  default:
    rules:
      extends:
        - recommended
      override:
        info-license: warn

  public:
    extends:
      - default
    rules:
      override:
        operation-summary: warn

  internal:
    extends:
      - default
    rules:
      override:
        security-defined: off
```

This is optional. It is mainly a readability choice.

### Important Non-1:1 Differences

- Redocly `root` paths are not stored in the current Specmatic config format. You still pass the actual spec file path to the CLI.
- Workflow parity is partial even when rule parity is strong. A migrated config may preserve lint policy well while still changing how users invoke lint runs.

## Unsupported And Partial-Parity Cases

### Not Supported Right Now

- `decorators`
  - Impact: any rule behavior that depended on document transformation before linting will not carry over through this guide.
- `preprocessors`
  - Impact: any linting flow that expected preprocessing before evaluation must be redesigned manually.
- `resolve`
  - Impact: resolver-specific Redocly behavior does not have a direct migration path in this guide.
- config-driven enumeration of API targets from aliases
  - Impact: the current Specmatic runtime does not use migrated alias entries to auto-discover the spec files to lint.

### Supported With Caveats

- `apis` aliasing
  - Caveat: it maps cleanly to profiles for policy selection, but invocation changes from alias-oriented to explicit profile selection plus an explicit spec path.
- plugin presets and plugin rules
  - Caveat: they work only if the same plugin is installed and resolvable from the Specmatic config location.
- type filtering
  - Caveat: it intentionally changes which rules run, so do not add `types` during migration unless you want that narrower behavior.

## Troubleshooting

### `Unknown top-level config key`

Your file still contains Redocly-only sections at the root.

What to do:

- keep only `plugins`, `rules`, and `profiles`
- move root `extends` into `profiles.<name>.rules.extends`
- move root `rules` into `profiles.<name>.rules.override`
- remove or manually redesign unsupported Redocly sections

### `Config must define at least one profile`

Your migrated config still looks like an older flat config.

What to do:

- create `profiles`
- create a `default` profile if there is only one lint policy

### `Multiple profiles are available`

The config has several profiles and none can be auto-selected.

What to do:

- either add a profile named `default`
- or explicitly select the intended profile when linting

### `Unknown ruleset`

A preset named in `profiles.<name>.rules.extends` is not available.

What to do:

- verify the preset name is one of `minimal`, `recommended`, `recommended-strict`, or `all`
- if it is a plugin preset, verify the plugin loads successfully and exposes that preset

### Plugin rule not found

A migrated rule ID refers to a plugin rule that Specmatic cannot load.

What to do:

- verify the plugin file path
- verify plugin resolution relative to `specmatic-linter.yaml`
- verify the rule ID still matches the plugin's actual exported ID

### Lint output differs from Redocly

This usually means one of three things:

- root and per-API rule settings were merged incorrectly
- the wrong profile was selected
- the original Redocly config depended on unsupported behavior

What to do:

- compare Redocly root `rules` against the final profile `rules.override`
- compare per-API Redocly overrides against the selected profile
- confirm you are linting the intended spec path with the intended selected profile
- check whether the original config used `decorators`, `preprocessors`, or `resolve`

### `No rules belong to types ...`

The configured `types` filter does not match any active rules.

What to do:

- remove `types` if you did not mean to filter rules
- or change it to valid built-in types such as `metadata`, `operations`, `parameters`, `schema`, `examples`, or `security`

## Validation Checklist After Migration

Use this checklist before calling the migration finished:

1. Confirm the config loads without schema or profile errors.
2. Inspect the selected profile's effective rules and verify that they match the intended policy.
3. Lint one known spec with the intended profile.
4. Compare a few representative rule outcomes against the previous Redocly run.
5. Only then widen the rollout to more APIs or more profiles.

## Step-By-Step Migration Example

For a fuller walkthrough that rewrites a multi-API Redocly config into the profile-first Specmatic format step by step, see [redocly-to-specmatic-step-by-step-example.md](/Users/yogeshanandanikam/project/specmatic-linter/docs/redocly-to-specmatic-step-by-step-example.md).

