import { loadRoll } from "./utils";

/**
 * @typedef Die
 * @property {number} faces
 * @property {Array<{result:number}>} results
 * @exports Die
 */

/**
 * @typedef Roll
 * @property {string} formula
 * @property {Array<Die|string|number>} terms
 * @property {number} _total
 * @exports Roll
 */

/**
 *
 *
 * @export
 * @class LoadedRoll
 * @extends {Roll}
 */
export class LoadedRoll extends Roll {
  constructor(formula, target) {
    super(formula);
    this._target = target;
  }

  async evaluate(options = {}) {
    await super.evaluate(options);
    return loadRoll(this);
  }
}
