/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../src/themer/themer', () => ({
    colors: {
        'stroke': '#000000',
        'fill': '#FFFFFF',
        'hover_select': '#CCCCCC',
        'text': '#000000'
    },
    updateThemeForStyle: vi.fn(),
    getThemeCardSvg: vi.fn()
}));

vi.mock('../src/engine', () => ({
    scheduleUpdate: vi.fn(),
    wireToBeCheckedSet: vi.fn(),
    updateCanvasSet: vi.fn(),
    forceResetNodesSet: vi.fn(),
    updateSimulationSet: vi.fn(),
    renderCanvas: vi.fn(),
    canvasMessageData: {},
    errorDetectedGet: vi.fn().mockReturnValue(false),
    errorDetectedSet: vi.fn()
}));

vi.mock('../src/ux', () => ({
    fillSubcircuitElements: vi.fn()
}));

vi.mock('../src/modules', () => ({
    changeInputSize: vi.fn(),
    default: {}
}));

vi.mock('../src/subcircuit', () => ({
    default: class SubCircuit {}
}));

vi.mock('../src/data/load', () => ({
    loadScope: vi.fn(),
    default: vi.fn()
}));

vi.mock('../src/data', () => ({
    default: {
        save: vi.fn(),
        load: vi.fn(),
        createSaveAsImgPrompt: vi.fn(),
        clearProject: vi.fn(),
        newProject: vi.fn(),
        saveOffline: vi.fn(),
        createOpenLocalPrompt: vi.fn(),
        recoverProject: vi.fn(),
        createSubCircuitPrompt: vi.fn(),
        createCombinationalAnalysisPrompt: vi.fn(),
        fullViewOption: vi.fn(),
        colorThemes: vi.fn(),
        showTourGuide: vi.fn(),
        newVerilogModule: vi.fn(),
        generateVerilog: vi.fn(),
        bitconverter: vi.fn(),
        createNewCircuitScope: vi.fn(),
        customShortcut: vi.fn(),
        ExportProject: {},
        ImportProject: {}
    }
}));

vi.mock('../src/combinationalAnalysis', () => ({
    performCombinationalAnalysis: vi.fn(),
    GenerateCircuit: vi.fn(),
    createBooleanPrompt: vi.fn()
}));

vi.mock('../src/layoutMode', () => ({
    layoutModeGet: vi.fn().mockReturnValue(false),
    layoutModeSet: vi.fn(),
    tempBuffer: {},
    determineLabel: vi.fn(),
    paneLayout: vi.fn(),
    layoutUpdate: vi.fn()
}));

import ParityGenerator from '../src/modules/ParityGenerator';
import { simulationArea } from '../src/simulationArea';

describe('ParityGenerator', () => {
    let parityGen;

    beforeEach(() => {
        global.globalScope = {
            ParityGenerator: [],
            scale: 1,
            ox: 0,
            oy: 0,
            allNodes: [],
            nodes: []
        };
        
        simulationArea.simulationQueue = {
            add: vi.fn()
        };
        simulationArea.context = {
             beginPath: vi.fn(),
             fillStyle: '',
             textAlign: '',
             fill: vi.fn(),
             stroke: vi.fn(),
             moveTo: vi.fn(),
             lineTo: vi.fn(),
             bezierCurveTo: vi.fn(),
             closePath: vi.fn(),
             arc: vi.fn(),
             fillText: vi.fn(),
             measureText: vi.fn(() => ({ width: 0 }))
        };
    });

    it('should initialize with 3 inputs by default', () => {
        parityGen = new ParityGenerator(0, 0, global.globalScope, 'RIGHT', 3);
        expect(parityGen.inputSize).toBe(3);
        expect(parityGen.inp.length).toBe(3);
    });

    it('should calculate parity correctly (Odd 1s -> 1)', () => {
        parityGen = new ParityGenerator(0, 0, global.globalScope, 'RIGHT', 3);
        parityGen.inp[0].value = 1;
        parityGen.inp[1].value = 0;
        parityGen.inp[2].value = 0;
        parityGen.resolve();
        expect(parityGen.output1.value).toBe(1);
    });

    it('should calculate parity correctly (Even 1s -> 0)', () => {
        parityGen = new ParityGenerator(0, 0, global.globalScope, 'RIGHT', 3);
        parityGen.inp[0].value = 1;
        parityGen.inp[1].value = 1;
        parityGen.inp[2].value = 0;
        parityGen.resolve();
        expect(parityGen.output1.value).toBe(0);
    });
    
    it('should work with 4 inputs', () => {
        parityGen = new ParityGenerator(0, 0, global.globalScope, 'RIGHT', 4);
        expect(parityGen.inputSize).toBe(4);
        expect(parityGen.inp.length).toBe(4);
        
        parityGen.inp[0].value = 1;
        parityGen.inp[1].value = 1;
        parityGen.inp[2].value = 1;
        parityGen.inp[3].value = 0;
        parityGen.resolve();
        expect(parityGen.output1.value).toBe(1);
        
        parityGen.inp[3].value = 1;
        parityGen.resolve();
        expect(parityGen.output1.value).toBe(0);
    });
});
