import { describe, test, expect, vi, beforeAll } from "vitest";
import { setup } from "../src/setup";
import load from "../src/data/load";
import gatesCircuitData from "./circuits/gates-circuitdata.json";
import { createPinia, setActivePinia } from "pinia";
import { mount } from "@vue/test-utils";
import simulator from "#/pages/simulatorHandler.vue";
import { createRouter, createWebHistory } from "vue-router";
import i18n from "#/locales/i18n";
import vuetify from "#/plugins/vuetify";
import { routes } from "#/router";
import logixFunction from "../src/data";
import { simulationArea } from "../src/simulationArea";

vi.mock("codemirror", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    fromTextArea: vi.fn(() => ({ setValue: () => {} })),
  };
});

vi.mock("codemirror-editor-vue3", () => ({
  defineSimpleMode: vi.fn(),
}));

// ELK cannot spawn web workers in vitest/jsdom, so fake the ELK API to produce
// a deterministic layout. This lets the test exercise the real partialBeautify
// wiring instead of trivially passing when ELK is unavailable.
vi.mock("elkjs/lib/elk-worker.min.js?worker", () => ({
  default: class FakeELKWorker {},
}));

vi.mock("elkjs/lib/elk-api.js", () => ({
  default: class FakeELK {
    async layout(graph) {
      let x = 40;
      for (const child of graph.children || []) {
        child.x = x;
        child.y = 40;
        x += 140;
      }
      return { children: graph.children || [], edges: [] };
    }
  },
}));

// `any` is used here because `scope` comes from the dynamically-typed
// `globalScope` test global and its node shapes vary per component.
function getPortReachability(scope: any): Map<any, Set<any>> {
  const portNodes = (scope.allNodes || []).filter((n: any) => n.type !== 2);
  const reachability = new Map<any, Set<any>>();
  for (const port of portNodes) {
    const visited = new Set<any>([port]);
    const queue: any[] = [port];
    while (queue.length > 0) {
      const curr = queue.shift()!;
      for (const nb of curr.connections || []) {
        if (!visited.has(nb)) {
          visited.add(nb);
          queue.push(nb);
        }
      }
    }
    reachability.set(port, new Set([...visited].filter((n: any) => n.type !== 2)));
  }
  return reachability;
}

describe("Partial Beautify Circuit", () => {
  let pinia: any;
  let router: any;

  beforeAll(async () => {
    pinia = createPinia();
    setActivePinia(pinia);

    router = createRouter({
      history: createWebHistory(),
      routes,
    });

    global.fetch = vi.fn().mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            data: {
              id: "1",
              attributes: {
                name: "User",
                profile_picture: "original/Default.jpg",
                locale: "en",
                admin: false,
              },
            },
          }),
      }),
    );

    const elem = document.createElement("div");
    if (document.body) {
      document.body.appendChild(elem);
    }

    global.document.createRange = vi.fn(() => ({
      setEnd: vi.fn(),
      setStart: vi.fn(),
      getBoundingClientRect: vi.fn(() => ({
        x: 0,
        y: 0,
        width: 0,
        height: 0,
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
      })),
      getClientRects: vi.fn(() => ({
        item: vi.fn(() => null),
        length: 0,
        [Symbol.iterator]: vi.fn(() => []),
      })),
    })) as any;

    (global as any).globalScope = (global as any).globalScope || {};

    mount(simulator, {
      global: {
        plugins: [pinia, router, i18n, vuetify],
      },
      attachTo: elem,
    });

    setup();
  });
  test("Partial beautify correctly lays out selected components, preserves centroid and unselected components", async () => {
    load(gatesCircuitData);

    const scope = (global as any).globalScope;
    expect(scope).toBeDefined();

    const beforeReach = getPortReachability(scope);

    const andGates = scope.AndGate || [];
    const orGates = scope.OrGate || [];
    expect(andGates.length).toBeGreaterThan(0);
    expect(orGates.length).toBeGreaterThan(0);

    const selectedComponents = [andGates[0], orGates[0]];
    const unselectedComponents = [
      ...(scope.Input || []),
      ...(scope.Output || []),
      ...andGates.slice(1),
      ...orGates.slice(1),
    ];

    const unselectedPositionsBefore = unselectedComponents.map((c) => ({
      comp: c,
      x: c.x,
      y: c.y,
    }));

    const selMinX = Math.min(...selectedComponents.map((c) => c.x));
    const selMaxX = Math.max(...selectedComponents.map((c) => c.x));
    const selMinY = Math.min(...selectedComponents.map((c) => c.y));
    const selMaxY = Math.max(...selectedComponents.map((c) => c.y));
    const centroidBefore = {
      x: (selMinX + selMaxX) / 2,
      y: (selMinY + selMaxY) / 2,
    };

    simulationArea.multipleObjectSelections = [...selectedComponents];

    await logixFunction.beautifyCircuit();

    for (const item of unselectedPositionsBefore) {
      expect(item.comp.x).toBe(item.x);
      expect(item.comp.y).toBe(item.y);
    }

    const afterMinX = Math.min(...selectedComponents.map((c) => c.x));
    const afterMaxX = Math.max(...selectedComponents.map((c) => c.x));
    const afterMinY = Math.min(...selectedComponents.map((c) => c.y));
    const afterMaxY = Math.max(...selectedComponents.map((c) => c.y));
    const centroidAfter = {
      x: (afterMinX + afterMaxX) / 2,
      y: (afterMinY + afterMaxY) / 2,
    };

    expect(Math.abs(centroidAfter.x - centroidBefore.x)).toBeLessThanOrEqual(10);
    expect(Math.abs(centroidAfter.y - centroidBefore.y)).toBeLessThanOrEqual(10);

    for (const wire of scope.wires) {
      const x1 = wire.node1.absX();
      const y1 = wire.node1.absY();
      const x2 = wire.node2.absX();
      const y2 = wire.node2.absY();
      expect(x1 === x2 || y1 === y2).toBe(true);
    }

    for (const wire of scope.wires) {
      expect(wire.node1.deleted).toBeFalsy();
      expect(wire.node2.deleted).toBeFalsy();
      expect(wire.node1.connections).toContain(wire.node2);
      expect(wire.node2.connections).toContain(wire.node1);
    }

    const afterReach = getPortReachability(scope);
    for (const [port, beforePorts] of beforeReach) {
      const afterPorts = afterReach.get(port);
      expect(afterPorts).toBeDefined();
      expect(afterPorts.size).toBe(beforePorts.size);
      for (const p of beforePorts) {
        expect(afterPorts.has(p)).toBe(true);
      }
    }
  }, 30000);
});
