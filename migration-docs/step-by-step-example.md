# Redocly To Specmatic Linter: Step-By-Step Migration Example

This walkthrough shows one realistic migration path for a multi-API Redocly config that uses:

- root `extends`
- root `rules`
- root `plugins`
- `apis` for per-API policy differences

It does not use:

- `decorators`
- `preprocessors`
- `resolve`

## Starting Point

Assume the team currently has this `redocly.yaml`:

```yaml
extends:
  - recommended

plugins:
  - ./company-plugin.cjs

rules:
  operation-summary: error
  info-license: warn
  no-empty-servers: error
  company-plugin/operation-extra: warn

apis:
  public:
    root: ./specs/public.yaml
    rules:
      operation-summary: warn
      security-defined: off

  partner:
    root: ./specs/partner.yaml
    rules:
      info-license: error

  internal:
    root: ./specs/internal.yaml
    rules:
      company-plugin/operation-extra: error
      operation-4xx-response: off
```

The migration goal is to preserve the lint policy as closely as possible in `specmatic-linter.yaml`.

## Step 1: Copy Root Plugins

Redocly root `plugins` maps directly to Specmatic root `plugins`.

```yaml
plugins:
  - ./company-plugin.cjs
```

## Step 2: Decide The Target Profiles

The Redocly config has three API aliases:

- `public`
- `partner`
- `internal`

Create one Specmatic profile per alias:

```yaml
profiles:
  public: {}
  partner: {}
  internal: {}
```

At this point, the profiles are only placeholders.

## Step 3: Move Root `extends` Into Each Profile

Redocly root `extends` becomes the starting preset list for every target profile.

```yaml
plugins:
  - ./company-plugin.cjs

profiles:
  public:
    rules:
      extends:
        - recommended

  partner:
    rules:
      extends:
        - recommended

  internal:
    rules:
      extends:
        - recommended
```

## Step 4: Turn Root `rules` Into Shared Per-Profile Overrides

Redocly root `rules` becomes the baseline `rules.override` block for every migrated profile.

Shared baseline:

```yaml
operation-summary: error
info-license: warn
no-empty-servers: error
company-plugin/operation-extra: warn
```

Apply that baseline to each profile:

```yaml
plugins:
  - ./company-plugin.cjs

profiles:
  public:
    rules:
      extends:
        - recommended
      override:
        operation-summary: error
        info-license: warn
        no-empty-servers: error
        company-plugin/operation-extra: warn

  partner:
    rules:
      extends:
        - recommended
      override:
        operation-summary: error
        info-license: warn
        no-empty-servers: error
        company-plugin/operation-extra: warn

  internal:
    rules:
      extends:
        - recommended
      override:
        operation-summary: error
        info-license: warn
        no-empty-servers: error
        company-plugin/operation-extra: warn
```

## Step 5: Apply Per-API Redocly Overrides

Now merge each `apis.<alias>.rules` block into the corresponding Specmatic profile.

### `public`

Redocly per-API rules:

```yaml
operation-summary: warn
security-defined: off
```

Merged result:

```yaml
public:
  rules:
    extends:
      - recommended
    override:
      operation-summary: warn
      info-license: warn
      no-empty-servers: error
      company-plugin/operation-extra: warn
      security-defined: off
```

### `partner`

Redocly per-API rules:

```yaml
info-license: error
```

Merged result:

```yaml
partner:
  rules:
    extends:
      - recommended
    override:
      operation-summary: error
      info-license: error
      no-empty-servers: error
      company-plugin/operation-extra: warn
```

### `internal`

Redocly per-API rules:

```yaml
company-plugin/operation-extra: error
operation-4xx-response: off
```

Merged result:

```yaml
internal:
  rules:
    extends:
      - recommended
    override:
      operation-summary: error
      info-license: warn
      no-empty-servers: error
      company-plugin/operation-extra: error
      operation-4xx-response: off
```

## Step 6: Assemble The Final `specmatic-linter.yaml`

Final migrated config:

```yaml
plugins:
  - ./company-plugin.cjs

profiles:
  public:
    rules:
      extends:
        - recommended
      override:
        operation-summary: warn
        info-license: warn
        no-empty-servers: error
        company-plugin/operation-extra: warn
        security-defined: off

  partner:
    rules:
      extends:
        - recommended
      override:
        operation-summary: error
        info-license: error
        no-empty-servers: error
        company-plugin/operation-extra: warn

  internal:
    rules:
      extends:
        - recommended
      override:
        operation-summary: error
        info-license: warn
        no-empty-servers: error
        company-plugin/operation-extra: error
        operation-4xx-response: off
```

## Step 7: Handle The `root` Paths Correctly

The Redocly `root` values are:

- `./specs/public.yaml`
- `./specs/partner.yaml`
- `./specs/internal.yaml`

These are not stored in the current Specmatic config format. Instead, each spec path must still be paired with the intended profile during linting.

## Optional Cleanup: Shared Parent Profile

If you want a smaller final config, you can factor the shared baseline into a `default` parent profile.

Compressed version:

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
        no-empty-servers: error
        company-plugin/operation-extra: warn

  public:
    extends:
      - default
    rules:
      override:
        operation-summary: warn
        security-defined: off

  partner:
    extends:
      - default
    rules:
      override:
        info-license: error

  internal:
    extends:
      - default
    rules:
      override:
        company-plugin/operation-extra: error
        operation-4xx-response: off
```

This version is behaviorally easier to maintain when many profiles share most of the same policy.

## What This Example Preserves Well

- root preset selection
- root rule severity and options
- plugin references
- per-API rule overrides
- API alias names as policy selectors

## What Still Changes Compared To Redocly

- profile selection is explicit rather than implicit through an API alias alone
- spec file targets are still passed on the command line
- the config does not store the Redocly `root` paths as runnable alias definitions

## Final Review Checklist

Before you accept the migration:

1. Confirm the config loads successfully.
2. Check the selected rules for each profile and confirm they match the intended policy.
3. Lint one representative spec per profile.
4. Compare a few important rule outcomes against the original Redocly run.
5. Adjust any profile-specific overrides that differ from the previous behavior.

