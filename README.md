<div align="center">
  <img src="https://github.com/CircuitVerse/CircuitVerse/raw/master/app/assets/images/cvlogo.svg" alt="The CircuitVerse logo" width="400"/>
</div>

# CircuitVerse Frontend Vue
[CircuitVerse Frontend Vue](https://circuitverse.netlify.app/simulatorvue) is dedicated to enhancing the CircuitVerse platform in several key ways. Our primary focus is on decoupling the [CircuitVerse Simulator](https://circuitverse.org/simulator) from the backend, allowing it to function independently and with greater flexibility. Additionally, we're working to remove the reliance on jQueryUI, opting for cleaner and more contemporary code practices. To improve performance and code readability, we're transitioning from traditional DOM mutations to string-based manipulation. Furthermore, we're actively integrating internationalization features to ensure the platform is accessible to users worldwide. In summary, our repository aims to elevate the capabilities and user experience of CircuitVerse through targeted improvements and optimizations.

## Community
We would love to hear from you! We communicate on Slack:

[![Slack](https://img.shields.io/badge/chat-on_slack-purple.svg?style=for-the-badge&logo=slack)](https://circuitverse.org/slack)

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

## Setting up on cloud with Stackblitz
[StackBlitz](https://developer.stackblitz.com/guides/user-guide/what-is-stackblitz) is an instant fullstack web IDE for the JavaScript ecosystem.

  1. Initiate the setup process by clicking on the following button:

  [![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/~/github.com/CircuitVerse/cv-frontend-vue)

  2. Once the setup is complete, a Preview URL will be displayed in the browser window. Append `/simulatorvue/` to your URL to access the simulator.
  ```
  https://<preview_url>/simulatorvue/
  ```

## How to Use Vue Simulator with CircuitVerse Main Repo
To access the Vue Simulator from the [CircuitVerse main repo](https://github.com/CircuitVerse/CircuitVerse) dev server, you can follow one of the following methods:

### Accessing Vue Simulator
  1. Start the CircuitVerse Main Repo dev server.
  2. go to the `/vuesimulator` path in the dev server.
  3. You would be accessing the Vue Simulator.

### Setting Vue Simulator as Default
  1. Log in to the CircuitVerse dev server using the admin account:
      - **Email:** `admin@circuitverse.org`
      - **Password:** `password`
  2. Once logged in, go to `/flipper` path and turn on vuesim feature flag site wide or for your user.
  3. After activation, you will be able to access the Vue Simulator site-wide in your dev server, also in `/simulator` path the Vue Simulator will be opening instead of the old simulator.

## Code of Conduct
We follow the [Code of Conduct](https://github.com/CircuitVerse/CircuitVerse/blob/master/code-of-conduct.md) of the [CircuitVerse](https://circuitverse.org) Community.

## Contributing
See [`CONTRIBUTING.md`](https://github.com/CircuitVerse/CircuitVerse/blob/master/CONTRIBUTING.md) for more information on contributing to CircuitVerse.

## License
This project is licensed under the [MIT License](LICENSE).

## To Dos -
1. **Creating the mobile version of the vue simulator** 
2. **Testing and bug fixing**
3. **Typescript integration & style Refactoring**
4. **Creating the desktop application** 
5. **Removing JQuery**