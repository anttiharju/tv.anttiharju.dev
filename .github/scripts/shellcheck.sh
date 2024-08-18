#!/bin/sh
set -eu

find . -type f -iname "*.sh" -exec shellcheck {} +