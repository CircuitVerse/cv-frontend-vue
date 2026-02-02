import { describe, it, expect, vi, beforeEach } from 'vitest';
import { pinchZoom } from '../src/listeners';

vi.mock('../src/simulationArea', () => ({ simulationArea: { canvas: { getBoundingClientRect: vi.fn(() => ({ left: 0, top: 0, width: 100, height: 100 })) } } }));
vi.mock('../src/engine', () => ({ gridUpdateSet: vi.fn(), scheduleUpdate: vi.fn(), updateSimulationSet: vi.fn(), updatePositionSet: vi.fn(), updateCanvasSet: vi.fn(), wireToBeCheckedSet: vi.fn(), errorDetectedSet: vi.fn() }));
vi.mock('../src/layoutMode', () => ({ layoutModeGet: vi.fn(), tempBuffer: {}, layoutUpdate: vi.fn() }));
vi.mock('../src/canvasApi', () => ({ changeScale: vi.fn(), findDimensions: vi.fn() }));
vi.mock('../src/data/backupCircuit', () => ({ scheduleBackup: vi.fn() }));
vi.mock('../src/ux', () => ({ hideProperties: vi.fn(), deleteSelected: vi.fn(), uxvar: {}, exitFullView: vi.fn() }));
vi.mock('../src/restrictedElementDiv', () => ({ updateRestrictedElementsList: vi.fn(), updateRestrictedElementsInScope: vi.fn(), hideRestricted: vi.fn(), showRestricted: vi.fn() }));
vi.mock('../src/minimap', () => ({ removeMiniMap: vi.fn(), updatelastMinimapShown: vi.fn() }));
vi.mock('../src/data/undo', () => ({ default: vi.fn() }));
vi.mock('../src/data/redo', () => ({ default: vi.fn() }));
vi.mock('../src/events', () => ({ copy: vi.fn(), paste: vi.fn(), selectAll: vi.fn() }));
vi.mock('../src/Verilog2CV', () => ({ verilogModeGet: vi.fn() }));
vi.mock('../src/plotArea', () => ({ setupTimingListeners: vi.fn() }));
vi.mock('../src/data', () => ({ default: {} }));
vi.mock('@tauri-apps/api/event', () => ({ listen: vi.fn() }));
vi.mock('#/store/simulatorMobileStore', () => ({ useSimulatorMobileStore: vi.fn() }));
vi.mock('vue', () => ({ toRefs: vi.fn() }));

describe('pinchZoom', () => {
    let globalScope = { scale: 1, ox: 0, oy: 0, root: {} };
    beforeEach(() => { globalScope.scale = 1; global.DPR = 1; });
    it('increases scale on zoom', () => {
        pinchZoom({ preventDefault: vi.fn(), touches: [{ clientX: 0, clientY: 0 }, { clientX: 10, clientY: 0 }] }, globalScope);
        expect(globalScope.scale).toBe(1.5);
        pinchZoom({ preventDefault: vi.fn(), touches: [{ clientX: 0, clientY: 0 }, { clientX: 8, clientY: 10 }] }, globalScope);
        expect(globalScope.scale).toBe(1.6);
    });
});
