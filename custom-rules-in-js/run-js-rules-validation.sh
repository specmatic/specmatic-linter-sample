#!/usr/bin/env bash

# Find the custom-rules directory
JS_DIR="$(cd "$(dirname "$0")" && pwd)"
# Find the sample root (where the local specmatic-lint.sh is)
SAMPLE_ROOT="$(cd "${JS_DIR}/.." && pwd)"

echo "--- Specmatic Linter: JavaScript Custom Rules Sample ---"
echo "This script demonstrates complex validation logic implemented via JS plugins."
echo ""

# We run the linter from the JS_DIR to ensure the local specmatic-linter.yaml is used
cd "${JS_DIR}"

echo "----------------------------------------------------------------"
echo "🚩 VALIDATING: js-rules-violation.yaml"
echo "Active JS Rules: pagination-range, operation-id-naming"
echo "----------------------------------------------------------------"
"${SAMPLE_ROOT}/specmatic-lint.sh" js-rules-violation.yaml
echo ""

echo "Note: The violations above involve cross-field comparison and string manipulation"
echo "that exceeds the capabilities of the standard YAML DSL."
