type DeviceType = 'Input' | 'Output' | 'Memory';

interface Device {
    type: DeviceType;
    net?: string;
    order?: number;
    bits: number;
    label?: string;
    abits?: number;
    words?: number;
    offset?: number;
    rdports?: Array<{clock_polarity?: boolean}>;
    wrports?: Array<{clock_polarity?: boolean}>;
    memdata?: (number | string)[];
}

interface Endpoint {
    id: string;
    port: string;
}

interface Connector {
    to: Endpoint;
    from: Endpoint;
    name: string;
}

export interface CircuitConfiguration {
    devices: {[key: string]: Device};
    connectors: Connector[];
    subcircuits: Record<string, unknown>;
}