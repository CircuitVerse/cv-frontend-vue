export class NameLabel {
  constructor(
    public name: string,
    public label: string) { }
}
export class ApplicationMetadata {
  circuitElementList: string[] = [
    "Input",
    "Output",
    "NotGate",
    "OrGate",
    "AndGate",
    "NorGate",
    "NandGate",
    "XorGate",
    "XnorGate",
    "SevenSegDisplay",
    "SixteenSegDisplay",
    "HexDisplay",
    "Multiplexer",
    "BitSelector",
    "Splitter",
    "Power",
    "Ground",
    "ConstantVal",
    "ControlledInverter",
    "TriState",
    "Adder",
    "verilogMultiplier",
    "verilogDivider",
    "verilogPower",
    "verilogShiftLeft",
    "TwoComplement",
    "verilogShiftRight",
    "Rom",
    "RAM",
    "verilogRAM",
    "EEPROM",
    "TflipFlop",
    "JKflipFlop",
    "SRflipFlop",
    "DflipFlop",
    "TTY",
    "Keyboard",
    "Clock",
    "DigitalLed",
    "Stepper",
    "VariableLed",
    "RGBLed",
    "SquareRGBLed",
    "RGBLedMatrix",
    "Button",
    "Demultiplexer",
    "Buffer",
    "SubCircuit",
    "Flag",
    "MSB",
    "LSB",
    "PriorityEncoder",
    "Tunnel",
    "ALU",
    "Decoder",
    "Random",
    "Counter",
    "Dlatch",
    "TB_Input",
    "TB_Output",
    "ForceGate"
  ];
  annotationList: string[] = [
    "Text",
    "Rectangle",
    "Arrow",
    "ImageAnnotation"
  ];
  inputList: string[] = [
    "Random",
    "Dlatch",
    "JKflipFlop",
    "TflipFlop",
    "SRflipFlop",
    "DflipFlop",
    "Buffer",
    "Stepper",
    "Ground",
    "Power",
    "ConstantVal",
    "Input",
    "Clock",
    "Button",
    "Counter"
  ];
  subCircuitInputList: string[] = [
    "Random",
    "Dlatch",
    "JKflipFlop",
    "TflipFlop",
    "SRflipFlop",
    "DflipFlop",
    "Buffer",
    "Stepper",
    "Ground",
    "Power",
    "ConstantVal",
    "Clock",
    "Button",
    "Counter"
  ];
  elementHierarchy: Map<string, NameLabel[]> = new Map([
    [
      "Input", [
        { "name": "Input", "label": "Input" },
        { "name": "Button", "label": "Button" },
        { "name": "Power", "label": "Power" },
        { "name": "Ground", "label": "Ground" },
        { "name": "ConstantVal", "label": "Constant Value" },
        { "name": "Stepper", "label": "Stepper" },
        { "name": "Random", "label": "Random" },
        { "name": "Counter", "label": "Counter" }
      ]
    ],
    ["Output", [
      { "name": "Output", "label": "Output" },
      { "name": "RGBLed", "label": "RGB Led" },
      { "name": "DigitalLed", "label": "Digital Led" },
      { "name": "VariableLed", "label": "Variable Led" },
      { "name": "HexDisplay", "label": "Hex Display" },
      { "name": "SevenSegDisplay", "label": "Seven Segment Display" },
      { "name": "SixteenSegDisplay", "label": "Sixteen Segment Display" },
      { "name": "SquareRGBLed", "label": "Square RGB Led" },
      { "name": "RGBLedMatrix", "label": "RGB Led Matrix" }
    ]],
    ["Gates", [
      { "name": "AndGate", "label": "And Gate" },
      { "name": "OrGate", "label": "Or Gate" },
      { "name": "NotGate", "label": "Not Gate" },
      { "name": "XorGate", "label": "Xor Gate" },
      { "name": "NandGate", "label": "Nand Gate" },
      { "name": "NorGate", "label": "Nor Gate" },
      { "name": "XnorGate", "label": "Xnor Gate" }
    ]],
    ["Decoders & Plexers", [
      { "name": "Multiplexer", "label": "Multiplexer" },
      { "name": "Demultiplexer", "label": "Demultiplexer" },
      { "name": "BitSelector", "label": "Bit Selector" },
      { "name": "MSB", "label": "MSB(Most Significant Bit)" },
      { "name": "LSB", "label": "LSB(Least Significant Bit)" },
      { "name": "PriorityEncoder", "label": "Priority Encoder" },
      { "name": "Decoder", "label": "Decoder" }
    ]
    ],
    ["Sequential Elements", [
      { "name": "DflipFlop", "label": "D flip Flop" },
      { "name": "Dlatch", "label": "D latch" },
      { "name": "TflipFlop", "label": "T flip Flop" },
      { "name": "JKflipFlop", "label": "JK flip Flop" },
      { "name": "SRflipFlop", "label": "SR flip Flop" },
      { "name": "TTY", "label": "TTY" },
      { "name": "Keyboard", "label": "Keyboard" },
      { "name": "Clock", "label": "Clock" },
      { "name": "Rom", "label": "ROM" },
      { "name": "RAM", "label": "RAM" },
      { "name": "verilogRAM", "label": "Verilog RAM" },
      { "name": "EEPROM", "label": "EEPROM" }
    ]
    ],
    ["Annotation", [
      { "name": "Rectangle", "label": "Rectangle" },
      { "name": "Arrow", "label": "Arrow" },
      { "name": "ImageAnnotation", "label": "Image Annotation" },
      { "name": "Text", "label": "Text" }
    ]
    ],
    ["Misc", [
      { "name": "TwoComplement", "label": "Two Complement" },
      { "name": "Flag", "label": "Flag" },
      { "name": "Splitter", "label": "Splitter" },
      { "name": "Adder", "label": "Adder" },
      { "name": "ALU", "label": "ALU(Arithmetic and Logical Unit)" },
      { "name": "TriState", "label": "TriState Flip Flop" },
      { "name": "Tunnel", "label": "Tunnel" },
      { "name": "verilogMultiplier", "label": "Verilog Multiplier" },
      { "name": "verilogDivider", "label": "Verilog Divider" },
      { "name": "verilogPower", "label": "Verilog Power" },
      { "name": "verilogShiftLeft", "label": "Verilog Shift Left" },
      { "name": "verilogShiftRight", "label": "Verilog Shift Right" },
      { "name": "Buffer", "label": "Buffer" },
      { "name": "ControlledInverter", "label": "Controlled Inverter" },
      { "name": "TB_Input", "label": "TB Input" },
      { "name": "TB_Output", "label": "TB Output" },
      { "name": "ForceGate", "label": "Force Gate" }
    ]
    ]
  ]);
}

export const metadata = new ApplicationMetadata();