/**
 *
 *
 * @param {import("../js/loadedroll").LoadedRoll} roll - The roll to load.
 * @return {import("../js/loadedroll").LoadedRoll} The loaded roll.
 */
export const loadRoll = (roll) => {
  // Calculate the difference between the roll total and the target
  const diff = roll._total - roll._target;

  // Copy into a mutable variable
  let diffBy = diff;

  // Find all dice terms in the roll
  const rolledDice = roll.terms.filter((term) => term instanceof Die);

  while (diffBy !== 0) {
    // Select a random die set from the pool.
    const randomDie = rolledDice[Math.floor(Math.random() * rolledDice.length)];
    // Select a random die from the set
    const randomSubDie = randomDie.results[Math.floor(Math.random() * randomDie.results.length)];

    // For each dice in the set (2d12 -> 2 dice, 1d6 -> 1 die, 1d8 -> 1 die, 5d6 -> 5 dice)
    //for (let subdie of randomDie.results) {
    // If the difference is positive, we need to reduce the result
    if (diffBy > 0) {
      // Calculate the distance from the minimum result
      let fromMin = Math.abs(1 - randomSubDie.result);

      // If the result is already the minimum, then it can't be lowered any more.
      if (fromMin === 0) {
        continue;
        // If the distance from the minimum is greater than the difference, we can reduce the result by the difference
      } else if (fromMin > diffBy) {
        randomSubDie.result -= diffBy;
        roll._total -= diffBy;
        diffBy = 0;
        // If the distance from the minimum is less than the difference, we reduce the result to the minimum and continue
      } else if (fromMin <= diffBy) {
        // Reduce the result by half the distance from the minimum
        const adjustmentAmount = Math.round(fromMin / 2);
        randomSubDie.result -= adjustmentAmount;
        roll._total -= adjustmentAmount;
        diffBy -= adjustmentAmount;
      }
      // If the difference is negative, we need to increase the result
    } else if (diffBy < 0) {
      // Calculate the distance from the maximum result
      let fromMax = randomDie.faces - randomSubDie.result;

      // If the result is already the maximum, then it can't be raised any more.
      if (fromMax === 0) {
        continue;
        // If the distance from the maximum is greater than the absolute value of the difference, we can raise the result by the absolute value of the difference
      } else if (fromMax > Math.abs(diffBy)) {
        randomSubDie.result += Math.abs(diffBy);
        roll._total += Math.abs(diffBy);
        diffBy = 0;
        // If the distance from the maximum is less than the absolute value of the difference, we raise the result to the maximum and continue
      } else if (fromMax <= Math.abs(diffBy)) {
        // Raise the result by half the distance from the maximum
        const adjustmentAmount = Math.round(fromMax / 2);
        randomSubDie.result += adjustmentAmount;
        roll._total += adjustmentAmount;
        diffBy += adjustmentAmount;
      }
    } else {
      break;
    }
  }
  return roll;
};
/**
 * Localizes a string using the game's localization system.
 *
 * @param {string} key
 */
export const localize = (key) => game.i18n.localize(key);

/**
 * Generates a random target value based on the formula and target condition.
 * @param {string} formula
 * @param {import("../types.js").ParsedTarget} parsedTarget
 * @return {Promise<number>} The generated target value.
 */
export const generateTargetValue = async (formula, parsedTarget) => {
  let r = new Roll(formula);
  const minEval = await r.evaluate({ minimize: true });
  const rollMinimum = minEval.total;
  r = new Roll(formula);
  const maxEval = await r.evaluate({ maximize: true });
  const rollMaximum = maxEval.total;

  const { condition, value: target } = parsedTarget;

  switch (condition) {
    case "lt":
      return Math.floor(Math.random() * (target - rollMinimum) + rollMinimum);
    case "lte":
      return Math.floor(Math.random() * (target - rollMinimum + 1) + rollMinimum);
    case "gt":
      return Math.floor(Math.random() * (rollMaximum - target) + target + 1);
    case "gte":
      return Math.floor(Math.random() * (rollMaximum - target + 1) + target);
    case "eq":
      return target;
  }
};

export const isTargetValid = async (formula, parsedTarget) => {
  let r = new Roll(formula);
  const minEval = await r.evaluate({ minimize: true });
  const rollMinimum = minEval.total;
  r = new Roll(formula);
  const maxEval = await r.evaluate({ maximize: true });
  const rollMaximum = maxEval.total;

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
  if (typeof target !== "string") {
    target = target.toString();
  }
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
