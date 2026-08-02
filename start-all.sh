#!/usr/bin/env bash
set -euo pipefail

trap 'kill 0' INT TERM EXIT

(cd api && npm run dev) &
(cd landingpage && npm run dev) &
(cd student && npm run dev) &
(cd admin && npm run dev) &

wait
