<div align="center">
  <img src="https://github.com/CircuitVerse/CircuitVerse/raw/master/app/assets/images/cvlogo.svg" alt="The CircuitVerse logo" width="400"/>
</div>

# CircuitVerse Frontend Vue
[CircuitVerse Frontend Vue](https://circuitverse.netlify.app/simulatorvue) is dedicated to enhancing the CircuitVerse platform in several key ways. Our primary focus is on decoupling the [CircuitVerse Simulator](https://circuitverse.org/simulator) from the backend, allowing it to function independently and with greater flexibility. Additionally, we're working to remove the reliance on jQueryUI, opting for cleaner and more contemporary code practices. To improve performance and code readability, we're transitioning from traditional DOM mutations to string-based manipulation. Furthermore, we're actively integrating internationalization features to ensure the platform is accessible to users worldwide. In summary, our repository aims to elevate the capabilities and user experience of CircuitVerse through targeted improvements and optimizations.

## Community
We would love to hear from you! We communicate on Slack:

[![Slack](https://img.shields.io/badge/chat-on_slack-purple.svg?style=for-the-badge&logo=slack)](https://circuitverse.org/slack)

## Prerequisites

### Windows users (important)

This project relies on **symlinks** for version management.

On Windows, make sure the following are enabled **before cloning the repository**:

1. Enable **Developer Mode**  
   Open **Windows Settings**, search for **“Developer settings”**, and turn **Developer Mode** ON.

2. Configure Git to allow symlinks:
   ```bash
   git config --global core.symlinks true
   ```
   After enabling the above, re-clone the repository to ensure symlinks are created correctly.


## Development & Versions
This repository supports multiple versions of the simulator.
- **v0**: Stable production version.
- **v1**: Experimental version for new features.

To start the development server:
```bash
# Start v0 (Default)
npm run dev

# Start v1 (Windows/Unix)
# Set VITE_SIM_VERSION=v1 in your environment and run npm run dev

# Note: After running v1, you must unset `VITE_SIM_VERSION` or set it back to `v0` to return to the default version.
```

## Build System
We use a unified build system to generate assets for all versions.

To build all supported versions:
```bash
npm run build
```

To build a specific version:
```bash
npm run build -- v1
```

### Custom Mounting Point (e.g. for Rails)
If you mount the simulator on a different path than the default `/simulatorvue/`, you must specify the `VITE_BASE` environment variable during build:

```bash
# Example for a mounting point at /simulator-v0/
VITE_BASE=/simulator-v0/ npm run build -- v0
```

Built assets will be available in `dist/simulatorvue/`. Each version will have a predictable entry point:
- `dist/simulatorvue/v0/simulator-v0.js`
- `dist/simulatorvue/v1/simulator-v1.js`

## Route-Agnostic Support
The simulator is designed to be **route-agnostic**. It can be mounted on any path (e.g., within a Rails view) by including the appropriate script and setting global variables:

```html
<div id="app"></div>
<script>
  window.logixProjectId = "0"; // Project ID or "0" for new
  window.isUserLoggedIn = true;
</script>
<!-- CSS is automatically injected by the JavaScript file -->
<script type="module" src="/simulatorvue/v0/simulator-v0.js"></script>
```

## Embed Mode
The simulator can be embedded in two ways:

### 1. Via Iframe (Recommended for external sites)
Use the dedicated embed route in your iframe `src`.
```html
<iframe 
  src="/simulatorvue/v0/embed/:projectId" 
  width="100%" 
  height="600px"
></iframe>
```

### 2. Direct Integration (Recommended for main Rails app)
Include the simulator script on any page and set the `window.embed` flag. This renders the minimal embed UI instead of the full simulator UI.
```html
<div id="app"></div>
<script>
  window.embed = true;
  window.logixProjectId = "123";
</script>
<script type="module" src="/simulatorvue/v0/simulator-v0.js"></script>
```

The embed mode supports query parameters for customization (e.g., `?theme=dark&fullscreen=false`):
- `theme`: `light` (default) or `dark`
- `display_title`: `true` or `false`
- `clock_time`: `true` or `false`
- `fullscreen`: `true` or `false`
- `zoom_in_out`: `true` or `false`

## How to Use Vue Simulator with CircuitVerse Main Repo
The Vue Simulator can be integrated into the [CircuitVerse main repo](https://github.com/CircuitVerse/CircuitVerse) as a replacement for the legacy jQuery-based simulator.

### Activation via Flipper
1. Log in to the CircuitVerse dev server using an admin account.
2. Navigate to `/flipper`.
3. Enable the `vuesim` feature flag.

Once enabled, the Rails app will handle routing and data synchronization between the backend and the Vue frontend.

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
