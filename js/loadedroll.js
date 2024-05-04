import { loadRoll } from "./utils.js";

// @ts-ignore
// eslint-disable-next-line no-undef
export class LoadedRoll extends Roll {
  /**
   * Creates an instance of LoadedRoll.
   * @param {string} formula
   * @param {number} target
   * @memberof LoadedRoll
   */
  constructor(formula, target) {
    super(formula);
    /** @type {import('../types.js').ParsedTarget} */
    /** @type {number} */
    this._target = target;
    this._total = super._total;
  }

  async evaluate(options = {}) {
    await super.evaluate(options);
    return loadRoll(this);
  }
}
