import { beforeEach, describe, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
    scheduleUpdate: vi.fn(),
    wireToBeCheckedSet: vi.fn(),
    updateCanvasSet: vi.fn(),
    updateSimulationSet: vi.fn(),
    changeCircuitName: vi.fn(),
}));

vi.mock('../src/layoutMode', () => ({
    layoutModeGet: vi.fn(),
}));

vi.mock('../src/engine', () => ({
    scheduleUpdate: mocks.scheduleUpdate,
    wireToBeCheckedSet: mocks.wireToBeCheckedSet,
    updateCanvasSet: mocks.updateCanvasSet,
    updateSimulationSet: mocks.updateSimulationSet,
}));

vi.mock('../src/simulationArea', () => ({
    simulationArea: { lastSelected: null },
}));

vi.mock('../src/data', () => ({
    default: {},
}));

vi.mock('../src/circuit', () => ({
    circuitProperty: {
        changeCircuitName: mocks.changeCircuitName,
    },
}));

vi.mock('../src/restrictedElementDiv', () => ({
    updateRestrictedElementsInScope: vi.fn(),
}));

vi.mock('../src/drag', () => ({
    dragging: {},
}));

vi.mock('#/store/SimulatorStore/SimulatorStore', () => ({
    SimulatorStore: vi.fn(),
}));

vi.mock('../src/metadata', () => ({
    circuitElementList: [],
}));

vi.mock('#/store/simulatorMobileStore', () => ({
    useSimulatorMobileStore: vi.fn(),
}));

import { checkPropertiesUpdate } from '../src/ux';

describe('circuit name property updates', () => {
    let input;

    beforeEach(() => {
        vi.clearAllMocks();

        document.body.innerHTML = `
            <input
                class="objectPropertyAttribute"
                name="changeCircuitName"
                value="Main Sheet"
            />
            <input name="newBitWidth" value="8" old-val="8" />
        `;

        input = document.querySelector(
            '[name="changeCircuitName"]'
        );

        checkPropertiesUpdate();
    });

    test('does not update circuit name during typing', () => {
        $(input).trigger('keyup');

        expect(mocks.changeCircuitName).not.toHaveBeenCalled();
    });

    test('does not update circuit name on paste or click', () => {
        $(input).trigger('paste');
        $(input).trigger('click');

        expect(mocks.changeCircuitName).not.toHaveBeenCalled();
    });

    test('updates circuit name on change', () => {
        $(input).val('Main Sheet New');
        $(input).trigger('change');

        expect(mocks.changeCircuitName).toHaveBeenCalledWith(
            'Main Sheet New'
        );
    });
});
