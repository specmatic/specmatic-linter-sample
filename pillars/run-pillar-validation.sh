#!/usr/bin/env bash

# Find the pillars directory
PILLARS_DIR="$(cd "$(dirname "$0")" && pwd)"
# Find the sample root (where the Docker-backed specmatic-lint.sh and config are)
SAMPLE_ROOT="$(cd "${PILLARS_DIR}/.." && pwd)"

echo "--- Specmatic Linter: Pillar Validation (Focused Semantic Mode) ---"
echo "This script demonstrates curated semantic rules on targeted sample specs."
echo "Use run-pillar-validation-full.sh for broader recommended and governance coverage."
echo ""

# We run from PILLARS_DIR and pass config explicitly so focused/full modes stay separate.
cd "${PILLARS_DIR}"

echo "----------------------------------------------------------------"
echo "🚩 PILLAR 1: Constraint Contradictions"
echo "Issues: Enum contradiction, regex incompatibility, boundary violations, incomplete schema type."
echo "----------------------------------------------------------------"
"${SAMPLE_ROOT}/specmatic-lint.sh" --config specmatic-linter.yaml 01-logical-dead-ends/impossible-logic.yaml
echo ""

echo "----------------------------------------------------------------"
echo "🚩 PILLAR 2: Schema Composition Problems"
echo 'Issues: $ref with siblings and ignored composition details.'
echo "----------------------------------------------------------------"
"${SAMPLE_ROOT}/specmatic-lint.sh" --config specmatic-linter.yaml 02-broken-contracts/structural-integrity.yaml
echo ""

echo "----------------------------------------------------------------"
echo "🚩 PILLAR 3: HTTP Semantics and Security Overlaps"
echo "Issues: GET with request body, shadowed api-key security schemes."
echo "----------------------------------------------------------------"
"${SAMPLE_ROOT}/specmatic-lint.sh" --config specmatic-linter.yaml 03-protocol-conflicts/ambiguous-protocol.yaml
echo ""
