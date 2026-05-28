@echo off
setlocal

docker run --rm -v "%CD%:/usr/src/app" -w /usr/src/app specmatic/enterprise lint %*
exit /b %ERRORLEVEL%
