// Hooks.once is used to perform initialization tasks when the module is loaded.
Hooks.once('init', () => {
  // Register a new game setting for 'maxAttempts' allowing users to specify their own maximum dice roll attempts.
  game.settings.register('loaded-dice-roll', 'maxAttempts', {
    name: 'Max Attempts', // The name displayed in the settings menu.
    hint: 'The maximum number of attempts for rolling dice. Be careful, high numbers can slow down or freeze your foundry.', // Additional description for the setting.
    scope: 'world', // Scope indicates that this setting is stored and applies on a per-world basis.
    config: true, // Config indicates that this setting appears in the Configure Settings menu.
    type: Number, // The type of the setting, in this case, a number.
    default: 100000, // The default value for the setting if not specified by the user.
    onChange: value => console.log(`Max Attempts changed to: ${value}`) // Optional function to call when the setting is changed.
  });
});

// Regular expression to parse the target format from user input.
const TARGET_FORMAT = /([^\d]*)[\s]*([\d]+)/;

// Function to log errors to the console and create a whisper message to the user.
const whisperError = (error) => {
  console.error(`Foundry VTT | Loaded Dice Roll | ${error}`);
  ChatMessage.create({
    user: game.user.id,
    whisper: [game.user.id],
    flavor: "Loaded Dice Roll",
    content: `<div>Error: ${error}</div>`
  });
};

// Parses the target string to extract the condition and value.
const parseTarget = (target) => {
  const match = target.match(TARGET_FORMAT);
  if (match) {
    const condition = match[1].trim();
    const value = parseInt(match[2].trim(), 10);
    switch (condition) {
      case "lt": case "<":
      case "lte": case "<=":
      case "gt": case ">":
      case "gte": case ">=":
      case "": case "eq": case "=": case "==": case "===":
        return { condition, value };
      default:
        return undefined;
    };
  }
  return undefined;
};

// Parses the dialog document to extract the formula and target from user input.
const parseDialogDoc = (doc) => {
  try {
    const formula = doc.find("input[name='formula']").val();
    const target = parseTarget(doc.find("input[name='target']").val());
    return { formula, target };
  } catch (e) {
    console.error(e);
    return { formula: undefined, target: undefined };
  }
};

// Evaluates the total of the dice roll against the target condition and value.
const evaluateTotalVsTarget = (total, target) => {
  switch (target.condition) {
    case "eq": return total === target.value;
    case "gt": return total > target.value;
    case "gte": return total >= target.value;
    case "lt": return total < target.value;
    case "lte": return total <= target.value;
    default: return false;
  }
};

// Main function to handle the submission of the roll dialog.
const onSubmit = async (doc) => {
  const { formula, target } = parseDialogDoc(doc);
  if (!formula || !target || !target.condition) {
    whisperError("Missing Formula or Invalid Target Format");
    return;
  }

  try {
    new Roll(formula).roll();
  } catch (e) {
    console.error(e);
    whisperError("Invalid Formula");
    return;
  }

  const MAX_ATTEMPTS = game.settings.get('loaded-dice-roll', 'maxAttempts');

  for (let i = 0; i < MAX_ATTEMPTS; i++) {
    const dice = new Roll(formula);
    await dice.roll();
    if (evaluateTotalVsTarget(dice.total, target)) {
      dice.toMessage({
        speaker: ChatMessage.getSpeaker({actor: game.user.character}),
        rollMode: game.settings.get("core", "rollMode")
      });
      console.log(`Foundry VTT | Loaded Dice Roll | Success in ${i + 1} attempts.`);
      return;
    }
  }
  whisperError("Max Attempts Reached");
};

// Function to show the dice roll dialog.
const showDialog = async () => {
  const html = await renderTemplate("/modules/loaded-dice-roll/template/module.html");
  return new Promise((resolve) => {
    new Dialog({
      title: 'Loaded Dice Roll',
      content: html,
      buttons: {
        roll: {
          label: "Roll",
          callback: async (html) => resolve(await onSubmit(html))
        }
      },
      default: "roll",
      close: () => resolve(null),
      render: (html) => html.find("input[name='formula']").focus()
    }).render(true);
  });
};

// Adds a button to the Foundry VTT UI for the Loaded Dice Roll feature (GM only).
Hooks.on("getSceneControlButtons", (controls) => {
  if (!game.user.isGM) return;

  const bar = controls.find(c => c.name === "token");
  if (bar) {
    bar.tools.push({
      name: "loaded-dice-roll",
      title: "Loaded Dice Roll",
      icon: "fas fa-dice",
      onClick: () => showDialog(),
      button: true
    });
  }
});
