interface Device {
  type: string;
  net?: string;
  order?: number;
  bits: number;
  label?: string;
  abits?: number;
  words?: number;
  offset?: number;
  rdports?: Array<{ clock_polarity?: boolean }>;
  wrports?: Array<{ clock_polarity?: boolean }>;
  memdata?: Array<number | string>;
}

interface Connector {
  to: {
    id: string;
    port: string;
  };
  from: {
    id: string;
    port: string;
  };
  name: string;
}

export interface JsConfig {
  devices: {
    [key: string]: Device;
  };
  connectors: Connector[];
  subcircuits: Record<string, unknown>;
}
