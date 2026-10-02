#!/bin/bash
# build-snap.sh - Build the CircuitVerse snap package
# Usage: bash snap/local/build-snap.sh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

cd "$PROJECT_ROOT"

echo "============================================"
echo "  CircuitVerse Snap Build"
echo "============================================"
echo ""

if [ ! -d "node_modules" ]; then
    echo "[1/5] Installing npm dependencies..."
    npm install
else
    echo "[1/5] npm dependencies already installed, skipping."
fi

echo "[2/5] Building Vue frontend (v0, desktop mode)..."
DESKTOP_MODE=1 VITE_BASE=/ npm run build -- v0

echo "[3/5] Building Tauri binary (release mode)..."
npx tauri build --no-bundle

echo "[4/5] Staging files for snap..."
rm -rf snap-build
mkdir -p snap-build

if [ -f "src-tauri/target/release/CircuitVerse" ]; then
    cp src-tauri/target/release/CircuitVerse snap-build/CircuitVerse
elif [ -f "src-tauri/target/release/circuit-verse" ]; then
    cp src-tauri/target/release/circuit-verse snap-build/CircuitVerse
else
    echo "ERROR: Tauri binary not found in src-tauri/target/release/"
    echo "Expected: CircuitVerse or circuit-verse"
    ls -la src-tauri/target/release/ 2>/dev/null || echo "Release directory does not exist."
    exit 1
fi

chmod +x snap-build/CircuitVerse

cp snap/gui/circuitverse-simulator.desktop snap-build/circuitverse-simulator.desktop

echo "[4/5] Staging complete."

echo "[5/5] Building snap package with snapcraft..."
snapcraft

echo ""
echo "============================================"
echo "  Build Complete!"
echo "============================================"
echo ""
echo "Snap file:"
ls -lh *.snap 2>/dev/null || echo "  (check for .snap file in project root)"
echo ""
echo "To install locally (for testing):"
echo "  sudo snap install --dangerous circuitverse-simulator_*.snap"
echo ""
echo "To upload to Snap Store (when ready):"
echo "  snapcraft login"
echo "  snapcraft upload circuitverse-simulator_*.snap --release=stable"
