// Pocket Critter — a tiny pixel animal that lives on this page
// First visit: tap the egg until it hatches, then give it a name
// Each egg is a species: kitten, bunny, puppy, bear cub, fox or panda.
// A new egg is always a species you haven't raised yet.
// Wiggle the mouse on it: you pet it
// FEED: an apple drops from the tree (or click the grass to drop a berry)
// SLEEP: it walks to its leaf bed and night falls
// When it's happy (fed, rested, petted) it follows your mouse
// CLOSET: dress it up with hats and clothes
// Every meal and every pet helps it grow a little bigger

const SAVE_KEY = "mochi-sprout";
const HISTORY_KEY = "mochi-sprout-species"; // species you have already raised

// palette: one character = one color
const COLORS = {
  o: "#5a3d5c", // outline
  b: "#ffc7d9", // body
  s: "#f4a3c0", // shade / feet
  l: "#fff0f5", // belly
  k: "#2b1d2e", // eyes / mouth
  w: "#ffffff", // shine
  p: "#ff8fab", // blush / tongue
  g: "#7bc96f", // leaf
  G: "#3f8a4a", // stem
  f: "#fff4a3", // petals
  c: "#ff9f43", // flower center
  r: "#e8505b", // fruit
  R: "#b83a48", // fruit shade
  y: "#ffe08a", // seeds
  e: "#fff6e0", // egg
  h: "#f1dfbd", // egg shade
  q: "#fffaf0", // white cloth
  B: "#ff6f9c", // pink cloth
  D: "#d94c7c", // pink cloth shade
  U: "#6fb8ff", // blue cloth
  V: "#3f86d9", // blue cloth shade
  P: "#b48cff", // purple cloth
  Q: "#8a62d9", // purple cloth shade
  Y: "#ffcc33", // gold
  O: "#e0961a", // gold shade
  T: "#f2d28b", // straw
  S: "#c9a35b", // straw shade
  F: "#8ed36f", // frog green
  E: "#5a9e45", // frog shade
  // each species sets its own fur (b, s, l), markings (m), inner ear (i) and nose (n)
  m: "#5a3d3a",
  i: "#ffb3c1",
  n: "#2b1d2e",
};

// it grows through four stages: head (hw x hh) and body (bw x bh) get bigger,
// ears and tail grow, arms appear, and the eyes get sparkly
const STAGES = [
  { name: "baby", xp: 0, hw: 11, hh: 9, bw: 7, bh: 4 },
  { name: "little", xp: 4, hw: 13, hh: 10, bw: 9, bh: 5 },
  { name: "big", xp: 10, hw: 15, hh: 11, bw: 11, bh: 7 },
  { name: "grown", xp: 18, hw: 17, hh: 12, bw: 13, bh: 8 },
];

const HEART = [".pp.pp.", "ppppppp", "ppppppp", ".ppppp.", "..ppp..", "...p..."];

const APPLE = [
  "...G..",
  "..G...",
  ".rrrr.",
  "rrwrrr",
  "rrrrrR",
  "rrrrRR",
  ".rRRR.",
];

const BERRY = [".GgG.", "rrrrr", "rwryr", ".ryr.", "..r.."];

const CLOUD = [
  "....wwww......",
  "..wwwwwwww.ww.",
  ".wwwwwwwwwwwww",
  "wwwwwwwwwwwwww",
];

let P; // size of one art pixel on screen
let groundY, bedX, treeX, treeTop;
let sceneLayer; // hills, grass and tree, drawn once per resize

let phase = "egg"; // egg -> naming -> live
let pet; // everything that gets saved
let egg = { taps: 0, shake: 0 };

// creature state
let x;
let vx = 0;
let dir = 1;
let walkPhase = 0;
let hopY = 0;
let vy = 0;
let mode = "idle"; // idle | wander | follow | toFood | eating | toBed | sleeping
let wanderX;
let wanderTimer = 0;
let eatTimer = 0;
let eatingFood = null;
let blinkTimer = 0;
let cheer = 0; // seconds of happy ^ ^ eyes
let petting = false;
let heartTimer = 0;
let moodTimer = 10;
let zTimer = 0;
let saveTimer = 0;
let bubble = { text: "", t: 0 };
let petBox = null; // where the creature is on screen (for petting / clicks)
let eggBox = null;
let lastMouse = { x: 0, y: 0 };

let darkness = 0; // 0 = day, 1 = night
let foods = [];
let particles = [];
let clouds = [];
let stars = [];
let flies = [];

function setup() {
  let cnv = createCanvas(windowWidth, windowHeight);
  cnv.mousePressed(onPress);
  noSmooth();
  textFont("Press Start 2P");
  layout();

  pet = loadPet();
  if (pet && pet.name) {
    phase = "live";
    if (!SPECIES[pet.species]) pet.species = pickSpecies();
    pet.stage = stageIndex();
    catchUp();
    showHud();
  } else {
    pet = newPet();
  }

  x = pet.sleeping ? bedX : width / 2;
  wanderX = x;
  if (pet.sleeping) {
    mode = "sleeping";
    darkness = 1;
  }
  hookUi();
  hookCloset();
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  layout();
  x = mode === "sleeping" ? bedX : constrain(x, P * 10, width - P * 10);
}

function layout() {
  P = max(3, floor(min(width, height) / 95));
  groundY = snap(height * 0.74);
  bedX = snap(width * 0.16);
  treeX = snap(width * 0.84);
  treeTop = groundY - P * 44;
  makeSky();
  drawSceneLayer();
}

function draw() {
  let dt = min(deltaTime / 1000, 0.1);
  darkness = lerp(darkness, mode === "sleeping" ? 1 : 0, 0.03);

  drawSky();
  image(sceneLayer, 0, 0, width, height);
  drawBedBack();
  drawNight();

  updateFoods();
  if (phase === "egg") {
    drawEgg();
  } else {
    updatePet(dt);
    drawPet();
  }
  drawBedFront();

  updateParticles();
  drawBubble();

  if (phase === "egg") drawHint("tap the egg!");
  if (phase === "live") {
    updateHud();
    saveTimer -= dt;
    if (saveTimer <= 0) {
      savePet();
      saveTimer = 2;
    }
  }

  let overPet = petBox && dist(mouseX, mouseY, petBox.x, petBox.y) < petBox.r;
  let overEgg = phase === "egg" && eggBox && dist(mouseX, mouseY, eggBox.x, eggBox.y) < eggBox.r;
  cursor(overPet || overEgg ? HAND : ARROW);
  lastMouse = { x: mouseX, y: mouseY };
}

// ------------------------------------------------------------
// The creature's brain
// ------------------------------------------------------------

function updatePet(dt) {
  let tx = x;
  let speed = 0;

  if (phase === "live") {
    updateStats(dt);
    updatePetting(dt);

    if (mode === "sleeping") {
      if (pet.energy >= 100) wake("good morning!");
    } else if (mode === "eating") {
      eatTimer -= dt;
      if (frameCount % 8 === 0) crumbs(eatingFood.x, groundY - P * 3, 1);
      if (eatTimer <= 0) finishMeal();
    } else if (pet.energy <= 0) {
      mode = "sleeping";
      say("so sleepy...");
    } else if (mode === "toBed") {
      tx = bedX;
      speed = 2.2;
      if (abs(x - bedX) < P * 3) {
        mode = "sleeping";
        say("good night...");
      }
    } else {
      let food = nearestFood();
      if (food && pet.full < 90) {
        mode = "toFood";
        tx = food.x;
        speed = 2.6;
        if (abs(food.x - x) < P * 4) {
          mode = "eating";
          eatingFood = food;
          eatTimer = 1.6;
          dir = food.x >= x ? 1 : -1;
        }
      } else {
        if (food && !food.refused) {
          food.refused = true;
          say("I'm full!");
        }
        if (isHappy()) {
          mode = "follow";
          tx = constrain(mouseX, P * 10, width - P * 10);
          speed = 3.2;
        } else {
          mode = "wander";
          wanderTimer -= dt;
          if (wanderTimer <= 0) {
            wanderX = constrain(x + random(-1, 1) * P * 40, P * 12, width - P * 12);
            wanderTimer = random(3, 7);
          }
          tx = wanderX;
          speed = 0.9;
        }
      }
      grumble(dt);
    }
  }

  // ---- walking ----
  let s = P / 4;
  let dx = tx - x;
  let desired = constrain(dx * 0.05, -speed * s, speed * s);
  if (abs(dx) < P * 3) desired = 0;
  vx = lerp(vx, desired, 0.12);
  x += vx;
  if (vx > 0.25) dir = 1;
  if (vx < -0.25) dir = -1;
  walkPhase += abs(vx) * 0.08;

  // little happy hops while following you
  if (mode === "follow" && abs(vx) > 1 && hopY === 0 && random() < 0.012) vy = -1.4 * P;

  // ---- hopping ----
  vy += 0.18 * P;
  hopY += vy;
  if (hopY > 0) {
    hopY = 0;
    vy = 0;
  }

  // ---- blink ----
  blinkTimer--;
  if (blinkTimer < -random(120, 260)) blinkTimer = 8;
  cheer = max(0, cheer - dt);
}

function updateStats(dt) {
  if (mode === "sleeping") {
    pet.energy += 3 * dt;
    pet.full -= 0.12 * dt;
  } else {
    pet.energy -= 0.25 * dt;
    pet.full -= 0.4 * dt;
    let drain = 0.3;
    if (pet.full < 25) drain += 0.8;
    if (pet.energy < 20) drain += 0.5;
    pet.joy -= drain * dt;
  }
  clampStats();
}

function updatePetting(dt) {
  let moved = abs(mouseX - lastMouse.x) + abs(mouseY - lastMouse.y) > 1;
  let over = petBox && dist(mouseX, mouseY, petBox.x, petBox.y) < petBox.r;
  petting = over && moved && mode !== "sleeping" && mode !== "eating";
  if (!petting) return;

  pet.joy = min(100, pet.joy + 18 * dt);
  pet.xp += 0.06 * dt;
  cheer = max(cheer, 0.3);
  heartTimer -= dt;
  if (heartTimer <= 0) {
    hearts(petBox.x + random(-1, 1) * petBox.r * 0.5, petBox.top, 1);
    heartTimer = 0.35;
  }
  checkGrowth();
}

// now and then it tells you what it needs
function grumble(dt) {
  moodTimer -= dt;
  if (moodTimer > 0 || bubble.t > 0) return;
  moodTimer = random(14, 24);
  if (pet.full < 25) say("hungry...");
  else if (pet.energy < 20) say("sleepy...");
  else if (pet.joy < 35) say("pet me?");
}

function isHappy() {
  return pet.joy >= 60 && pet.full >= 25 && pet.energy >= 15;
}

function wake(msg) {
  mode = "idle";
  say(msg);
}

function finishMeal() {
  let food = eatingFood;
  foods.splice(foods.indexOf(food), 1);
  pet.full = min(100, pet.full + (food.kind === "apple" ? 30 : 18));
  pet.joy = min(100, pet.joy + 10);
  pet.xp += 1;
  crumbs(food.x, groundY - P * 3, 6);
  hearts(x, petBox ? petBox.top : groundY - P * 20, 2);
  say(random(["yum!", "nom nom", "tasty!", "more?"]));
  cheer = 1.2;
  eatingFood = null;
  mode = "idle";
  checkGrowth();
}

function stageIndex() {
  let i = 0;
  for (let k = 0; k < STAGES.length; k++) if (pet.xp >= STAGES[k].xp) i = k;
  return i;
}

function checkGrowth() {
  let i = stageIndex();
  if (i <= pet.stage) return;
  pet.stage = i;
  say("I grew!");
  cheer = 2;
  vy = -2.2 * P;
  sparks(x, petBox ? petBox.y : groundY - P * 10, 24);
  savePet();
}

function nearestFood() {
  let best = null;
  for (let f of foods) {
    if (!f.landed) continue;
    if (!best || abs(f.x - x) < abs(best.x - x)) best = f;
  }
  return best;
}

// ------------------------------------------------------------
// Input
// ------------------------------------------------------------

function onPress() {
  if (phase === "egg") {
    if (eggBox && dist(mouseX, mouseY, eggBox.x, eggBox.y) < eggBox.r) tapEgg();
    return;
  }
  if (phase === "naming") return;

  // poke the creature
  if (petBox && dist(mouseX, mouseY, petBox.x, petBox.y) < petBox.r) {
    if (mode === "sleeping") {
      say("zzz...");
      return;
    }
    if (hopY === 0) vy = -2 * P;
    pet.joy = min(100, pet.joy + 6);
    cheer = 1;
    hearts(petBox.x, petBox.top, 3);
    say(random(["hi!", "hehe", "<3", pet.name + "!", "boop!"]));
    return;
  }

  // anywhere else: drop a berry
  if (foods.length < 6) {
    foods.push({ x: mouseX, y: min(mouseY, groundY), vy: 0, kind: "berry", landed: false });
  }
}

function hookUi() {
  document.getElementById("feedBtn").onclick = () => {
    if (foods.length >= 6) return;
    let fx = treeX + random(-1, 1) * P * 12;
    foods.push({ x: fx, y: treeTop + P * 12, vy: 0, kind: "apple", landed: false });
  };

  document.getElementById("sleepBtn").onclick = () => {
    if (mode === "sleeping") {
      if (pet.energy < 60) {
        pet.joy = max(0, pet.joy - 5);
        wake("5 more minutes...");
      } else {
        wake("morning!");
      }
    } else {
      mode = "toBed";
      eatingFood = null;
      say("bed time?");
    }
  };

  document.getElementById("namer").onsubmit = (e) => {
    e.preventDefault();
    let name = document.getElementById("nameInput").value.trim().slice(0, 12) || "Mochi";
    pet.name = name;
    pet.saved = Date.now();
    phase = "live";
    document.getElementById("namer").classList.add("hidden");
    showHud();
    say(name + "!");
    cheer = 2;
    hearts(x, petBox ? petBox.top : groundY - P * 20, 5);
    savePet();
  };

  document.getElementById("resetBtn").onclick = () => {
    if (!confirm("Say goodbye to " + pet.name + " and start over with a new egg?")) return;
    rememberSpecies(pet.species);
    try {
      localStorage.removeItem(SAVE_KEY);
    } catch (e) {}
    pet = null;
    location.reload();
  };

  window.addEventListener("beforeunload", savePet);
}

function showHud() {
  for (let id of ["hud", "tip", "resetBtn"]) document.getElementById(id).classList.remove("hidden");
}

function updateHud() {
  document.getElementById("petName").textContent = pet.name;
  document.getElementById("petStage").textContent = SPECIES[pet.species].name + " · " + STAGES[pet.stage].name;
  document.getElementById("barFull").style.width = pet.full + "%";
  document.getElementById("barEnergy").style.width = pet.energy + "%";
  document.getElementById("barJoy").style.width = pet.joy + "%";

  let i = pet.stage;
  let grow = 100;
  if (i < STAGES.length - 1) {
    grow = ((pet.xp - STAGES[i].xp) / (STAGES[i + 1].xp - STAGES[i].xp)) * 100;
  }
  document.getElementById("barGrow").style.width = constrain(grow, 0, 100) + "%";
  document.getElementById("sleepBtn").textContent = mode === "sleeping" ? "WAKE UP" : "SLEEP";
  document.getElementById("tip").style.color = darkness > 0.5 ? "#d9d3ff" : "#3f6e3a";
}

// ------------------------------------------------------------
// Saving: it remembers you between visits
// ------------------------------------------------------------

function newPet() {
  return {
    name: "", species: pickSpecies(), xp: 0, stage: 0,
    full: 70, energy: 80, joy: 65, sleeping: false, saved: Date.now(),
  };
}

// pick a species you haven't had yet (once you've had them all, start over)
function pickSpecies() {
  let seen = [];
  try {
    seen = JSON.parse(localStorage.getItem(HISTORY_KEY)) || [];
  } catch (e) {}
  let fresh = SPECIES_IDS.filter((id) => !seen.includes(id));
  if (fresh.length === 0) fresh = SPECIES_IDS.filter((id) => id !== seen[seen.length - 1]);
  return random(fresh);
}

function rememberSpecies(id) {
  try {
    let seen = JSON.parse(localStorage.getItem(HISTORY_KEY)) || [];
    if (seen.length >= SPECIES_IDS.length) seen = [];
    seen.push(id);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(seen));
  } catch (e) {}
}

function loadPet() {
  try {
    let raw = localStorage.getItem(SAVE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

function savePet() {
  if (!pet || phase !== "live") return;
  pet.sleeping = mode === "sleeping";
  pet.saved = Date.now();
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(pet));
  } catch (e) {}
}

// time passes while you're away (at most 15 minutes' worth)
function catchUp() {
  let e = constrain((Date.now() - pet.saved) / 1000, 0, 900);
  if (pet.sleeping) {
    pet.energy += 3 * e;
    pet.full -= 0.12 * e;
  } else {
    pet.energy -= 0.25 * e;
    pet.full -= 0.4 * e;
    pet.joy -= 0.3 * e;
  }
  pet.full = max(pet.full, 10);
  pet.joy = max(pet.joy, 20);
  clampStats();
  if (e > 60) say(pet.sleeping ? "zzz..." : "you're back!");
}

function clampStats() {
  pet.full = constrain(pet.full, 0, 100);
  pet.energy = constrain(pet.energy, 0, 100);
  pet.joy = constrain(pet.joy, 0, 100);
}

// ------------------------------------------------------------
// The egg (first meeting)
// ------------------------------------------------------------

function tapEgg() {
  egg.taps++;
  egg.shake = 1;
  sparks(eggBox.x, eggBox.y - P * 4, 5);
  if (egg.taps >= 4) {
    phase = "naming";
    x = width / 2;
    sparks(eggBox.x, eggBox.y, 30);
    for (let i = 0; i < 10; i++) {
      particles.push({
        kind: "dot", col: i % 2 ? COLORS.e : COLORS.h,
        x: eggBox.x, y: eggBox.y, vx: random(-2, 2) * P / 3, vy: random(-3, -1) * P / 3,
        g: 0.12 * P, life: 50,
      });
    }
    cheer = 3;
    let kind = SPECIES[pet.species].name;
    document.getElementById("hatchText").textContent = "It's " + (/^[aeiou]/.test(kind) ? "an " : "a ") + kind + "!";
    document.getElementById("namer").classList.remove("hidden");
    document.getElementById("nameInput").focus();
  }
}

function drawEgg() {
  let g = buildEgg(egg.taps);
  egg.shake *= 0.9;
  let wobble = 0;
  if (egg.shake > 0.05) wobble = floor(frameCount / 2) % 2 ? P : -P;
  else if (frameCount % 150 < 16) wobble = floor(frameCount / 4) % 2 ? P : -P;

  let GW = g[0].length;
  let GH = g.length;
  let left = snap(width / 2 - (GW * P) / 2) + wobble;
  let top = groundY - (GH - 1) * P;

  noStroke();
  fill(0, 0, 0, 30);
  rect(snap(width / 2 - 6 * P), groundY + P, 12 * P, P);
  drawGrid(g, left, top, false, palette());
  eggBox = { x: width / 2, y: top + (GH * P) / 2, r: GH * P * 0.6 };
}

function buildEgg(taps) {
  let w = 13;
  let h = 16;
  let g = emptyGrid(w + 2, h + 2);
  let cx = (w + 1) / 2;
  let cy = Math.round(1 + (h - 1) / 2);
  for (let y = 1; y <= h; y++) {
    for (let x = 0; x < w + 2; x++) {
      let ny = (y - cy) / (h / 2);
      let rx = (w / 2) * (ny < 0 ? 0.82 : 1); // pointy on top
      let nx = (x - cx) / rx;
      if (nx * nx + ny * ny > 1) continue;
      g[y][x] = nx + ny > 0.8 ? "h" : "e";
    }
  }
  // the egg's pattern is a hint of what's inside
  let pattern = SPECIES[pet.species].egg;
  if (pattern === "stripes") {
    for (let dx = -6; dx <= 6; dx++) {
      setIf(g, cx + dx, cy - 3 + (abs(dx) % 2), "b");
      setIf(g, cx + dx, cy + 3 + (abs(dx) % 2), "b");
    }
  } else if (pattern === "patches") {
    for (let [dx, dy] of [[-3, -2], [-4, -2], [-3, -1], [-4, -1], [3, 2], [4, 2], [3, 3], [2, 3], [0, -5], [1, -5]]) {
      setIf(g, cx + dx, cy + dy, "m");
    }
  } else {
    for (let [dx, dy] of [[-3, -2], [-2, -2], [2, -5], [3, 1], [4, 1], [-2, 4], [0, 0]]) {
      setIf(g, cx + dx, cy + dy, SPECIES[pet.species].eggDot || "b");
    }
  }
  setIf(g, cx - 2, cy - 5, "w");
  addOutline(g);

  // cracks appear one by one
  let cracks = [
    [[0, -7], [1, -6], [0, -5], [1, -4]],
    [[-5, -1], [-4, 0], [-3, -1], [-2, 0]],
    [[2, -2], [3, -1], [4, -2], [5, -1], [4, 0]],
  ];
  for (let i = 0; i < min(taps, cracks.length); i++) {
    for (let [dx, dy] of cracks[i]) setIf(g, cx + dx, cy + dy, "k");
  }
  return g;
}

// ------------------------------------------------------------
// Building the animal sprite: a chibi with a big head, a small
// body, ears, a tail and little paws
// ------------------------------------------------------------

function drawPet() {
  let si = phase === "live" ? pet.stage : 0;
  let st = STAGES[si];
  let sleeping = mode === "sleeping";
  let walking = abs(vx) > 0.35;

  // which way to look
  let face = 0;
  if (walking) face = dir;
  else if (!sleeping && abs(mouseX - x) > P * 8) face = mouseX > x ? 1 : -1;

  let eyes = "open";
  if (sleeping || blinkTimer > 0) eyes = "closed";
  else if (cheer > 0) eyes = "happy";
  else if (phase === "live" && (pet.joy < 35 || pet.full < 20)) eyes = "sad";

  let mouth = "smile";
  if (sleeping) mouth = "sleep";
  else if (mode === "eating") mouth = floor(eatTimer * 6) % 2 ? "open" : "smile";
  else if (cheer > 0) mouth = "open";
  else if (eyes === "sad") mouth = "sad";

  let stepFoot = walking ? (floor(walkPhase) % 2) + 1 : 0;
  let armsUp = cheer > 0 && !sleeping;
  let wagSpeed = sleeping ? 0 : isHappy() || cheer > 0 ? 6 : 16;
  let wag = wagSpeed ? floor(frameCount / wagSpeed) % 2 : 0;
  let sprite = buildPet(si, { eyes, mouth, stepFoot, face, armsUp, wag }, outfit());
  let g = sprite.g;
  let GW = g[0].length;
  let GH = g.length;

  // slow breathing while asleep
  let bob = sleeping && floor(frameCount / 50) % 2 ? P : 0;
  let left = snap(x - (GW * P) / 2);
  let top = snap(groundY - (GH - 1) * P + hopY) + bob;

  noStroke();
  fill(0, 0, 0, 30 * (1 - darkness));
  let sw = hopY < -P * 2 ? st.bw : st.bw + 4;
  rect(snap(x - (sw * P) / 2), groundY + P, sw * P, P);

  drawGrid(g, left, top, false, palette());
  petBox = {
    x: left + sprite.cx * P + P / 2,
    y: top + sprite.cy * P,
    r: (st.hw / 2) * P * 1.25,
    top: top + sprite.headTop * P,
    head: top + sprite.headRow * P,
  };

  if (sleeping) {
    zTimer -= 1;
    if (zTimer <= 0) {
      particles.push({
        kind: "z", x: petBox.x + petBox.r * 0.6, y: petBox.top,
        vx: 0.25 * P / 4, vy: -0.4 * P / 4, g: 0, life: 90,
      });
      zTimer = 60;
    }
  }
}

function outfit() {
  if (phase !== "live") return {};
  return { hat: HATS.find((h) => h.id === pet.hat), cloth: CLOTHES.find((c) => c.id === pet.cloth) };
}

function palette(speciesId = pet.species) {
  return Object.assign({}, COLORS, SPECIES[speciesId].colors);
}

// bounds-checked pixel helpers
function put(g, x, y, ch) {
  x = Math.round(x);
  y = Math.round(y);
  if (g[y] && g[y][x] !== undefined) g[y][x] = ch;
}

function blob(g, x, y, r, ch, only = null) {
  for (let j = -Math.ceil(r); j <= Math.ceil(r); j++) {
    for (let i = -Math.ceil(r); i <= Math.ceil(r); i++) {
      if (i * i + j * j > r * r + 0.3) continue;
      let gx = Math.round(x + i);
      let gy = Math.round(y + j);
      if (only && !(g[gy] && only.includes(g[gy][gx]))) continue;
      put(g, gx, gy, ch);
    }
  }
}

function isFur(c) {
  return c === "b" || c === "s" || c === "l";
}

function buildPet(si, look, wear = {}, speciesId = pet.species) {
  let sp = SPECIES[speciesId];
  let st = STAGES[si];
  let GW = st.hw + 18;
  let headTop = 10; // room above for ears and hats
  let headBot = headTop + st.hh - 1;
  let bodyTop = headBot - 1;
  let footY = bodyTop + st.bh - 1;
  let legH = si >= 2 ? 2 : 1;
  let g = emptyGrid(GW, footY + legH + 2);
  let cx = (GW - 1) / 2;
  let hcy = headTop + (st.hh - 1) / 2;
  let hrx = st.hw / 2;
  let hry = st.hh / 2;
  let bcy = bodyTop + (st.bh - 1) / 2;
  let brx = st.bw / 2;
  let bry = st.bh / 2;
  let f = look.face;
  let side = f === 0 ? 1 : -f; // the tail sticks out on the side it's walking away from
  let ctx = { cx, headTop, headBot, hrx, bodyTop, footY, bcy, brx, si, side, f };

  // ---- tail (behind everything) ----
  sp.tail(g, cx + side * Math.ceil(brx), Math.round(bcy), side, si, look.wag);

  // ---- body ----
  let mask = emptyGrid(GW, g.length);
  for (let y = bodyTop; y <= footY; y++) {
    for (let x = 0; x < GW; x++) {
      let nx = (x - cx) / brx;
      let ny = (y - bcy) / bry;
      let d = nx * nx + ny * ny;
      if (d > 1) continue;
      let bx = (x - cx) / (brx * 0.55);
      let by = (y - bcy - 0.4) / (bry * 0.75);
      g[y][x] = bx * bx + by * by <= 1 ? "l" : d > 0.6 && nx > 0.5 ? "s" : "b";
      mask[y][x] = "x";
    }
  }

  // ---- legs with paws, lifting in turn while walking ----
  let lx = max(1, Math.round(brx * 0.5));
  let lw = si >= 2 ? 3 : 2;
  for (let [s2, lifted] of [[-1, look.stepFoot === 1], [1, look.stepFoot === 2]]) {
    let x0 = s2 < 0 ? cx - lx - lw + 1 : cx + lx;
    let h = lifted ? legH - 1 : legH;
    for (let j = 1; j <= h; j++) {
      for (let i = 0; i < lw; i++) g[footY + j][x0 + i] = j === h ? sp.feet : sp.limb;
    }
  }

  // ---- head ----
  for (let y = headTop; y <= headBot; y++) {
    for (let x = 0; x < GW; x++) {
      let nx = (x - cx) / hrx;
      let ny = (y - hcy) / hry;
      if (ny > 0) ny *= 0.85; // chubby cheeks
      let d = nx * nx + ny * ny;
      if (d > 1) continue;
      g[y][x] = d > 0.6 && nx + ny > 0.9 ? "s" : "b";
      mask[y][x] = ".";
    }
  }

  // ---- ears ----
  sp.ears(g, ctx);

  // ---- little arms, raised when happy ----
  let cloth = wear.cloth;
  if (si >= 1) {
    let ay = min(headBot + 1, footY);
    let row = mask[ay];
    let l = row.indexOf("x");
    let r = row.lastIndexOf("x");
    let col = cloth && cloth.sleeve ? cloth.sleeve : sp.limb;
    let len = si >= 2 ? 2 : 1;
    for (let i = 1; i <= len; i++) {
      let dy = look.armsUp ? -i : 0;
      put(g, l - i, ay + dy, col);
      put(g, r + i, ay + dy, col);
    }
  }

  // ---- clothes (only on the body, never on the face) ----
  if (cloth) cloth.paint(g, mask, ctx);

  // ---- hat ----
  let hat = wear.hat;
  if (hat) {
    let hw = hat.rows[0].length;
    let hx0 = cx + f + (hat.side ? Math.round(hrx * 0.55) : 0) - (hw - 1) / 2;
    let hy0 = headTop + 1 - (hat.rows.length - 1);
    for (let j = 0; j < hat.rows.length; j++) {
      for (let i = 0; i < hw; i++) {
        let ch = hat.rows[j][i];
        if (ch !== ".") put(g, hx0 + i, hy0 + j, ch);
      }
    }
  }

  addOutline(g);

  // ---- face ----
  let ey = headTop + Math.round(st.hh * 0.38);
  let ex = max(2, Math.round(hrx * 0.38));
  let eyeH = si >= 2 ? 3 : 2;
  let L = cx - ex - 1 + f;
  let R = cx + ex + f;
  let my = ey + eyeH; // nose row
  let mx = cx + f;
  let face = { ey, eyeH, L, R, my, mx };

  if (sp.markings) sp.markings(g, ctx, face, !!hat);

  for (let x0 of [L, R]) {
    let inner = x0 === L ? x0 + 1 : x0;
    if (look.eyes === "open" || look.eyes === "sad") {
      for (let i = 0; i < 2; i++) for (let j = 0; j < eyeH; j++) g[ey + j][x0 + i] = "k";
      g[ey][x0] = "w";
      if (look.eyes === "sad") g[ey - 1][x0 === L ? inner : inner] = "k"; // worried brows
    } else if (look.eyes === "happy") {
      g[ey][x0] = "k"; // ^ ^
      g[ey][x0 + 1] = "k";
      g[ey + 1][x0 - 1] = "k";
      g[ey + 1][x0 + 2] = "k";
    } else {
      g[ey + eyeH - 1][x0] = "k";
      g[ey + eyeH - 1][x0 + 1] = "k";
    }
  }

  // blush
  for (let bx of [L - 2, L - 1, R + 2, R + 3]) if (isFur(g[my][bx])) g[my][bx] = "p";

  // nose
  if (sp.bigNose) for (let i = -1; i <= 1; i++) g[my][mx + i] = "n";
  else g[my][mx] = "n";

  // mouth under the nose
  if (look.mouth === "open") {
    g[my + 1][mx] = "k";
    g[my + 2][mx - 1] = "k";
    g[my + 2][mx] = "p";
    g[my + 2][mx + 1] = "k";
    put(g, mx, my + 3, "p");
  } else if (look.mouth === "sad" || look.mouth === "sleep") {
    g[my + 1][mx] = "k";
    if (look.mouth === "sad") {
      g[my + 2][mx - 1] = "k";
      g[my + 2][mx + 1] = "k";
    }
  } else if (sp.bigNose || sp.bearMouth) {
    // ᴥ bear-style mouth
    g[my + 1][mx] = "k";
    g[my + 2][mx - 1] = "k";
    g[my + 2][mx + 1] = "k";
  } else if (si === 0) {
    g[my + 1][mx - 1] = "k";
    g[my + 1][mx + 1] = "k";
  } else {
    // ω
    for (let [dx, dy] of [[-2, 1], [-1, 2], [0, 1], [1, 2], [2, 1]]) g[my + dy][mx + dx] = "k";
  }

  if (sp.whiskers && si >= 1) {
    for (let y of [my, my + 1]) {
      let row = g[y];
      let l = row.findIndex(isFur);
      let r = row.length - 1 - [...row].reverse().findIndex(isFur);
      put(g, l - 1, y, "k");
      put(g, l - 2, y + (y === my ? -1 : 1), "k");
      put(g, r + 1, y, "k");
      put(g, r + 2, y + (y === my ? -1 : 1), "k");
    }
  }

  let headRow = g.findIndex((row) => row.some((c) => c !== "."));
  return { g, cx, cy: Math.round((hcy + bcy) / 2), headTop, headRow };
}

// ------------------------------------------------------------
// Species: each egg hatches into one of these
// ------------------------------------------------------------

// a triangle ear, leaning out a little
function triEar(g, x, baseY, h, w, side, tip = null, inner = "i") {
  for (let j = 0; j < h; j++) {
    let ww = max(1, Math.round(w * (1 - j / h)));
    let x0 = x + side * floor(j / 3) - floor(ww / 2);
    for (let i = 0; i < ww; i++) {
      let ch = "b";
      if (tip && j >= h - 2) ch = tip;
      else if (ww >= 3 && i > 0 && i < ww - 1 && j >= 1) ch = inner;
      put(g, x0 + i, baseY - j, ch);
    }
  }
}

function roundEars(g, c, col, inner) {
  let r = [1.4, 1.7, 2.1, 2.4][c.si];
  for (let s of [-1, 1]) {
    let ex = c.cx + s * Math.round(c.hrx * 0.62);
    blob(g, ex, c.headTop - 0.3, r, col);
    if (r > 1.6) put(g, ex, c.headTop - 1, inner);
    if (r > 2) put(g, ex, c.headTop - 2, inner);
  }
}

// a curving line of pixels
function trail(g, ax, ay, side, pts, colorAt) {
  pts.forEach(([dx, dy], i) => put(g, ax + side * dx, ay + dy, colorAt(i)));
}

const SPECIES = {
  kitten: {
    name: "kitten",
    colors: { b: "#f7b56e", s: "#de8d48", l: "#fff4e4", m: "#d97a35", i: "#ffb3c1", n: "#ff8fa3" },
    limb: "b", feet: "l", whiskers: true, egg: "stripes",
    ears(g, c) {
      for (let s of [-1, 1]) {
        triEar(g, c.cx + s * Math.round(c.hrx * 0.55), c.headTop + 1, [3, 4, 4, 5][c.si], [4, 4, 5, 5][c.si], s);
      }
    },
    tail(g, ax, ay, side, si, wag) {
      let len = [3, 5, 6, 7][si];
      let pts = [];
      for (let i = 0; i < len; i++) pts.push([min(i, 2) + 1, -max(0, i - 2)]);
      pts.push([wag ? 4 : 2, -(len - 2)]); // the tip flicks
      trail(g, ax, ay, side, pts, (i) => (i % 2 ? "m" : "b"));
      trail(g, ax, ay + 1, side, pts.slice(0, 2), () => "b");
    },
    markings(g, c, face, hat) {
      if (hat) return;
      for (let [dx, dy] of [[-2, 1], [0, 1], [0, 2], [2, 1]]) {
        if (isFur(g[c.headTop + dy][c.cx + dx])) g[c.headTop + dy][c.cx + dx] = "m";
      }
    },
  },

  bunny: {
    name: "bunny",
    colors: { b: "#f7f1ea", s: "#ddd1c4", l: "#ffffff", m: "#e3d5c6", i: "#ffb3c8", n: "#ff8fab" },
    limb: "b", feet: "l", egg: "spots", eggDot: "i",
    ears(g, c) {
      let h = [4, 6, 7, 8][c.si];
      let w = c.si === 0 ? 2 : 3;
      for (let s of [-1, 1]) {
        let x0 = c.cx + s * Math.round(c.hrx * 0.38) - (s < 0 ? w - 1 : 0);
        for (let j = 0; j < h; j++) {
          // grown-up bunnies get one floppy ear
          let flop = c.si === 3 && s === 1 && j >= h - 3;
          let y = flop ? c.headTop - (h - 4) + (j - (h - 4)) * 0 : c.headTop + 1 - j;
          let xx = flop ? x0 + (j - (h - 4)) : x0;
          for (let i = 0; i < w; i++) {
            let ch = w === 3 && i === 1 && j >= 1 && j < h - 1 ? "i" : "b";
            put(g, xx + i, y, ch);
          }
        }
      }
    },
    tail(g, ax, ay, side, si, wag) {
      blob(g, ax + side * (1 + wag * 0.4), ay + 0.5, [1.2, 1.5, 1.8, 2.1][si], "l");
    },
  },

  puppy: {
    name: "puppy",
    colors: { b: "#ecc893", s: "#cf9f62", l: "#fff6e6", m: "#9a6440", i: "#9a6440", n: "#3a2a24" },
    limb: "b", feet: "l", bigNose: true, egg: "spots",
    ears(g, c) {
      // floppy ears hanging down the sides of the head
      let h = [4, 5, 6, 7][c.si];
      for (let s of [-1, 1]) {
        for (let j = 0; j < h; j++) {
          let y = c.headTop + 1 + j;
          let edge = c.cx + s * Math.round(c.hrx * (0.75 + 0.15 * min(1, j / 2)));
          let w = j === h - 1 ? 2 : 3;
          for (let i = 0; i < w; i++) put(g, edge + s * (i - 1), y, "m");
        }
        put(g, c.cx + s * Math.round(c.hrx * 0.6), c.headTop, "m");
      }
    },
    tail(g, ax, ay, side, si, wag) {
      let len = [2, 3, 3, 4][si];
      let pts = [];
      for (let i = 0; i < len; i++) pts.push(wag ? [i + 1, -i - 1] : [1 + floor(i / 2), -i - 1]);
      trail(g, ax, ay, side, pts, (i) => (i === len - 1 ? "l" : "b"));
    },
    markings(g, c, face) {
      // muzzle and a patch around one eye
      blob(g, face.mx, face.my + 1, [2.2, 2.5, 3, 3.3][c.si], "l", "bs");
      if (c.si >= 1) blob(g, face.R + 0.5, face.ey + 0.5, 2, "m", "bsl");
    },
  },

  bear: {
    name: "bear cub",
    colors: { b: "#b07c5c", s: "#8f5f44", l: "#ecd2b5", m: "#7a4a35", i: "#ecd2b5", n: "#3a2420" },
    limb: "b", feet: "s", bigNose: true, egg: "spots",
    ears(g, c) {
      roundEars(g, c, "b", "i");
    },
    tail(g, ax, ay, side, si) {
      blob(g, ax + side, ay + 0.5, [1, 1.2, 1.4, 1.6][si], "b");
    },
    markings(g, c, face) {
      blob(g, face.mx, face.my + 1, [2.2, 2.5, 3, 3.3][c.si], "l", "bs");
    },
  },

  fox: {
    name: "fox",
    colors: { b: "#ff9a4d", s: "#e2722e", l: "#fffaf3", m: "#5a3d3a", i: "#fff1e3", n: "#2b1d2e" },
    limb: "b", feet: "m", egg: "stripes",
    ears(g, c) {
      for (let s of [-1, 1]) {
        triEar(g, c.cx + s * Math.round(c.hrx * 0.55), c.headTop + 1, [4, 5, 6, 7][c.si], [4, 5, 6, 6][c.si], s, "m");
      }
    },
    tail(g, ax, ay, side, si, wag) {
      // a big fluffy tail with a white tip
      let r = [1.8, 2.4, 3, 3.5][si];
      let tx = ax + side * (r + (wag ? 1 : 0));
      let ty = ay - r;
      blob(g, tx, ty, r, "b");
      blob(g, tx + side * r * 0.5, ty - r * 0.6, r * 0.55, "l");
      trail(g, ax, ay, side, [[0, 0], [1, 0]], () => "b");
    },
    markings(g, c, face) {
      // white cheeks
      for (let y = face.my; y <= c.headBot; y++) {
        for (let x = 0; x < g[y].length; x++) if (isFur(g[y][x])) g[y][x] = "l";
      }
    },
  },

  panda: {
    name: "panda",
    colors: { b: "#ffffff", s: "#e3e1ea", l: "#ffffff", m: "#4a4452", i: "#4a4452", n: "#2b1d2e", j: "#686075" },
    limb: "m", feet: "m", egg: "patches", bearMouth: true,
    ears(g, c) {
      roundEars(g, c, "m", "m");
    },
    tail(g, ax, ay, side, si) {
      blob(g, ax + side, ay + 0.5, [1, 1.2, 1.4, 1.6][si], "b");
    },
    markings(g, c, face) {
      // black eye patches
      for (let x0 of [face.L, face.R]) {
        let out = x0 === face.L ? -0.6 : 0.6;
        blob(g, x0 + 0.5 + out, face.ey + face.eyeH / 2 - 0.5, face.eyeH === 3 ? 2 : 1.7, "j", "bs");
      }
    },
  },
};

const SPECIES_IDS = Object.keys(SPECIES);

// ------------------------------------------------------------
// The closet: hats and clothes (some unlock as it grows)
// ------------------------------------------------------------

const HATS = [
  { id: "bow", name: "bow", stage: 0, side: true, rows: ["BB.BB", "BBDBB", "BB.BB"] },
  {
    id: "party", name: "party", stage: 0,
    rows: ["...Y...", "..YYY..", "...B...", "..BBB..", "..UUU..", ".BBBBB.", ".UUUUU.", "BBBBBBB"],
  },
  { id: "beanie", name: "beanie", stage: 1, rows: ["...qqq...", "..UUUUU..", ".UUUUUUU.", ".UVUVUVU.", "VVVVVVVVV"] },
  {
    id: "sunhat", name: "sun hat", stage: 1,
    rows: ["....TTTTT....", "...TTTTTTT...", "...BBBBBBB...", "TTTTTTTTTTTTT", ".SSSSSSSSSSS."],
  },
  {
    id: "frog", name: "frog", stage: 2,
    rows: [".FFF...FFF.", "FqkFF.FFkqF", "FFFFFFFFFFF", "FFEFFFFFEFF", "FFFEEEEEFFF", "EEEEEEEEEEE"],
  },
  { id: "crown", name: "crown", stage: 3, rows: ["Y...Y...Y", "YY.YYY.YY", "YYYYYYYYY", "YrYYUYYrY", "OOOOOOOOO"] },
];

// paint a cloth color over body pixels; shaded pixels get the darker tone
function dye(g, mask, x, y, light, dark) {
  if (!mask[y] || mask[y][x] !== "x") return;
  let c = g[y][x];
  if (c === "b" || c === "l") g[y][x] = light;
  else if (c === "s") g[y][x] = dark;
}

function bodyRow(mask, y) {
  return [mask[y].indexOf("x"), mask[y].lastIndexOf("x")];
}

const CLOTHES = [
  {
    id: "scarf", name: "scarf", stage: 0,
    paint(g, mask, c) {
      let y = c.headBot;
      let [l, r] = bodyRow(mask, y + 1);
      for (let yy of [y, y + 1]) {
        for (let x = l - 1; x <= r + 1; x++) put(g, x, yy, x % 4 < 2 ? "r" : "q");
      }
      // the end of the scarf hangs down
      let tx = c.cx - c.side * 2;
      for (let yy = y + 2; yy <= min(y + 3, c.footY); yy++) put(g, tx, yy, yy % 2 ? "r" : "q");
    },
  },
  {
    id: "sweater", name: "sweater", stage: 1, sleeve: "P",
    paint(g, mask, c) {
      for (let y = c.bodyTop; y <= c.footY; y++) {
        let stripe = y === c.headBot + 2;
        for (let x = 0; x < g[y].length; x++) dye(g, mask, x, y, stripe ? "q" : "P", stripe ? "q" : "Q");
      }
      if (c.si >= 2) {
        let hy = c.headBot + 3;
        for (let [dx, dy] of [[-1, 0], [1, 0], [-1, 1], [0, 1], [1, 1], [0, 2]]) put(g, c.cx + dx, hy + dy, "B");
      }
    },
  },
  {
    id: "overalls", name: "overalls", stage: 2,
    paint(g, mask, c) {
      let top = Math.round(c.bcy);
      for (let y = top; y <= c.footY; y++) {
        for (let x = 0; x < g[y].length; x++) dye(g, mask, x, y, "U", "V");
      }
      let sx = max(1, Math.round(c.brx * 0.45));
      for (let y = c.headBot + 1; y < top; y++) {
        dye(g, mask, c.cx - sx, y, "U", "V");
        dye(g, mask, c.cx + sx, y, "U", "V");
      }
      put(g, c.cx - sx, top, "Y");
      put(g, c.cx + sx, top, "Y");
      if (top + 2 <= c.footY) for (let dx = -1; dx <= 1; dx++) put(g, c.cx + dx, top + 2, "V"); // pocket
    },
  },
  {
    id: "dress", name: "tutu", stage: 2,
    paint(g, mask, c) {
      let skirt = Math.round(c.bcy);
      for (let y = c.bodyTop; y <= c.footY; y++) {
        let [l, r] = bodyRow(mask, y);
        if (l < 0) continue;
        for (let x = l; x <= r; x++) dye(g, mask, x, y, "B", "D");
        // the skirt puffs out on both sides
        if (y >= skirt) {
          let puff = y === c.footY ? 2 : 1;
          for (let i = 1; i <= puff; i++) {
            put(g, l - i, y, "B");
            put(g, r + i, y, "D");
          }
        }
      }
      // ruffle along the hem
      let hem = g[c.footY];
      for (let x = 0; x < hem.length; x += 2) if ("BD".includes(hem[x])) hem[x] = "q";
    },
  },
];

function hookCloset() {
  let closet = document.getElementById("closet");
  document.getElementById("closetBtn").onclick = () => {
    closet.classList.toggle("hidden");
    if (!closet.classList.contains("hidden")) fillCloset();
  };
  document.getElementById("closetClose").onclick = () => closet.classList.add("hidden");
}

function fillCloset() {
  shelf("hatShelf", HATS, "hat");
  shelf("clothShelf", CLOTHES, "cloth");
}

function shelf(id, items, slot) {
  let el = document.getElementById(id);
  el.innerHTML = "";
  for (let item of [null, ...items]) {
    let locked = item && item.stage > pet.stage;
    let on = (pet[slot] || null) === (item ? item.id : null);
    let tile = document.createElement("button");
    tile.className = "tile" + (on ? " on" : "") + (locked ? " locked" : "");

    let cv = document.createElement("canvas");
    let wear = outfit();
    wear[slot] = item || undefined;
    renderPreview(cv, wear);
    tile.appendChild(cv);

    let label = document.createElement("span");
    label.textContent = locked ? "grows: " + STAGES[item.stage].name : item ? item.name : "none";
    tile.appendChild(label);

    tile.onclick = () => {
      if (locked) {
        say("when I'm " + STAGES[item.stage].name + "!");
        return;
      }
      pet[slot] = item ? item.id : null;
      if (item) {
        say(random(["how do I look?", "so cute!", "I love it!"]));
        sparks(petBox.x, petBox.y, 14);
        cheer = 1.2;
      }
      savePet();
      fillCloset();
    };
    el.appendChild(tile);
  }
}

// a small still picture of the creature wearing something
function renderPreview(cv, wear) {
  let si = pet.stage;
  let { g, headRow } = buildPet(si, { eyes: "open", mouth: "smile", stepFoot: 0, face: 0 }, wear);
  let rows = g.slice(headRow);
  let s = 3;
  let w = rows[0].length;
  cv.width = w * s;
  cv.height = rows.length * s;
  let ctx = cv.getContext("2d");
  let pal = palette();
  for (let y = 0; y < rows.length; y++) {
    for (let x = 0; x < w; x++) {
      if (rows[y][x] === ".") continue;
      ctx.fillStyle = pal[rows[y][x]];
      ctx.fillRect(x * s, y * s, s, s);
    }
  }
}

// ------------------------------------------------------------
// Grid helpers
// ------------------------------------------------------------

function emptyGrid(w, h) {
  let g = [];
  for (let y = 0; y < h; y++) g.push(new Array(w).fill("."));
  return g;
}

function setIf(g, x, y, ch) {
  if (g[y] && g[y][x] !== undefined && g[y][x] !== "." && g[y][x] !== "o") g[y][x] = ch;
}

// every empty cell touching a colored cell becomes outline
function addOutline(g) {
  let marks = [];
  for (let y = 0; y < g.length; y++) {
    for (let x = 0; x < g[y].length; x++) {
      if (g[y][x] !== ".") continue;
      let near =
        (y > 0 && g[y - 1][x] !== ".") ||
        (y < g.length - 1 && g[y + 1][x] !== ".") ||
        (x > 0 && g[y][x - 1] !== ".") ||
        (x < g[y].length - 1 && g[y][x + 1] !== ".");
      if (near) marks.push([x, y]);
    }
  }
  for (let [x, y] of marks) g[y][x] = "o";
}

function drawGrid(g, left, top, mirror, pal = COLORS) {
  noStroke();
  for (let y = 0; y < g.length; y++) {
    for (let x = 0; x < g[y].length; x++) {
      let ch = g[y][x];
      if (ch === ".") continue;
      let gx = mirror ? g[y].length - 1 - x : x;
      fill(pal[ch]);
      rect(left + gx * P, top + y * P, P, P);
    }
  }
}

function drawSprite(rows, left, top, px, alpha = 255, skip = null) {
  noStroke();
  for (let y = 0; y < rows.length; y++) {
    for (let x = 0; x < rows[y].length; x++) {
      let ch = rows[y][x];
      if (ch === "." || (skip && skip(x, rows[y].length))) continue;
      let c = color(COLORS[ch]);
      c.setAlpha(alpha);
      fill(c);
      rect(left + x * px, top + y * px, px, px);
    }
  }
}

// ------------------------------------------------------------
// Food
// ------------------------------------------------------------

function updateFoods() {
  for (let f of foods) {
    if (!f.landed) {
      f.vy += 0.12 * P;
      f.y += f.vy;
      if (f.y >= groundY) {
        f.y = groundY;
        f.landed = true;
      }
    }
    let rows = f.kind === "apple" ? APPLE : BERRY;
    let w = rows[0].length;
    let left = snap(f.x - (w * P) / 2);
    let top = snap(f.y - (rows.length - 1) * P);

    // bites disappear from the side it's eating from
    let skip = null;
    if (f === eatingFood) {
      let bite = floor((1 - eatTimer / 1.6) * w);
      skip = (col, n) => (dir === 1 ? col < bite : col >= n - bite);
    }
    drawSprite(rows, left, top, P, 255, skip);
  }
}

// ------------------------------------------------------------
// Particles: hearts, sparkles, crumbs, z's
// ------------------------------------------------------------

function hearts(hx, hy, n) {
  for (let i = 0; i < n; i++) {
    particles.push({
      kind: "heart", x: hx + random(-P * 4, P * 4), y: hy - random(P * 2, P * 6),
      vx: random(-0.2, 0.2) * P / 4, vy: random(-0.9, -0.5) * P / 4, g: 0, life: 70,
    });
  }
}

function sparks(sx, sy, n) {
  for (let i = 0; i < n; i++) {
    let a = random(TWO_PI);
    let sp = random(0.5, 2) * P / 3;
    particles.push({
      kind: "dot", col: random([COLORS.f, COLORS.w, COLORS.p]),
      x: sx, y: sy, vx: cos(a) * sp, vy: sin(a) * sp, g: 0.02 * P, life: random(30, 55),
    });
  }
}

function crumbs(cx, cy, n) {
  for (let i = 0; i < n; i++) {
    particles.push({
      kind: "dot", col: COLORS.r,
      x: cx, y: cy, vx: random(-1, 1) * P / 4, vy: random(-1.5, -0.5) * P / 4, g: 0.08 * P, life: 30,
    });
  }
}

function updateParticles() {
  noStroke();
  for (let i = particles.length - 1; i >= 0; i--) {
    let p = particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.vy += p.g;
    p.life--;
    let a = min(1, p.life / 20) * 255;

    if (p.kind === "heart") {
      let hp = max(2, floor(P / 2));
      drawSprite(HEART, round(p.x - 3.5 * hp), round(p.y), hp, a);
    } else if (p.kind === "z") {
      fill(255, 255, 255, a);
      textSize(P * 3);
      textAlign(CENTER, CENTER);
      text("z", p.x, p.y);
    } else {
      let c = color(p.col);
      c.setAlpha(a);
      fill(c);
      rect(snap(p.x), snap(p.y), P, P);
    }
    if (p.life <= 0) particles.splice(i, 1);
  }
}

// ------------------------------------------------------------
// Speech bubble
// ------------------------------------------------------------

function say(t) {
  bubble.text = t;
  bubble.t = 150;
}

function drawBubble() {
  if (bubble.t <= 0 || !petBox) return;
  bubble.t--;

  let ts = max(8, round(P * 1.8));
  textSize(ts);
  let tw = snap(textWidth(bubble.text) + P * 6);
  let th = snap(ts + P * 5);
  let bx = snap(constrain(petBox.x - tw / 2, P * 2, width - tw - P * 2));
  let by = snap(petBox.head - th - P * 2);

  noStroke();
  fill(COLORS.o);
  rect(bx, by, tw, th);
  rect(snap(petBox.x) - P, by + th, P * 3, P);
  rect(snap(petBox.x), by + th + P, P, P);
  fill("#ffffff");
  rect(bx + P, by + P, tw - 2 * P, th - 2 * P);
  rect(snap(petBox.x), by + th - P, P, P * 2);

  fill(COLORS.o);
  textAlign(CENTER, CENTER);
  text(bubble.text, bx + tw / 2, by + th / 2 + 1);
}

function drawHint(t) {
  noStroke();
  fill("#3f6e3a");
  textAlign(CENTER, BOTTOM);
  textSize(max(9, round(P * 1.6)));
  text(t, width / 2, height - 24);
}

// ------------------------------------------------------------
// The world: sky, hills, a tree with apples, a leaf bed
// ------------------------------------------------------------

function makeSky() {
  clouds = [];
  stars = [];
  flies = [];
  for (let i = 0; i < 4; i++) {
    clouds.push({ x: random(width), y: random(height * 0.06, height * 0.4), v: random(0.1, 0.35) });
  }
  for (let i = 0; i < 40; i++) {
    stars.push({ x: random(width), y: random(0, groundY - P * 24), t: random(TWO_PI) });
  }
  for (let i = 0; i < 8; i++) {
    flies.push({ x: random(width), y: random(groundY - P * 30, groundY + P * 10), t: random(1000) });
  }
}

function drawSky() {
  let dayTop = color("#8fd3ff");
  let dayLow = color("#e6f7ff");
  let nightTop = color("#141233");
  let nightLow = color("#3a3266");
  noStroke();
  let bands = 10;
  let bh = ceil(groundY / bands / P) * P;
  for (let i = 0; i < bands; i++) {
    let t = i / (bands - 1);
    let day = lerpColor(dayTop, dayLow, t);
    let night = lerpColor(nightTop, nightLow, t);
    fill(lerpColor(day, night, darkness));
    rect(0, i * bh, width, bh);
  }
  fill(lerpColor(dayLow, nightLow, darkness));
  rect(0, bands * bh, width, height);

  // sun
  if (darkness < 0.5) pixelDisc(snap(width * 0.32), snap(height * 0.14), 6, "#ffd54a", "#fff1a8", "#f5b83d");

  // clouds
  for (let c of clouds) {
    c.x += c.v;
    if (c.x > width + P * 20) c.x = -P * 20;
    let w = color("#ffffff");
    w.setAlpha(255 * (1 - darkness * 0.8));
    noStroke();
    fill(w);
    for (let y = 0; y < CLOUD.length; y++) {
      for (let x = 0; x < CLOUD[y].length; x++) {
        if (CLOUD[y][x] === "w") rect(snap(c.x) + x * P, snap(c.y) + y * P, P, P);
      }
    }
  }
}

// night: darken the land, then add the moon, stars and fireflies
function drawNight() {
  if (darkness < 0.02) return;
  noStroke();
  fill(20, 18, 60, 130 * darkness);
  rect(0, 0, width, height);

  let a = constrain((darkness - 0.3) / 0.7, 0, 1);
  if (a <= 0) return;

  for (let s of stars) {
    fill(255, 250, 220, 255 * a * (0.5 + 0.5 * sin(frameCount * 0.05 + s.t)));
    rect(snap(s.x), snap(s.y), P, P);
  }

  if (darkness > 0.5) {
    let mx = snap(width * 0.32);
    let my = snap(height * 0.14);
    pixelDisc(mx, my, 5, "#fff4c2", "#ffffff", "#e8dca0");
    fill("#e8dca0");
    rect(mx - P * 2, my - P, P * 2, P * 2);
    rect(mx + P * 2, my + P * 2, P, P);
  }

  for (let f of flies) {
    f.t += 0.01;
    let fx = snap(f.x + sin(f.t * 3) * P * 12);
    let fy = snap(f.y + cos(f.t * 2) * P * 6);
    fill(255, 240, 120, 255 * a * (0.5 + 0.5 * sin(f.t * 20)));
    rect(fx, fy, P, P);
  }
}

function drawSceneLayer() {
  if (sceneLayer) sceneLayer.remove();
  sceneLayer = createGraphics(width, height);
  let pg = sceneLayer;
  pg.noSmooth();
  pg.noStroke();

  // two rows of rolling hills
  hills(pg, "#bfe8ae", 14, 0.04, 1.3);
  hills(pg, "#9ed98c", 7, 0.07, 4.1);

  // grass
  pg.fill("#7cc96a");
  pg.rect(0, groundY + P, width, height);
  pg.fill("#9fe08a");
  pg.rect(0, groundY + P, width, P);
  pg.fill("#6cb85b");
  pg.rect(0, snap(height * 0.9), width, height);

  // grass blades + flowers
  randomSeed(7);
  for (let i = 0; i < width / (P * 6); i++) {
    let fx = snap(random(width));
    let fy = snap(random(groundY + P * 4, height - P * 6));
    if (random() < 0.3) {
      let petal = random(["#ffffff", "#ffd1e0", "#fff4a3"]);
      pg.fill(petal);
      pg.rect(fx - P, fy, P, P);
      pg.rect(fx + P, fy, P, P);
      pg.rect(fx, fy - P, P, P);
      pg.rect(fx, fy + P, P, P);
      pg.fill(COLORS.c);
      pg.rect(fx, fy, P, P);
    } else {
      pg.fill("#5fae55");
      pg.rect(fx, fy, P, P * 2);
      pg.rect(fx + P * 2, fy + P, P, P);
      pg.rect(fx - P * 2, fy + P, P, P);
    }
  }
  randomSeed(millis());

  // tree
  pg.fill("#7a5235");
  pg.rect(treeX - P * 3, treeTop + P * 18, P * 6, groundY - treeTop - P * 17);
  pg.fill("#9a6a44");
  pg.rect(treeX - P * 2, treeTop + P * 18, P * 2, groundY - treeTop - P * 17);
  pixelDisc(treeX - P * 9, treeTop + P * 14, 9, "#5fb35a", "#7fcf6f", "#3f8a4a", pg);
  pixelDisc(treeX + P * 9, treeTop + P * 14, 9, "#5fb35a", "#7fcf6f", "#3f8a4a", pg);
  pixelDisc(treeX, treeTop + P * 8, 12, "#5fb35a", "#7fcf6f", "#3f8a4a", pg);
  for (let [ax, ay] of [[-6, 4], [5, 7], [1, -2], [-11, 14], [10, 16], [-2, 13]]) {
    pg.fill(COLORS.r);
    pg.rect(treeX + ax * P, treeTop + P * 8 + ay * P, P * 2, P * 2);
    pg.fill("#ffffff");
    pg.rect(treeX + ax * P, treeTop + P * 8 + ay * P, P, P);
  }
}

function hills(pg, col, amp, freq, seed) {
  pg.fill(col);
  for (let i = 0; i * P < width; i++) {
    let h = amp + sin(i * freq + seed) * amp * 0.6 + sin(i * freq * 2.3) * amp * 0.25;
    let top = groundY - snap(h * P);
    pg.rect(i * P, top, P, groundY - top + P);
  }
}

function pixelDisc(cx, cy, r, base, light, dark, pg = window) {
  pg.noStroke();
  for (let j = -r; j <= r; j++) {
    for (let i = -r; i <= r; i++) {
      let d = i * i + j * j;
      if (d > r * r) continue;
      let c = base;
      if (d > (r - 1) * (r - 1)) c = dark;
      else if (i + j < -r * 0.6) c = light;
      pg.fill(c);
      pg.rect(cx + i * P, cy + j * P, P, P);
    }
  }
}

// the leaf bed is drawn in two halves so the creature looks tucked in
function drawBedBack() {
  bedHalf(false);
}

function drawBedFront() {
  bedHalf(true);
}

function bedHalf(front) {
  let cy = groundY - P * 2;
  let rx = 16;
  let ry = 5;
  let night = color(40, 36, 90);
  let k = front ? darkness * 0.5 : 0; // the back half is already under the night overlay
  let dark = lerpColor(color("#4f9a55"), night, k);
  let light = lerpColor(color("#8fd47f"), night, k);
  let vein = lerpColor(color("#6fbf63"), night, k);
  let edge = lerpColor(color("#3f8a4a"), night, k);
  noStroke();
  for (let j = -ry; j <= ry; j++) {
    if (front !== j >= 1) continue;
    for (let i = -rx; i <= rx; i++) {
      let nx = i / rx;
      let ny = j / ry;
      if (nx * nx + ny * ny > 1) continue;
      let onEdge = (i * i) / ((rx - 1) * (rx - 1)) + (j * j) / ((ry - 1) * (ry - 1)) > 1;
      if (onEdge) fill(edge);
      else if (front && j === 2 && abs(i) < rx - 3) fill(vein);
      else fill(front ? light : dark);
      rect(bedX + i * P, cy + j * P, P, P);
    }
  }
  // little stem curling off the end
  if (front) {
    fill(edge);
    rect(bedX + (rx + 1) * P, cy, P, P);
    rect(bedX + (rx + 2) * P, cy - P, P, P);
  }
}

// ------------------------------------------------------------

function snap(v) {
  return floor(v / P) * P;
}
