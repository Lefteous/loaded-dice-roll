Hooks.once('init', () => {
  game.settings.register('loaded-dice-roll', 'maxAttempts', {
    name: 'Max Attempts',
    hint: 'The maximum number of attempts for rolling dice. Be careful, high numbers can slow down or freeze your foundry.',
    scope: 'world',
    config: true,
    type: Number,
    default: 100000,
    onChange: value => console.log(`Max Attempts changed to: ${value}`)
  });

  // Additional initialization code as needed...
});

const TARGET_FORMAT = /([^\d]*)[\s]*([\d]+)/;

const whisperError = (error) => {
  console.error(`Foundry VTT | Loaded Dice Roll | ${error}`);
  ChatMessage.create({
    user: game.user.id,
    whisper: [game.user.id],
    flavor: "Loaded Dice Roll",
    content: `<div>Error: ${error}</div>`
  });
};

const parseTarget = (target) => {
  const match = target.match(TARGET_FORMAT);
  if (match) {
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
  return undefined;
};

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
      return false;
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
    const total = dice.total;
    if (evaluateTotalVsTarget(total, target)) {
      dice.toMessage({
        speaker: ChatMessage.getSpeaker({actor: game.user.character})
      }, {
        rollMode: game.settings.get("core", "rollMode")
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
          callback: async (html) => {
            resolve(await onSubmit(html));
          }
        }
      },
      default: "roll",
      close: () => resolve(null),
      render: (html) => {
        html.find("input[name='formula']").focus();
      }
    }).render(true);
  });
};

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
      button: true
    });
  }
});
