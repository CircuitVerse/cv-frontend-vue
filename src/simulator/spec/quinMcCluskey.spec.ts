import { describe, test, expect } from "vitest";
import BooleanMinimize from "../src/quinMcCluskey";

const bin = (n: number, width: number) => n.toString(2).padStart(width, "0");

/** Whether a sum of products covers the given input assignment. */
function evaluate(implicants: string[], input: string): boolean {
  return implicants.some((term) =>
    [...term].every((ch, i) => ch === "-" || ch === input[i]),
  );
}

function minimize(numVars: number, minTerms: number[], dontCares: number[] = []): string[] {
  return new (BooleanMinimize as any)(numVars, minTerms, dontCares).result;
}

/** The cost that solve() minimizes: one per term, per literal, and per inversion. */
function complexity(terms: string[]): number {
  let cost = terms.length;
  for (const term of terms) {
    for (const ch of term) {
      if (ch !== "-") {
        cost++;
        if (ch === "0") cost++;
      }
    }
  }
  return cost;
}

/** Every prime implicant of the function, found by direct enumeration. */
function primeImplicants(numVars: number, allowed: number): string[] {
  const coverage = (term: string) => {
    let mask = 0;
    for (let i = 0; i < 1 << numVars; i++) {
      if (evaluate([term], bin(i, numVars))) mask |= 1 << i;
    }
    return mask;
  };

  const terms: string[] = [];
  for (let code = 0; code < 3 ** numVars; code++) {
    let rest = code;
    const chars: string[] = [];
    for (let i = 0; i < numVars; i++) {
      chars.push(["0", "1", "-"][rest % 3]);
      rest = Math.floor(rest / 3);
    }
    const term = chars.join("");
    if ((coverage(term) & ~allowed) === 0) terms.push(term);
  }

  return terms.filter((term) => {
    const own = coverage(term);
    return !terms.some((other) => other !== term && (coverage(other) & own) === own);
  });
}

/**
 * The lowest cost any sum of products can reach. A minimal cover never needs a
 * non-prime implicant, since widening a term only removes literals.
 */
function optimalComplexity(numVars: number, minTerms: number[]): number {
  let required = 0;
  for (const m of minTerms) required |= 1 << m;

  const primes = primeImplicants(numVars, required);
  const covers = primes.map((term) => {
    let mask = 0;
    for (let i = 0; i < 1 << numVars; i++) {
      if (evaluate([term], bin(i, numVars))) mask |= 1 << i;
    }
    return mask;
  });

  let best = Infinity;
  const search = (index: number, covered: number, chosen: string[]) => {
    const cost = complexity(chosen);
    if (cost >= best) return;
    if ((required & ~covered) === 0) {
      best = cost;
      return;
    }
    if (index >= primes.length) return;
    search(index + 1, covered | covers[index], [...chosen, primes[index]]);
    search(index + 1, covered, chosen);
  };
  search(0, 0, []);

  return best;
}

/** Every minterm, and only the minterms, must be covered. */
function coversExactly(result: string[], numVars: number, minTerms: number[]): boolean {
  for (let i = 0; i < 1 << numVars; i++) {
    if (evaluate(result, bin(i, numVars)) !== minTerms.includes(i)) return false;
  }
  return true;
}

/** All 2^(2^n) - 1 non-empty functions of n variables. */
function* everyFunction(numVars: number): Generator<number[]> {
  for (let mask = 1; mask < 1 << (1 << numVars); mask++) {
    const minTerms: number[] = [];
    for (let i = 0; i < 1 << numVars; i++) {
      if (mask & (1 << i)) minTerms.push(i);
    }
    yield minTerms;
  }
}

describe("BooleanMinimize", () => {
  test("drops a term already covered by the others", () => {
    // f = A'B' + A'C + B'C', where A'B' is redundant: A'C covers 001 and 011,
    // B'C' covers 000 and 100, so together they cover every minterm.
    expect(minimize(3, [0, 1, 3, 4])).toHaveLength(2);
  });

  test("covers exactly the minterms, for every function of up to four variables", () => {
    const failures: string[] = [];

    for (const numVars of [1, 2, 3, 4]) {
      for (const minTerms of everyFunction(numVars)) {
        const result = minimize(numVars, minTerms);
        if (!coversExactly(result, numVars, minTerms)) {
          failures.push(`[${minTerms}] => [${result}]`);
        }
      }
    }

    expect(failures.slice(0, 5)).toEqual([]);
  });

  test("finds a minimal cover, for every function of up to three variables", () => {
    const suboptimal: string[] = [];

    for (const numVars of [1, 2, 3]) {
      for (const minTerms of everyFunction(numVars)) {
        const result = minimize(numVars, minTerms);
        const cost = complexity(result);
        const best = optimalComplexity(numVars, minTerms);
        if (cost > best) {
          suboptimal.push(`[${minTerms}] => [${result}] costs ${cost}, best is ${best}`);
        }
      }
    }

    expect(suboptimal.slice(0, 5)).toEqual([]);
  });

  test("respects don't cares", () => {
    // 000 and 010 are minterms, 001 and 011 are free: A'B' + A'B reduces to A'.
    expect(minimize(3, [0, 2], [1, 3])).toEqual(["0--"]);
  });
});
