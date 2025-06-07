import { isTargetValid, parseTarget, generateTargetValue, localize } from "./utils.js";
import { LoadedRoll } from "./loadedroll.js";
let loadedDialog = null;

const whisperError = (error) => {
  console.error(`Foundry VTT | Loaded Dice Roll | ${error}`);
  ChatMessage.create({
    user: game.user.id,
    whisper: [game.user.id],
    flavor: localize("loaded-dice-roll.title"),
    content: `<div>Error: ${error}</div>`,
  });
};

const showDialog = async () => {
  
  if (loadedDialog?.rendered) {
    loadedDialog.bringToFront();
  } else {

    let LoadedDialogV13;

    const v13AndAbove = Number.parseInt(game.version.split(".")[0]) >= 13;
    if (v13AndAbove) {
      const module13  = await import("./moduleV13.js"); // Import for V13 and above
      LoadedDialogV13 = module13.LoadedDialogV13;
    }

    loadedDialog = v13AndAbove ? new LoadedDialogV13() : new LoadedDialog();
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
      title: localize("loaded-dice-roll.title"),
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

/** Hooks **/

Hooks.once("init", () => {
  CONFIG.Dice.rolls.push(LoadedRoll);

  // Expose a global function for macros
  game.loadedDiceRoll = {
    showDialog,
    rollDice: async (formula, target) => {
      if (!game.user.isGM) {
        return;
      }
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

  const v13AndAbove = Number.parseInt(game.version.split(".")[0]) >= 13;
  
  if (v13AndAbove) {
    return;
  }

  // Initalize this way if V12 or below

  const button = {
    name: "loaded-dice-roll",
    title: localize("loaded-dice-roll.title"),
    icon: "fas fa-dice",    
    onClick: async () => await showDialog(), // This method is depreciated in V13 and above
    button: true,
  };

  let bar = controls.find((c) => c.name === "token");

  if (bar) {
    bar.tools.push(button);
  }
});

Hooks.on("renderSceneControls", () => {
  
  console.log("Foundry VTT | Loaded Dice Roll | Rendering Scene Controls");

  const v13AndAbove = Number.parseInt(game.version.split(".")[0]) >= 13;

  if (!v13AndAbove) {
    return;
  }

  // Initalize this way if V13 or above, due to changes in allowed onClick handlers.
  // This Hook is used because the DOM is not ready when the getSceneControlButtons hook.

  const container = document.querySelector("#scene-controls-tools");

  if (container.querySelector("#loaded-dice-roll")) {
    return; // Already added
  }

  const listItemElement = document.createElement("li");
  const buttonElement = document.createElement("button");
  buttonElement.name = "loaded-dice-roll";
  buttonElement.id = "loaded-dice-roll";
  buttonElement.ariaLabel = localize("loaded-dice-roll.title");
  buttonElement.type = "button";
  buttonElement.className = "control ui-control tool icon toggle fas fa-dice";
  buttonElement.title = localize("loaded-dice-roll");
  buttonElement.dataset.tool = "loaded-dice-roll";
  buttonElement.ariaPressed = "false";
  buttonElement.addEventListener("click", () => showDialog());
  listItemElement.appendChild(buttonElement);
  container.appendChild(listItemElement);

})