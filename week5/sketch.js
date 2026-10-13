// Visual Animal — a pixel dachshund
// Move the mouse: it walks after you
// Hover on its head: it gets happy
// Click: it jumps and barks

// sprite grid size (in art pixels)
const W = 41;
const H = 16;

// palette: one character = one color
const PALETTE = {
  o: "#5b3527", // outline
  b: "#d97757", // fur
  d: "#a9533a", // dark fur
  c: "#f5d3b3", // cream
  k: "#2a1a14", // eye / nose
  w: "#ffffff", // highlight
  p: "#f28b9b", // pink
  r: "#e0475b", // collar
  y: "#f5c542", // tag
};

const HEART = [
  ".pp.pp.",
  "ppppppp",
  "ppppppp",
  ".ppppp.",
  "..ppp..",
  "...p...",
];

const CLOUD = [
  "....wwww......",
  "..wwwwwwww.ww.",
  ".wwwwwwwwwwwww",
  "wwwwwwwwwwwwww",
];

let P; // size of one art pixel on screen

// dog state
let dogX;
let targetX;
let dir = 1; // 1 = facing right, -1 = facing left
let vx = 0;
let walkPhase = 0;
let jumpY = 0;
let vy = 0;
let barkTimer = 0;
let blinkTimer = 0;
let happy = false;

let hearts = [];
let clouds = [];

function setup() {
  createCanvas(windowWidth, windowHeight);
  noSmooth();
  P = pixelSize();
  dogX = width / 2;
  targetX = width / 2;
  for (let i = 0; i < 4; i++) {
    clouds.push({ x: random(width), y: random(height * 0.08, height * 0.4), v: random(0.15, 0.4) });
  }
}

function draw() {
  let groundY = snap(height * 0.72);

  drawBackground(groundY);

  // ---- walk toward the mouse ----
  let dx = targetX - dogX;
  let desired = constrain(dx * 0.05, -4, 4);
  if (abs(dx) < P * 4) desired = 0;
  vx = lerp(vx, desired, 0.1);
  dogX += vx;
  if (vx > 0.3) dir = 1;
  if (vx < -0.3) dir = -1;
  let walking = abs(vx) > 0.4;
  walkPhase += abs(vx) * 0.06;

  // ---- jump ----
  vy += 0.15 * P;
  jumpY += vy;
  if (jumpY > 0) {
    jumpY = 0;
    vy = 0;
  }

  // ---- blink ----
  blinkTimer--;
  if (blinkTimer < -random(120, 260)) blinkTimer = 8;

  // sprite top-left corner on screen (snapped so pixels stay crisp)
  let bob = walking && floor(walkPhase) % 2 === 1 ? -P : 0;
  let left = snap(dogX - (W * P) / 2);
  let top = snap(groundY - (H - 1) * P + jumpY) + bob;

  // ---- happy when the mouse is near its head ----
  let head = toScreen(31, 5, left, top);
  happy = dist(mouseX, mouseY, head.x, head.y) < P * 7 || barkTimer > 0;

  // shadow
  let shadowW = jumpY < 0 ? 22 : 30;
  noStroke();
  fill(0, 0, 0, 35);
  rect(snap(dogX - (shadowW * P) / 2), groundY + P, shadowW * P, P);

  // the dog
  drawGrid(buildDog(walking), left, top);

  // bark bubble
  if (barkTimer > 0) {
    drawBark(head.x + dir * P * 6, head.y - P * 9);
    barkTimer--;
  }

  updateHearts();
  drawHint();
}

// ------------------------------------------------------------
// Build the dog sprite into a char grid, facing right.
// ------------------------------------------------------------
function buildDog(walking) {
  let g = [];
  for (let y = 0; y < H; y++) g.push(new Array(W).fill("."));

  let step = walking ? (floor(walkPhase) % 2 === 0 ? 1 : -1) : 0;
  let wagSpeed = happy ? 4 : 10;
  let tailFrame = [0, 1, 2, 1][floor(frameCount / wagSpeed) % 4];

  // far legs (darker)
  leg(g, 8 - step, "d");
  leg(g, 23 + step, "d");

  // tail
  let tails = [
    [[5, 8], [4, 7], [3, 6], [2, 5]],
    [[5, 8], [4, 7], [4, 6], [4, 5]],
    [[5, 8], [5, 7], [5, 6], [6, 5]],
  ];
  for (let [x, y] of tails[tailFrame]) g[y][x] = "b";

  // long sausage body
  fillRect(g, 6, 7, 24, 5, "b");
  g[7][6] = ".";
  g[11][6] = ".";
  fillRect(g, 12, 7, 5, 1, "d"); // back spot
  fillRect(g, 13, 8, 3, 1, "d");
  fillRect(g, 24, 9, 4, 3, "c"); // chest

  // near legs
  leg(g, 11 + step, "b");
  leg(g, 26 - step, "b");

  // head + neck
  fillRect(g, 27, 2, 9, 7, "b");
  fillRect(g, 26, 6, 3, 4, "b");
  g[2][27] = ".";
  g[2][35] = ".";

  // collar + tag
  fillRect(g, 27, 7, 1, 3, "r");
  fillRect(g, 28, 9, 1, 1, "r");
  g[10][28] = "y";

  // snout + nose
  fillRect(g, 34, 5, 5, 3, "c");
  g[7][38] = ".";
  fillRect(g, 37, 4, 2, 2, "k");
  g[4][37] = "w";

  // tongue
  if (happy) fillRect(g, 36, 8, 2, 2, "p");

  // eye
  if (happy) {
    g[4][31] = "k"; // ^ ^
    g[3][32] = "k";
    g[4][33] = "k";
  } else if (blinkTimer > 0) {
    fillRect(g, 32, 4, 2, 1, "k");
  } else {
    fillRect(g, 32, 3, 2, 2, "k");
    g[3][33] = "w";
  }

  // blush
  g[6][33] = "p";

  // floppy ear (flips up while jumping)
  if (jumpY < 0) {
    fillRect(g, 25, 1, 3, 2, "d");
    fillRect(g, 28, 2, 2, 2, "d");
  } else {
    fillRect(g, 28, 3, 3, 5, "d");
    g[8][29] = "d";
  }

  addOutline(g);
  return g;
}

function leg(g, x, col) {
  fillRect(g, x, 12, 2, 2, col);
  fillRect(g, x, 14, 3, 1, col); // paw
}

function fillRect(g, x, y, w, h, ch) {
  for (let j = y; j < y + h; j++) {
    for (let i = x; i < x + w; i++) {
      if (j >= 0 && j < H && i >= 0 && i < W) g[j][i] = ch;
    }
  }
}

// every empty cell touching a colored cell becomes outline
function addOutline(g) {
  let marks = [];
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (g[y][x] !== ".") continue;
      let near =
        (y > 0 && g[y - 1][x] !== ".") ||
        (y < H - 1 && g[y + 1][x] !== ".") ||
        (x > 0 && g[y][x - 1] !== ".") ||
        (x < W - 1 && g[y][x + 1] !== ".");
      if (near) marks.push([x, y]);
    }
  }
  for (let [x, y] of marks) g[y][x] = "o";
}

// draw a char grid, mirrored when the dog faces left
function drawGrid(g, left, top) {
  noStroke();
  for (let y = 0; y < g.length; y++) {
    for (let x = 0; x < g[y].length; x++) {
      let ch = g[y][x];
      if (ch === ".") continue;
      let gx = dir === 1 ? x : g[y].length - 1 - x;
      fill(PALETTE[ch]);
      rect(left + gx * P, top + y * P, P, P);
    }
  }
}

function toScreen(gx, gy, left, top) {
  let x = dir === 1 ? gx : W - 1 - gx;
  return { x: left + x * P + P / 2, y: top + gy * P + P / 2 };
}

// ------------------------------------------------------------

function drawBackground(groundY) {
  background("#f4ede3");
  noStroke();

  // pixel sun
  let sx = snap(width * 0.82);
  let sy = snap(height * 0.15);
  fill("#f8cf7a");
  for (let y = -4; y <= 4; y++) {
    for (let x = -4; x <= 4; x++) {
      if (x * x + y * y <= 18) rect(sx + x * P, sy + y * P, P, P);
    }
  }

  // clouds
  for (let c of clouds) {
    c.x += c.v;
    if (c.x > width + 20 * P) c.x = -20 * P;
    drawSprite(CLOUD, snap(c.x), snap(c.y), { w: "#ffffff" });
  }

  // grass
  fill("#bcd6a0");
  rect(0, groundY + P, width, height - groundY);
  fill("#a5c487");
  rect(0, groundY + P, width, P);
  for (let x = 0; x < width; x += P * 6) {
    let off = (x / (P * 6)) % 2 === 0 ? 3 : 6;
    rect(snap(x), groundY + off * P, P * 2, P);
  }
}

function drawSprite(rows, left, top, colors) {
  for (let y = 0; y < rows.length; y++) {
    for (let x = 0; x < rows[y].length; x++) {
      let ch = rows[y][x];
      if (ch === ".") continue;
      fill(colors[ch]);
      rect(left + x * P, top + y * P, P, P);
    }
  }
}

function drawBark(x, y) {
  let bw = P * 16;
  let bh = P * 7;
  let left = snap(x - bw / 2);
  let top = snap(y - bh / 2);

  noStroke();
  fill(PALETTE.o);
  rect(left - P, top, bw + 2 * P, bh);
  rect(left, top - P, bw, bh + 2 * P);
  fill(255);
  rect(left, top, bw, bh);

  // little tail of the bubble, pointing back at the dog
  let tx = dir === 1 ? left + P * 2 : left + bw - P * 3;
  fill(PALETTE.o);
  rect(tx - P, top + bh, P * 3, P * 2);
  rect(tx - dir * P, top + bh + P * 2, P, P);
  fill(255);
  rect(tx, top + bh - P, P, P * 2);

  fill(PALETTE.o);
  textFont("Press Start 2P");
  textAlign(CENTER, CENTER);
  textSize(P * 2.4);
  text("WOOF!", left + bw / 2, top + bh / 2 + P * 0.3);
}

function updateHearts() {
  noStroke();
  for (let i = hearts.length - 1; i >= 0; i--) {
    let h = hearts[i];
    h.x += h.vx;
    h.y += h.vy;
    h.life--;
    if (h.life % 6 < 5 || h.life > 20) {
      drawSprite(HEART, snap(h.x), snap(h.y), { p: PALETTE.p });
    }
    if (h.life <= 0) hearts.splice(i, 1);
  }
}

function drawHint() {
  fill("#7a5a48");
  noStroke();
  textFont("Press Start 2P");
  textAlign(CENTER, BOTTOM);
  textSize(constrain(P * 1.4, 8, 14));
  text("move to walk  ·  hover to pet  ·  click to jump", width / 2, height - 20);
}

// ------------------------------------------------------------

function pixelSize() {
  return max(3, floor(min(width, height) / 60));
}

function snap(v) {
  return floor(v / P) * P;
}

function mouseMoved() {
  targetX = mouseX;
}

function mouseDragged() {
  targetX = mouseX;
}

function mousePressed() {
  targetX = mouseX;
  if (jumpY === 0) vy = -2.2 * P;
  barkTimer = 50;
  let left = snap(dogX - (W * P) / 2);
  let top = snap(height * 0.72 - (H - 1) * P);
  let head = toScreen(31, 3, left, top);
  for (let i = 0; i < 5; i++) {
    hearts.push({
      x: head.x + random(-6, 6) * P,
      y: head.y - P * 4,
      vx: random(-0.8, 0.8),
      vy: random(-2.2, -1),
      life: 60,
    });
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  noSmooth();
  P = pixelSize();
}
