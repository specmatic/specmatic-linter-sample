#!/usr/bin/env bash

set -euo pipefail

# This script is a self-contained wrapper for the Specmatic Enterprise Docker image.

exec docker run --rm -v "${PWD}:/usr/src/app" -w /usr/src/app specmatic/enterprise lint "$@"
