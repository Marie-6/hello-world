# Week 6 — The Shadow Theater

A candle-lit paper screen. Step in front of your webcam and your body becomes a shadow puppet on the paper. Tiny hooded paper children wander the stage with lanterns. **Your shadow is solid to them**, so they climb onto it. Put your arm under one and lift it up; pull your arm away and it falls (and panics).

- **Moths** circle the candle and scatter when your shadow touches them.
- **The clock** hanging on the wall is a shadow prop showing the real time. Its pendulum swings once per second.
- **The candle** burns down over each hour and is new again at :00.
- **Every new minute the clock strikes:** the children hop and the moths scatter.

## How to use it

1. Open the page. When it says **"Step out of the light…"**, move out of the camera's view for ~4 seconds. The theater is memorizing the empty room.
2. Step back in. You're now a shadow.
3. Works best with the camera still and the room evenly lit.

| Key | Action |
|-----|--------|
| `B` | Re-learn the empty stage (if the shadow looks messy) |
| `D` | Peek at the pixels: shows the 80×60 grid of cells |
| `↑ / ↓` | Shadow sensitivity (threshold) |
| `M` | Mirror on/off |
| `SPACE` | Invite another child |
| `S` | Save a photo |

Run it via GitHub Pages (`https://marie-6.github.io/hello-world/week6/`) or `python3 -m http.server`. The webcam is blocked when opened as `file://`.

## How the shadow works (no AI, just pixels)

1. **Background memory.** The webcam is shrunk to 80×60. The sketch averages 30 frames of the empty room into `bg`.
2. **Difference.** Every frame, each pixel's color is compared with the memory:
   `diff = |r − bgR| + |g − bgG| + |b − bgB|`. If `diff > threshold`, that cell is "you".
3. **Smoothing.** Each `ShadowCell` fades in fast and out slowly, so the shadow trails a little, like smoke.
4. **Puppet edge.** The 80×60 grid is scaled up to 320×240 with blur, then thresholded. The blocky pixels become a smooth, crisp silhouette, and a blurred copy makes the soft penumbra.
5. **Collision.** That 320×240 map (`solid`) is what the children stand on: `isSolid(x, y)`.

## Concepts from this week

| Concept | Where |
|---|---|
| **Nested loops** | building the `cells` grid; reading the camera; writing the shadow image; drawing the pixel-peek view |
| **Pixel array formula** | `(row * COLS + x) * 4` in `updateCamera()`; also used to *write* pixels in `renderShadowLayers()` |
| **Classes** | `ShadowCell` (one webcam pixel), `Walker` (paper child with walking, gravity and climbing), `Moth` |
| **2D arrays of objects** | `cells[row][col]` |
| **Time + modulo** | clock hands from `hour() % 12`, `minute()`, `second()`; pendulum from `millis()`; candle height from minutes; the minute strike |
| **Trigonometry** | clock hands, pendulum, moth orbits |
| **Mirroring** | `x = COLS - 1 - col` |

Small extras: Perlin `noise()` makes the candle flicker, and the shadow wobbles with the flame. Webcam auto-exposure is compensated so the whole frame doesn't turn to shadow when you step in, and the theater re-learns the stage automatically if the camera gets bumped.

## Files

```
week6/
├── index.html
├── sketch.js
├── style.css
└── libraries/
    └── p5.min.js
```
