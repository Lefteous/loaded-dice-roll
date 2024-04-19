import { loadRoll } from "./utils";

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
