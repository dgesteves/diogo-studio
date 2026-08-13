#!/usr/bin/env bash
#
# Run the `e2e` job from .github/workflows/ci.yml under the constraint that actually
# breaks it: a GitHub-hosted runner for a private repo on Free is 2 vCPU / 7 GB, and
# the three.js scene is software-rendered there. Every E2E failure this repo has had
# came from that starvation, not from the workflow YAML.
#
# Mirrored: Ubuntu 24.04 (`ubuntu-latest`), the browser build and system libraries
# pinned to the Playwright version in this lockfile, a frozen install, a production
# build, and `CI=1` (which is what selects 1 worker, 2 retries and `next start`).
#
# Not mirrored, and no local setup can: CPU architecture. On Apple Silicon this runs
# arm64, so SwiftShader timings are indicative rather than identical — amd64 under
# emulation is far too slow to be a useful signal.
#
# Usage:
#   pnpm e2e:runner                             # whole suite
#   pnpm e2e:runner -g "Boot sequence"          # arguments pass through to `playwright test`
#   CI_CPUS=1 pnpm e2e:runner                   # squeeze harder to surface timing bugs
#   CI_IMAGE=… pnpm e2e:runner                  # override the container image
set -euo pipefail

CPUS="${CI_CPUS:-2}"
MEMORY="${CI_MEMORY:-7g}"

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$repo_root"

if ! docker info >/dev/null 2>&1; then
  echo "error: no reachable Docker daemon. Start Docker Desktop, or 'brew install colima && colima start --cpu 4 --memory 8'." >&2
  exit 1
fi

playwright_version="$(node -p "require('@playwright/test/package.json').version")"
image="${CI_IMAGE:-mcr.microsoft.com/playwright:v${playwright_version}-noble}"

# Host node_modules is macOS/arm64 and .next holds a host-built manifest; shadowing both
# with container-owned volumes keeps the two installs from corrupting each other, and
# keeps the install and the browser cache warm between runs. The pnpm store has to live
# inside the node_modules volume: pnpm keeps the store on the same filesystem as the
# install, and with $HOME on the container's own filesystem the default relocates into
# the bind-mounted tree as `.pnpm-store`. Only `--store-dir` overrides that — pnpm 11
# ignores `npm_config_store_dir`, which is how 343 MB once landed in the working tree.
# The assertion after the install is what stops that failing silently a second time.
volume_prefix="$(basename "$repo_root")-ci"

# A plain string, not an array: macOS ships bash 3.2, where expanding an empty array
# under `set -u` is an error.
tty_flags=""
if [ -t 0 ]; then
  tty_flags="--interactive --tty"
fi

# A runner has no `.env.local`. Leaving the host's in place would run the degraded
# paths (no `OPENAI_API_KEY` → `/api/chat` returns 503) as the configured ones, which
# is precisely the class of surprise this script exists to remove.
env_mask=""
if [ -f .env.local ]; then
  empty_env="$(mktemp -t ci-local-env)"
  trap 'rm -f "$empty_env"' EXIT
  env_mask="--volume $empty_env:/work/.env.local:ro"
fi

echo "==> ${image} · ${CPUS} vCPU · ${MEMORY} · playwright ${playwright_version}"

docker run --rm $tty_flags $env_mask \
  --cpus "$CPUS" \
  --memory "$MEMORY" \
  --ipc host \
  --volume "$repo_root:/work" \
  --volume "${volume_prefix}-node-modules:/work/node_modules" \
  --volume "${volume_prefix}-next:/work/.next" \
  --volume "${volume_prefix}-ms-playwright:/root/.cache/ms-playwright" \
  --workdir /work \
  --env CI=1 \
  "$image" \
  bash -euo pipefail -c '
    node_major="$(node -p "process.versions.node.split(\".\")[0]")"
    if [ "$node_major" != "24" ]; then
      echo "warning: container runs Node ${node_major}; CI runs Node 24 (NODE_VERSION in ci.yml)." >&2
    fi

    corepack enable

    # engineStrict is on in pnpm-workspace.yaml and this image ships whatever Node the
    # Playwright release pinned, which is not the one this project pins. The warning
    # above is the signal that matters; failing the install here would only be noise.
    pnpm install --frozen-lockfile \
      --store-dir /work/node_modules/.pnpm-store \
      --config.engineStrict=false

    if [ -e /work/.pnpm-store ]; then
      echo "error: pnpm wrote its store into the mounted working tree despite --store-dir." >&2
      echo "       pnpm changed how the store location is configured; fix scripts/ci-local.sh." >&2
      exit 1
    fi

    pnpm exec playwright install chromium
    pnpm build
    pnpm exec playwright test "$@"
  ' -- "$@"
