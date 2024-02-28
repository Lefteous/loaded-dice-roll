# Loaded Dice Roll
A loaded dice rolling module for FoundryVTT
Based on the old, unmaintained FoundryVTT module "[Fudge](https://github.com/troygoode/fvtt-fudge)" 

You can load dice rolls! This module adds a new dice roll tool to the tokens toolbar. Click the 🎲 `(dice)` button, enter in a dice roll formula `(like 2d6)`, enter in your desired result, either a specific number or great/less than, `(like 7 or >10)`, and the result will be printed to chat messages!

The reason I made this module is so that I can "rig" dice games against my players, like this [game](https://www.reddit.com/r/Pathfinder_RPG/comments/57rlbi/comment/d8ubcm1/?utm_source=share&utm_medium=web2x&context=3). I'm sure there are other uses.
Eventually due to their own perception or a perception check, hopefully, they'll notice the dice are always rolling in favor of the house. 

## Installation
This module can be installed directly through FoundryVTT:

[https://foundryvtt.com/packages/loaded-dice-roll](https://foundryvtt.com/packages/loaded-dice-roll)

You can also install manually with this Manifest URL:

```
https://raw.githubusercontent.com/lefteous/loaded-dice-roll/main/module.json
```

## Demo
The dice are rolled secretly in the background ensuring only your desired result is shown to the players.
Sometimes, if your formula or desire result are too extreme, `(like 10d100 = 10)`, it will take too many attempts to roll the result and you'll be privately be messaged a failure alert. `Max attempts are set to 100,000 by default but can be changed in the configuration settings.`

<img width="1213" alt="image" src="https://github.com/Lefteous/loaded-dice-roll/assets/24902317/be62241f-76ab-4956-8847-1e8fc086f9e4">


### Example of a formula targetting the number 7:
![image](https://github.com/Lefteous/loaded-dice-roll/assets/24902317/31d79097-9d17-4139-9ede-edb357826d25)
![image](https://github.com/Lefteous/loaded-dice-roll/assets/24902317/365180e9-ae25-4ea5-839e-a2148fc9d5dc)



### Example of a formula targetting a range of numbers greater than 10:
![image](https://github.com/Lefteous/loaded-dice-roll/assets/24902317/fee15caa-29e0-4ee3-9dcc-4abe7d1b97f6)
![image](https://github.com/Lefteous/loaded-dice-roll/assets/24902317/7106704e-3a78-4db1-8acd-4580306960f9)

### Operators 
Below are the options you can use for your dice loading.
The **Formula Operators** are used for making the dice formula that you want to have rolled `(like 2d10+10)`.
The **Target Operators** are used for making the desired end result of your loaded dice `(like >14)`. 
Target Operators have letter variants as well. For example `>` and `gt` are both for `greater than`.

```
Formula Operators:
+
-
*
/

Target Operators:
=, ==, ===, eq
>, gt
>=, gte
<, lt
<=, lte
```

### Macros
The loaded dice can now be used in FoundryVTT Macros.

You can open the dialog via macro using the following code

```
game.loadedDiceRoll.showDialog();
```

You can also set macros to roll specified loaded dice like in the following examples.

```
game.loadedDiceRoll.rollDice("2d6", "7");
```

```
game.loadedDiceRoll.rollDice("1d20+5", ">=15");
```
