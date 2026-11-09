# Process record: Late Show Box Office

A tool that picks a movie or TV series for tonight. You set your mood, and it prints a cinema ticket.
Made with an AI assistant (Claude, in Claude Code) over one week (Nov 3–9, 2026), in 67 prompts, after a first try called *Tonight's Feature*.
[▶ Open the tool](https://marie-6.github.io/hello-world/week8-tool/) · [All prompts](PROMPTS.md) · [Full chat history](CHAT_HISTORY.md)

**How to read the pictures:** "Before" is the screenshot I sent to the AI when I saw a problem. "After" is the same part of the finished tool. My screenshots are in dark mode, so the "after" pictures are too. A few "step" pictures show ideas we tried and then changed.

<img src="images/after-whole-page.png" width="700">

## Version 0: "Tonight's Feature"

[▶ Open the first version](https://marie-6.github.io/hello-world/week8-tool/first-version/) (kept exactly as it was, bug included)

Before Late Show Box Office there was a first try called **Tonight's Feature**. It worked like a form in 4 steps: pick an **occasion** (lunch break, date night, friends…), set the **mood** (film or series, how much time, how heavy), do a **taste check** (answer 13 genre questions one by one), then see **your lineup**. It had 139 titles and no posters.

<table><tr><th>1 · Occasion</th><th>2 · Mood</th></tr><tr>
<td><img src="images/v0-occasion.png" width="380"></td>
<td><img src="images/v0-setup.png" width="380"></td></tr>
<tr><th>3 · Taste check (13 questions)</th><th>4 · Your lineup: empty</th></tr><tr>
<td><img src="images/v0-taste.png" width="380"></td>
<td><img src="images/v0-results.png" width="380"></td></tr></table>

**What was wrong with it:**

- **Too many steps.** You had to answer up to 13 genre questions before seeing anything.
- **The last step was broken.** The code used two names it never defined, so the page crashed before it could print the ticket. "Your lineup" stayed empty.
- **No posters, no lists.** Only a Watchlist drawer, and nothing to remember what I'd seen.

**What I kept from it:** the cinema idea (a marquee, a ticket with ADMIT and a stub), a "how heavy" slider, film vs. series, and "who's watching" (from the occasions).

**What changed in Late Show Box Office:** everything on one screen. Move a slider and the ticket changes right away, with no questions first.

<table><tr><th>Version 0</th><th>Final</th></tr><tr>
<td><img src="images/v0-taste.png" width="380"></td>
<td><img src="images/after-top.png" width="380"></td></tr></table>

## What did I want to make?

The question "what should I watch tonight?" usually ends with scrolling for 30 minutes. I wanted **one answer, not a list of 100**:

- **A mood, not a genre.** You choose how heavy, how strange and how fast you want it, with three sliders like a mixing desk.
- **A ticket, not a grid.** The answer is printed as one cinema ticket with a poster, a one-line description and a match %.
- **It remembers.** "My list" for things to watch later, "I've seen" so it never suggests something twice, and a profile for each person.

## Which choices did I make?

### 1. Lists should be simple

The first "I've seen" was a big grid of every title with a search box and filters. It was too much. I asked for a simple list like "My list", and for every title to have a poster.

<table><tr><th>Before</th><th>After</th></tr><tr>
<td><img src="images/before-seen-grid.jpg" width="380"></td>
<td><img src="images/after-ive-seen.png" width="380"></td></tr></table>

Later I asked for the **newest first**, 6 titles per page with **« First / Last »** buttons, a **Watched** button to move a title from My list to I've seen, and a filter for Movies / TV series.

<table><tr><th>Before: oldest at the top</th><th>After: newest is 01</th></tr><tr>
<td><img src="images/before-seen-order.png" width="380"></td>
<td><img src="images/after-my-list.png" width="380"></td></tr></table>

### 2. The ticket should never move

When a title was long, the ticket grew taller and the buttons under it jumped down. I asked to keep them in the same place. The first fix broke the titles ("GROUNDHO / G DAY") and cut some off, so we fixed it again: now **long titles shrink to fit** a fixed-height ticket, and words never break.

<table><tr><th>Before: buttons drift</th><th>Before: title broken</th></tr><tr>
<td><img src="images/before-buttons-drift.png" width="380"></td>
<td><img src="images/before-title-broken.png" width="380"></td></tr>
<tr><th>After: same height, buttons stay</th><th>After: the title fits</th></tr><tr>
<td><img src="images/after-buttons-stay.png" width="380"></td>
<td><img src="images/after-title-fits.png" width="380"></td></tr></table>

### 3. Clicking a title opens its ticket

In "My list" a title was only a line of text. I asked for the ticket to pop up again when I click it, with animation (it rises in with a small bounce and "prints" from top to bottom). Later the pop-up also got **See related** and **Shuffle pick**, which picks a random title from my list when I can't decide.

<table><tr><th>Before</th><th>After</th></tr><tr>
<td><img src="images/before-list-rows.png" width="380"></td>
<td><img src="images/after-shuffle.png" width="380"></td></tr></table>

### 4. A short header

The header had three lines of small grey text explaining the tool. The AI suggested one short tagline instead: "One ticket, one perfect pick for tonight."

<table><tr><th>Before</th><th>Step</th></tr><tr>
<td><img src="images/before-header-description.png" width="380"></td>
<td><img src="images/step-header-tagline.png" width="380"></td></tr></table>

### 5. Filling the gap in the mood desk: era → reputation → countries

The left panel was shorter than the ticket, so there was an empty gap. We tried three ideas:

1. **Which era?** (classics / modern / recent). But I don't choose films by year.
2. **Reputation sliders** (mixed reviews ↔ acclaimed, hidden gem ↔ blockbuster, from real IMDb data). They didn't feel right either.
3. **Where from?** USA, UK & Ireland, Europe, Asia, Elsewhere. ✅ This is how I really choose.

<table><tr><th>Before: the gap</th><th>Step: era row</th></tr><tr>
<td><img src="images/before-desk-gap.jpg" width="380"></td>
<td><img src="images/step-era-row.png" width="380"></td></tr>
<tr><th>Step: reputation sliders</th><th>After: Where from?</th></tr><tr>
<td><img src="images/before-reputation-sliders.png" width="380"></td>
<td><img src="images/after-mood-desk.png" width="300"></td></tr></table>

### 6. Bottoms line up, and nothing drifts

I kept noticing parts that changed height: the two columns ended at different lines, choosing TV added a gap, and the "Also playing" cards were taller when a title took two lines. The rule we ended with: **every card has a fixed height**, and both columns always end on the same line.

<table><tr><th>Before: TV leaves a gap</th><th>After</th></tr><tr>
<td><img src="images/before-tv-gap.jpg" width="380"></td>
<td><img src="images/after-tv.png" width="380"></td></tr>
<tr><th>Before: cards of different heights</th><th>After: every card is 112px</th></tr><tr>
<td><img src="images/before-also-playing-1.png" width="380"><br><img src="images/before-also-playing-2.png" width="380"></td>
<td><img src="images/after-also-playing.png" width="380"></td></tr></table>

### 7. See related

"See related" first opened under the ticket and pushed the page down. It became a pop-up with **4 pages of 6** titles that feel similar (by the mood scores), and a second tab, **More by [director]**. The cards first changed height from page to page, so they got a fixed size too: the title always takes 2 lines.

<table><tr><th>Before: only 6</th><th>Before: card heights drift</th></tr><tr>
<td><img src="images/before-related-6.jpg" width="380"></td>
<td><img src="images/before-related-drift-1.jpg" width="380"></td></tr>
<tr><th colspan="2">After</th></tr><tr>
<td colspan="2"><img src="images/after-related.png" width="600"></td></tr></table>

### 8. On your list ✓ / Remove

If a title is already on my list, the button now says "On your list ✓", and turns into "Remove from list" when you hover.

<table><tr><th>Before</th><th>After</th></tr><tr>
<td><img src="images/before-on-your-list.png" width="380"></td>
<td><img src="images/after-on-your-list.png" width="380"></td></tr></table>

### 9. Search

With more than 1,600 titles, I asked if I should add search, and the AI said yes. It finds titles and directors, and ignores accents and "The": "amelie" finds *Amélie*, and "nolan" finds his films. Press **/** to jump into it.

<img src="images/after-search.png" width="600">

### 10. The account button took 7 tries

This was the hardest design choice. "Watching as" started as a wide bar of name chips. I wanted it to look like a login on the right.

1. A big account button next to the search bar → a huge gap between them.
2. Moved to the top right next to the title → too tight at the top.
3. A thin top strip with "Tonight's program" → I deleted it.
4. "(M) WATCHING AS Me ⌄" on the gold sign line → not lined up, then **just keep the "M" circle**.
5. Hiding the text went wrong: the letters squeezed into the circle. Fixed.

<table><tr><th>Before: the bar</th><th>Step: next to search</th></tr><tr>
<td><img src="images/before-watching-bar-1.png" width="380"></td>
<td><img src="images/before-watching-bar-2.png" width="380"></td></tr>
<tr><th>Step: top right</th><th>Step: top strip</th></tr><tr>
<td><img src="images/step-account-top-right.png" width="380"></td>
<td><img src="images/step-top-strip.png" width="380"></td></tr>
<tr><th>Step: on the sign line</th><th>Before: letters squeezed</th></tr><tr>
<td><img src="images/before-watching-as-me.png" width="380"></td>
<td><img src="images/before-letters.png" width="380"></td></tr>
<tr><th colspan="2">After: only the M circle, with the menu</th></tr><tr>
<td colspan="2"><img src="images/after-acct.png" width="600"></td></tr></table>

### 11. The gold line became shortcuts

The gold line said "NOW SHOWING · 2,667 FILMS & SERIES · DOORS OPEN LATE". I turned it into jump links to **My list** and **I've seen**. Then: delete the rest, no underline, bigger, then smaller, no numbers, and on the same line as the M circle.

<table><tr><th>Before</th><th>Step</th></tr><tr>
<td><img src="images/before-now-showing.png" width="380"></td>
<td><img src="images/before-bigger.png" width="380"></td></tr>
<tr><th colspan="2">After</th></tr><tr>
<td colspan="2"><img src="images/after-header.png" width="600"></td></tr></table>

### 12. Alignment pass

I asked the AI to check the whole page: every element should share the same left edge, sit on the same baseline, and same elements should have the same spacing. It measured every edge in a test browser and found:

- The big title sat 3px to the right, because large letters have a little built-in space on the left.
- In the list rows, the number, title and buttons were up to 2px off the same line.
- "12 OF 2,667" floated in the middle of the heading.
- Pager buttons had 6px gaps, other buttons 10px.
- The questions in the mood desk had no space above their options (I found this one).

<table><tr><th>Before: left edges</th><th>Before: question too close</th></tr><tr>
<td><img src="images/before-left-edge.png" width="380"></td>
<td><img src="images/before-question-close.png" width="200"></td></tr>
<tr><th>After</th><th>After</th></tr><tr>
<td><img src="images/after-header.png" width="380"></td>
<td><img src="images/after-mood-desk.png" width="200"></td></tr></table>

### 13. Only I can be "Marie"

Profiles let my mom and friends keep their own lists. In the last step I made **"Marie" an owner profile**: on claude.ai, only I (the owner of the page) can use it. Everyone else starts as a Guest and is asked to add their own name, and the name "Marie" is refused for them. Here on GitHub nobody can sign in, so everyone starts as a Guest.

<table><tr><th>Me (owner)</th><th>Someone else</th></tr><tr>
<td><img src="images/after-acct.png" width="380"></td>
<td><img src="images/after-visitor.png" width="380"></td></tr></table>

## How did the catalogue grow?

| Prompt | Titles |
|---|---|
| First version | 67 |
| + TV series | 88 |
| "add more" ×3 | 140 → 198 → 253 |
| "add 200 more movies and 200 more TV" | 664 |
| "add 500 more" | 1,164 |
| "add 500 more" (+ Nolan and Tarantino) | 1,667 |
| "add 500 more tv and mv each" | **2,667** |

Every title has a poster, a year, a country, an IMDb ★ rating, three mood scores (heavy, strange, pace) and a one-line description. Films have their directors.

## What did I keep on purpose?

- **One ticket.** It never shows a list of results on the front page, only one pick and two "Also playing".
- **Mood sliders.** They were the first idea and still the main control.
- **The cinema look:** marquee lights, gold sign line, a ticket with a stub and "ADMIT ONE".

## What did I leave out?

- **A real login.** Lists are saved in each person's own browser, not on a server. The AI explained that saving lists to accounts would only work for people in my organization.
- **Era and reputation filters.** I tried both and replaced them with countries.
- **Genres.** The mood sliders do that job.

## What did I learn?

- **Say what's wrong with a screenshot.** Almost every fix started with a picture and one sentence.
- **Fixed sizes stop drifting.** Cards, tickets and rows that keep the same height make the page feel calm.
- **Ask the AI to check its own work.** Some fixes broke something else (the title split, the squeezed letters). Asking it to measure in a browser and screenshot after each change caught these.
- **Try, then delete.** The account button and the filter row both took several tries. Seeing each one was the only way to know.
