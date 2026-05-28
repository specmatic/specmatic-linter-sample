#!/usr/bin/env bash

# Find the configurable-rules directory
CONFIG_DIR="$(cd "$(dirname "$0")" && pwd)"
# Find the sample root (where the local specmatic-lint.sh is)
SAMPLE_ROOT="$(cd "${CONFIG_DIR}/.." && pwd)"

echo "--- Specmatic Linter: Configurable Rules Sample ---"
echo "This script demonstrates how to enforce company-specific standards using the DSL."
echo ""

# We run the linter from the CONFIG_DIR to ensure the local specmatic-linter.yaml is used
cd "${CONFIG_DIR}"

echo "----------------------------------------------------------------"
echo "🚩 VALIDATING: custom-rules-violation.yaml"
echo "Active Rules: rule/no-error-param, rule/parameter-description-required, rule/force-oidc-auth"
echo "----------------------------------------------------------------"
"${SAMPLE_ROOT}/specmatic-lint.sh" custom-rules-violation.yaml
echo ""

echo "Note: The violations above are defined purely via configuration, without any custom code."
