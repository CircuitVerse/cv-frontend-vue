import {modules} from './modules';
import {Adder} from './modules/adder';
import {ALU} from './modules/alu';
import {AndGate} from './modules/and_gate';
import {Arrow} from './modules/arrow';
import {ImageAnnotation} from './modules/image_annotation';
import {BitSelector} from './modules/bit_selector';
import {Buffer} from './modules/buffer';
import {Button} from './modules/button';
import {ConstantVal} from './modules/constant_val';
import {ControlledInverter} from './modules/controlled_inverter';
import {Counter} from './modules/counter';
import {Decoder} from './modules/decoder';
import {Demultiplexer} from './modules/demultiplexer';
import {DigitalLed} from './modules/digital_led';
import {Flag} from './modules/flag';
import {Ground} from './modules/ground';
import {HexDisplay} from './modules/hex_display';
import {Input} from './modules/input';
import {LSB} from './modules/lsb';
import {MSB} from './modules/msb';
import {Multiplexer} from './modules/multiplexer';
import {NandGate} from './modules/nand_gate';
import {NorGate} from './modules/nor_gate';
import {NotGate} from './modules/not_gate';
import {OrGate} from './modules/or_gate';
import {Output} from './modules/output';
import {Power} from './modules/power';
import {PriorityEncoder} from './modules/priority_encoder';
import {Random} from './modules/random';
import {Rectangle} from './modules/rectangle';
import {RGBLed} from './modules/RGBLed';
import {RGBLedMatrix} from './modules/rgb_led_matrix';
import {SevenSegDisplay} from './modules/seven_seg_display';
import {SixteenSegDisplay} from './modules/sixteen_seg_display';
import {Splitter} from './modules/splitter';
import {SquareRGBLed} from './modules/square_rgb_led';
import {Stepper} from './modules/stepper';
import {Text} from './modules/text';
import {TriState} from './modules/tri_state';
import {Tunnel} from './modules/tunnel';
import {TwoComplement} from './modules/twos_complement';
import {VariableLed} from './modules/variable_led';
import {XnorGate} from './modules/xnor_gate';
import {XorGate} from './modules/xor_gate';
import {Clock} from './sequential/clock';
import {DflipFlop} from './sequential/d_flip_flop';
import {Dlatch} from './sequential/d_latch';
import {EEPROM} from './sequential/eeprom';
import {JKflipFlop} from './sequential/jk_flip_flop';
import {Keyboard} from './sequential/keyboard';
import {RAM} from './sequential/ram';
import {Rom} from './sequential/rom';
import {SRflipFlop} from './sequential/sr_flip_flop';
import {TflipFlop} from './sequential/t_flip_flop';
import {TTY} from './sequential/tty';
import {ForceGate} from './modules/force_gate';
import {TB_Input} from './testbench/testbenchInput';
import {TB_Output} from './testbench/testbenchOutput';
import {verilogMultiplier} from './modules/verilog_multiplier';
import {verilogDivider} from './modules/verilog_divider';
import {verilogPower} from './modules/verilog_power';
import {verilogShiftLeft} from './modules/verilog_shift_left';
import {verilogShiftRight} from './modules/verilog_shift_right';
import {verilogRAM} from './sequential/verilog_ram';

export function setupModules() {
  const moduleSet = {
    AndGate,
    Random,
    NandGate,
    Counter,
    Multiplexer,
    XorGate,
    XnorGate,
    SevenSegDisplay,
    SixteenSegDisplay,
    HexDisplay,
    OrGate,
    Stepper,
    NotGate,
    Text,
    TriState,
    Buffer,
    ControlledInverter,
    Adder,
    verilogMultiplier,
    verilogDivider,
    verilogPower,
    verilogShiftLeft,
    verilogShiftRight,
    TwoComplement,
    Splitter,
    Ground,
    Power,
    Input,
    Output,
    BitSelector,
    ConstantVal,
    NorGate,
    DigitalLed,
    VariableLed,
    Button,
    RGBLed,
    SquareRGBLed,
    Demultiplexer,
    Decoder,
    Flag,
    MSB,
    LSB,
    PriorityEncoder,
    Tunnel,
    ALU,
    Rectangle,
    Arrow,
    ImageAnnotation,
    RGBLedMatrix,
    TflipFlop,
    DflipFlop,
    Dlatch,
    SRflipFlop,
    JKflipFlop,
    TTY,
    Keyboard,
    Clock,
    Rom,
    EEPROM,
    RAM,
    verilogRAM,
    TB_Input,
    TB_Output,
    ForceGate,
  };
  Object.assign(modules, moduleSet);
}
