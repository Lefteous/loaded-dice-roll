import { isTargetValid, parseTarget, evaluateTotalVsTarget } from "./utils.js";
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
    if (!formula) {
      this.errors.formula = "Missing Formula";
    }

    if (!target) {
      this.errors.target = "Missing Target";
    }

    const parsedTarget = parseTarget(target);

    if (!parsedTarget) {
      this.errors.target = "Target must be an integer";
    }

    if (this.errors.formula || this.errors.target) {
      loadedDialog.render(true);
      return;
    }

    if (!Roll.validate(formula)) {
      this.errors.formula = "Invalid Formula";
    }

    if (!isTargetValid(formula, parsedTarget)) {
      this.errors.target = "The Target is outside the range of the Formula.";
    }

    if (this.errors.formula || this.errors.target) {
      loadedDialog.render(true);
      return;
    }

    const result = await calculateRoll(formula, parsedTarget);

    if (!result) {
      this.errors.target = "Max Attempts Reached";
      loadedDialog.render(true);
    }
  }
}

const calculateRoll = async (formula, parsedTarget) => {
  const MAX_ATTEMPTS = game.settings.get("loaded-dice-roll", "maxAttempts");
  for (let i = 0; i < MAX_ATTEMPTS; i++) {
    const dice = new Roll(formula);
    await dice.roll();
    const total = dice.total;
    if (evaluateTotalVsTarget(total, parsedTarget)) {
      dice.toMessage(
        {
          speaker: ChatMessage.getSpeaker({ actor: game.user.character }),
        },
        {
          rollMode: game.settings.get("core", "rollMode"),
        },
      );
      console.log(`Foundry VTT | Loaded Dice Roll | Succeeded in ${i + 1} attempts.`);
      if (loadedDialog?.rendered) {
        loadedDialog.close();
      }
      return true;
    }
  }
  return false;
};

/** Hooks **/

Hooks.once("init", () => {
  game.settings.register("loaded-dice-roll", "maxAttempts", {
    name: "Max Attempts",
    hint: "The maximum number of attempts for rolling dice. Be careful, high numbers can slow down or freeze your Foundry.",
    scope: "world",
    config: true,
    type: Number,
    default: 100000,
    onChange: (value) => console.log(`Max Attempts changed to: ${value}`),
  });

// Expose a global function for macros
game.loadedDiceRoll = {
  showDialog,
  rollDice: async (formula, target) => {
    if (!formula) {
      whisperError("Missing Formula");
      return;
    }
    if (!target) {
      whisperError("Missing Target");
      return;
    }
    if (!Roll.validate(formula)) {
      whisperError("Invalid Formula");
      return;
    }

    // Parse the target string using the parseTarget function
    let parsedTarget = parseTarget(target);
    if (!parsedTarget) {
      whisperError("Invalid Target");
      return;
    }

    // Validate the parsed target against the formula
    if (!isTargetValid(formula, parsedTarget)) {
      whisperError("The Target is outside the range of the Formula.");
      return;
    }

    // Proceed with the roll calculation using the parsed and validated target
    await calculateRoll(formula, parsedTarget);
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
