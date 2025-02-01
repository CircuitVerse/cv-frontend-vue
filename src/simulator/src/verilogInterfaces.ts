export interface Node {
    verilogLabel?: string;
    parent: {
        verilogLabel: string;
    };
    label?: string;
}