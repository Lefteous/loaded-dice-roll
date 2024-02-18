const MAX_ATTEMPTS = 3000;
const TARGET_FORMAT = /([^\d]*)[\s]*([\d]+)/;

const whisperError = (error) => {
  console.error(`Foundry VTT | Loaded Dice Roll | ${error}`);
  // Ensure ChatMessage.create is used correctly according to the latest API.
  ChatMessage.create({
    user: game.user.id, // Updated to "id" from "_id" as per the newer API conventions.
    whisper: [game.user.id], // Same here.
    flavor: "Loaded Dice Roll",
    content: `<div>Error: ${error}</div>`
  });
};

const parseTarget = (target) => {
  const match = target.match(TARGET_FORMAT);
  if (match) { // Ensure match is not null before accessing it.
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
      default:
        return undefined;
    };
  }
  return undefined; // Return undefined if match fails.
};

const parseDialogDoc = (doc) => {
  try {
    const formula = doc.find("input[name='formula']").val(); // Use val() for jQuery objects.
    const target = parseTarget(doc.find("input[name='target']").val());
    return { formula, target };
  } catch (e) {
    console.error(e);
    return { formula: undefined, target: undefined };
  }
};

const evaluateTotalVsTarget = (total, target) => {
  switch (target.condition) {
    case "eq":
      return total === target.value;
    case "gt":
      return total > target.value;
    case "gte":
      return total >= target.value;
    case "lt":
      return total < target.value;
    case "lte":
      return total <= target.value;
    default:
      return false; // Ensure there's a default return for safety.
  }
};

const onSubmit = async (doc) => {
  const { formula, target } = parseDialogDoc(doc);
  if (!formula) {
    whisperError("Missing Formula");
    return;
  }
  if (!target || !target.condition) {
    whisperError("Invalid Target Format");
    return;
  }

  try {
    new Roll(formula).roll(); // Validate formula by attempting to create a Roll object.
  } catch (e) {
    console.error(e);
    whisperError("Invalid Formula");
    return;
  }

  for (let i = 0; i < MAX_ATTEMPTS; i++) {
    const dice = new Roll(formula);
    await dice.roll(); // Roll method is async, ensure we await it.
    const total = dice.total;
    if (evaluateTotalVsTarget(total, target)) {
      dice.toMessage({
        speaker: ChatMessage.getSpeaker({actor: game.user.character}) // Ensure correct speaker retrieval.
      }, {
        rollMode: game.settings.get("core", "rollMode") // Use global rollMode setting.
      });
      console.log(`Foundry VTT | Loaded Dice Roll | Cheated in ${i + 1} attempts.`);
      return;
    }
  }
  whisperError("Max Attempts Reached");
};

const showDialog = async () => {
  const html = await renderTemplate("/modules/loaded-dice-roll/template/module.html");
  return new Promise((resolve) => {
    new Dialog({
      title: 'Loaded Dice Roll',
      content: html,
      buttons: {
        roll: {
          label: "Roll",
          callback: async (html) => { // Change 'input' to 'html' for clarity.
            resolve(await onSubmit(html));
          }
        }
      },
      default: "roll",
      close: () => resolve(null),
      render: (html) => {
        html.find("input[name='formula']").focus(); // Ensure correct focus.
      }
    }).render(true);
  });
};

Hooks.on("getSceneControlButtons", (controls) => {
  if (!game.user.isGM) {
    return;
  }

  const bar = controls.find((c) => c.name === "token");
  if (bar) { // Check if bar is found to avoid errors.
    bar.tools.push({
      name: "loaded-dice-roll",
      title: "Loaded Dice Roll",
      icon: "fas fa-dice",
      onClick: () => showDialog(),
      button: true
    });
  }
});
