const { ApplicationV2, HandlebarsApplicationMixin} = foundry.applications.api;
import { isTargetValid, parseTarget, generateTargetValue, localize } from "./utils.js";
import { LoadedRoll } from "./loadedroll.js";
let loadedDialog = null;

export class LoadedDialogV13 extends HandlebarsApplicationMixin(ApplicationV2) {

  static DEFAULT_OPTIONS = {
    actions: {
      doRoll: LoadedDialogV13.doRoll,
    },
    position: {
      width: 400,
      height: "auto",
    },
    window: {
      title: "loaded-dice-roll.title",
      closeOnSubmit: false,
      submitOnChange: false,
      submitOnClose: false,
    }
  }

  static PARTS = {
    form: {
      template: "/modules/loaded-dice-roll/template/module.hbs",
    }
  }

  constructor() {
    super();
    this.errors = {
      formula: "",
      target: "",
    };
    this.values = {
      formula: "",
      target: "",
    };
  }

  _prepareContext(options) {
    return {
      values: this.values,
      errors: this.errors,
    };
  }

  static async doRoll(event) {
    event.preventDefault();
    document.querySelectorAll("div[class*='form-error']").forEach((container) => (container.textContent = ""));

    const formula = document.querySelector("input[name='formula']").value;
    const target = document.querySelector("input[name='target']").value;

    this.errors = {
      formula: "",
      target: "",
    };
    this.values = {
      formula,
      target,
    };

    this.errors = await validateRoll(formula, target);

    if (this.errors.formula || this.errors.target) {
      loadedDialog.render(true);
    } else {
      await calculateRoll(formula, parseTarget(target));
    }
    
  }
}

const validateRoll = async (formula, target) => {
  const errors = {
    formula: "",
    target: "",
  };

  if (!formula) {
    errors.formula = localize("loaded-dice-roll.errors.formula.required");
  }

  if (!target) {
    errors.target = localize("loaded-dice-roll.errors.target.required");
  }

  const parsedTarget = parseTarget(target);

  if (!parsedTarget) {
    errors.target = localize("loaded-dice-roll.errors.target.invalid");
  }

  if (errors.formula || errors.target) {
    return errors;
  }

  if (!Roll.validate(formula)) {
    errors.formula = localize("loaded-dice-roll.errors.formula.required");
  }

  const validTarget = await isTargetValid(formula, parsedTarget);

  if (!validTarget) {
    errors.target = localize("loaded-dice-roll.errors.target.outside-range");
  }

  return errors;
};

const calculateRoll = async (formula, parsedTarget) => {
  const target = await generateTargetValue(formula, parsedTarget);
  const dice = new LoadedRoll(formula, target);
  await dice.evaluate();
  dice.toMessage(
    {
      speaker: ChatMessage.getSpeaker({ actor: game.user.character }),
    },
    {
      rollMode: game.settings.get("core", "rollMode"),
    },
  );
  if (loadedDialog?.rendered) {
    loadedDialog.close();
  }
};