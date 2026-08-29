vi.mock('@tauri-apps/api/path', () => ({
    join: vi.fn(),
    downloadDir: vi.fn(),
}));

vi.mock('@tauri-apps/plugin-fs', () => ({
    writeFile: vi.fn(),
}));

vi.mock('@tauri-apps/api/core', () => ({
    isTauri: vi.fn(() => false),
}));

vi.mock('#/store/simulatorMobileStore', () => ({
    useSimulatorMobileStore: vi.fn(() => ({ showCanvas: { value: false } })),
}));

vi.mock('../src/simulationArea', () => ({
    simulationArea: { timePeriod: 1000, simulationQueue: { time: 0 } },
}));

vi.mock('../src/utils', () => ({
    convertors: { dec2hex: vi.fn((v) => v.toString(16)) },
}));

import plotArea from '../src/plotArea';

describe('plotArea generateCSV testing', () => {
    beforeEach(() => {
        global.globalScope = { Flag: [] };
    });

    test('generateCSV with empty flags', () => {
        expect(plotArea.generateCSV()).toBe('');
    });

    test('generateCSV header working', () => {
        global.globalScope.Flag = [
            { identifier: 'CLK', plotValues: [[0, 1]] },
            { identifier: 'DATA', plotValues: [[0, 0]] },
        ];
        const rows = plotArea.generateCSV().split('\n');
        expect(rows[0]).toBe('Time,CLK,DATA');
    });

    test('missing initial value in signal', () => {
        // SignalA only starts at t=10, so its cell at t=0 should be empty
        global.globalScope.Flag = [
            { identifier: 'SignalA', plotValues: [[10, 1], [20, 0]] },
            { identifier: 'SignalB', plotValues: [[0, 0], [10, 1], [20, 1]] },
        ];

        const csv = plotArea.generateCSV();
        const expected = [
            'Time,SignalA,SignalB',
            '0,,0',
            '10,1,1',
            '20,0,1',
        ].join('\n');
        expect(csv).toBe(expected);
    });

    test('carry forward value working', () => {
        // DATA only has a value at t=0 but should appear in all rows
        global.globalScope.Flag = [
            { identifier: 'CLK', plotValues: [[0, 0], [10, 1], [20, 0]] },
            { identifier: 'DATA', plotValues: [[0, 1]] },
        ];

        const csv = plotArea.generateCSV();
        const expected = [
            'Time,CLK,DATA',
            '0,0,1',
            '10,1,1',
            '20,0,1',
        ].join('\n');
        expect(csv).toBe(expected);
    });

    test('escaping commas in names', () => {
        global.globalScope.Flag = [
            { identifier: 'A,B', plotValues: [[0, 1]] },
        ];
        const rows = plotArea.generateCSV().split('\n');
        expect(rows[0]).toBe('Time,"A,B"');
    });

    test('escaping formula injection', () => {
        global.globalScope.Flag = [
            { identifier: 'SIG1', plotValues: [[0, '=CMD']] },
            { identifier: 'SIG2', plotValues: [[0, '  +B1']] },
            { identifier: 'SIG3', plotValues: [[0, '\t-C1']] },
        ];
        const rows = plotArea.generateCSV().split('\n');
        expect(rows[1]).toBe("0,'=CMD,'  +B1,'\t-C1");
    });
});
