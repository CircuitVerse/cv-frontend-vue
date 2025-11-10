interface LayoutProperties {
    x: number;
    y: number;
}

interface InputOutputElement {
    layoutProperties: LayoutProperties;
}

interface Scope {
    Input: InputOutputElement[];
    Output: InputOutputElement[];
    layout: {
        height: number;
    };
}

interface GlobalScope extends Scope {
    // Add any additional properties if needed
}

interface Module {
    new (
        x: number,
        y: number,
        scope: GlobalScope,
        direction: string,
        size: number,
        bitWidth: number
    ): ModuleInstance;
}

interface ModuleInstance {
    delete(): void;
}

interface Modules {
    [key: string]: Module;
}

interface ChangeInputSizeContext {
    inputSize: number;
    objectType: string;
    x: number;
    y: number;
    scope: GlobalScope;
    direction: string;
    bitWidth: number;
    delete(): void;
}