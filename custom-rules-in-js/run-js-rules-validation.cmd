@echo off
setlocal

set "JS_DIR=%~dp0"
set "SAMPLE_ROOT=%JS_DIR%.."

echo --- Specmatic Linter: JavaScript Custom Rules Sample ---
echo This script demonstrates complex validation logic implemented via JS plugins.
echo.

pushd "%JS_DIR%"

echo ----------------------------------------------------------------
echo 🚩 VALIDATING: js-rules-violation.yaml
echo Active JS Rules: pagination-range, operation-id-naming
echo ----------------------------------------------------------------
call "%SAMPLE_ROOT%\specmatic-lint.cmd" js-rules-violation.yaml
echo.

echo Note: The violations above involve cross-field comparison and string manipulation
echo that exceeds the capabilities of standard YAML DSL.

popd
exit /b 0
