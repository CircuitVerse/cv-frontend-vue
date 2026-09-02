import { QueueObject } from './eventQueue';

declare module './node' {
  export default interface Node extends QueueObject {
    verilogLabel: string;
  }
}
