// Algorithm used for Combinational Analysis

type BooleanMinimizeType = {
  minTerms: number[];
  dontCares: number[];
  numVars: number;
  result: string[];
};

export default function BooleanMinimize(
  numVarsArg: number,
  minTermsArg: number[],
  dontCaresArg: number[] = [],
) {
  var __result: string[];

  Object.defineProperties(this, {
    minTerms: {
      value: minTermsArg,
      enumerable: false,
      writable: false,
      configurable: true,
    },

    dontCares: {
      value: dontCaresArg,
      enumerable: false,
      writable: false,
      configurable: true,
    },

    numVars: {
      value: numVarsArg,
      enumerable: false,
      writable: false,
      configurable: true,
    },

    result: {
      enumerable: true,
      configurable: true,
      get: function () {
        if (__result === undefined) {
          __result = BooleanMinimize.prototype.solve.call(this);
        }

        return __result;
      },
      set: function () {
        throw new Error("result cannot be assigned a value");
      },
    },
  });
}

BooleanMinimize.prototype.solve = function () {
  const dec_to_binary_string = (n: number) => {
    var str = n.toString(2);

    while (str.length != this.numVars) {
      str = "0" + str;
    }

    return str;
  };

  const num_set_bits = (s: string) => {
    var ans = 0;
    for (let i = 0; i < s.length; ++i) if (s[i] === "1") ans++;
    return ans;
  };

  const get_prime_implicants = (allTerms: string[]) => {
    var table: Set<string>[] = [];
    var primeImplicants = new Set();
    var reduced;

    while (1) {
      for (let i = 0; i <= this.numVars; ++i) table[i] = new Set();
      for (let i = 0; i < allTerms.length; ++i) table[num_set_bits(allTerms[i])].add(allTerms[i]);

      allTerms = [];
      reduced = new Set();

      for (let i = 0; i < table.length - 1; ++i) {
        for (let str1 of table[i]) {
          for (let str2 of table[i + 1]) {
            let diff = -1;

            for (let j = 0; j < this.numVars; ++j) {
              if (str1[j] != str2[j]) {
                if (diff === -1) {
                  diff = j;
                } else {
                  diff = -1;
                  break;
                }
              }
            }

            if (diff !== -1) {
              allTerms.push(str1.slice(0, diff) + "-" + str1.slice(diff + 1));
              reduced.add(str1);
              reduced.add(str2);
            }
          }
        }
      }

      for (let t of table) {
        for (let str of t) {
          if (!reduced.has(str)) primeImplicants.add(str);
        }
      }

      if (!reduced.size) break;
    }

    return primeImplicants;
  };

  const get_essential_prime_implicants = (primeImplicants: string[], minTerms: string[]) => {
    const check_if_similar = (minTerm: string, primeImplicant: string) => {
      for (let i = 0; i < primeImplicant.length; ++i) {
        if (primeImplicant[i] !== "-" && minTerm[i] !== primeImplicant[i]) return false;
      }

      return true;
    };

    // Coverage table: one row per minterm, listing the implicants that cover it.
    var rows: number[][] = [];
    for (let m of minTerms) {
      let column: number[] = [];

      for (let i = 0; i < primeImplicants.length; ++i) {
        if (check_if_similar(m, primeImplicants[i])) {
          column.push(i);
        }
      }

      rows.push(column);
    }

    // Reduce the table before enumerating covers, which is exponential in the
    // number of rows. A minterm covered by exactly one implicant forces that
    // implicant into every cover, and a row whose implicants are a superset of
    // another row's is satisfied whenever that row is. Both are removable
    // without changing the cheapest cover, and on real inputs they usually
    // leave nothing to enumerate.
    const selected = new Set<number>();

    const rowKey = (row: number[]) =>
      row
        .slice()
        .sort((a, b) => a - b)
        .join(",");

    for (;;) {
      let changed = false;

      for (let row of rows) {
        if (row.length === 1 && !selected.has(row[0])) {
          selected.add(row[0]);
          changed = true;
        }
      }

      if (selected.size > 0) {
        const remaining = rows.filter((row) => !row.some((pi) => selected.has(pi)));
        if (remaining.length !== rows.length) {
          rows = remaining;
          changed = true;
        }
      }

      const seen = new Set<string>();
      const unique: number[][] = [];
      for (let row of rows) {
        const key = rowKey(row);
        if (seen.has(key)) {
          changed = true;
          continue;
        }
        seen.add(key);
        unique.push(row);
      }
      rows = unique;

      const kept: number[][] = [];
      for (let i = 0; i < rows.length; ++i) {
        const dominated = rows.some(
          (other, j) =>
            j !== i && other.length < rows[i].length && other.every((pi) => rows[i].includes(pi)),
        );
        if (dominated) {
          changed = true;
        } else {
          kept.push(rows[i]);
        }
      }
      rows = kept;

      if (!changed) break;
    }

    const essentials: string[] = [];
    for (let i of selected) {
      essentials.push(primeImplicants[i]);
    }

    if (rows.length === 0) {
      return essentials;
    }

    // What one implicant adds to the cost: itself, plus a literal per
    // fixed position and another for each inverted one.
    const implicant_cost = (implicant: string) => {
      let cost = 1;
      for (let i = 0; i < implicant.length; ++i) {
        if (implicant[i] !== "-") {
          cost++;
          if (implicant[i] === "0") cost++;
        }
      }
      return cost;
    };

    // Cheapest cover per unit of cost, repeated until everything is covered.
    // Always produces a valid cover, so it both seeds the bound below and
    // guarantees an answer if the search does not finish.
    const greedy_cover = () => {
      const covers = new Map<number, number[]>();
      for (let r = 0; r < rows.length; ++r) {
        for (let pi of rows[r]) {
          const list = covers.get(pi);
          if (list) list.push(r);
          else covers.set(pi, [r]);
        }
      }

      const picked = new Set<number>();
      const covered = rows.map(() => false);
      let remaining = rows.length;

      while (remaining > 0) {
        let bestPi = -1;
        let bestRatio = -1;

        for (let [pi, list] of covers) {
          if (picked.has(pi)) continue;
          let gain = 0;
          for (let r of list) {
            if (!covered[r]) gain++;
          }
          if (gain === 0) continue;
          const ratio = gain / implicant_cost(primeImplicants[pi]);
          if (ratio > bestRatio) {
            bestRatio = ratio;
            bestPi = pi;
          }
        }

        if (bestPi === -1) break;

        picked.add(bestPi);
        for (let r of covers.get(bestPi)!) {
          if (!covered[r]) {
            covered[r] = true;
            remaining--;
          }
        }
      }

      return picked;
    };

    const cover_cost = (cover: Iterable<number>) => {
      let cost = 0;
      for (let pi of cover) cost += implicant_cost(primeImplicants[pi]);
      return cost;
    };

    // Branch and bound over the reduced table. Enumerating every candidate
    // cover is exponential in the number of rows, which made 6 variables hang.
    // Cost is a sum over the chosen implicants, so a partial cover already at
    // or above the best complete one can be abandoned, and branching on the
    // row with the fewest choices keeps the tree narrow.
    //
    // Finding the true minimum is set cover, so the search is capped. Within
    // the cap the answer is optimal; past it the greedy cover stands, which
    // is still correct, only possibly a term or two larger. Real truth tables
    // reduce away long before the cap.
    const chosen = new Set<number>();
    let chosenCost = 0;
    let bestSet: number[] = [...greedy_cover()];
    let bestCost = cover_cost(bestSet);
    let steps = 0;
    const STEP_LIMIT = 50000;

    const search = () => {
      if (chosenCost >= bestCost) return;
      if (++steps > STEP_LIMIT) return;

      let target: number[] | undefined;
      for (let row of rows) {
        if (row.some((pi) => chosen.has(pi))) continue;
        if (target === undefined || row.length < target.length) target = row;
      }

      if (target === undefined) {
        bestSet = [...chosen];
        bestCost = chosenCost;
        return;
      }

      for (let pi of target) {
        const cost = implicant_cost(primeImplicants[pi]);
        chosen.add(pi);
        chosenCost += cost;
        search();
        chosenCost -= cost;
        chosen.delete(pi);
      }
    };

    search();

    const result = essentials.slice();
    for (let pi of bestSet) {
      result.push(primeImplicants[pi]);
    }

    return result;
  };

  var minTerms: string[] = this.minTerms.map(dec_to_binary_string.bind(this));
  var dontCares: string[] = this.dontCares.map(dec_to_binary_string.bind(this));

  return get_essential_prime_implicants.call(
    this,
    Array.from(get_prime_implicants.call(this, minTerms.concat(dontCares))) as string[],
    minTerms,
  );
};
