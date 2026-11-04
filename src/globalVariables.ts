/*global ...*/
/*eslint no-undef: "error"*/
declare const window: any;
import jQuery from "jquery";

if (typeof window !== "undefined") {
  window.$ = window.jQuery = jQuery;
  window.isUserLoggedIn = window.isUserLoggedIn ?? false;
  window.logixProjectId = window.logixProjectId ?? undefined;
  window.restrictedElements = window.restrictedElements ?? [];
  window.globalScope = window.globalScope ?? undefined;
  window.lightMode = window.lightMode ?? false; // To be deprecated
  window.projectId = window.projectId ?? undefined;
  window.id = window.id ?? undefined;
  window.loading = window.loading ?? false; // Flag - all assets are loaded
  window.embed = window.embed ?? false;
  window.width = window.width ?? undefined;
  window.height = window.height ?? undefined;
  window.DPR = window.devicePixelRatio || 1;
}
