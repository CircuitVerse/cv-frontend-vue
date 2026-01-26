import { vi, afterEach } from 'vitest';

global.window = window;
global.jQuery = require('jquery');
global.DPR = true;
global.width = true;
global.height = true;

window.Jquery = require('jquery');
window.$ = require('jquery');
window.restrictedElements = [];
window.userSignedIn = true;
window.embed = false;

vi.useFakeTimers()

afterEach(() => {
	vi.runOnlyPendingTimers()
	vi.clearAllTimers()
})

vi.mock('@tauri-apps/api/event', () => ({
	listen: vi.fn(() => Promise.resolve(() => {})),
}))

global.ResizeObserver = vi.fn().mockImplementation(() => ({
	observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
}))

HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
    clearRect: vi.fn(),
    fillRect: vi.fn(),
    fillText: vi.fn(),
    strokeRect: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    stroke: vi.fn(),
    closePath: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
    rect: vi.fn(),
})) 
