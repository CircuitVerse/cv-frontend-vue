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

declare module "#/components/helpers/promptComponent/PromptComponent.vue" {
  import type { DefineComponent } from "vue";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/ban-types
  const component: DefineComponent<{}, {}, any>;
  export default component;
  export const provideProjectName: () => Promise<string | Error>;
  export const provideCircuitName: () => Promise<string | Error>;
}

declare module "#/components/helpers/deleteCircuit/DeleteCircuit.vue" {
  import type { DefineComponent } from "vue";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/ban-types
  const component: DefineComponent<{}, {}, any>;
  export default component;
  export function deleteCurrentCircuit(id?: string | number): void;
  export function closeCircuit(circuitItem: unknown): void;
}
