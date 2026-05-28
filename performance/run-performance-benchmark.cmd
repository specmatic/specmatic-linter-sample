@echo off
setlocal

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0run-performance-benchmark.ps1"
exit /b %ERRORLEVEL%
