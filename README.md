# Loaded Dice Roll
A loaded dice rolling module for FoundryVTT
Based on the old, unmaintained FoundryVTT module "[Fudge](https://github.com/troygoode/fvtt-fudge)" 

You can load dice rolls! This module adds a new dice roll tool to the tokens toolbar. Click the 🎲 `(dice)` button, enter in a dice roll formula `(like 2d6)`, enter in your desired result, either a specific number or great/less than, `(like 7 or >10)`, and the result will be printed to chat messages!

The reason I made this module is so that I can "rig" dice games against my players, like this [game](https://www.reddit.com/r/Pathfinder_RPG/comments/57rlbi/comment/d8ubcm1/?utm_source=share&utm_medium=web2x&context=3). I'm sure there are other uses.
Eventually due to their own perception or a perception check, hopefully, they'll notice the dice are always rolling in favor of the house. 

## Installation
Currently install manually with this Manifest URL:

`https://raw.githubusercontent.com/lefteous/loaded-dice-roll/main/module.json`

## Demo

The dice are rolled secretly in the background ensuring only your desired result is shown to the players.
Sometimes, if your formula or desire result are to extreme, `(like 10d100 = 10)`, it will take too many attempts to roll the result and you'll be privately be messaged a failure alert. `Max attempts is currently set to 3000 tries`

Example of a formula targetting the number 7:



Example of a formula targetting a range of numbers greater than 10:

