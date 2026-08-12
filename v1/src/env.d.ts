/// <reference types="vite/client" />

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

declare var $: any;
declare var globalScope: any;
declare var DPR: number;
declare var restrictedElements: any[];
declare var embed: boolean;
