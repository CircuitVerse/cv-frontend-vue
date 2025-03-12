name: Vue Simulator Desktop Release

on:
  push:
    branches: [ "main" ]
  release:
    types: [created]

jobs:
  build-tauri:
    runs-on: ${{ matrix.os }}
    strategy:
      fail-fast: false
      matrix:
        os: [Ubuntu-latest, windows-latest, macos-latest]

    steps:
      - name: Checkout repository
        uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 22

      - name: Cache Node.js Dependencies
        uses: actions/cache@v3
        with:
          path: ~/.npm
          key: ${{ runner.os }}-node-${{ hashFiles('**/package-lock.json') }}
          restore-keys: ${{ runner.os }}-node-

      - name: Install Dependencies (Vue + Tauri CLI)
        run: npm install
        shell: bash
  

      - name: Install Tauri CLI
        run: |
            npm install -g @tauri-apps/cli
            npm install @tauri-apps/cli --save-dev
        shell: bash

      - name: Build Desktop Frontend
        run: npm run desktop
        shell: bash

      - name: Copy Index File (Cross-Platform)
        run: |
          if [ "$RUNNER_OS" == "Windows" ]; then
            cp dist/index-cv.html dist/index.html
          else
            cp dist/index-cv.html dist/index.html
          fi
        shell: bash

      - name: Setup Rust
        if: matrix.os != 'windows-latest'
        run: |
          rustup update stable
          rustup default stable
        shell: bash 

      - name: Install Linux Dependencies (Ubuntu)
        if: matrix.os == 'Ubuntu-latest'
        run: |
          sudo apt-get update && sudo apt-get install -y \
            libgtk-3-dev \
            libglib2.0-dev \
            libwebkit2gtk-4.0-dev \
            libappindicator3-dev \
            librsvg2-dev \
            patchelf \
            curl \
            wget \
            pkg-config \
            build-essential
        shell: bash

      - name: Install macOS Dependencies
        if: matrix.os == 'macos-latest'
        run: |
          brew update
          brew install \
            gtk+3 \
            glib \
            webkit2gtk \
            librsvg \
            appindicator-gtk3 \
            pkg-config
        shell: bash

      - name: Setup Rust
        if: matrix.os != 'windows-latest'
        run: |
          rustup update stable
          rustup default stable
        shell: bash 

      - name: Cache Rust Dependencies
        uses: Swatinem/rust-cache@v2
        with:
          workspaces: "./src-tauri"

      - name: Build Tauri App
        run: npm run tauri build
        shell: bash

      - name: Upload Tauri Build Artifacts
        uses: actions/upload-artifact@v4
        with:
          name: Tauri Build Artifacts (${{ matrix.os }})
          path: |
            src-tauri/target/release/bundle
      - name: Create GitHub Release and Upload Assets
        if: github.event_name == 'release' && github.event.action == 'created'
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        run: |
          # Determine the asset paths based on OS
          ASSET_PATH=""
          ASSET_NAME=""
          if [ "${{ matrix.os }}" == "Ubuntu-latest" ]; then
            ASSET_PATH="src-tauri/target/release/bundle/appimage/circuitverse-desktop.AppImage"
            ASSET_NAME="circuitverse-desktop-ubuntu-latest-${{ github.ref_name }}.AppImage"
          elif [ "${{ matrix.os }}" == "windows-latest" ]; then
            ASSET_PATH="src-tauri/target/release/bundle/msi/circuitverse-desktop_0.1.0_x64_en-US.msi"
            ASSET_NAME="circuitverse-desktop-windows-latest-${{ github.ref_name }}.msi"
          elif [ "${{ matrix.os }}" == "macos-latest" ]; then
            ASSET_PATH="src-tauri/target/release/bundle/macos/circuitverse-desktop.app.tar.gz"
            ASSET_NAME="circuitverse-desktop-macos-latest-${{ github.ref_name }}.tar.gz"
          fi
          # Check if asset exists
          if [ -f "$ASSET_PATH" ]; then
            gh release upload ${{ github.ref_name }} "$ASSET_PATH" --clobber --repo ${{ github.repository }} -t "Release ${{ github.ref_name }}" -n "Official CircuitVerse desktop app release. Download the binaries below!"
          else
            echo "Error: Asset not found at $ASSET_PATH"
            exit 1
          fi
        shell: bash