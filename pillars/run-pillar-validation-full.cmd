@echo off
setlocal

set "PILLARS_DIR=%~dp0"
set "SAMPLE_ROOT=%PILLARS_DIR%.."

echo --- Specmatic Linter: Pillar Validation (Full Coverage Mode) ---
echo This script runs same pillar specs with broader recommended and custom rules.
echo Expect semantic findings plus additional governance and style findings.
echo.

pushd "%PILLARS_DIR%"

echo ----------------------------------------------------------------
echo 🚩 PILLAR 1: Constraint Contradictions
echo Issues: Enum contradiction, regex incompatibility, boundary violations, incomplete schema type.
echo ----------------------------------------------------------------
call "%SAMPLE_ROOT%\specmatic-lint.cmd" --config specmatic-linter-full.yaml 01-logical-dead-ends\impossible-logic.yaml
echo.

echo ----------------------------------------------------------------
echo 🚩 PILLAR 2: Schema Composition Problems
echo Issues: $ref with siblings and ignored composition details.
echo ----------------------------------------------------------------
call "%SAMPLE_ROOT%\specmatic-lint.cmd" --config specmatic-linter-full.yaml 02-broken-contracts\structural-integrity.yaml
echo.

echo ----------------------------------------------------------------
echo 🚩 PILLAR 3: HTTP Semantics and Security Overlaps
echo Issues: GET with request body, shadowed api-key security schemes.
echo ----------------------------------------------------------------
call "%SAMPLE_ROOT%\specmatic-lint.cmd" --config specmatic-linter-full.yaml 03-protocol-conflicts\ambiguous-protocol.yaml
echo.

popd
exit /b 0
