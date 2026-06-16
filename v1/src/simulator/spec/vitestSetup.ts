import { vi, afterEach } from "vitest";

import jQuery from "jquery";

global.window = window;
global.jQuery = jQuery;
vi.stubGlobal("$", jQuery);
global.DPR = true;
global.width = true;
global.height = true;

// Vuetify 3.7+ accesses visualViewport in VOverlay which jsdom doesn't provide
if (!global.visualViewport) {
  const visualViewportMock = {
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    width: 1024,
    height: 768,
    offsetLeft: 0,
    offsetTop: 0,
    pageLeft: 0,
    pageTop: 0,
    scale: 1,
    onresize: null,
    onscroll: null,
  } as any;
  global.visualViewport = visualViewportMock;
  window.visualViewport = visualViewportMock;
}

window.jQuery = jQuery;
window.$ = jQuery;
window.restrictedElements = [];
window.userSignedIn = true;
window.embed = false;

vi.useFakeTimers();

afterEach(() => {
  vi.runOnlyPendingTimers();
  vi.clearAllTimers();
});

vi.mock("@tauri-apps/api/event", () => ({
  listen: vi.fn(() => Promise.resolve(() => {})),
}));

global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

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
}));
