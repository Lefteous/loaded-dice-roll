import { parseTarget, isTargetValid } from "../js/utils.js";
import { jest } from "@jest/globals";
describe("module", () => {
  // Create a fake Roll class
  class Roll {
    constructor(formula) {
      this.formula = formula;
    }

    evaluate({ minimize, maximize, async }) {
      return {
        total: 7,
      };
    }
  }

  global.Roll = Roll;

  describe("parseTarget", () => {
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
  });

  describe("range testing", () => {
    const rollSpy = jest.spyOn(global, "Roll");
    it("Assure GT 10 falls within 20-30", () => {
      rollSpy.mockImplementationOnce(() => {
        return {
          evaluate: () => {
            return {
              total: 20,
            };
          },
        };
      });
      rollSpy.mockImplementationOnce(() => {
        return {
          evaluate: () => {
            return {
              total: 30,
            };
          },
        };
      });

      expect(isTargetValid("2d6", { condition: "gt", value: 10 })).toBe(true);
    });
    it("Assure LT 10 falls outside of 20-30", () => {
      rollSpy.mockImplementationOnce(() => {
        return {
          evaluate: () => {
            return {
              total: 20,
            };
          },
        };
      });
      rollSpy.mockImplementationOnce(() => {
        return {
          evaluate: () => {
            return {
              total: 30,
            };
          },
        };
      });

      expect(isTargetValid("2d6", { condition: "lt", value: 10 })).toBe(false);
    });
    it("Assure GT 30 falls outside of 20-30", () => {
      rollSpy.mockImplementationOnce(() => {
        return {
          evaluate: () => {
            return {
              total: 20,
            };
          },
        };
      });
      rollSpy.mockImplementationOnce(() => {
        return {
          evaluate: () => {
            return {
              total: 30,
            };
          },
        };
      });

      expect(isTargetValid("2d6", { condition: "gt", value: 30 })).toBe(false);
    });
    it("Assure GTE 30 falls inside of 20-30", () => {
      rollSpy.mockImplementationOnce(() => {
        return {
          evaluate: () => {
            return {
              total: 20,
            };
          },
        };
      });
      rollSpy.mockImplementationOnce(() => {
        return {
          evaluate: () => {
            return {
              total: 30,
            };
          },
        };
      });

      expect(isTargetValid("2d6", { condition: "gte", value: 30 })).toBe(true);
    });
    it("Assure EQ 25 falls inside of 20-30", () => {
      rollSpy.mockImplementationOnce(() => {
        return {
          evaluate: () => {
            return {
              total: 20,
            };
          },
        };
      });
      rollSpy.mockImplementationOnce(() => {
        return {
          evaluate: () => {
            return {
              total: 30,
            };
          },
        };
      });

      expect(isTargetValid("2d6", { condition: "eq", value: 25 })).toBe(true);
    });
    it("Assure EQ 25 falls inside of 1-5", () => {
      rollSpy.mockImplementationOnce(() => {
        return {
          evaluate: () => {
            return {
              total: 1,
            };
          },
        };
      });
      rollSpy.mockImplementationOnce(() => {
        return {
          evaluate: () => {
            return {
              total: 5,
            };
          },
        };
      });

      expect(isTargetValid("2d6", { condition: "eq", value: 25 })).toBe(false);
    });
  });
});
