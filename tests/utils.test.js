import {
  parseTarget,
  isTargetValid,
  loadRoll,
  evaluateTotalVsTarget,
  generateTargetValue,
  localize,
} from "../js/utils.js";
// eslint-disable-next-line no-shadow
import { jest } from "@jest/globals";

const ROLL_COUNT = 50;

describe("module", () => {
  /**
   * @class Die
   * @property {number} faces
   * @property {Array<{result:number}>} results
   */
  class Die {
    constructor(faces, results) {
      this.faces = faces;
      this.results = results;
    }
  }

  /**
   * @class Roll
   * @property {string} formula
   * @property {Array<Die|string|number>} terms
   */
  class Roll {
    constructor(formula) {
      this.formula = formula;
      /** @type {Array<Die|string|number>} */
      this.terms = [];
      this._total = 0;
    }

    // eslint-disable-next-line no-unused-vars
    async evaluate({ minimize, maximize }) {
      return {
        total: 7,
      };
    }
  }

  /**
   * @class LoadedRoll
   * @extends {Roll}
   * @property {number} _target
   */
  class LoadedRoll extends Roll {
    constructor(formula, target) {
      super(formula);
      let die = new Die(6, [{ result: 4 }, { result: 6 }]);
      this._target = target;
      this.terms = [die];
    }

    async evaluate(options = { minimize: false, maximize: false }) {
      await super.evaluate(options);
      return loadRoll(this);
    }
  }

  // eslint-disable-next-line no-undef
  global.Die = Die;
  // eslint-disable-next-line no-undef
  global.Roll = Roll;
  // eslint-disable-next-line no-undef
  global.LoadedRoll = LoadedRoll;

  // eslint-disable-next-line no-undef
  global.game = {
    i18n: {
      localize: jest.fn().mockImplementation((key) => {
        if (key === "valid_key") {
          return "Localized String";
        }
        return "";
      }),
    },
  };

  describe("parseTarget", () => {
    it("should return undefined if the target condition is invalid", () => {
      expect(parseTarget("invalid 10")).toBeUndefined();
    });

    it("should return undefined if the target is a float", () => {
      expect(parseTarget("10.5")).toBeUndefined();
    });
    it("should return undefined if the target condition is valid and target is a float", () => {
      expect(parseTarget("lt 10.5")).toBeUndefined();
    });
    it("should return undefined if the target is not a number", () => {
      expect(parseTarget("abc")).toBeUndefined();
    });

    it('should parse target with condition "lt"', () => {
      expect(parseTarget("lt 10")).toEqual({ condition: "lt", value: 10 });
    });

    it('should parse target with condition "<"', () => {
      expect(parseTarget("< 5")).toEqual({ condition: "lt", value: 5 });
    });

    it('should parse target with condition "lte"', () => {
      expect(parseTarget("lte 20")).toEqual({ condition: "lte", value: 20 });
    });

    it('should parse target with condition "<="', () => {
      expect(parseTarget("<= 15")).toEqual({ condition: "lte", value: 15 });
    });

    it('should parse target with condition "gt"', () => {
      expect(parseTarget("gt 30")).toEqual({ condition: "gt", value: 30 });
    });

    it('should parse target with condition ">"', () => {
      expect(parseTarget("> 25")).toEqual({ condition: "gt", value: 25 });
    });

    it('should parse target with condition "gte"', () => {
      expect(parseTarget("gte 40")).toEqual({ condition: "gte", value: 40 });
    });

    it('should parse target with condition ">="', () => {
      expect(parseTarget(">= 35")).toEqual({ condition: "gte", value: 35 });
    });

    it('should parse target with condition "eq"', () => {
      expect(parseTarget("eq 50")).toEqual({ condition: "eq", value: 50 });
    });

    it('should parse target with condition "="', () => {
      expect(parseTarget("= 55")).toEqual({ condition: "eq", value: 55 });
    });

    it('should parse target with condition "=="', () => {
      expect(parseTarget("== 60")).toEqual({ condition: "eq", value: 60 });
    });

    it('should parse target with condition "==="', () => {
      expect(parseTarget("=== 65")).toEqual({ condition: "eq", value: 65 });
    });

    it('should parse target with empty condition as "eq"', () => {
      expect(parseTarget("75")).toEqual({ condition: "eq", value: 75 });
    });

    it("should parse target as an integer", () => {
      expect(parseTarget(80)).toEqual({ condition: "eq", value: 80 });
    });
  });

  describe("range testing", () => {
    // @ts-ignore
    // eslint-disable-next-line no-undef
    const rollSpy = jest.spyOn(global, "Roll");

    afterAll(() => {
      jest.clearAllMocks();
    });

    it("should return false formula condition is invalid", async () => {
      // @ts-ignore
      rollSpy.mockImplementationOnce(() => {
        return {
          evaluate: () => {
            return {
              total: 10,
            };
          },
        };
      });
      // @ts-ignore
      rollSpy.mockImplementationOnce(() => {
        return {
          evaluate: () => {
            return {
              total: 20,
            };
          },
        };
      });
      expect(await isTargetValid("2d6", { condition: "invalidvalue", value: 10 })).toBe(false);
    });

    it("Assure GT 10 falls within 20-30", async () => {
      // @ts-ignore
      rollSpy.mockImplementationOnce(() => {
        return {
          evaluate: () => {
            return {
              total: 20,
            };
          },
        };
      });
      // @ts-ignore
      rollSpy.mockImplementationOnce(() => {
        return {
          evaluate: () => {
            return {
              total: 30,
            };
          },
        };
      });

      expect(await isTargetValid("2d6", { condition: "gt", value: 10 })).toBe(true);
    });
    it("Assure LT 10 falls outside of 20-30", async () => {
      // @ts-ignore
      rollSpy.mockImplementationOnce(() => {
        return {
          evaluate: () => {
            return {
              total: 20,
            };
          },
        };
      });
      // @ts-ignore
      rollSpy.mockImplementationOnce(() => {
        return {
          evaluate: () => {
            return {
              total: 30,
            };
          },
        };
      });

      expect(await isTargetValid("2d6", { condition: "lt", value: 10 })).toBe(false);
    });

    it("Assure LTE 10 falls within 10-20", async () => {
      // @ts-ignore
      rollSpy.mockImplementationOnce(() => {
        return {
          evaluate: () => {
            return {
              total: 20,
            };
          },
        };
      });
      // @ts-ignore
      rollSpy.mockImplementationOnce(() => {
        return {
          evaluate: () => {
            return {
              total: 30,
            };
          },
        };
      });

      expect(await isTargetValid("2d6", { condition: "lte", value: 20 })).toBe(true);
    });

    it("Assure GT 30 falls outside of 20-30", async () => {
      // @ts-ignore
      rollSpy.mockImplementationOnce(() => {
        return {
          evaluate: () => {
            return {
              total: 20,
            };
          },
        };
      });
      // @ts-ignore
      rollSpy.mockImplementationOnce(() => {
        return {
          evaluate: () => {
            return {
              total: 30,
            };
          },
        };
      });

      expect(await isTargetValid("2d6", { condition: "gt", value: 30 })).toBe(false);
    });
    it("Assure GTE 30 falls inside of 20-30", async () => {
      // @ts-ignore
      rollSpy.mockImplementationOnce(() => {
        return {
          evaluate: () => {
            return {
              total: 20,
            };
          },
        };
      });
      // @ts-ignore
      rollSpy.mockImplementationOnce(() => {
        return {
          evaluate: () => {
            return {
              total: 30,
            };
          },
        };
      });

      expect(await isTargetValid("2d6", { condition: "gte", value: 30 })).toBe(true);
    });
    it("Assure EQ 25 falls inside of 20-30", async () => {
      // @ts-ignore
      rollSpy.mockImplementationOnce(() => {
        return {
          evaluate: () => {
            return {
              total: 20,
            };
          },
        };
      });
      // @ts-ignore
      rollSpy.mockImplementationOnce(() => {
        return {
          evaluate: () => {
            return {
              total: 30,
            };
          },
        };
      });

      expect(await isTargetValid("2d6", { condition: "eq", value: 25 })).toBe(true);
    });
    it("Assure EQ 25 falls outside of 1-5", async () => {
      // @ts-ignore
      rollSpy.mockImplementationOnce(() => {
        return {
          evaluate: () => {
            return {
              total: 1,
            };
          },
        };
      });
      // @ts-ignore
      rollSpy.mockImplementationOnce(() => {
        return {
          evaluate: () => {
            return {
              total: 5,
            };
          },
        };
      });

      expect(await isTargetValid("2d6", { condition: "eq", value: 25 })).toBe(false);
    });
  });

  describe("LoadedRoll", () => {
    describe("evaluate", () => {
      it("set 2d6 to 10", async () => {
        let roll = new LoadedRoll("2d6", 10);
        let term1 = new Die(6, [{ result: 6 }, { result: 6 }]);
        roll._total = 12; // Set the initial total to 12
        roll.terms = [term1];

        roll = await roll.evaluate();
        expect(roll._total).toBe(10); // Total should be modified to match the target
      });

      it(`set 2d6 to 10 - ${ROLL_COUNT} Times`, async () => {
        let roll = new LoadedRoll("2d6", 10);
        let term1 = new Die(6, [{ result: 6 }, { result: 6 }]);
        roll._total = 12; // Set the initial total to 12
        roll.terms = [term1];
        const rollSpy = jest.spyOn(roll, "evaluate");

        const results = [];
        for (let i = 0; i < ROLL_COUNT; i++) {
          roll = await roll.evaluate();
          results.push(roll._total);
        }
        expect(rollSpy).toHaveBeenCalledTimes(ROLL_COUNT);
        expect(rollSpy).toHaveReturnedTimes(ROLL_COUNT);
        // expect(roll._total).toBe(10); // Total should be modified to match the target
        expect(new Set(results)).toEqual(new Set([10]));
      });

      it(`set 1d20 to 15 - ${ROLL_COUNT} Times`, async () => {
        let roll = new LoadedRoll("1d20", 15);
        let term1 = new Die(20, [{ result: 20 }]);
        roll._total = 20; // Set the initial total to 12
        roll.terms = [term1];
        const rollSpy = jest.spyOn(roll, "evaluate");
        const results = [];
        for (let i = 0; i < ROLL_COUNT; i++) {
          roll = await roll.evaluate();
          results.push(roll._total);
        }
        expect(rollSpy).toHaveBeenCalledTimes(ROLL_COUNT);
        expect(rollSpy).toHaveReturnedTimes(ROLL_COUNT);
        expect(new Set(results)).toEqual(new Set([15]));
      });

      it("set 4d6(10) to 4", async () => {
        let roll = new LoadedRoll("4d6", 4);
        let term1 = new Die(6, [{ result: 1 }, { result: 2 }, { result: 3 }, { result: 4 }]);
        roll._total = 10;
        roll.terms = [term1];

        roll = await roll.evaluate();
        expect(roll._total).toBe(4); // Total should remain unchanged
      });

      it("set 4d6(4) to 10 from 4", async () => {
        let roll = new LoadedRoll("4d6", 10);
        let term1 = new Die(6, [{ result: 1 }, { result: 1 }, { result: 1 }, { result: 1 }]);
        roll._total = 4;
        roll.terms = [term1];

        roll = await roll.evaluate();
        expect(roll._total).toBe(10); // Total should remain unchanged
      });

      it("set 4d6(4) to 20 from 9", async () => {
        let roll = new LoadedRoll("4d6", 20);
        let term1 = new Die(6, [{ result: 1 }, { result: 6 }, { result: 1 }, { result: 1 }]);
        roll._total = 9;
        roll.terms = [term1];

        roll = await roll.evaluate();
        expect(roll._total).toBe(20); // Total should remain unchanged
      });

      it("should not modify the results if the target is already met", async () => {
        const roll = new LoadedRoll("2d6", 10);
        roll._total = 10; // Set the initial total to 10
        roll.terms = [
          {
            faces: 6,
            results: [{ result: 4 }, { result: 6 }],
          },
        ];

        await roll.evaluate();

        expect(roll._total).toBe(10); // Total should remain unchanged
      });
    });
    describe("evaluateTotalVsTarget", () => {
      it("should return true when total is equal to the target value with condition 'eq'", () => {
        const total = 10;
        const parsedTarget = { condition: "eq", value: 10 };
        expect(evaluateTotalVsTarget(total, parsedTarget)).toBe(true);
      });

      it("should return false when total is not equal to the target value with condition 'eq'", () => {
        const total = 15;
        const parsedTarget = { condition: "eq", value: 10 };
        expect(evaluateTotalVsTarget(total, parsedTarget)).toBe(false);
      });

      it("should return true when total is greater than the target value with condition 'gt'", () => {
        const total = 15;
        const parsedTarget = { condition: "gt", value: 10 };
        expect(evaluateTotalVsTarget(total, parsedTarget)).toBe(true);
      });

      it("should return false when total is not greater than the target value with condition 'gt'", () => {
        const total = 5;
        const parsedTarget = { condition: "gt", value: 10 };
        expect(evaluateTotalVsTarget(total, parsedTarget)).toBe(false);
      });

      it("should return true when total is greater than or equal to the target value with condition 'gte'", () => {
        const total = 15;
        const parsedTarget = { condition: "gte", value: 10 };
        expect(evaluateTotalVsTarget(total, parsedTarget)).toBe(true);
      });

      it("should return false when total is not greater than or equal to the target value with condition 'gte'", () => {
        const total = 5;
        const parsedTarget = { condition: "gte", value: 10 };
        expect(evaluateTotalVsTarget(total, parsedTarget)).toBe(false);
      });

      it("should return true when total is less than the target value with condition 'lt'", () => {
        const total = 5;
        const parsedTarget = { condition: "lt", value: 10 };
        expect(evaluateTotalVsTarget(total, parsedTarget)).toBe(true);
      });

      it("should return false when total is not less than the target value with condition 'lt'", () => {
        const total = 15;
        const parsedTarget = { condition: "lt", value: 10 };
        expect(evaluateTotalVsTarget(total, parsedTarget)).toBe(false);
      });

      it("should return true when total is less than or equal to the target value with condition 'lte'", () => {
        const total = 5;
        const parsedTarget = { condition: "lte", value: 10 };
        expect(evaluateTotalVsTarget(total, parsedTarget)).toBe(true);
      });

      it("should return false when total is not less than or equal to the target value with condition 'lte'", () => {
        const total = 15;
        const parsedTarget = { condition: "lte", value: 10 };
        expect(evaluateTotalVsTarget(total, parsedTarget)).toBe(false);
      });

      it("should return false when an invalid condition is provided", () => {
        const total = 10;
        const parsedTarget = { condition: "invalid", value: 10 };
        expect(evaluateTotalVsTarget(total, parsedTarget)).toBe(false);
      });
    });
    describe("generateTargetValue", () => {
      const formula = "2d6";
      const parsedTarget = { condition: "lt", value: 10 };

      const rollSpy = jest.spyOn(global, "Roll");

      afterAll(() => {
        jest.clearAllMocks();
      });

      it('should generate a value lower than the target when the condition is "lt"', async () => {
        // @ts-ignore
        rollSpy.mockImplementationOnce(() => {
          return {
            evaluate: () => {
              return {
                total: 1, // Minimum
              };
            },
          };
        });
        // @ts-ignore
        rollSpy.mockImplementationOnce(() => {
          return {
            evaluate: () => {
              return {
                total: 12, //Maximum
              };
            },
          };
        });
        const target = await generateTargetValue(formula, parsedTarget);
        expect(target).toBeLessThan(parsedTarget.value);
      });

      it('should generate a value lower than or equal to the target when the condition is "lte"', async () => {
        // @ts-ignore
        rollSpy.mockImplementationOnce(() => {
          return {
            evaluate: () => {
              return {
                total: 1, // Minimum
              };
            },
          };
        });
        // @ts-ignore
        rollSpy.mockImplementationOnce(() => {
          return {
            evaluate: () => {
              return {
                total: 12, //Maximum
              };
            },
          };
        });
        const target = await generateTargetValue(formula, { condition: "lte", value: 10 });
        expect(target).toBeLessThanOrEqual(10);
      });

      it('should generate a value greater than the target when the condition is "gt"', async () => {
        // @ts-ignore
        rollSpy.mockImplementationOnce(() => {
          return {
            evaluate: () => {
              return {
                total: 1, // Minimum
              };
            },
          };
        });
        // @ts-ignore
        rollSpy.mockImplementationOnce(() => {
          return {
            evaluate: () => {
              return {
                total: 12, //Maximum
              };
            },
          };
        });
        const target = await generateTargetValue(formula, { condition: "gt", value: 10 });
        expect(target).toBeGreaterThan(10);
      });

      it('should generate a value greater than or equal to the target when the condition is "gte"', async () => {
        // @ts-ignore
        rollSpy.mockImplementationOnce(() => {
          return {
            evaluate: () => {
              return {
                total: 1, // Minimum
              };
            },
          };
        });
        // @ts-ignore
        rollSpy.mockImplementationOnce(() => {
          return {
            evaluate: () => {
              return {
                total: 12, //Maximum
              };
            },
          };
        });
        const target = await generateTargetValue(formula, { condition: "gte", value: 10 });
        expect(target).toBeGreaterThanOrEqual(10);
      });

      it('should generate a value equal to the target when the condition is "eq"', async () => {
        // @ts-ignore
        rollSpy.mockImplementationOnce(() => {
          return {
            evaluate: () => {
              return {
                total: 1, // Minimum
              };
            },
          };
        });
        // @ts-ignore
        rollSpy.mockImplementationOnce(() => {
          return {
            evaluate: () => {
              return {
                total: 12, //Maximum
              };
            },
          };
        });
        const target = await generateTargetValue(formula, { condition: "eq", value: 10 });
        expect(target).toBe(10);
      });
    });
  });
  describe("localize", () => {
    it("should return the localized string for a valid key", () => {
      // Call the localize function with a valid key
      const result = localize("valid_key");

      // Expect the game.i18n.localize function to be called with the correct key
      expect(game.i18n.localize).toHaveBeenCalledWith("valid_key");

      // Expect the result to be the localized string
      expect(result).toBe("Localized String");
    });

    it("should return an empty string for an invalid key", () => {
      // Call the localize function with an invalid key
      const result = localize("invalid_key");

      // Expect the game.i18n.localize function to be called with the correct key
      expect(game.i18n.localize).toHaveBeenCalledWith("invalid_key");

      // Expect the result to be an empty string
      expect(result).toBe("");
    });
  });
});
