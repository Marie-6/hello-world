# Process record: Pigeons in New York

Made with an AI assistant (Claude). [▶ Play](https://marie-6.github.io/hello-world/week7/) · [Probe](probes/traffic-overlap.html)

## Which choices did I make?

**Idea**
- A pigeon crossing New York streets, like *Crossy Road*. The pigeon walks by itself and I only use one button.
- The pigeon moves its neck like a real pigeon: the head stays still, then jerks forward.

**Controls**
- Press Space to stop, press again to walk. Before, a tap stopped it for a hidden time, and I never knew when it would walk again.
- Hold Space to fly. Flying uses a Wings bar, so you can't fly forever.
- All the words say "Space" instead of "tap".

**Start page**
- The rules are short and simple on the start page. Before, there were too many words.
- Picking a mode doesn't start the game. You press Start, so people can still change their mind about the mode.

**Difficulty**
- 3 modes: Easy, Medium, Hard. Easy was still too hard, so I made it much easier.
- Car speed and number of cars change by mode. Buses only appear in Medium and Hard.
- Fewer people on the sidewalk, so cars are the main danger and people are a smaller one.
- 3 lives in every mode, for more time playing.
- Pizza gives you a life back, but each life costs more pizza, so you can't live forever.

**Being hit**
- When hit, the pigeon stops for a moment, then blinks and gets dizzy stars.
- I tried a bigger effect (spinning, screen shaking, red flash) and didn't like it, so I went back.
- Every death looks the same: flattened. Before, a bus made it lie on its back.

**Maps**
- 12 New York neighborhoods, including Washington Square Park. None repeats in one game.

**Fixes**
- Streets with no gap to cross: now every gap is big enough to walk through, and wide streets have a safe island.
- Cars overlapping: each new car now checks every car in its lane before it appears.
- Cars running in parallel: each lane on a street has its own speed now.
- Fountains overlapping: decorations, pizza and people no longer cover each other.

**What I kept on purpose**
- No way to win, only to lose. The streets go on forever, and you try to beat your best score.
- Enter, ↑ and the mouse also work, but you only need Space to play.

## What didn't work the first time

| Problem | First try | Then |
|---|---|---|
| Too many people | Fewer new people | Still piled up, because there was no limit. A fixed number per sidewalk worked. |
| Easy too hard | A bit slower | Not enough. Half speed and no buses worked. |
| Cars still overlapping | Fix was done | My screenshot was the old page. A refresh showed the fix. |
| Being hit | Big spinning effect | Didn't like it. A short stop worked. |

## Evidence (before / after)

The [probe](probes/traffic-overlap.html) tests 2,000 random lanes:
- Old rule: about 110,000–130,000 frames with overlapping cars.
- New rule: 0.

It proves the new rule stops overlaps. It doesn't show how the game feels to play.

## A prompt and the AI's first answer

> **Me:** "maybe we can create a game called "pigeons in newyork", which is a game similar to the crossing road game. but only press one button for the pigeon to stop and hold the button for pigeon to fly. and pigeons should avoid people and cars."
>
> **AI:** "Tap: the pigeon stops in place. Hold: the pigeon flies… No input: the pigeon keeps walking forward on its own… Flying uses a stamina bar that refills while you walk. Otherwise you could just fly the whole time."

The Wings bar came from the AI's answer.

## How I write prompts

- Add a screenshot and say what looks wrong.
- Say what to keep, like "keep the dizzy and shining part".
- Say "just check, don't change" when I only want a check.

## Credits

- **Me:** the idea and every choice above. I found the bugs by playing.
- **AI (Claude):** wrote the code, explained why the bugs happened, and tested the fixes.
- **Inspired by:** *Frogger*, *Crossy Road*, *Flappy Bird*. No code or images were copied.

## Next step

When a person on the sidewalk is blocked, they turn around. Does that feel fair, or does it feel like a trap for the pigeon?

## Class proposal

When AI changes something, say how it was checked: played, tested with code, or not checked. The AI often said "I haven't played it", and once a change didn't fix the problem.
