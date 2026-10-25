// =====================================================
//  THE SHADOW THEATER  ·  Week 6 — Custom Pixels & Classes
//
//  A candle-lit paper screen. Step in front of the webcam and
//  your body becomes a shadow puppet. Tiny paper children walk
//  the stage — and they can climb onto your shadow.
//  Raise your arm under them and lift them up.
//
//  How the shadow works (no AI, just pixels):
//   1. The theater memorizes the EMPTY stage (background).
//   2. Every frame, each webcam pixel is compared to that memory.
//   3. Pixels that changed a lot = you. Those cells turn to shadow.
//
//  Keys:  B  re-learn the empty stage      D  peek at the pixels
//         ↑/↓ shadow sensitivity           M  mirror on/off
//         SPACE  invite another child      S  save a photo
// =====================================================

// ---------- camera grid ----------
const COLS = 80;              // webcam is shrunk to 80 x 60:
const ROWS = 60;              // one video pixel = one ShadowCell
const MID_W = 320;            // shadow is smoothed at 320 x 240
const MID_H = 240;

let capture;
let camReady = false;
let camFailed = false;
let cells = [];               // 2D array of ShadowCell objects
let bg = null;                // memorized empty stage (r,g,b per cell)
let bgAccum, bgCount = 0;
let bgMean = 1;              // overall brightness of the empty stage
let overfullFrames = 0;

let threshold = 75;           // how different a pixel must be to count as "you"
let mirror = true;
let debug = false;

// ---------- phases ----------
// 'intro'     : "step out of the light" countdown
// 'learning'  : averaging frames of the empty stage
// 'show'      : the performance
let phase = 'intro';
let phaseStart = 0;

// ---------- drawing layers ----------
let shadowG, midG, penG;      // tiny -> smoothed -> blurred shadow
let solid;                    // 320x240 map: 1 where the shadow is (for walkers)
let paperG, curtainG;         // pre-rendered scenery
let layoutTimer;

// ---------- scene ----------
let S = 1;                    // scale factor based on window height
let floorY, curtainW, valanceH;
let stage = {};               // where the webcam image lands on screen
let light = {};               // the oil lamp BEHIND the paper
let candle = {};              // the candle in FRONT (it is the hour clock)
let flick = 1, sway = 0;
let walkers = [];
let moths = [];
let lastMinute = -1;

// shadow ink color
const SR = 26, SG = 15, SB = 13;

// =====================================================
//  CLASS: ShadowCell — one webcam pixel
// =====================================================
class ShadowCell {
  constructor(col, row) {
    this.col = col;
    this.row = row;
    this.diff = 0;   // how different from the empty stage
    this.raw = 0;    // 1 = you are here, 0 = empty
    this.occ = 0;    // smoothed 0–1 (shadows fade out slowly, like smoke)
  }

  update(diff) {
    this.diff = diff;
    this.raw = diff > threshold ? 1 : 0;
    // fast to appear, slow to disappear
    let speed = this.raw > this.occ ? 0.65 : 0.22;
    this.occ = lerp(this.occ, this.raw, speed);
  }

  // used by the "peek at the pixels" view
  displayDebug(x0, y0, size) {
    noStroke();
    if (this.occ > 0.05) fill(255, 120 + this.occ * 100, 40, 60 + this.occ * 195);
    else fill(255, 255, 255, constrain(this.diff * 0.6, 0, 60));
    rect(x0 + this.col * size, y0 + this.row * size, size - 0.5, size - 0.5);
  }
}

// =====================================================
//  CLASS: Walker — a tiny hooded paper child
// =====================================================
class Walker {
  constructor(x) {
    this.x = x;
    this.y = floorY;
    this.vy = 0;
    this.dir = random() < 0.5 ? -1 : 1;
    this.speed = random(0.45, 1.0);
    this.size = random(26, 36) * S;
    this.step = random(TWO_PI);
    this.pause = 0;
    this.lifted = 0;      // frames since being pushed up by a shadow
    this.scared = 0;      // frames of panic after a fall
    this.hopCooldown = 0;
  }

  get onShadow() { return this.y < floorY - 3; }

  update() {
    // --- walk ---
    if (this.pause > 0) this.pause--;
    else this.x += this.dir * this.speed * S * (this.scared > 0 ? 2.2 : 1);

    if (random() < 0.003) this.dir *= -1;
    if (random() < 0.002 && this.scared === 0) this.pause = floor(random(40, 140));

    let left = curtainW + 25 * S, right = width - curtainW - 25 * S;
    if (this.x < left) { this.x = left; this.dir = 1; }
    if (this.x > right) { this.x = right; this.dir = -1; }

    // --- gravity ---
    this.vy += 0.42 * S;
    this.y += this.vy;
    if (this.y >= floorY) {
      if (this.vy > 9 * S) this.scared = 70;     // hard landing!
      this.y = floorY;
      this.vy = 0;
    }

    // --- the shadow is solid: get pushed up out of it ---
    let pushed = 0;
    let maxClimb = 26 * S;
    while (isSolid(this.x, this.y - 1) && pushed < maxClimb) {
      this.y -= 1;
      pushed++;
    }
    if (pushed > 0) {
      if (this.vy > 9 * S) this.scared = 70;
      this.vy = 0;
      if (pushed > 3) this.lifted = 30;
    }
    if (this.y < valanceH + 40 * S) this.y = valanceH + 40 * S;

    if (this.lifted > 0) this.lifted--;
    if (this.scared > 0) this.scared--;
    if (this.hopCooldown > 0) this.hopCooldown--;

    // legs move when walking
    let moving = this.pause === 0 && this.vy === 0;
    if (moving) this.step += this.speed * 0.28 * (this.scared > 0 ? 2 : 1);
  }

  hop() {
    if (this.vy === 0 && this.hopCooldown === 0) {
      this.vy = -random(5, 8) * S;
      this.hopCooldown = 30;
    }
  }

  // world position of the lantern (for the glow pass)
  get lantern() {
    return { x: this.x + this.dir * this.size * 0.32, y: this.y - this.size * 0.28 };
  }

  display() {
    let s = this.size;
    let armsUp = this.lifted > 0 || this.scared > 0 || this.vy < -1;
    push();
    translate(this.x, this.y);
    scale(this.dir, 1);
    fill(SR, SG, SB);
    stroke(SR, SG, SB);
    strokeCap(ROUND);

    // legs
    let swing = this.vy === 0 && this.pause === 0 ? sin(this.step) : 0;
    strokeWeight(s * 0.075);
    line(-s * 0.05, -s * 0.3, -s * 0.05 + swing * s * 0.14, -s * 0.02);
    line(s * 0.05, -s * 0.3, s * 0.05 - swing * s * 0.14, -s * 0.02);

    // cloak
    noStroke();
    beginShape();
    vertex(-s * 0.13, -s * 0.74);
    vertex(s * 0.13, -s * 0.74);
    vertex(s * 0.24, -s * 0.26);
    vertex(s * 0.08, -s * 0.3);
    vertex(0, -s * 0.24);
    vertex(-s * 0.1, -s * 0.3);
    vertex(-s * 0.24, -s * 0.26);
    endShape(CLOSE);

    // head + pointed hood that flops back
    ellipse(0, -s * 0.83, s * 0.4, s * 0.38);
    let flop = sin(this.step * 0.5) * s * 0.03;
    triangle(-s * 0.2, -s * 0.86, s * 0.12, -s * 0.98, -s * 0.34 + flop, -s * 1.12);

    // arms
    stroke(SR, SG, SB);
    strokeWeight(s * 0.06);
    if (armsUp) {
      line(-s * 0.08, -s * 0.62, -s * 0.22, -s * 0.95);
      line(s * 0.08, -s * 0.62, s * 0.24, -s * 0.95);
    } else {
      line(s * 0.06, -s * 0.6, s * 0.3, -s * 0.42);   // holding the lantern
      strokeWeight(s * 0.02);
      line(s * 0.32, -s * 0.42, s * 0.32, -s * 0.34);
      noStroke();
      rect(s * 0.26, -s * 0.34, s * 0.12, s * 0.13, s * 0.02);
    }
    pop();
  }

  // drawn AFTER the darkness, so the eyes glow
  displayEyes() {
    let s = this.size;
    let blink = (frameCount + floor(this.step * 10)) % 220 < 6;
    if (blink) return;
    noStroke();
    fill(250, 238, 205, 235);
    let ex = this.x + this.dir * s * 0.07;
    let ey = this.y - s * 0.84;
    let big = this.scared > 0 ? 1.6 : 1;
    ellipse(ex - this.dir * s * 0.02, ey, s * 0.06 * big, s * 0.08 * big);
    ellipse(ex + this.dir * s * 0.1, ey, s * 0.06 * big, s * 0.08 * big);
    if (this.scared > 0 && this.onShadow === false) {
      fill(250, 238, 205, 200);
      textAlign(CENTER, BOTTOM);
      textSize(s * 0.5);
      text('!', this.x, this.y - s * 1.15);
    }
  }
}

// =====================================================
//  CLASS: Moth — circles the candle, flees from your shadow
// =====================================================
class Moth {
  constructor() {
    this.a = random(TWO_PI);
    this.r = random(40, 110) * S;
    this.spin = random(0.02, 0.05) * (random() < 0.5 ? -1 : 1);
    this.off = random(1000);
    this.x = candle.x; this.y = candle.flameY;
    this.flee = 0;
    this.size = random(9, 14) * S;
  }

  update() {
    this.a += this.spin * (this.flee > 0 ? 2.5 : 1);
    let wobble = (noise(this.off + frameCount * 0.01) - 0.5) * 80 * S;
    let rr = this.r + wobble + this.flee * 6 * S;
    let tx = candle.x + sway * 3 + cos(this.a) * rr;
    let ty = candle.flameY + sin(this.a) * rr * 0.7 - 10 * S;
    this.x = lerp(this.x, tx, 0.08);
    this.y = lerp(this.y, ty, 0.08);

    if (isSolid(this.x, this.y)) this.flee = 40;   // touched by a shadow!
    if (this.flee > 0) this.flee--;
  }

  display() {
    let flap = abs(sin(frameCount * 0.55 + this.off));
    // its big soft shadow on the paper (thrown away from the flame)
    let sx = candle.x + (this.x - candle.x) * 2.4;
    let sy = candle.flameY + (this.y - candle.flameY) * 2.4;
    this.drawShape(sx, sy, this.size * 3, flap, 38);
    // the moth itself
    this.drawShape(this.x, this.y, this.size, flap, 230);
  }

  drawShape(x, y, s, flap, alpha) {
    push();
    translate(x, y);
    noStroke();
    fill(SR + 10, SG + 6, SB + 4, alpha);
    let w = s * (0.25 + flap * 0.85);
    triangle(0, 0, -w, -s * 0.7, -w * 0.8, s * 0.5);
    triangle(0, 0, w, -s * 0.7, w * 0.8, s * 0.5);
    ellipse(0, 0, s * 0.25, s * 0.8);
    pop();
  }
}

// =====================================================
//  setup + draw
// =====================================================
function setup() {
  createCanvas(windowWidth, windowHeight);
  pixelDensity(1);
  textFont('IM Fell English');

  capture = createCapture(VIDEO, () => { camReady = true; phaseStart = millis(); });
  capture.size(COLS, ROWS);
  capture.hide();
  if (capture.elt) capture.elt.addEventListener('error', () => { camFailed = true; });

  // nested loops -> 2D array of ShadowCell objects
  for (let row = 0; row < ROWS; row++) {
    cells[row] = [];
    for (let col = 0; col < COLS; col++) {
      cells[row][col] = new ShadowCell(col, row);
    }
  }

  shadowG = createGraphics(COLS, ROWS); shadowG.pixelDensity(1);
  midG = createGraphics(MID_W, MID_H); midG.pixelDensity(1);
  penG = createGraphics(MID_W, MID_H); penG.pixelDensity(1);
  solid = new Uint8Array(MID_W * MID_H);

  layout();

  for (let i = 0; i < 7; i++) walkers.push(new Walker(random(curtainW + 60 * S, width - curtainW - 60 * S)));
  for (let i = 0; i < 5; i++) moths.push(new Moth());

  phaseStart = millis();
}

function draw() {
  // candle-light flicker (Perlin noise = natural, not random jitter)
  let t = millis() / 1000;
  flick = 0.88 + 0.12 * noise(t * 2.2);
  sway = (noise(t * 1.3 + 50) - 0.5) * 6 * S;

  updateCamera();
  updatePhases();
  if (phase === 'show') renderShadowLayers();

  // ---- time ----
  if (minute() !== lastMinute) {
    if (lastMinute !== -1) clockStrikes();
    lastMinute = minute();
  }

  // ---- scenery ----
  image(paperG, 0, 0);

  // everything behind the paper wobbles with the lamp flame
  push();
  let wob = 1 + (flick - 0.94) * 0.025;
  translate(light.x + sway, light.y);
  scale(wob);
  translate(-light.x - sway, -light.y);
  drawClockShadow();
  if (phase === 'show') drawPlayerShadow();
  pop();

  for (let w of walkers) { w.update(); w.display(); }
  for (let m of moths) { m.update(); m.display(); }

  drawDarkness();
  drawCandle();
  drawGlows();
  for (let w of walkers) w.displayEyes();

  image(curtainG, 0, 0);
  drawTexts();
  if (debug) drawDebug();
}

// =====================================================
//  CAMERA -> cells
// =====================================================
function updateCamera() {
  if (!camReady || capture.width === 0) return;
  capture.loadPixels();
  let px = capture.pixels;
  if (!px || px.length < COLS * ROWS * 4) return;

  // learning the empty stage: average many frames
  if (phase === 'learning') {
    for (let i = 0; i < COLS * ROWS; i++) {
      bgAccum[i * 3] += px[i * 4];
      bgAccum[i * 3 + 1] += px[i * 4 + 1];
      bgAccum[i * 3 + 2] += px[i * 4 + 2];
    }
    bgCount++;
    return;
  }
  if (phase !== 'show' || !bg) return;

  // webcams auto-adjust brightness when you step in, which would make the
  // whole frame look "different". Compare overall brightness and correct for it.
  let sumNow = 0;
  for (let i = 0; i < COLS * ROWS; i++) sumNow += px[i * 4] + px[i * 4 + 1] + px[i * 4 + 2];
  let gain = constrain(bgMean / max(1, sumNow), 0.75, 1.35);

  let filled = 0;
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      let x = mirror ? COLS - 1 - col : col;
      let i = row * COLS + x;
      let o = i * 4;                     // the pixel formula: (y * width + x) * 4
      let r = px[o] * gain, g = px[o + 1] * gain, b = px[o + 2] * gain;
      let diff = abs(r - bg[i * 3]) + abs(g - bg[i * 3 + 1]) + abs(b - bg[i * 3 + 2]);
      let cell = cells[row][col];
      cell.update(diff);
      filled += cell.raw;
      // empty cells slowly re-learn, so the room's light can drift
      if (cell.raw === 0) {
        bg[i * 3] += (r - bg[i * 3]) * 0.01;
        bg[i * 3 + 1] += (g - bg[i * 3 + 1]) * 0.01;
        bg[i * 3 + 2] += (b - bg[i * 3 + 2]) * 0.01;
      }
    }
  }

  // almost everything is "you"? the camera probably moved -> learn again
  if (filled > COLS * ROWS * 0.85) overfullFrames++;
  else overfullFrames = 0;
  if (overfullFrames > 90) relearnStage();
}

function updatePhases() {
  let el = (millis() - phaseStart) / 1000;
  if (phase === 'intro' && camReady && el > 4) {
    phase = 'learning';
    bgAccum = new Float32Array(COLS * ROWS * 3);
    bgCount = 0;
    phaseStart = millis();
  }
  if (phase === 'learning' && bgCount >= 30) {
    bg = new Float32Array(COLS * ROWS * 3);
    bgMean = 0;
    for (let i = 0; i < bg.length; i++) { bg[i] = bgAccum[i] / bgCount; bgMean += bg[i]; }
    phase = 'show';
    phaseStart = millis();
  }
}

function relearnStage() {
  if (!camReady) return;
  phase = 'intro';
  phaseStart = millis();
  overfullFrames = 0;
  for (let row of cells) for (let c of row) { c.occ = 0; c.raw = 0; }
  solid.fill(0);
}

// tiny 80x60 grid -> smooth, crisp-edged shadow at 320x240
function renderShadowLayers() {
  // 1. write each cell into a tiny image (alpha = occupancy)
  shadowG.loadPixels();
  let sp = shadowG.pixels;
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      let i = (row * COLS + col) * 4;
      sp[i] = 0; sp[i + 1] = 0; sp[i + 2] = 0;
      sp[i + 3] = cells[row][col].occ * 255;
    }
  }
  shadowG.updatePixels();

  // 2. scale up with blur -> soft blob
  midG.clear();
  let ctx = midG.drawingContext;
  ctx.imageSmoothingEnabled = true;
  ctx.filter = 'blur(3px)';
  ctx.drawImage(shadowG.elt, 0, 0, MID_W, MID_H);
  ctx.filter = 'none';

  // 3. threshold the blob -> crisp, rounded puppet edge
  midG.loadPixels();
  let mp = midG.pixels;
  for (let i = 0; i < MID_W * MID_H; i++) {
    let a = mp[i * 4 + 3];
    let k = constrain((a - 95) / 55, 0, 1);
    k = k * k * (3 - 2 * k);                  // smoothstep
    solid[i] = k > 0.5 ? 1 : 0;
    mp[i * 4] = SR; mp[i * 4 + 1] = SG; mp[i * 4 + 2] = SB;
    mp[i * 4 + 3] = k * 255;
  }
  midG.updatePixels();

  // 4. a blurry copy for the soft penumbra around the shadow
  penG.clear();
  penG.drawingContext.filter = 'blur(7px)';
  penG.drawingContext.drawImage(midG.elt, 0, 0);
  penG.drawingContext.filter = 'none';
}

function drawPlayerShadow() {
  let ctx = drawingContext;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.globalAlpha = 0.5;
  let g = 0.02;
  ctx.drawImage(penG.elt, stage.x - stage.w * g, stage.y - stage.h * g, stage.w * (1 + g * 2), stage.h * (1 + g * 2));
  ctx.globalAlpha = 0.93;
  ctx.drawImage(midG.elt, stage.x, stage.y, stage.w, stage.h);
  ctx.globalAlpha = 1;
}

// is screen point (x, y) inside the player's shadow?
function isSolid(x, y) {
  if (phase !== 'show') return false;
  let mx = floor((x - stage.x) / stage.w * MID_W);
  let my = floor((y - stage.y) / stage.h * MID_H);
  if (mx < 0 || mx >= MID_W || my < 0 || my >= MID_H) return false;
  return solid[my * MID_W + mx] === 1;
}

// =====================================================
//  TIME: the shadow clock + the hour candle
// =====================================================
function drawClockShadow() {
  let cx = width - curtainW - 120 * S;
  let cy = valanceH + 115 * S;
  let r = 55 * S;
  let ink = color(SR, SG, SB, 225);

  stroke(ink);
  strokeCap(ROUND);
  noFill();

  // hanging string
  strokeWeight(2 * S);
  line(cx, 0, cx, cy - r * 1.25);

  // pendulum: one swing per second
  let swing = sin((millis() / 1000) * PI) * 0.32;
  let px = cx + sin(swing) * r * 1.9;
  let py = cy + cos(swing) * r * 1.9;
  strokeWeight(3 * S);
  line(cx, cy, px, py);
  noStroke();
  fill(ink);
  ellipse(px, py, r * 0.42);

  // clock body with a little pointed roof
  fill(ink);
  triangle(cx - r * 1.05, cy - r * 0.75, cx + r * 1.05, cy - r * 0.75, cx, cy - r * 1.35);
  ellipse(cx, cy, r * 2.2);

  // face: cut-out ring of light
  let face = color(214, 186, 140);
  fill(face);
  ellipse(cx, cy, r * 1.7);

  // hour marks
  stroke(ink);
  for (let i = 0; i < 12; i++) {
    let a = i * TWO_PI / 12;
    strokeWeight(i % 3 === 0 ? 4 * S : 2 * S);
    let r1 = i % 3 === 0 ? r * 0.6 : r * 0.68;
    line(cx + cos(a) * r1, cy + sin(a) * r1, cx + cos(a) * r * 0.78, cy + sin(a) * r * 0.78);
  }

  // hands (real time)
  let sec = second();
  let mn = minute() + sec / 60;
  let hr = (hour() % 12) + mn / 60;
  hand(cx, cy, hr / 12, r * 0.42, 5 * S);
  hand(cx, cy, mn / 60, r * 0.66, 3.5 * S);
  hand(cx, cy, sec / 60, r * 0.74, 1.5 * S);
  noStroke();
  fill(ink);
  ellipse(cx, cy, 8 * S);
}

function hand(cx, cy, frac, len, w) {
  let a = frac * TWO_PI - HALF_PI;
  strokeWeight(w);
  line(cx, cy, cx + cos(a) * len, cy + sin(a) * len);
}

// every new minute the clock strikes: children hop, moths scatter
function clockStrikes() {
  for (let w of walkers) w.hop();
  for (let m of moths) m.flee = 50;
}

// the candle burns down over the hour and is "replaced" at :00
function drawCandle() {
  let progress = (minute() + second() / 60) / 60;
  let maxH = 150 * S, minH = 22 * S;
  let h = lerp(maxH, minH, progress);
  let w = 26 * S;
  let x = candle.x;
  let base = floorY;
  candle.flameY = base - h - 22 * S * flick;

  noStroke();
  // dish
  fill(40, 26, 18);
  ellipse(x, base - 3 * S, w * 3.2, 12 * S);
  // wax
  fill(222, 205, 170);
  rect(x - w / 2, base - h, w, h, 3 * S);
  fill(190, 170, 135);
  rect(x + w * 0.15, base - h, w * 0.35, h, 3 * S);
  // drips
  fill(230, 214, 180);
  ellipse(x - w * 0.42, base - h + 14 * S, 7 * S, 22 * S);
  ellipse(x + w * 0.1, base - h + 9 * S, 6 * S, 14 * S);
  // wick
  stroke(30);
  strokeWeight(2 * S);
  line(x, base - h, x + sway * 0.3, base - h - 7 * S);
  noStroke();

  // flame
  let fx = x + sway;
  let fy = base - h - 8 * S;
  let fh = 34 * S * flick;
  flame(fx, fy, fh * 1.25, fh * 0.42, color(255, 140, 40, 120));
  flame(fx, fy, fh, fh * 0.32, color(255, 200, 90, 230));
  flame(fx, fy, fh * 0.55, fh * 0.18, color(255, 250, 220, 255));
}

function flame(x, y, h, w, c) {
  fill(c);
  beginShape();
  vertex(x, y);
  bezierVertex(x - w, y - h * 0.15, x - w * 0.6, y - h * 0.65, x + sway * 0.4, y - h);
  bezierVertex(x + w * 0.6, y - h * 0.65, x + w, y - h * 0.15, x, y);
  endShape(CLOSE);
}

// =====================================================
//  LIGHT
// =====================================================
function drawDarkness() {
  let ctx = drawingContext;
  let lx = light.x + sway * 4, ly = light.y;
  let R = max(width, height) * 0.78 * flick;
  let g = ctx.createRadialGradient(lx, ly, 0, lx, ly, R);
  g.addColorStop(0.0, 'rgba(0,0,0,0)');
  g.addColorStop(0.32, 'rgba(18,8,6,0.12)');
  g.addColorStop(0.68, 'rgba(14,6,6,0.62)');
  g.addColorStop(1.0, 'rgba(6,3,3,0.94)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, width, height);
}

function drawGlows() {
  let ctx = drawingContext;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';

  // lamp behind the paper
  radialGlow(light.x + sway * 4, light.y, width * 0.38 * flick, 'rgba(255,150,60,' + (0.16 * flick) + ')');
  // candle
  radialGlow(candle.x + sway, candle.flameY, 170 * S * flick, 'rgba(255,170,80,' + (0.32 * flick) + ')');
  // lanterns
  for (let w of walkers) {
    if (w.lifted > 0 || w.scared > 0) continue;   // lantern swinging wildly = dimmer
    let p = w.lantern;
    radialGlow(p.x, p.y, 26 * S, 'rgba(255,190,100,0.55)');
  }
  ctx.restore();
}

function radialGlow(x, y, r, inner) {
  let ctx = drawingContext;
  let g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, inner);
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
}

// =====================================================
//  TEXT + DEBUG
// =====================================================
function drawTexts() {
  // title on the valance
  textAlign(CENTER, CENTER);
  noStroke();
  fill(214, 170, 90);
  textSize(22 * S);
  text('T H E   S H A D O W   T H E A T E R', width / 2, valanceH * 0.42);

  // footer on the stage floor
  textSize(14 * S);
  fill(200, 160, 110, 150);
  text('raise an arm and let them climb   ·   B  reset the stage   ·   D  peek at the pixels   ·   S  save',
       width / 2, floorY + (height - floorY) * 0.55);

  // center messages
  let el = (millis() - phaseStart) / 1000;
  let msg = '', sub = '';
  if (camFailed || (!camReady && millis() > 8000)) {
    msg = 'The theater needs your camera';
    sub = 'allow camera access, then reload  (open via http://, not file://)';
  } else if (!camReady) {
    msg = 'Lighting the lamp…';
  } else if (phase === 'intro') {
    msg = 'Step out of the light…';
    sub = 'the theater is memorizing the empty stage   ' + max(1, ceil(4 - el));
  } else if (phase === 'learning') {
    msg = 'Hold still…';
  } else if (phase === 'show' && el < 4) {
    msg = 'Now — step in.';
  }

  if (msg) {
    let a = phase === 'show' ? map(el, 2.5, 4, 255, 0, true) : 255;
    fill(30, 16, 12, a * 0.85);
    textSize(46 * S);
    text(msg, width / 2, height * 0.42);
    if (sub) {
      textSize(18 * S);
      fill(30, 16, 12, a * 0.7);
      text(sub, width / 2, height * 0.42 + 48 * S);
    }
  }
}

function drawDebug() {
  let size = 3 * S;
  let w = COLS * size, h = ROWS * size;
  let x0 = width - curtainW - w - 20 * S;
  let y0 = floorY - h - 20 * S;
  fill(0, 0, 0, 190);
  noStroke();
  rect(x0 - 8 * S, y0 - 28 * S, w + 16 * S, h + 36 * S, 6 * S);

  // nested loops over the cell objects
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      cells[row][col].displayDebug(x0, y0, size);
    }
  }
  fill(255, 200, 120);
  textAlign(LEFT, CENTER);
  textSize(12 * S);
  textFont('monospace');
  text(COLS + '×' + ROWS + ' cells   threshold ' + threshold + '  (↑/↓)', x0, y0 - 14 * S);
  textFont('IM Fell English');
}

// =====================================================
//  LAYOUT + pre-rendered scenery
// =====================================================
function layout() {
  S = height / 900;
  floorY = height * 0.86;
  curtainW = width * 0.075;
  valanceH = height * 0.075;

  // webcam (4:3) covers the width, sitting on the floor
  stage.w = width;
  stage.h = width * 0.75;
  stage.x = 0;
  stage.y = floorY - stage.h + stage.h * 0.02;

  light.x = width * 0.52;
  light.y = floorY * 0.48;

  candle.x = curtainW + 90 * S;
  candle.flameY = floorY - 170 * S;

  buildPaper();
  buildCurtains();
}

function buildPaper() {
  paperG = createGraphics(width, height);
  paperG.pixelDensity(1);
  let p = paperG;

  // warm paper with grain + blotchy stains
  p.loadPixels();
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let i = (y * width + x) * 4;
      let blot = (noise(x * 0.004, y * 0.004) - 0.5) * 46;
      let grain = random(-10, 10);
      let v = blot + grain;
      p.pixels[i] = 214 + v;
      p.pixels[i + 1] = 186 + v * 0.95;
      p.pixels[i + 2] = 140 + v * 0.85;
      p.pixels[i + 3] = 255;
    }
  }
  p.updatePixels();

  // paper fibers
  p.noFill();
  for (let i = 0; i < 900; i++) {
    p.stroke(110, 80, 50, random(8, 22));
    p.strokeWeight(random(0.5, 1.2));
    let x = random(width), y = random(floorY);
    let a = random(TWO_PI), l = random(6, 30);
    p.bezier(x, y, x + cos(a) * l * 0.3, y + sin(a) * l * 0.6,
             x + cos(a + 0.6) * l * 0.7, y + sin(a + 0.6) * l, x + cos(a) * l, y + sin(a) * l);
  }

  // seams between paper sheets + a wooden frame grid (like a shoji screen)
  for (let i = 1; i < 6; i++) {
    let x = map(i, 0, 6, curtainW, width - curtainW) + random(-4, 4);
    p.stroke(90, 60, 35, 40);
    p.strokeWeight(5 * S);
    p.line(x, 0, x, floorY);
    p.stroke(90, 60, 35, 18);
    p.strokeWeight(14 * S);
    p.line(x, 0, x, floorY);
  }
  p.stroke(90, 60, 35, 35);
  p.strokeWeight(5 * S);
  p.line(0, floorY * 0.5, width, floorY * 0.5);

  // water stains
  for (let i = 0; i < 6; i++) {
    let x = random(width), y = random(floorY * 0.8), r = random(40, 140) * S;
    p.noStroke();
    p.fill(120, 85, 45, 12);
    p.ellipse(x, y, r, r * random(0.7, 1));
    p.noFill();
    p.stroke(110, 75, 40, 22);
    p.strokeWeight(2);
    p.ellipse(x, y, r, r * random(0.7, 1));
  }

  // wooden stage floor
  for (let y = floorY; y < height; y++) {
    let k = (y - floorY) / (height - floorY);
    p.stroke(62 - k * 30, 40 - k * 20, 26 - k * 14);
    p.line(0, y, width, y);
  }
  // plank lines
  for (let i = 0; i < 4; i++) {
    let y = floorY + (height - floorY) * (0.18 + i * 0.24);
    p.stroke(20, 12, 8, 160);
    p.strokeWeight(1.5);
    p.line(0, y, width, y);
  }
  for (let i = 0; i < 18; i++) {
    let row = floor(random(4));
    let y0 = floorY + (height - floorY) * (0.18 + row * 0.24);
    let y1 = y0 + (height - floorY) * 0.24;
    let x = random(width);
    p.line(x, y0, x, min(y1, height));
  }
  // where the paper meets the floor
  p.stroke(20, 12, 8);
  p.strokeWeight(3 * S);
  p.line(0, floorY, width, floorY);
  p.noStroke();
  p.fill(20, 12, 8, 70);
  p.rect(0, floorY - 10 * S, width, 10 * S);
}

function buildCurtains() {
  curtainG = createGraphics(width, height);
  curtainG.pixelDensity(1);
  let c = curtainG;
  c.clear();

  // soft shadow the curtains throw onto the paper
  let ctx = c.drawingContext;
  let gl = ctx.createLinearGradient(curtainW, 0, curtainW + 70 * S, 0);
  gl.addColorStop(0, 'rgba(0,0,0,0.55)'); gl.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = gl; ctx.fillRect(curtainW, 0, 70 * S, floorY);
  let gr = ctx.createLinearGradient(width - curtainW, 0, width - curtainW - 70 * S, 0);
  gr.addColorStop(0, 'rgba(0,0,0,0.55)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = gr; ctx.fillRect(width - curtainW - 70 * S, 0, 70 * S, floorY);
  let gt = ctx.createLinearGradient(0, valanceH, 0, valanceH + 60 * S);
  gt.addColorStop(0, 'rgba(0,0,0,0.5)'); gt.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = gt; ctx.fillRect(0, valanceH, width, 60 * S);

  // side drapes: vertical folds
  for (let side = 0; side < 2; side++) {
    for (let i = 0; i < curtainW; i++) {
      let x = side === 0 ? i : width - 1 - i;
      let k = i / curtainW;
      let fold = 0.5 + 0.5 * sin(k * PI * 6 + side);
      let edge = side === 0 ? 1 - k * 0.5 : 1 - k * 0.5;
      c.stroke(lerp(34, 120, fold) * edge, lerp(4, 20, fold) * edge, lerp(8, 26, fold) * edge);
      // inner edge of the drape billows at the bottom
      let bottom = height;
      c.line(x, 0, x, bottom);
    }
  }

  // valance across the top with scalloped edge
  for (let y = 0; y < valanceH; y++) {
    let k = y / valanceH;
    c.stroke(lerp(70, 130, sin(k * PI)), lerp(8, 22, sin(k * PI)), lerp(12, 28, sin(k * PI)));
    c.line(0, y, width, y);
  }
  let n = 9;
  let sw = width / n;
  c.noStroke();
  for (let i = 0; i < n; i++) {
    c.fill(110, 18, 24);
    c.arc(i * sw + sw / 2, valanceH, sw, sw * 0.32, 0, PI);
    c.fill(150, 110, 45);
    c.ellipse(i * sw + sw / 2, valanceH + sw * 0.16, 9 * S, 13 * S);   // tassel
  }
  c.stroke(170, 125, 50);
  c.strokeWeight(3 * S);
  c.line(0, valanceH * 0.82, width, valanceH * 0.82);
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  clearTimeout(layoutTimer);
  layoutTimer = setTimeout(() => {
    layout();
    for (let w of walkers) { w.y = min(w.y, floorY); w.size = random(26, 36) * S; }
  }, 200);
}

function keyPressed() {
  if (key === 'b' || key === 'B') relearnStage();
  if (key === 'd' || key === 'D') debug = !debug;
  if (key === 'm' || key === 'M') mirror = !mirror;
  if (key === 's' || key === 'S') saveCanvas('shadow-theater', 'png');
  if (key === ' ' && walkers.length < 14) {
    let fromLeft = random() < 0.5;
    let w = new Walker(fromLeft ? curtainW + 30 * S : width - curtainW - 30 * S);
    w.dir = fromLeft ? 1 : -1;
    walkers.push(w);
  }
  if (keyCode === UP_ARROW) threshold = min(250, threshold + 10);
  if (keyCode === DOWN_ARROW) threshold = max(20, threshold - 10);
  return false;
}
