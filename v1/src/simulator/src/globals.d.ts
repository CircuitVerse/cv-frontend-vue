import Scope from "./circuit";

declare global {
  var globalScope: Scope;
  var width: number;
  var height: number;
  var DPR: number;
  var lightMode: boolean;
  var embed: boolean;
  var loading: boolean;
  var projectId: string | undefined;
  var NODE_INPUT: number;
  var NODE_OUTPUT: number;
  var NODE_INTERMEDIATE: number;

  interface Window {
    globalScope: Scope;
    lightMode: boolean;
    projectId: string | undefined;
    id: string | undefined;
    loading: boolean;
    DPR: number;
    embed: boolean;
    NODE_INPUT: number;
    NODE_OUTPUT: number;
    NODE_INTERMEDIATE: number;
  }
}
