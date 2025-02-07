export interface KeyBinding {
    custom?: string;
    default: string;
  }
  
  export interface KeyBindings {
    [key: string]: KeyBinding;
  }