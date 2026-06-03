# Specmatic Linter Sample

This sample project shows the current profile-centric config model in a few small demos.

## Demos

### 1. Main walkthrough

`demo/` shows built-in, configurable, and JS plugin rules with profiles.

```bash
docker run --rm -v ./demo:/usr/src/app specmatic/enterprise lint openapi.yaml --config specmatic-linter.yaml --profile minimal-semantic
```

```bash
docker run --rm -v ./demo:/usr/src/app specmatic/enterprise lint openapi.yaml --config specmatic-linter.yaml --profile recommended-semantic
```

```bash
docker run --rm -v ./demo:/usr/src/app specmatic/enterprise lint openapi.yaml --config specmatic-linter.yaml --profile configurable-rules
```

```bash
docker run --rm -v ./demo:/usr/src/app specmatic/enterprise lint openapi.yaml --config specmatic-linter.yaml --profile js-rules
```

### 2. Rule typing

`rule-typing/` shows profile-level `types` filtering.

```bash
docker run --rm -v ./rule-typing:/usr/src/app specmatic/enterprise lint openapi.yaml --config specmatic-linter.yaml --profile schema-only
```

```bash
docker run --rm -v ./rule-typing:/usr/src/app specmatic/enterprise lint openapi.yaml --config specmatic-linter.yaml --profile examples-only
```

```bash
docker run --rm -v ./rule-typing:/usr/src/app specmatic/enterprise lint openapi.yaml --config specmatic-linter.yaml --profile custom-parameters-only
```

```bash
docker run --rm -v ./rule-typing:/usr/src/app specmatic/enterprise lint openapi.yaml --config specmatic-linter.yaml --profile metadata-override
```

What each highlights:
- `schema-only`: invalid bounds, mixed enum types, missing `items`
- `examples-only`: invalid example values
- `custom-parameters-only`: a configurable rule from the root inventory typed as `parameters`
- `metadata-override`: built-in `operation-summary` retyped from its default bucket into `metadata`

### 3. Maturity

`maturity/` shows maturity reporting with a small rule set.

```bash
docker run --rm -v ./maturity:/usr/src/app specmatic/enterprise lint openapi.yaml --config specmatic-linter.yaml --profile maturity-lint
```

The profile makes `operation-summary` a `bronze` error and `info-license` a `gold` error. This sample should report maturity as `baseline` because it fails the `bronze` requirement.

### 4. Central config repo

`central-config-demo/` showcases how a central governance team can maintain API linter rules in a dedicated repository, allowing development teams to simply choose a "profile" (e.g., `public-api`, `internal-api`) without having to manage the rules themselves.

#### Try Different Profiles

Each profile below applies different rules to its corresponding spec from a central repository.

**1. Public API Profile**
Strict rules for external-facing APIs (requires contact, license, summaries, and OAuth2).
```bash
docker run --rm -v "./central-config-demo:/usr/src/app" -e CENTRAL_CONFIG_REPO_TOKEN=$PAT specmatic/enterprise lint public-api.yaml \
  --config-repo-url=https://github.com/specmatic/central-linter-config.git \
  --config=configs/specmatic-linter.yaml \
  --profile=public-api
```

**2. Internal API Profile**
Relaxed rules for internal services (e.g., contact/license optional, warns on legacy headers).
```bash
docker run --rm -v "./central-config-demo:/usr/src/app" -e CENTRAL_CONFIG_REPO_TOKEN=$PAT specmatic/enterprise lint internal-api.yaml \
  --config-repo-url=https://github.com/specmatic/central-linter-config.git \
  --config=configs/specmatic-linter.yaml \
  --profile=internal-api
```

**3. Payment API Profile**
The most stringent profile, extending `public-api` with additional checks for pagination and error formats.
```bash
docker run --rm -v "./central-config-demo:/usr/src/app" -e CENTRAL_CONFIG_REPO_TOKEN=$PAT specmatic/enterprise lint payment-api.yaml \
  --config-repo-url=https://github.com/specmatic/central-linter-config.git \
  --config=configs/specmatic-linter.yaml \
  --profile=payment-api
```

**Benefits:**
- **No Local Config:** Dev teams don't need local rule files.
- **Consistency:** All APIs across the company follow the same standards.
- **Easy Upgrades:** Central updates are automatically applied to all teams on their next run.
- **Profile-based Governance:** Teams subscribe to a profile that fits their API's maturity or type.

### 5. Performance

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

## Notes

- `plugins` live only at the root.
- Root `rules` are the reusable inventory for configurable and JS rules.
- Profiles select behavior with profile `extends`, `types`, and `rules.extends` / `rules.include` / `rules.exclude` / `rules.override`.

See [configurable-rule-anatomy.md](/Users/yogeshanandanikam/project/sample_projects/specmatic-linter-sample/configurable-rule-anatomy.md) and [custom-js-rule-anatomy.md](/Users/yogeshanandanikam/project/sample_projects/specmatic-linter-sample/custom-js-rule-anatomy.md) for the rule shapes used in the main demo.
