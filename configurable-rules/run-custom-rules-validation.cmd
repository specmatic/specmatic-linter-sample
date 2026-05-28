@echo off
setlocal

set "CONFIG_DIR=%~dp0"
set "SAMPLE_ROOT=%CONFIG_DIR%.."

echo --- Specmatic Linter: Configurable Rules Sample ---
echo This script demonstrates how to enforce company-specific standards using DSL.
echo.

pushd "%CONFIG_DIR%"

echo ----------------------------------------------------------------
echo 🚩 VALIDATING: custom-rules-violation.yaml
echo Active Rules: rule/no-error-param, rule/parameter-description-required, rule/force-oidc-auth
echo ----------------------------------------------------------------
call "%SAMPLE_ROOT%\specmatic-lint.cmd" custom-rules-violation.yaml
echo.

echo Note: The violations above are defined purely via configuration, without any custom code.

popd
exit /b 0
