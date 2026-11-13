import { moduleList } from "./metadata";

const isPlainObject = (value: unknown): value is Record<string, any> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/**
 * Checks that a circuit payload (a single scope, or the root clipboard
 * object) has the shape that loadScope() relies on.
 */
function hasLoadableShape(payload: unknown): boolean {
  if (!isPlainObject(payload)) return false;
  // loadScope() calls data.allNodes.map() unguarded.
  if (!Array.isArray(payload.allNodes)) return false;
  // loadScope() iterates data[moduleName].length for every module that is
  // present, so a present-but-not-array module would be loaded as garbage.
  return moduleList.every((name) => payload[name] === undefined || Array.isArray(payload[name]));
}

function isValidScope(scope: unknown): boolean {
  if (!hasLoadableShape(scope)) return false;
  const s = scope as Record<string, any>;
  // Scope ids are numbers when the simulator creates them (see the Scope
  // constructor in circuit.ts) and may be strings in saved data.
  const idIsString = typeof s.id === "string" && s.id !== "";
  const idIsNumber = typeof s.id === "number" && Number.isFinite(s.id);
  if (!idIsString && !idIsNumber) return false;
  if (s.name !== undefined && typeof s.name !== "string") return false;
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
