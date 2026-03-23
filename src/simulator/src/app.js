import { setup } from './setup';
import ArrayHelpers from './arrayHelpers';
import { initSentry } from './sentry';

// Initialize Sentry first
initSentry();

document.addEventListener('DOMContentLoaded', () => {
    setup();

    // Make array helpers globally available
    window.ArrayHelpers = ArrayHelpers;
});