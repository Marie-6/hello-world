# Process record: Pigeons in New York

How this game was made with an AI assistant (Claude, in Claude Code): every request I made, what was decided and why, how it was built, what went wrong, and what was tried again.

**Play:** https://marie-6.github.io/hello-world/week7/ · **Code:** [`sketch.js`](sketch.js) · **Probe:** [`probes/traffic-overlap.html`](probes/traffic-overlap.html)

---

## 1. Intention and boundary

**What I wanted:** an original one-button game with a funny New York pigeon, crossing streets like *Frogger* / *Crossy Road*. In those games you press for every step. Here the pigeon **walks on its own** (the automated control), and the one button only decides **when to stop** and **when to fly**.

**What I changed over time:** the controls got clearer (tap toggles stop/walk), there are 3 modes and 3 lives, 12 neighborhoods, fairer traffic, nothing overlaps on screen, a short "stunned" moment when hit, and a Start button.

**What I kept or left out on purpose:**

| Kept / left out | Why |
|---|---|
| **No win, only lose.** The streets never end; the score is how far you get. | Like Flappy Bird. The challenge is how long you survive, not reaching an end. |
| **Extra inputs kept:** Enter, ↑ and mouse/touch also work; modes are picked with the mouse. | I decided not to strip them: the game itself is still played with one button (Space). |
| **3 lives in every mode** (not 5/3/1 as the AI suggested). | Same rules for everyone; difficulty comes from traffic, not lives. |
| **Rejected the big "hit" effect** (tumble, X eyes, screen shake, red flash). | I didn't like how it looked. I kept only a short stop + the blinking and dizzy stars. |
| **Not added:** hawks, subway steam grates, hot dog carts (from the first plan). | Kept the game focused on cars vs. people. |
| **No images.** Everything is drawn with code on one canvas; sounds are generated live. | Nothing to load, so it runs by just opening `index.html`. |

---

## 2. Evidence

**Starting point:** reference games *Frogger* / *Crossy Road*. The first playable version was an AI-built web page (Oct 28), then copied to this repo in commit [`30b8a2a`](https://github.com/Marie-6/hello-world/commit/30b8a2a).

### One before/after check: overlapping cars

- **Observation (before):** in my screenshot, cars in three lanes were drawn on top of each other.
- **Check:** [`probes/traffic-overlap.html`](probes/traffic-overlap.html) runs 2,000 random lanes for 30 s with the old and the new spawning rule.

| Rule | Frames with overlapping cars | Smallest gap |
|---|---|---|
| Old | **≈ 110,000–130,000** | about −120 px (overlap) |
| New ([`8a4995a`](https://github.com/Marie-6/hello-world/commit/8a4995a)) | **0** | ≈ 100 px |

The lanes are random, so the old number changes a little each run. The new one is always 0.

- **What it establishes:** the old rule itself caused the overlaps, and the new rule never lets two cars in a lane touch.
- **What it does not establish:** how it looks or feels. It's a simulation without drawing. My second screenshot still showed overlaps, which turned out to be the **old cached page**: GitHub Pages published the fix at 8:30 PM, and the screenshot was taken at 8:30:17 PM.

### A prompt and its first response

> **My prompt:** "maybe we can create a game called"pigeons in newyork", which is a game similar to the crossing road game. but only press one button for the pigeon to stop and hold the button for pigeon to fly. and pigeons should avoid people and cars. how about htis"
>
> **First AI response (shortened):** "I like it! It's simple, it has a clear personality, and the stop-vs-fly controls give it its own feel… **Tap**: the pigeon stops in place. **Hold**: the pigeon flies… **No input**: the pigeon keeps walking forward on its own… Flying uses a **stamina bar** that refills while you walk. Otherwise you could just fly the whole time…"

The AI added the **stamina bar**. I hadn't thought of it, but without it you could just fly forever.

---

## 3. Decision log (every request)

Each row: my prompt (exact words), the decision and why, how it works, and whether it worked first time.

### Idea

| # | My prompt | Decision + why | Result |
|---|---|---|---|
| 1 | "do you have any ideas about what game to make?" | AI suggested 5 ideas (Lighthouse Keeper, Echo…). | Not what I wanted. |
| 2 | "do you know flappy bird? … anything fun and interesting and new" | AI listed why Flappy Bird works and gave 5 twists. | Still felt like old games. |
| 3–4 | "i recall a music game called "dancing line"" / "but that's not interesting?" | More rhythm ideas, then "stranger" ones. | Still not new enough. |
| 5 | "let's maybe start with a topic?" | **Starting from a topic** instead of from other games. | This unlocked my own idea. |
| 6 | "pigeons in newyork … press one button for the pigeon to stop and hold … to fly" | **My idea.** AI planned the stamina bar, NYC details and auto-walking. | Accepted. |

### Building and tuning

| # | My prompt | Decision + why | Mechanism (how) | Worked? |
|---|---|---|---|---|
| 7 | "make sure the pigeon's movement is funny like in the real life they move their necks" | Copy the real pigeon head-bob. | The step is a cycle from 0 to 1. For 62% of it the head moves backward as fast as the body moves forward, so it **stays still on screen**, then it snaps forward. | ✅ |
| 8 | "after pressing tap, i dont know how long the pigeon's gonna stop" | A hidden 0.9 s timer was confusing → let the player decide. | Tap = **toggle** stop/walk. A "SPACE TO WALK" sign shows while stopped. Press < 0.17 s = tap, longer = hold (fly). | ✅ |
| 9 | "change the mode to "easy- middle- and hard"" | 3 modes with their own best score. | One settings table per mode: car speed, gaps, lanes, buses, wing drain, people. | ⚠️ Easy too hard → #10 |
| 10 | "the easy mode is still to hard" | Easy needed to be *much* easier, not slightly. | Cars at half speed, double gaps, no buses, max 2 lanes, longer flight, smaller hitbox. | ✅ |
| 11 | "change tap to pree "space"" | Only the wording; Space already worked. | Text changed on the start screen, hint, sign and game-over screen. | ✅ |
| 12 | "should i add like 3 lives … or i die so fast" → "3 lives in every mode" | AI suggested 5/3/1 lives; **I chose 3 for all**. | Feathers in the HUD. A hit = "Ouch!", flying feathers, dizzy stars, 2 s blinking (can't be hit). | ✅ |
| 13 | "there's just 3 maps? … like washington square park? … dont repeat them in one game" | 12 neighborhoods, each with its own look and traffic. | Fixed start (Midtown) and end (Coney Island); the 10 in between are shuffled (Fisher–Yates) every game. | ✅ |
| 14 | "if i eat soo many pizzas, i will never die?" | Bonus lives were too easy. | Each bonus life costs more: 10, then 20 more, then 30 more… Goals move up even when lives are full. | ✅ |
| 15 | "so many people in medium mode … delete some?" | Lower the spawn rate by about 40%. | Changed a multiplier. | ❌ Didn't help → #17 |
| 16 | "[screenshot] so many words in introduction" | Players learn by playing. | Start screen cut to: goal, 2 controls, 3 small tips, mode buttons. | ✅ |
| 17 | "still a lot of people … find the balance of avoiding the cars and the people?" | **Real cause:** people kept spawning every few seconds with **no limit**, so they piled up. | Each sidewalk now has a **fixed headcount**. A new person only comes in when one leaves. Cars stay the main danger. | ✅ |
| 18 | "sometimes there's no way out of the traffic" | **Bug:** gaps shrank with distance down to about 0.27 s, impossible to walk through. | Minimum gap = lane speed × a minimum time (Easy 2 s, Medium 1.45 s, Hard 1.2 s). Wide streets got a safe **island** in the middle. | ✅ |

### Submission and polish (in this repo)

| # | My prompt | Decision + why | Mechanism (how) | Worked? |
|---|---|---|---|---|
| 19 | "add it into fungames, also create week 7 in hello-world" | Same game in both repos. | Commits [`30b8a2a`](https://github.com/Marie-6/hello-world/commit/30b8a2a) (hello-world) and `4d9f679` (fun-games). | ✅ |
| 20 | "[assignment screenshot] check if it meets the requirements (don't modify)" | Check only. | Found: no `sketch.js`, README missing "game I started from" and "control I automated"; extra inputs; no win. | — |
| 21 | "fix the missing parts and no way to win but only lose, keep 3 and 4" | Fix only the missing files/README. **I kept** the extra inputs and endless mode. | The code moved unchanged into `sketch.js` ([`67df15b`](https://github.com/Marie-6/hello-world/commit/67df15b)). | ✅ |
| 22 | "cars are covering each other sometimes … make sure cars don't Overlap" | **Cause:** a new car only checked the *last added* car. The cars already on a new street are stored in the opposite order, so the first new car could land on one of them. | Check **every** car in the lane before adding one; otherwise wait 0.2 s ([`8a4995a`](https://github.com/Marie-6/hello-world/commit/8a4995a)). | ✅ (see Evidence) |
| 23 | "[screenshot] the cars still overlap?" | Checked the live files: the fix was there. The screenshot was the old cached page. | No code change. Hard refresh (`Cmd+Shift+R`). | ✅ |
| 24 | "the cars are running in parallel. can you change them to different speed?" | Cars inside one lane must share a speed, or they'd drive through each other. So **lanes** get different speeds. | Each lane on a street gets a shuffled pace: 70%, 87%, 103% or 120% of the street's speed (average ≈ 1, so not harder) ([`924c03f`](https://github.com/Marie-6/hello-world/commit/924c03f)). | ✅ |
| 25 | "[screenshot] the fountains are overlapping, fix that. make sure nothing is overlapping" | **Cause:** wide sidewalks placed decorations twice with no space check, so two fountains could land in the middle. | Every decoration has a size; it's placed only where it touches nothing **and** leaves a walkway for people. People walk around decorations, pizza and each other (step aside, wait, or turn around after 2 s). String lights hang overhead ([`2971c9e`](https://github.com/Marie-6/hello-world/commit/2971c9e)). | ✅ First test: people still touched in 0.01% of frames (sideways steps ignored people behind) → fixed → 0 in 6.7 M frames. |
| 26 | "when the pigeon is hit, maybe add a status of being hit. perseve the shinning and dizzy part." | AI made a big effect: tumble, X eyes, screen shake, red flash, "Hit! −1" label ([`8618de0`](https://github.com/Marie-6/hello-world/commit/8618de0)). | — | ❌ I didn't like it |
| 27 | "change it to the last version, i dont like this version of being hit" | Undo with a new commit, so history is kept ([`7a3eb8d`](https://github.com/Marie-6/hello-world/commit/7a3eb8d)). | `git revert` | ✅ |
| 28 | "still add a stop or just being hit when it's being hit, perserve the dizzy and shining" | The smaller version of #26. | When hit, the pigeon **stops for 0.6 s** (Space ignored), already blinking with dizzy stars, then walks on ([`e447ecc`](https://github.com/Marie-6/hello-world/commit/e447ecc)). | ✅ |
| 29 | "maybe can add a start, so people can hestitate when thinking about which mode to begin" | Clicking a mode started the game right away. | Mode buttons only **select**; a pulsing "Start Medium" button (or Space) begins ([`9122214`](https://github.com/Marie-6/hello-world/commit/9122214)). | ✅ |
| 30 | "[2 screenshots] why when hit by a bus and died … different from getting squashed by a car? make sure it's all like image#7" | There were 2 death poses: flat (taxi/car) and feet-up (everything else). | Removed the feet-up pose; every death is flattened ([`1c98e96`](https://github.com/Marie-6/hello-world/commit/1c98e96)). | ✅ |

### Errors and retries (summary)

| Problem | First try | Why it failed | What worked |
|---|---|---|---|
| Too many people (#15 → #17) | Spawn people less often | There was no limit, so they still piled up | Fixed number of people per sidewalk |
| Easy too hard (#9 → #10) | Slightly slower traffic | Not enough difference | Half speed, no buses, double gaps |
| Impossible streets (#18) | — | Gaps shrank with distance | Minimum gap based on time + safe islands |
| Cars overlapping (#22 → #23) | Fix pushed | Screenshot came from the cached old page | Hard refresh |
| People touching (#25) | Avoidance v1 | Sideways steps ignored people behind | Sideways steps check everyone |
| Hit effect (#26 → #28) | Big tumble + shake | I didn't like the style | Revert, then a simple 0.6 s stop |
| Tooling | `node` not installed | — | Used macOS's built-in JavaScriptCore (`jsc`) to syntax-check and run headless tests |

---

## 4. How I describe a prompt (what I learned)

- **Prompts that worked first time:** a symptom plus what I see, often with a **screenshot**. For example: "[screenshot] the fountains are overlapping", "after pressing tap, i dont know how long the pigeon's gonna stop".
- **Prompts that needed a second round:** vague amounts. "delete some" people only changed a number, and the real problem (no limit) came out when I said "**find the balance** of avoiding the cars and the people".
- **Say what to keep.** "perseve the shinning and dizzy part" and "keep 3 and 4, dont change that" stopped the AI from changing things I liked.
- **Say "just check, don't change"** when I only want a review (#20).
- **Ask for less if the result is too much.** #26 was too big. "just a stop" (#28) gave exactly what I wanted.
- **Ask "why"** ("why when hit by a bus … different?"). The AI then explains the cause before fixing it.

---

## 5. My contribution and credits

**My decisions:** the game idea (pigeons, NYC, crossing roads, stop/fly on one button), the funny head-bob, toggle instead of timer, Space wording, 3 lives in every mode, more neighborhoods including Washington Square Park with no repeats, limits on bonus lives, fewer people, a simpler start screen, no win (only lose), keeping the extra inputs, different lane speeds, rejecting the big hit effect, the Start button, and one death look. I found every bug by playing (traffic, overlaps, fountains, death pose).

**What the AI (Claude, Claude Code) did:** suggested ideas and the stamina bar, wrote all the code (canvas drawing, physics, sounds), found the causes of bugs, wrote the simulations/probe, and wrote the READMEs and this record from our conversation.

**References:** *Frogger* (Konami, 1981) and *Crossy Road* (Hipster Whale, 2014) for the road-crossing idea; *Flappy Bird* for the "endless, easy to retry" idea. No code, images or sounds were copied. Fonts: Google Fonts. Code: this folder; same game also in [fun-games](https://github.com/Marie-6/fun-games/tree/main/pigeons-in-new-york).

---

## 6. Next step

**Open question for a peer:** Is the game fair on a narrow sidewalk? People now walk around things and sometimes turn around when blocked. I tested that nothing overlaps (simulation, 6.7 M frames), but **not whether it feels natural or makes the pigeon's path too hard**. Does a person turning around feel like a surprise trap?

Also unchecked: the claude.ai artifact link is an old version (overlaps still there). The GitHub links are the current ones.

---

## 7. Class-contract proposal

**Observation:** the AI often said "I checked the code has no errors, but I haven't played it." Twice that mattered: the "fewer people" change didn't fix the problem, and a fix looked broken because I saw a cached page.

**Proposal:** *When AI makes a change, the process note must say **how it was checked** (played by a person / simulated / only syntax-checked) and **which version** was tested (commit or time).* This makes it clear what is actually proven and avoids confusion between old and new versions.
