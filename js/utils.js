export class RiggedRoll extends Roll {
  constructor(formula, target) {
    super(formula);
    this._target = target;
  }

  async evaluate(options = {}) {
    await super.evaluate(options);
    const diff = this._total - this._target;
    let diffBy = diff;
    const rolledDice = this.terms.filter((term) => term instanceof Die);
    for (let die of rolledDice) {
      for (let subdie of die.results) {
        if (diffBy > 0) {
          let fromMin = Math.abs(1 - subdie.result);
          if (fromMin > diffBy) {
            subdie.result -= diffBy;
            this._total -= diffBy;
            diffBy = 0;
          } else if (fromMin < diffBy) {
            subdie.result = 1;
            this._total -= fromMin;
            diffBy -= fromMin;
          }
        } else if (diffBy < 0) {
          let fromMax = die.faces - subdie.result;
          if (fromMax > Math.abs(diffBy)) {
            subdie.result += Math.abs(diffBy);
            this._total += Math.abs(diffBy);
            diffBy = 0;
          } else if (fromMax < Math.abs(diffBy)) {
            subdie.result = die.faces;
            this._total += fromMax;
            diffBy += fromMax;
          }
        } else {
          break;
        }
      }
    }
    return this;
  }
}

export const isTargetValid = (formula, parsedTarget) => {
  const rollMinimum = new Roll(formula).evaluate({ minimize: true, async: false }).total;
  const rollMaximum = new Roll(formula).evaluate({ maximize: true, async: false }).total;

  const { condition, value: target } = parsedTarget;

  switch (condition) {
    case "lt":
      return rollMinimum < target;
    case "lte":
      return rollMinimum <= target;
    case "gt":
      return target < rollMaximum;
    case "gte":
      return target <= rollMaximum;
    case "eq":
      return rollMinimum === rollMaximum ? target === rollMinimum : target >= rollMinimum && target <= rollMaximum;
  }
  return false;
};

export const evaluateTotalVsTarget = (total, parsedTarget) => {
  switch (parsedTarget.condition) {
    case "eq":
      return total === parsedTarget.value;
    case "gt":
      return total > parsedTarget.value;
    case "gte":
      return total >= parsedTarget.value;
    case "lt":
      return total < parsedTarget.value;
    case "lte":
      return total <= parsedTarget.value;
    default:
      return false;
  }
};

export const TARGET_FORMAT = /^(lt|lte|gt|gte|eq|<|<=|>|>=|==|=|===)\s*(\d+)$/;
export const parseTarget = (target) => {
  const match = target.match(TARGET_FORMAT);
  if (match) {
    const condition = match[1].trim();
    const value = parseInt(match[2].trim());

    if (!Number.isInteger(parseFloat(value))) {
      return undefined;
    }

    switch (condition) {
      case "lt":
      case "<":
        return { condition: "lt", value };
      case "lte":
      case "<=":
        return { condition: "lte", value };
      case "gt":
      case ">":
        return { condition: "gt", value };
      case "gte":
      case ">=":
        return { condition: "gte", value };
      case "":
      case "eq":
      case "=":
      case "==":
      case "===":
        return { condition: "eq", value };
      default:
        return { condition: "eq", value };
    }
  }
  if (!Number.isInteger(parseFloat(target))) {
    return undefined;
  }
  return { condition: "eq", value: parseInt(target) };
};
