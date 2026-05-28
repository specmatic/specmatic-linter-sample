# Specmatic Linter Sample

This project is a comprehensive demonstration of the **Specmatic Linter**, designed to demonstrate its unique strengths in semantic accuracy, industrial-scale performance, and corporate governance.

---

## 🧪 Explore the Capabilities

The sample is organized into four key modules. Each module targets a specific challenge in API design and maintenance.

## 💻 Platform Notes

- **macOS / Linux:** Use the existing `.sh` scripts.
- **Windows (Command Prompt or PowerShell):** Use the matching `.cmd` scripts.
- **Prerequisites:** Docker must be running for every sample. `node` must be on `PATH` for the performance benchmark because it formats benchmark output.
- **First run note:** Docker may pull `specmatic/enterprise` before the linter starts.

**Direct linter wrappers**

macOS / Linux:
```bash
./specmatic-lint.sh --help
```

Windows:
```bat
.\specmatic-lint.cmd --help
```

### 1. Semantic Intelligence (The "Pillars")
Standard linters check for style (naming, descriptions). Specmatic Linter checks for **Logic**.
- **Constraint Contradictions:** Flags enum contradictions.
- **Regex Incompatibility:** Detects pattern vs. length conflicts.
- **Boundary Violations:** Catches impossible ranges like `max < min`.
- **Incomplete Schema Type:** Detects arrays missing `items`.
- **HTTP Semantic Conflicts:** Rejects `GET` operations with request bodies.
- **Schema Composition Problems:** Flags `$ref` definitions with sibling fields.
- **Security Overlaps:** Detects shadowed security schemes.

**Run focused semantic mode:**
```bash
cd pillars
./run-pillar-validation.sh
```

```bat
cd pillars
.\run-pillar-validation.cmd
```

**Run full coverage mode:**
```bash
cd pillars
./run-pillar-validation-full.sh
```

```bat
cd pillars
.\run-pillar-validation-full.cmd
```

Focused mode uses curated semantic-only rules so output maps directly to the README bullets. Full mode uses broader recommended and governance rules, so you will see additional findings beyond semantic intelligence checks.

---

### 2. Performance at Scale (The "Benchmark")
The Specmatic Linter is optimized for sub-second performance on massive API estates.
- **Enterprise Estate:** Lints **50 specifications**, each exceeding **1,000 lines**.
- **High Throughput:** Processes over **100,000 lines** and **12,000 paths** in seconds.
- **Resource Visibility:** Reports wall-clock time plus sampled CPU usage for the full benchmark run.
- **Auditability:** Automatically generates detailed JSON reports in the `results/` directory.

**Run the performance benchmark:**
```bash
cd performance
./run-performance-benchmark.sh
```

```bat
cd performance
.\run-performance-benchmark.cmd
```

---

### 3. Governance via DSL (Configurable Rules)
Enforce company-specific standards using a powerful, code-free YAML DSL.
- **Architectural Guardrails:** Blacklist specific parameter names or enforce protocol restrictions (e.g., OIDC only).
- **Style Guidelines:** Mandate descriptions or naming conventions across the entire spec.

**Run the DSL sample:**
```bash
cd configurable-rules
./run-custom-rules-validation.sh
```

```bat
cd configurable-rules
.\run-custom-rules-validation.cmd
```

---

### 4. Unlimited Extensibility (Custom JS Rules)
For scenarios too complex for the DSL—such as cross-field math or dynamic naming—you can write full JavaScript plugins.
- **Computed Validation:** Ensure the *sum* of different parameters (e.g., limit + offset) stays within safe bounds.
- **Context-Aware Naming:** Derive expected `operationId` values dynamically from API paths.

**Run the JS custom rules sample:**
```bash
cd custom-rules-in-js
./run-js-rules-validation.sh
```

```bat
cd custom-rules-in-js
.\run-js-rules-validation.cmd
```

---

## 🛠 Project Structure

- `specmatic-lint.sh` / `specmatic-lint.cmd`: Local wrappers for the linter on Unix-like systems and Windows.
- `performance/run-performance-benchmark.ps1`: Windows benchmark runner with Docker-based linting and resource sampling.
- `specmatic-linter.yaml`: Standardized shared configuration.
- `pillars/`: Targeted specs highlighting deep semantic logic, with focused and full validation modes.
- `performance/`: High-volume data and benchmarking tools.
- `configurable-rules/`: Examples of architectural governance via DSL.
- `custom-rules-in-js/`: Examples of complex logic implemented via JS plugins.

---

## 🚀 Getting Started
To demonstrate the full power of the linter, we recommend running the **Performance Benchmark** first to see the scale, followed by the **Pillars** to see the depth of analysis.
