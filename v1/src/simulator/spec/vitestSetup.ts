import { vi, afterEach } from 'vitest';

(global as any).window = window;
(global as any).jQuery = require('jquery');
(global as any).DPR = 1;
(global as any).width = 100;
(global as any).height = 100;

(window as any).Jquery = require('jquery');
(window as any).$ = require('jquery');
(window as any).restrictedElements = [];
(window as any).userSignedIn = true;
(window as any).embed = false;

vi.useFakeTimers()

afterEach(() => {
	vi.runOnlyPendingTimers()
	vi.clearAllTimers()
    window.localStorage.clear();
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
    clearRect: vi.fn(), fillRect: vi.fn(), fillText: vi.fn(), strokeRect: vi.fn(), beginPath: vi.fn(),
    moveTo: vi.fn(), lineTo: vi.fn(), stroke: vi.fn(), closePath: vi.fn(), arc: vi.fn(), fill: vi.fn(), rect: vi.fn(),
} as unknown as CanvasRenderingContext2D)) as any

Object.defineProperty(window, 'localStorage', { value: {
  _s: {} as Record<string, string>,
  getItem(k: string) { return this._s[k] || null; },
  setItem(k: string, v: string) { this._s[k] = String(v); },
  removeItem(k: string) { delete this._s[k]; },
  clear() { this._s = {}; }
}});
