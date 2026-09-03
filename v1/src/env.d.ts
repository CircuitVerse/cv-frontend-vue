/// <reference types="vite/client" />
/// <reference types="jquery" />

interface Array<T> {
  clean(deleteValue: T): T[];
  extend(otherArray: T[]): void;
  contains(value: T): boolean;
}

declare module "*.vue" {
  import type { DefineComponent } from "vue";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/ban-types
  const component: DefineComponent<{}, {}, any>;
  export default component;
}

declare var $: JQueryStatic;
declare var globalScope: import("./simulator/src/circuit").default;
declare var DPR: number;
declare var restrictedElements: string[];
declare var embed: boolean;
