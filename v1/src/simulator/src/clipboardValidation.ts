import { moduleList } from "./metadata";
import { stripTags } from "./utils";

const isPlainObject = (value: unknown): value is Record<string, any> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/**
 * Checks that a circuit payload (a single scope, or the root clipboard
 * object) has the shape that loadScope() relies on.
 */
function hasLoadableShape(payload: unknown): boolean {
  if (!isPlainObject(payload)) return false;
  // loadScope() calls data.allNodes.map() unguarded, and loadNode() reads
  // properties of every entry.
  if (!Array.isArray(payload.allNodes)) return false;
  if (!payload.allNodes.every(isPlainObject)) return false;
  // loadScope() writes scope.layout.titleEnabled, which throws if layout
  // is a string, number or boolean.
  if (payload.layout !== undefined && !isPlainObject(payload.layout)) {
    return false;
  }
  // loadScope() iterates data[moduleName] for every module that is present,
  // and loadModule()/loadSubCircuit() read properties of every entry.
  return moduleList.every((name) => {
    const entries = payload[name];
    if (entries === undefined) return true;
    return Array.isArray(entries) && entries.every(isPlainObject);
  });
}

function isValidScope(scope: unknown): boolean {
  if (!hasLoadableShape(scope)) return false;
  const s = scope as Record<string, any>;
  // Scope ids are numbers for circuits created in the simulator
  // (see the Scope constructor) but may be strings for imported ones.
  const idIsValid =
    (typeof s.id === "string" && s.id !== "") ||
    (typeof s.id === "number" && Number.isFinite(s.id));
  if (!idIsValid) return false;
  if (s.name !== undefined) {
    if (typeof s.name !== "string") return false;
    // newCircuit() strips tags and returns undefined for an empty name,
    // which would make loadScope() throw after earlier scopes were created.
    if (!stripTags(s.name)) return false;
  }
  return true;
}

/**
 * Validates parsed clipboard data completely, before anything in the
 * simulator is touched. paste() must only start creating circuits once
 * this returns true, so invalid data can never partially modify state.
 * @category events
 */
export function isValidClipboardData(data: unknown): boolean {
  if (!isPlainObject(data) || !data.logixClipBoardData) return false;
  if (!Array.isArray(data.scopes)) return false;
  // The root payload is also passed to loadScope() later in paste().
  if (!hasLoadableShape(data)) return false;
  return data.scopes.every(isValidScope);
}