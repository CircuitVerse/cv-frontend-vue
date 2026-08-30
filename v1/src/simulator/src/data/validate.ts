import Ajv2020 from "ajv/dist/2020";
import type { ErrorObject } from "ajv";
import canonicalSchema from "../schemas/canonical.schema.json";
import type { CanonicalNet, CanonicalProject } from "../types/canonical.types";

export type ValidationResult = { valid: true; errors: [] } | { valid: false; errors: string[] };

const ajv = new Ajv2020({ allErrors: true });
const validateSchema = ajv.compile(canonicalSchema);

function formatSchemaError(error: ErrorObject): string {
  const path = error.instancePath;
  const params = error.params as Record<string, unknown>;

  if (error.keyword === "required" && typeof params.missingProperty === "string") {
    return `${path}/${params.missingProperty} is required`;
  }

  if (error.keyword === "additionalProperties" && typeof params.additionalProperty === "string") {
    return `${path}/${params.additionalProperty} is not allowed`;
  }

  if (error.keyword === "propertyNames" && typeof params.propertyName === "string") {
    return `${path}/${params.propertyName} has an invalid property name`;
  }

  return `${path || "/"} ${error.message ?? "is invalid"}`;
}

function validateProjectReferences(project: CanonicalProject): string[] {
  const errors: string[] = [];
  const circuitIds = new Set(Object.keys(project.circuits));
  const orderedTabs = new Set<string>();

  if (!circuitIds.has(project.projectMetadata.focussedCircuit)) {
    errors.push(`/projectMetadata/focussedCircuit refers to an unknown circuit`);
  }

  for (const [index, circuitId] of project.projectMetadata.orderedTabs.entries()) {
    const path = `/projectMetadata/orderedTabs/${index}`;
    if (!circuitIds.has(circuitId)) {
      errors.push(`${path} refers to an unknown circuit "${circuitId}"`);
    }
    orderedTabs.add(circuitId);
  }

  for (const circuitId of circuitIds) {
    if (!orderedTabs.has(circuitId)) {
      errors.push(`/projectMetadata/orderedTabs is missing circuit "${circuitId}"`);
    }
  }

  for (const [circuitId, scope] of Object.entries(project.circuits)) {
    const componentIds = new Set<string>();
    const netsById = new Map<string, CanonicalNet>();

    for (const [componentIndex, component] of scope.netlist.components.entries()) {
      if (componentIds.has(component.id)) {
        errors.push(`/circuits/${circuitId}/netlist/components has duplicate ID "${component.id}"`);
      }
      componentIds.add(component.id);

      if (component.type === "SubCircuit") {
        const path = `/circuits/${circuitId}/netlist/components/${componentIndex}/properties/constructorParamaters/0`;
        const targetId = component.properties.constructorParamaters?.[0];
        if (typeof targetId !== "string") {
          errors.push(`${path} must reference a circuit ID`);
        } else if (!circuitIds.has(targetId)) {
          errors.push(`${path} refers to an unknown circuit "${targetId}"`);
        }
      }
    }

    for (const [netIndex, net] of scope.netlist.nets.entries()) {
      if (netsById.has(net.id)) {
        errors.push(`/circuits/${circuitId}/netlist/nets has duplicate ID "${net.id}"`);
      }
      netsById.set(net.id, net);

      for (const [connectionIndex, portReference] of net.connections.entries()) {
        const referencedComponentId = portReference.slice(0, portReference.indexOf("."));
        if (!componentIds.has(referencedComponentId)) {
          errors.push(
            `/circuits/${circuitId}/netlist/nets/${netIndex}/connections/${connectionIndex} refers to an unknown component "${referencedComponentId}"`,
          );
        }
      }
    }

    const layout = scope.layout;
    if (layout) {
      for (const componentId of Object.keys(layout)) {
        if (
          componentId === "intermediateNodes" ||
          componentId === "annotations" ||
          componentId === "subcircuitSymbol"
        ) {
          continue;
        }
        if (!componentIds.has(componentId)) {
          errors.push(
            `/circuits/${circuitId}/layout/${componentId} refers to an unknown component`,
          );
        }
      }

      for (const componentId of componentIds) {
        if (layout[componentId] === undefined) {
          errors.push(`/circuits/${circuitId}/layout is missing component "${componentId}"`);
        }
      }

      for (const [netId, routing] of Object.entries(layout.intermediateNodes ?? {})) {
        const net = netsById.get(netId);
        if (net === undefined) {
          errors.push(
            `/circuits/${circuitId}/layout/intermediateNodes/${netId} refers to an unknown net`,
          );
          continue;
        }

        const netConnections = new Set(net.connections);
        for (const [connectionIndex, connection] of routing.connections.entries()) {
          for (const [endpointIndex, endpoint] of connection.entries()) {
            const path = `/circuits/${circuitId}/layout/intermediateNodes/${netId}/connections/${connectionIndex}/${endpointIndex}`;

            if (typeof endpoint === "number") {
              if (endpoint >= routing.nodes.length) {
                errors.push(`${path} refers to an unknown routing node ${endpoint}`);
              }
              continue;
            }

            const referencedComponentId = endpoint.slice(0, endpoint.indexOf("."));
            if (!componentIds.has(referencedComponentId)) {
              errors.push(`${path} refers to an unknown component "${referencedComponentId}"`);
            } else if (!netConnections.has(endpoint)) {
              errors.push(`${path} does not belong to net "${netId}"`);
            }
          }
        }
      }
    }

    for (const [index, subCircuitId] of scope.verilogMetadata.subCircuitScopeIds.entries()) {
      if (!circuitIds.has(subCircuitId)) {
        errors.push(
          `/circuits/${circuitId}/verilogMetadata/subCircuitScopeIds/${index} refers to an unknown circuit`,
        );
      }
    }
  }

  return errors;
}

export function validateCanonicalJson(json: unknown): ValidationResult {
  if (!validateSchema(json)) {
    return {
      valid: false,
      errors: validateSchema.errors!.map(formatSchemaError),
    };
  }

  const errors = validateProjectReferences(json as CanonicalProject);
  return errors.length === 0 ? { valid: true, errors: [] } : { valid: false, errors };
}
