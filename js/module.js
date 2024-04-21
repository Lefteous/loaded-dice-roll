import { isTargetValid, parseTarget, generateTargetValue } from "./utils.js";
import { LoadedRoll } from "./loadedroll.js";
let loadedDialog = null;

const whisperError = (error) => {
  console.error(`Foundry VTT | Loaded Dice Roll | ${error}`);
  ChatMessage.create({
    user: game.user.id,
    whisper: [game.user.id],
    flavor: "Loaded Dice Roll",
    content: `<div>Error: ${error}</div>`,
  });
};

const showDialog = () => {
  if (loadedDialog?.rendered) {
    loadedDialog.bringToTop();
  } else {
    loadedDialog = new LoadedDialog();
    loadedDialog.render(true);
  }
};

/** Dialog **/

export class LoadedDialog extends FormApplication {
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

  getData(options) {
    return mergeObject(super.getData(options), {
      values: this.values,
      errors: this.errors,
    });
  }

  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      title: "Loaded Dice Roll",
      template: "/modules/loaded-dice-roll/template/module.hbs",
      width: 400,
      height: "auto",
      closeOnSubmit: false,
      submitOnChange: false,
      submitOnClose: false,
    });
  }

  async activateListeners(html) {
    super.activateListeners(html);
    this.form.addEventListener("button[name='roll']", async () => {
      this.form.querySelectorAll("div[class*='form-error']").forEach((container) => (container.textContent = ""));
      await this._onSubmit.bind(this);
    });
  }

  async _onSubmit(event) {
    event.preventDefault();
    const formula = this.form.querySelector("input[name='formula']").value;
    const target = this.form.querySelector("input[name='target']").value;

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
    errors.formula = "Missing Formula";
  }

  if (!target) {
    errors.target = "Missing Target";
  }

  const parsedTarget = parseTarget(target);

  if (!parsedTarget) {
    errors.target = "Target must be an integer";
  }

  if (errors.formula || errors.target) {
    return errors;
  }

  if (!Roll.validate(formula)) {
    errors.formula = "Invalid Formula";
  }

  if (!isTargetValid(formula, parsedTarget)) {
    errors.target = "The Target is outside the range of the Formula.";
  }

  return errors;
};

const calculateRoll = async (formula, parsedTarget) => {
  const target = generateTargetValue(formula, parsedTarget);
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

/** Hooks **/

Hooks.once("init", () => {
  CONFIG.Dice.rolls.push(LoadedRoll);

  // Expose a global function for macros
  game.loadedDiceRoll = {
    showDialog,
    rollDice: async (formula, target) => {
      const errors = await validateRoll(formula, target);
      if (errors.formula || errors.target) {
        whisperError(errors.formula || errors.target);
        return;
      }
      await calculateRoll(formula, parseTarget(target));
    },
  };
});

Hooks.on("getSceneControlButtons", (controls) => {
  if (!game.user.isGM) {
    return;
  }

  const bar = controls.find((c) => c.name === "token");
  if (bar) {
    bar.tools.push({
      name: "loaded-dice-roll",
      title: "Loaded Dice Roll",
      icon: "fas fa-dice",
      onClick: () => showDialog(),
      button: true,
    });
  }
});
