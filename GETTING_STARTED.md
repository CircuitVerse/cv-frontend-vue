<div align="center"> <img src="https://github.com/CircuitVerse/CircuitVerse/raw/master/app/assets/images/cvlogo.svg" alt="CircuitVerse Logo" width="320"/> </div>


# Getting Started - CircuitVerse Frontend Vue

Welcome to the CircuitVerse Frontend Vue project! This guide will help you set up the project for both web development and desktop application development using Tauri.

## Prerequisites
Before setting up the project, ensure you have the following installed:

### For Web Development
- **Node.js** (version 16 or higher)
- **npm** (comes with Node.js)

### For Desktop Application Development (Tauri)
- **Rust** - Required for Tauri desktop app development
- **System Dependencies** - Platform-specific requirements for Tauri

#### Installing Rust
1. Visit [rustup.rs](https://rustup.rs/) or run the following command:
   ```bash
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
   ```
2. Follow the installation prompts
3. Restart your terminal or run:
   ```bash
   source ~/.cargo/env
   ```
4. Verify installation:
   ```bash
   rustc --version
   cargo --version
   ```

#### Platform-Specific Dependencies

**Windows:**
- Microsoft Visual Studio C++ Build Tools or Visual Studio Community
- WebView2 (usually pre-installed on Windows 10/11)

**macOS:**
- Xcode Command Line Tools:
  ```bash
  xcode-select --install
  ```

**Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install libwebkit2gtk-4.0-dev \
    build-essential \
    curl \
    wget \
    file \
    libssl-dev \
    libgtk-3-dev \
    libayatana-appindicator3-dev \
    librsvg2-dev
```

**Linux (Fedora):**
```bash
sudo dnf install webkit2gtk4.0-devel \
    openssl-devel \
    curl \
    wget \
    file \
    libappindicator-gtk3-devel \
    librsvg2-devel
sudo dnf group install "C Development Tools and Libraries"
```

**Linux (Arch):**
```bash
sudo pacman -S webkit2gtk \
    base-devel \
    curl \
    wget \
    file \
    openssl \
    appmenu-gtk-module \
    gtk3 \
    libappindicator-gtk3 \
    librsvg \
    libvips
```

## Installation
To set up the project on your local machine, follow these steps:

  1. Clone the repository to your local machine using the following command:
  ```
  git clone https://github.com/CircuitVerse/cv-frontend-vue.git
  ```
  2. Navigate to the project directory:
  ```
  cd cv-frontend-vue
  ```
  3. Install the project dependencies:
  ```
  npm install
  ```
  4. Start the development server:
  ```
  npm run dev
  ```

## Desktop Application Development (Tauri)
For working with the desktop application version:

### Development Mode
To run the desktop application in development mode:
```bash
npm run tauri dev
```

### Building the Desktop Application
To build the desktop application for production:
```bash
npm run tauri build
```

The built application will be available in the `src-tauri/target/release/bundle/` directory.

