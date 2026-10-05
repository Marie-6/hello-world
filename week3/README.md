First Case — a horror detective logic game：
A rainy night. An anonymous call. A body hidden in the trunk of a car.
Explore Harlow House, collect clues, and find out **who the victim is** and **who the killer is**.

## How to play

- At the start, draw one of three item cards: Master Key, Flashlight, or Magnifying Glass. Each one makes a different route easier.
- Some doors are locked. Roll a die to open them (or use the Master Key).
- Watch your sanity. Dark rooms and scary events lower it. If it reaches 0, you run out of the house and lose.
- When you have enough evidence, go back to the basement and make your accusation.

## Endings

- Perfect ending: right victim, right killer, all the evidence
- Good ending: right victim and killer, but not all the evidence
- Bad endings: accuse the wrong person

## Logic used

- Arithmetic operators: sanity changes, card index
- Comparison operators: dice rolls, sanity checks
- Logical operators: evidence checks (`and` / `or` / `not`)
- `if / elif / else` for every room and ending
- Functions for each room, the dice, and the card draw

## How to run

**Python version**

    python3 FirstCase.py

**Web version (p5.js)**

Open the `FirstCase` folder in VS Code and click Go Live.
