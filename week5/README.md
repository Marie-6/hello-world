▶️ [Play me](https://marie-6.github.io/hello-world/week5/)
original pet to interact
▶️ [Play me](https://marie-6.github.io/hello-world/week5/creature/)
more interesting creature to have!
Concept

A tiny pixel-art dachshund living on a little screen. Its long sausage
body, short legs and floppy ear are built from small squares, like a
sprite from an old video game. It follows you around, wags its tail,
blinks, and gets happy when you pet it. Click the sun and day turns
into a quiet night sky with a moon and twinkling stars.

How to interact

- Move your mouse: the dog walks after you and turns to face you
- Hover over its head: it smiles, sticks out its tongue and wags faster
- Click: it jumps, barks "WOOF!" and sends out pixel hearts
- Click the sun: it becomes night; click the moon: it becomes day again
- Leave it alone: it stands still, blinks and slowly wags its tail

Logic

1. Ingredients (defined only, not run)
   Constants: dog size, color palette, heart/cloud pixel art
   Variables: dog state (position, speed, direction, jump, blink, happy)

2. setup()  ← runs once at the start
   Create canvas → calculate pixel size → place dog in the center → generate clouds and stars

3. draw()   ← runs about 60 times per second, draws one full frame each time
   ① Draw background: day or night
   ② Update state: walk toward the mouse, jump gravity, blink, check if happy
   ③ Draw the dog: buildDog() builds the grid → drawGrid() draws it on screen
   ④ Draw extra effects: bark bubble, hearts, hint text

4. Event functions  ← triggered by user input, only change variables
   mouseMoved    → update targetX (where the dog wants to go)
   mousePressed  → switch day/night, or make the dog jump + bark + release hearts
   windowResized → recalculate sizes when the window changes
