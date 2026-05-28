@echo off
setlocal

set "PILLARS_DIR=%~dp0"
set "SAMPLE_ROOT=%PILLARS_DIR%.."

echo --- Specmatic Linter: Pillar Validation (Focused Semantic Mode) ---
echo This script demonstrates curated semantic rules on targeted sample specs.
echo Use run-pillar-validation-full.cmd for broader recommended and governance coverage.
echo.

pushd "%PILLARS_DIR%"

echo ----------------------------------------------------------------
echo 🚩 PILLAR 1: Constraint Contradictions
echo Issues: Enum contradiction, regex incompatibility, boundary violations, incomplete schema type.
echo ----------------------------------------------------------------
call "%SAMPLE_ROOT%\specmatic-lint.cmd" --config specmatic-linter.yaml 01-logical-dead-ends\impossible-logic.yaml
echo.

echo ----------------------------------------------------------------
echo 🚩 PILLAR 2: Schema Composition Problems
echo Issues: $ref with siblings and ignored composition details.
echo ----------------------------------------------------------------
call "%SAMPLE_ROOT%\specmatic-lint.cmd" --config specmatic-linter.yaml 02-broken-contracts\structural-integrity.yaml
echo.

echo ----------------------------------------------------------------
echo 🚩 PILLAR 3: HTTP Semantics and Security Overlaps
echo Issues: GET with request body, shadowed api-key security schemes.
echo ----------------------------------------------------------------
call "%SAMPLE_ROOT%\specmatic-lint.cmd" --config specmatic-linter.yaml 03-protocol-conflicts\ambiguous-protocol.yaml
echo.

popd
exit /b 0
