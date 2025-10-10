const { ApplicationV2, HandlebarsApplicationMixin} = foundry.applications.api;
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
    loadedDialog = new LoadedDialog();
    loadedDialog.render(true);
  }
};

/** Dialog **/

export class LoadedDialog extends HandlebarsApplicationMixin(ApplicationV2) {

  static DEFAULT_OPTIONS = {
    actions: {
      doRoll: LoadedDialog.doRoll,
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

Hooks.on("renderSceneControls", () => {
  
  console.log("Foundry VTT | Loaded Dice Roll | Rendering Scene Controls");

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