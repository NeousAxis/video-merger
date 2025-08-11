#!/usr/bin/env bash
set -e
source "$(dirname "$0")/venv/bin/activate"
python3 "$(dirname "$0")/testnet_listener.py"