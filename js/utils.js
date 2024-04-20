export /**
 * Randomizes the dice inside the terms of a roll.
 *
 * @param {*} roll
 * @return {*}
 */
const RandomizeTermsDice = (roll) => {
  const terms = roll.terms;
  for (let term of terms) {
    if (term instanceof Die) {
      term.results = term.results.sort((a, b) => 0.5 - Math.random());
    }
  }
  return roll;
};

export const loadRoll = (roll) => {
  // Calculate the difference between the roll total and the target
  const diff = roll._total - roll._target;

  // Copy into a mutable variable
  let diffBy = diff;

  // Find all dice terms in the roll
  const rolledDice = roll.terms.filter((term) => term instanceof Die);

  // For each dice set inside the rolled dice (2d12) (1d6) (1d8) (5d6)
  for (let die of rolledDice) {
    // For each dice in the set (2d12 -> 2 dice, 1d6 -> 1 die, 1d8 -> 1 die, 5d6 -> 5 dice)
    for (let subdie of die.results) {
      // If the difference is positive, we need to reduce the result
      if (diffBy > 0) {
        // Calculate the distance from the minimum result
        let fromMin = Math.abs(1 - subdie.result);

        // If the result is already the minimum, then it can't be lowered any more.
        if (fromMin === 0) {
          continue;
          // If the distance from the minimum is greater than the difference, we can reduce the result by the difference
        } else if (fromMin > diffBy) {
          subdie.result -= diffBy;
          roll._total -= diffBy;
          diffBy = 0;
          // If the distance from the minimum is less than the difference, we reduce the result to the minimum and continue
        } else if (fromMin <= diffBy) {
          subdie.result = 1;
          roll._total -= fromMin;
          diffBy -= fromMin;
        }
        // If the difference is negative, we need to increase the result
      } else if (diffBy < 0) {
        // Calculate the distance from the maximum result
        let fromMax = die.faces - subdie.result;

        // If the result is already the maximum, then it can't be raised any more.
        if (fromMax === 0) {
          continue;
          // If the distance from the maximum is greater than the absolute value of the difference, we can raise the result by the absolute value of the difference
        } else if (fromMax > Math.abs(diffBy)) {
          subdie.result += Math.abs(diffBy);
          roll._total += Math.abs(diffBy);
          diffBy = 0;
          // If the distance from the maximum is less than the absolute value of the difference, we raise the result to the maximum and continue
        } else if (fromMax <= Math.abs(diffBy)) {
          subdie.result = die.faces;
          roll._total += fromMax;
          diffBy += fromMax;
        }
      } else {
        break;
      }
    }
  }
  return roll;
};

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
    }
  }
  if (!Number.isInteger(parseFloat(target))) {
    return undefined;
  }
  return { condition: "eq", value: parseInt(target) };
};
