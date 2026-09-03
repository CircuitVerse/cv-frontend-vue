import Scope from "./circuit";

declare global {
  var globalScope: Scope;
  var width: number;
  var height: number;
  var DPR: number;
  var lightMode: boolean;
  var embed: boolean;
  var loading: boolean;
}
