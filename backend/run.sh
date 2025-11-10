#!/usr/bin/env bash
set -e

# always start in the script’s folder
cd "$(dirname "$0")"

# create venv if it doesn’t exist
if [ ! -d ".venv" ]; then
  python3 -m venv .venv
fi

# activate venv
source .venv/bin/activate

# ensure packages are installed
python -m pip install -q --disable-pip-version-check fastapi 'uvicorn[standard]' >/dev/null

# make sure app/ is visible to Python
export PYTHONPATH=.

# run uvicorn
exec python -m uvicorn app.main:app --reload
