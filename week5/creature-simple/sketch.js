// Pocket Critter (simple version)
//
// A tiny pixel pet that lives on this page.
//   1. Tap the egg 4 times and it hatches. Give it a name.
//   2. It has 3 needs: FULL (food), ENERGY (sleep), HAPPY (petting).
//      They slowly go down over time.
//   3. FEED drops an apple. Clicking the grass drops a berry.
//      SLEEP sends it to bed. Wiggling the mouse on it pets it.
//   4. Eating and petting give it XP. With enough XP it grows bigger.
//   5. It is saved in the browser, so it's still there next time.
//
// The file is in 8 parts:
//   1. DATA     pixel art and lists (species, hats, clothes)
//   2. STATE    variables that change while it runs
//   3. SETUP    runs once at the start
//   4. DRAW     runs 60 times a second
//   5. BRAIN    decides what the pet does
//   6. INPUT    clicks and buttons
//   7. SAVING   remember the pet between visits
//   8. PICTURES drawing the world, the egg, the pet and the effects

// ============================================================
// 1. DATA
// ============================================================

// Pixel art is written as text. Each letter is one colored square
// and "." is empty. A color table turns letters into colors.
//   o = outline   b = fur   l = belly

// The pet's head and body. Ears, tail, face and hat go on top of this.
const PET_ART = [
  "...ooooooooo...", // row 0: top of head
  "..obbbbbbbbbo..",
  ".obbbbbbbbbbbo.",
  "obbbbbbbbbbbbbo",
  "obbbbbbbbbbbbbo", // row 4: eyes
  "obbbbbbbbbbbbbo",
  "obbbbbbbbbbbbbo", // row 6: nose and blush
  ".obbbbbbbbbbbo.", // row 7: mouth
  "..ooobbbbbooo..", // row 8: neck
  "...oblllllbo...", // row 9: body
  "...oblllllbo...",
  "...obbbbbbbo...",
  "...obbo.obbo...", // row 12: legs
  "...oooo.oooo...",
];

// Ears sit on top of the head.  e = ear color, i = inside of the ear
const EARS = {
  pointy: [
    ".o...........o.",
    ".oo.........oo.",
    ".oeo.......oeo.",
    ".oeio.....oieo.",
  ],
  long: [
    "...ooo...ooo...",
    "..oeieo.oeieo..",
    "..oeieo.oeieo..",
    "..oeieo.oeieo..",
    "..oeieo.oeieo..",
    "...oeo...oeo...",
  ],
  round: [
    "..ooo.....ooo..",
    ".oeeeo...oeeeo.",
    ".oeieo...oeieo.",
  ],
  floppy: [
    "..oooo...oooo..",
    ".oeeeeo.oeeeeo.",
    "..oeeo...oeeo..",
  ],
};

// Tails stick out of the back (drawn for the right side, flipped for the left).
// t = tail color, w = white tip
const TAILS = {
  long: ["....oo", "...oto", "..oto.", ".oto..", "oto..."],
  puff: [".oo.", "otto", ".oo."],
  fluffy: ["..ooo.", ".owwwo", "ottwo.", "ottto.", "otto.."],
};

// Each egg hatches into one of these.
// colors: b fur, l belly, e ears, i inner ear, t tail, n nose
// spot: the color of the spots on its egg (a hint of what's inside)
const SPECIES = {
  kitten: {
    name: "kitten", ears: "pointy", tail: "long", whiskers: true, spot: "#d97a35",
    colors: { b: "#f7b56e", l: "#fff4e4", e: "#f7b56e", i: "#ffb3c1", t: "#d97a35", n: "#ff8fa3" },
  },
  bunny: {
    name: "bunny", ears: "long", tail: "puff", spot: "#ffb3c8",
    colors: { b: "#f7f1ea", l: "#ffffff", e: "#f7f1ea", i: "#ffb3c8", t: "#ffffff", n: "#ff8fab" },
  },
  puppy: {
    name: "puppy", ears: "floppy", tail: "long", spot: "#9a6440",
    colors: { b: "#ecc893", l: "#fff6e6", e: "#9a6440", i: "#9a6440", t: "#ecc893", n: "#3a2a24" },
  },
  bear: {
    name: "bear cub", ears: "round", tail: "puff", spot: "#b07c5c",
    colors: { b: "#b07c5c", l: "#ecd2b5", e: "#b07c5c", i: "#ecd2b5", t: "#b07c5c", n: "#3a2420" },
  },
  fox: {
    name: "fox", ears: "pointy", tail: "fluffy", spot: "#ff9a4d",
    colors: { b: "#ff9a4d", l: "#fffaf3", e: "#ff9a4d", i: "#5a3d3a", t: "#ff9a4d", n: "#2b1d2e" },
  },
  panda: {
    name: "panda", ears: "round", tail: "puff", eyePatches: true, spot: "#4a4452",
    colors: { b: "#ffffff", l: "#ffffff", e: "#4a4452", i: "#4a4452", t: "#ffffff", n: "#2b1d2e" },
  },
};
const SPECIES_IDS = Object.keys(SPECIES);

// Colors that everything shares
const BASE_COLORS = {
  o: "#5a3d5c", // outline
  k: "#2b1d2e", // eyes, mouth
  w: "#ffffff", // white
  p: "#ff8fab", // pink: blush, hearts
  r: "#e8505b", // red: fruit
  R: "#b83a48", // dark red
  G: "#3f8a4a", // dark green: stems
  g: "#7bc96f", // green: leaves
  y: "#ffe08a", // yellow: seeds
  // the hat colors
  q: "#fffaf0", B: "#ff6f9c", D: "#d94c7c", U: "#6fb8ff", V: "#3f86d9",
  Y: "#ffcc33", O: "#e0961a", T: "#f2d28b", S: "#c9a35b", F: "#8ed36f", E: "#5a9e45",
};

// It grows through 4 stages. size = how big each art pixel is (times P).
const STAGES = [
  { name: "baby", xp: 0, size: 0.8 },
  { name: "little", xp: 4, size: 1.0 },
  { name: "big", xp: 10, size: 1.2 },
  { name: "grown", xp: 18, size: 1.4 },
];

// Hats: pixel art drawn on the head. stage = when it unlocks.
const HATS = [
  { id: "bow", name: "bow", stage: 0, dx: 3, rows: ["BB.BB", "BBDBB", "BB.BB"] },
  { id: "party", name: "party", stage: 0,
    rows: ["...Y...", "..YYY..", "...B...", "..BBB..", "..UUU..", ".BBBBB.", ".UUUUU.", "BBBBBBB"] },
  { id: "beanie", name: "beanie", stage: 1, rows: ["...qqq...", "..UUUUU..", ".UUUUUUU.", ".UVUVUVU.", "VVVVVVVVV"] },
  { id: "sunhat", name: "sun hat", stage: 1,
    rows: ["....TTTTT....", "...TTTTTTT...", "...BBBBBBB...", "TTTTTTTTTTTTT", ".SSSSSSSSSSS."] },
  { id: "frog", name: "frog", stage: 2,
    rows: [".FFF...FFF.", "FqkFF.FFkqF", "FFFFFFFFFFF", "FFEFFFFFEFF", "FFFEEEEEFFF", "EEEEEEEEEEE"] },
  { id: "crown", name: "crown", stage: 3, rows: ["Y...Y...Y", "YY.YYY.YY", "YYYYYYYYY", "YrYYUYYrY", "OOOOOOOOO"] },
];

// Clothes: they recolor some rows of the body (see dressUp)
const CLOTHES = [
  { id: "scarf", name: "scarf", stage: 0, color: "#e8505b", rows: [8, 9] },
  { id: "sweater", name: "sweater", stage: 1, color: "#b48cff", rows: [9, 10, 11] },
  { id: "overalls", name: "overalls", stage: 2, color: "#6fb8ff", rows: [10, 11, 12] },
  { id: "dress", name: "tutu", stage: 2, color: "#ff6f9c", rows: [10, 11] },
];

// The egg. e = shell, s = spots (in the color of the animal inside)
const EGG = [
  "....ooooo....",
  "...oeeeeeo...",
  "..oeesseeeo..",
  ".oeeesseeeeo.",
  ".oeeeeeeesso.",
  "oesseeeeeeeeo",
  "oeeeeesseeeeo",
  "oeeeeeeeeesso",
  "oeesseeeeeeeo",
  ".oeeeeesseeo.",
  "..oeeeeeeeo..",
  "...ooooooo...",
];
// One crack appears each time you tap the egg: [column, row] squares
const CRACKS = [
  [[6, 1], [7, 2], [6, 3], [7, 4]],
  [[2, 6], [3, 7], [4, 6], [5, 7]],
  [[8, 5], [9, 6], [10, 5], [9, 7]],
];

const APPLE = ["...G..", "..G...", ".rrrr.", "rrwrrr", "rrrrrR", "rrrrRR", ".rRRR."];
const BERRY = [".GgG.", "rrrrr", "rwryr", ".ryr.", "..r.."];
const HEART = [".pp.pp.", "ppppppp", "ppppppp", ".ppppp.", "..ppp..", "...p..."];
const CLOUD = ["....wwww......", "..wwwwwwww.ww.", ".wwwwwwwwwwwww", "wwwwwwwwwwwwww"];

const SAVE_KEY = "mochi-sprout"; // same key as the big version, so your pet carries over
const HISTORY_KEY = "mochi-sprout-species"; // species you have already raised

// ============================================================
// 2. STATE
// ============================================================

let P; // the size of one art pixel on screen
let groundY, bedX, treeX;

let phase = "egg"; // "egg" -> "naming" -> "live"
let pet; // everything that gets saved (name, species, stats, outfit)

// what the pet is doing right now:
// "idle" | "wander" | "follow" | "toFood" | "eating" | "toBed" | "sleeping"
let mode = "idle";

let x; // where it stands
let targetX; // where it wants to go
let walkSpeed = 0;
let walking = false;
let dir = 1; // 1 = facing right, -1 = facing left
let hopY = 0; // how high it is in the air (negative = up)
let vy = 0; // vertical speed of a hop

let wanderX, wanderTimer = 0;
let eatingFood = null, eatTimer = 0;
let cheer = 0; // seconds of happy ^ ^ eyes left
let moodTimer = 10; // seconds until it complains about its needs
let saveTimer = 0, heartTimer = 0, zTimer = 0;
let darkness = 0; // 0 = day, 1 = night
let eggTaps = 0, eggShake = 0;

let bubble = { text: "", time: 0 }; // the speech bubble
let petBox = null; // where the pet is on screen, for clicks and petting
let eggBox = null;
let lastMouseX = 0, lastMouseY = 0;

let foods = [];
let particles = []; // hearts, sparkles and z's
let clouds = [];
let stars = [];
let flowers = [];

// ============================================================
// 3. SETUP
// ============================================================

function setup() {
  let canvas = createCanvas(windowWidth, windowHeight);
  canvas.mousePressed(onPress);
  noSmooth();
  textFont("Press Start 2P");
  layout();

  pet = loadPet();
  if (pet && pet.name) {
    // welcome back!
    phase = "live";
    if (!SPECIES[pet.species]) pet.species = pickSpecies();
    pet.stage = stageFromXp();
    if (pet.sleeping) mode = "sleeping";
    timePassedWhileAway();
    showHud();
  } else {
    pet = newPet();
  }

  x = mode === "sleeping" ? bedX : width / 2;
  targetX = x;
  wanderX = x;
  if (mode === "sleeping") darkness = 1;

  hookButtons();
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  layout();
  x = mode === "sleeping" ? bedX : constrain(x, P * 10, width - P * 10);
}

// work out sizes and positions from the window size
function layout() {
  P = max(3, floor(min(width, height) / 95));
  groundY = round(height * 0.74);
  bedX = round(width * 0.16);
  treeX = round(width * 0.84);

  clouds = [];
  stars = [];
  flowers = [];
  for (let i = 0; i < 4; i++) {
    clouds.push({ x: random(width), y: random(height * 0.06, height * 0.4), speed: random(0.1, 0.35) });
  }
  for (let i = 0; i < 40; i++) {
    stars.push({ x: random(width), y: random(groundY - P * 24), twinkle: random(TWO_PI) });
  }
  for (let i = 0; i < width / (P * 8); i++) {
    flowers.push({ x: random(width), y: random(groundY + P * 4, height - P * 4), color: random(["#ffffff", "#ffd1e0", "#fff4a3"]) });
  }
}

// ============================================================
// 4. DRAW: every frame, think -> move -> draw
// ============================================================

function draw() {
  let dt = min(deltaTime / 1000, 0.1); // seconds since the last frame

  // fade slowly towards night while it sleeps, and back to day when it wakes
  darkness = lerp(darkness, mode === "sleeping" ? 1 : 0, 0.03);

  drawWorld();
  updateFoods();

  if (phase === "egg") {
    drawEgg();
    drawHint("tap the egg!");
  } else {
    if (phase === "live") {
      think(dt);
      updateStats(dt);
      checkPetting(dt);
    }
    move();
    drawPet();
  }

  drawBedFront(); // drawn after the pet, so it looks tucked in
  updateParticles();
  drawBubble();

  if (phase === "live") {
    updateHud();
    // save every 2 seconds
    saveTimer -= dt;
    if (saveTimer <= 0) {
      savePet();
      saveTimer = 2;
    }
  }

  cursor(isOver(petBox) || (phase === "egg" && isOver(eggBox)) ? HAND : ARROW);
  lastMouseX = mouseX;
  lastMouseY = mouseY;
}

// ============================================================
// 5. BRAIN: what should it do right now?
// ============================================================

function think(dt) {
  // asleep: wake up when fully rested
  if (mode === "sleeping") {
    if (pet.energy >= 100) wake("good morning!");
    return;
  }

  // eating: wait until the food is gone
  if (mode === "eating") {
    eatTimer -= dt;
    if (eatTimer <= 0) finishMeal();
    return;
  }

  // out of energy: falls asleep right where it is
  if (pet.energy <= 0) {
    mode = "sleeping";
    say("so sleepy...");
    return;
  }

  // you pressed SLEEP: walk to bed
  if (mode === "toBed") {
    walkTo(bedX, 0.55);
    if (isNear(bedX)) {
      mode = "sleeping";
      say("good night...");
    }
    return;
  }

  // there's food and it's hungry: go eat it
  let food = nearestFood();
  if (food && pet.full < 90) {
    mode = "toFood";
    walkTo(food.x, 0.65);
    if (isNear(food.x)) {
      mode = "eating";
      eatingFood = food;
      eatTimer = 1.6;
    }
    return;
  }
  if (food && !food.refused) {
    food.refused = true;
    say("I'm full!");
  }

  // happy: follow the mouse. Not happy: wander around slowly.
  if (isHappy()) {
    mode = "follow";
    walkTo(constrain(mouseX, P * 10, width - P * 10), 0.8);
  } else {
    mode = "wander";
    wanderTimer -= dt;
    if (wanderTimer <= 0) {
      wanderX = random(P * 12, width - P * 12);
      wanderTimer = random(3, 7);
    }
    walkTo(wanderX, 0.25);
  }

  complain(dt);
}

// the needs go up and down over time
function updateStats(dt) {
  if (mode === "sleeping") {
    pet.energy += 3 * dt;
    pet.full -= 0.12 * dt;
  } else {
    pet.energy -= 0.25 * dt;
    pet.full -= 0.4 * dt;
    // it gets sad faster when it's hungry or tired
    let sadness = 0.3;
    if (pet.full < 25) sadness += 0.8;
    if (pet.energy < 20) sadness += 0.5;
    pet.joy -= sadness * dt;
  }
  pet.full = constrain(pet.full, 0, 100);
  pet.energy = constrain(pet.energy, 0, 100);
  pet.joy = constrain(pet.joy, 0, 100);
}

// moving the mouse on top of it = petting
function checkPetting(dt) {
  let mouseMoved = abs(mouseX - lastMouseX) + abs(mouseY - lastMouseY) > 1;
  let petting = isOver(petBox) && mouseMoved && mode !== "sleeping" && mode !== "eating";
  if (!petting) return;

  pet.joy = min(100, pet.joy + 18 * dt);
  pet.xp += 0.06 * dt;
  cheer = max(cheer, 0.3);

  // a heart every 0.35 seconds
  heartTimer -= dt;
  if (heartTimer <= 0) {
    hearts(petBox.x, petBox.top, 1);
    heartTimer = 0.35;
  }
  checkGrowth();
}

// now and then it tells you what it needs
function complain(dt) {
  moodTimer -= dt;
  if (moodTimer > 0 || bubble.time > 0) return;
  moodTimer = random(14, 24);
  if (pet.full < 25) say("hungry...");
  else if (pet.energy < 20) say("sleepy...");
  else if (pet.joy < 35) say("pet me?");
}

function isHappy() {
  return pet.joy >= 60 && pet.full >= 25 && pet.energy >= 15;
}

function wake(message) {
  mode = "idle";
  say(message);
}

function finishMeal() {
  foods.splice(foods.indexOf(eatingFood), 1); // remove the food
  pet.full = min(100, pet.full + (eatingFood.kind === "apple" ? 30 : 18));
  pet.joy = min(100, pet.joy + 10);
  pet.xp += 1;
  hearts(x, petBox.top, 2);
  say(random(["yum!", "nom nom", "tasty!", "more?"]));
  cheer = 1.2;
  eatingFood = null;
  mode = "idle";
  checkGrowth();
}

// which stage its XP has reached
function stageFromXp() {
  let stage = 0;
  for (let i = 0; i < STAGES.length; i++) {
    if (pet.xp >= STAGES[i].xp) stage = i;
  }
  return stage;
}

function checkGrowth() {
  let stage = stageFromXp();
  if (stage <= pet.stage) return;
  pet.stage = stage;
  say("I grew!");
  cheer = 2;
  vy = -2.2 * P; // jump for joy
  sparks(x, petBox.y, 24);
  savePet();
}

function nearestFood() {
  let best = null;
  for (let food of foods) {
    if (food.y < groundY) continue; // still falling
    if (!best || abs(food.x - x) < abs(best.x - x)) best = food;
  }
  return best;
}

function walkTo(tx, speed) {
  targetX = tx;
  walkSpeed = speed;
}

function isNear(tx) {
  return abs(tx - x) < P * 3;
}

// take one step towards targetX, and fall back down after a hop
function move() {
  let stepX = constrain(targetX - x, -walkSpeed * P, walkSpeed * P);
  if (abs(targetX - x) < P * 2) stepX = 0; // close enough
  x += stepX;
  walking = stepX !== 0;
  if (stepX > 0) dir = 1;
  if (stepX < 0) dir = -1;

  // little happy hops while following you
  if (mode === "follow" && walking && hopY === 0 && random() < 0.01) vy = -1.4 * P;

  // gravity
  vy += 0.18 * P;
  hopY += vy;
  if (hopY > 0) {
    hopY = 0;
    vy = 0;
  }

  cheer = max(0, cheer - deltaTime / 1000);
}

// ============================================================
// 6. INPUT
// ============================================================

// clicking on the canvas
function onPress() {
  if (phase === "egg") {
    if (isOver(eggBox)) tapEgg();
    return;
  }
  if (phase === "naming") return;

  // clicked the pet: it hops and says hi
  if (isOver(petBox)) {
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

  // clicked anywhere else: drop a berry (at most 6 foods at once)
  if (foods.length < 6) {
    foods.push({ kind: "berry", x: mouseX, y: min(mouseY, groundY), vy: 0 });
  }
}

function tapEgg() {
  eggTaps++;
  eggShake = 1;
  sparks(eggBox.x, eggBox.y, 5);
  if (eggTaps < 4) return;

  // the 4th tap: it hatches!
  phase = "naming";
  sparks(eggBox.x, eggBox.y, 30);
  cheer = 3;
  let kind = SPECIES[pet.species].name;
  let article = "aeiou".includes(kind[0]) ? "an " : "a ";
  document.getElementById("hatchText").textContent = "It's " + article + kind + "!";
  document.getElementById("namer").classList.remove("hidden");
  document.getElementById("nameInput").focus();
}

function hookButtons() {
  document.getElementById("feedBtn").onclick = () => {
    if (foods.length >= 6) return;
    // an apple falls from the tree
    foods.push({ kind: "apple", x: treeX + random(-1, 1) * P * 12, y: groundY - P * 32, vy: 0 });
  };

  document.getElementById("sleepBtn").onclick = () => {
    if (mode !== "sleeping") {
      mode = "toBed";
      eatingFood = null;
      say("bed time?");
    } else if (pet.energy < 60) {
      pet.joy = max(0, pet.joy - 5); // grumpy when woken up too early
      wake("5 more minutes...");
    } else {
      wake("morning!");
    }
  };

  document.getElementById("namer").onsubmit = (event) => {
    event.preventDefault(); // don't reload the page
    let name = document.getElementById("nameInput").value.trim() || "Mochi";
    pet.name = name;
    phase = "live";
    document.getElementById("namer").classList.add("hidden");
    showHud();
    say(name + "!");
    cheer = 2;
    hearts(x, petBox.top, 5);
    savePet();
  };

  document.getElementById("resetBtn").onclick = () => {
    if (!confirm("Say goodbye to " + pet.name + " and start over with a new egg?")) return;
    rememberSpecies(pet.species);
    localStorage.removeItem(SAVE_KEY);
    pet = null; // so savePet doesn't save it again while leaving
    location.reload();
  };

  let closet = document.getElementById("closet");
  document.getElementById("closetBtn").onclick = () => {
    closet.classList.toggle("hidden");
    fillCloset();
  };
  document.getElementById("closetClose").onclick = () => closet.classList.add("hidden");

  window.addEventListener("beforeunload", savePet);
}

// make one button for each hat and each piece of clothing
function fillCloset() {
  fillShelf("hatShelf", HATS, "hat");
  fillShelf("clothShelf", CLOTHES, "cloth");
}

function fillShelf(shelfId, items, slot) {
  let shelf = document.getElementById(shelfId);
  shelf.innerHTML = "";

  // null = the "none" button
  for (let item of [null, ...items]) {
    let button = document.createElement("button");
    button.className = "tile";
    let locked = item && item.stage > pet.stage;
    let wearing = (pet[slot] || null) === (item ? item.id : null);
    if (wearing) button.classList.add("on");

    if (locked) {
      button.classList.add("locked");
      button.textContent = "grows: " + STAGES[item.stage].name;
    } else {
      button.textContent = item ? item.name : "none";
    }

    button.onclick = () => {
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
    shelf.appendChild(button);
  }
}

function showHud() {
  for (let id of ["hud", "tip", "resetBtn"]) {
    document.getElementById(id).classList.remove("hidden");
  }
}

// copy the stats into the HTML bars
function updateHud() {
  document.getElementById("petName").textContent = pet.name;
  document.getElementById("petStage").textContent = SPECIES[pet.species].name + " · " + STAGES[pet.stage].name;
  document.getElementById("barFull").style.width = pet.full + "%";
  document.getElementById("barEnergy").style.width = pet.energy + "%";
  document.getElementById("barJoy").style.width = pet.joy + "%";

  // GROW bar: how far it is from this stage to the next one
  let grow = 100;
  let next = STAGES[pet.stage + 1];
  if (next) {
    let start = STAGES[pet.stage].xp;
    grow = ((pet.xp - start) / (next.xp - start)) * 100;
  }
  document.getElementById("barGrow").style.width = constrain(grow, 0, 100) + "%";
  document.getElementById("sleepBtn").textContent = mode === "sleeping" ? "WAKE UP" : "SLEEP";
  document.getElementById("tip").style.color = darkness > 0.5 ? "#d9d3ff" : "#3f6e3a";
}

// ============================================================
// 7. SAVING (localStorage keeps text in the browser between visits)
// ============================================================

function newPet() {
  return {
    name: "", species: pickSpecies(), xp: 0, stage: 0,
    full: 70, energy: 80, joy: 65, sleeping: false, saved: Date.now(),
  };
}

function loadPet() {
  let text = localStorage.getItem(SAVE_KEY);
  return text ? JSON.parse(text) : null;
}

function savePet() {
  if (!pet || phase !== "live") return;
  pet.sleeping = mode === "sleeping";
  pet.saved = Date.now();
  localStorage.setItem(SAVE_KEY, JSON.stringify(pet));
}

// pick a species you haven't raised yet (after all 6, start over)
function pickSpecies() {
  let seen = JSON.parse(localStorage.getItem(HISTORY_KEY)) || [];
  let fresh = SPECIES_IDS.filter((id) => !seen.includes(id));
  if (fresh.length === 0) fresh = SPECIES_IDS;
  return random(fresh);
}

function rememberSpecies(id) {
  let seen = JSON.parse(localStorage.getItem(HISTORY_KEY)) || [];
  if (seen.length >= SPECIES_IDS.length) seen = [];
  seen.push(id);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(seen));
}

// while you were away, time passed (at most 15 minutes' worth)
function timePassedWhileAway() {
  let seconds = constrain((Date.now() - pet.saved) / 1000, 0, 900);
  updateStats(seconds);
  pet.full = max(pet.full, 10);
  pet.joy = max(pet.joy, 20);
  if (seconds > 60) say(pet.sleeping ? "zzz..." : "you're back!");
}

// ============================================================
// 8. PICTURES
// ============================================================

// draw text-based pixel art. flip = mirror it left-to-right
function drawPixels(art, left, top, size, colors, flip = false, alpha = 255) {
  noStroke();
  for (let row = 0; row < art.length; row++) {
    for (let col = 0; col < art[row].length; col++) {
      let letter = art[row][col];
      if (letter === ".") continue;
      let c = color(colors[letter]);
      c.setAlpha(alpha);
      fill(c);
      let drawCol = flip ? art[row].length - 1 - col : col;
      rect(left + drawCol * size, top + row * size, size, size);
    }
  }
}

// ---- the world ----

function drawWorld() {
  noStroke();

  // sky: blend from day blue to night purple
  background(lerpColor(color("#8fd3ff"), color("#1d1a44"), darkness));

  // sun
  if (darkness < 0.5) {
    fill("#ffd54a");
    circle(width * 0.32, height * 0.14, P * 12);
  }

  // clouds drift to the right and wrap around
  for (let cloud of clouds) {
    cloud.x += cloud.speed;
    if (cloud.x > width + P * 20) cloud.x = -P * 20;
    drawPixels(CLOUD, round(cloud.x), round(cloud.y), P, BASE_COLORS, false, 255 * (1 - darkness * 0.8));
  }

  // hills
  fill("#9ed98c");
  ellipse(width * 0.25, groundY, width * 0.9, P * 30);
  ellipse(width * 0.8, groundY, width * 0.7, P * 20);

  // grass and flowers
  fill("#7cc96a");
  rect(0, groundY, width, height - groundY);
  for (let f of flowers) {
    fill(f.color);
    rect(f.x - P, f.y, P * 3, P);
    rect(f.x, f.y - P, P, P * 3);
    fill("#ff9f43");
    rect(f.x, f.y, P, P);
  }

  drawTree();
  drawBedBack();

  // at night: a dark blue layer over everything, then the moon and stars
  if (darkness > 0.02) {
    fill(20, 18, 60, 130 * darkness);
    rect(0, 0, width, height);

    for (let star of stars) {
      let twinkle = 0.5 + 0.5 * sin(frameCount * 0.05 + star.twinkle);
      fill(255, 250, 220, 255 * darkness * twinkle);
      rect(star.x, star.y, P, P);
    }
    if (darkness > 0.5) {
      fill("#fff4c2");
      circle(width * 0.32, height * 0.14, P * 10);
    }
  }
}

function drawTree() {
  let top = groundY - P * 44;
  fill("#7a5235");
  rect(treeX - P * 3, top + P * 18, P * 6, groundY - top - P * 18);
  fill("#5fb35a");
  circle(treeX - P * 9, top + P * 14, P * 18);
  circle(treeX + P * 9, top + P * 14, P * 18);
  circle(treeX, top + P * 8, P * 24);
  // apples
  for (let [ax, ay] of [[-6, 12], [5, 15], [1, 6], [-11, 20], [9, 21], [-2, 19]]) {
    fill(BASE_COLORS.r);
    rect(treeX + ax * P, top + ay * P, P * 2, P * 2);
  }
}

// the leaf bed is drawn in two halves so the pet looks tucked in
function drawBedBack() {
  fill("#4f9a55");
  ellipse(bedX, groundY - P * 2, P * 32, P * 10);
}

function drawBedFront() {
  noStroke();
  fill(lerpColor(color("#8fd47f"), color("#28245a"), darkness * 0.5));
  arc(bedX, groundY - P * 2, P * 32, P * 10, 0, PI);
}

function drawHint(message) {
  noStroke();
  fill("#3f6e3a");
  textAlign(CENTER, BOTTOM);
  textSize(max(9, round(P * 1.6)));
  text(message, width / 2, height - 24);
}

// ---- the egg ----

function drawEgg() {
  let size = round(P * 1.3);

  // shake after a tap, and wiggle a little every few seconds
  eggShake *= 0.9;
  let wobble = 0;
  if (eggShake > 0.05 || frameCount % 150 < 16) wobble = frameCount % 4 < 2 ? P : -P;

  let left = round(width / 2 - (EGG[0].length * size) / 2) + wobble;
  let top = groundY - EGG.length * size;
  let colors = { o: BASE_COLORS.o, e: "#fff6e0", s: SPECIES[pet.species].spot };
  drawPixels(EGG, left, top, size, colors);

  // cracks: one more for each tap
  fill(BASE_COLORS.k);
  for (let i = 0; i < min(eggTaps, CRACKS.length); i++) {
    for (let [col, row] of CRACKS[i]) rect(left + col * size, top + row * size, size, size);
  }

  eggBox = { x: width / 2, y: top + (EGG.length * size) / 2, r: EGG.length * size * 0.6 };
}

// ---- the pet ----

function drawPet() {
  let species = SPECIES[pet.species];
  let colors = Object.assign({}, BASE_COLORS, species.colors); // shared colors + this species' colors
  let size = round(P * STAGES[pet.stage].size);
  let sleeping = mode === "sleeping";

  // which way it looks: -1 left, 0 straight at you, 1 right
  let look = 0;
  if (walking) look = dir;
  else if (!sleeping && abs(mouseX - x) > P * 8) look = mouseX > x ? 1 : -1;

  // bob while walking, breathe slowly while asleep
  let bob = 0;
  if (walking && floor(frameCount / 8) % 2) bob = -size;
  if (sleeping && floor(frameCount / 50) % 2) bob = size;

  let artW = PET_ART[0].length;
  let artH = PET_ART.length;
  let left = round(x - (artW * size) / 2);
  let top = round(groundY - artH * size + hopY + bob);

  // shadow
  noStroke();
  fill(0, 0, 0, 30 * (1 - darkness));
  rect(x - size * 5, groundY, size * 10, P);

  // tail: on the side it's walking away from, wagging when happy
  let tail = TAILS[species.tail];
  let tailSide = look === 0 ? 1 : -look;
  let wag = !sleeping && (isHappy() || cheer > 0) && floor(frameCount / 8) % 2 ? size : 0;
  let tailTop = top + (12 - tail.length) * size - wag;
  let tailLeft = tailSide === 1 ? left + 11 * size : left + (4 - tail[0].length) * size;
  drawPixels(tail, tailLeft, tailTop, size, colors, tailSide === -1);

  // ears, then the head and body (wearing its clothes)
  let ears = EARS[species.ears];
  drawPixels(ears, left, top + (2 - ears.length) * size, size, colors);
  let cloth = CLOTHES.find((c) => c.id === pet.cloth);
  if (cloth && phase === "live") colors.c = cloth.color;
  drawPixels(dressUp(PET_ART, cloth), left, top, size, colors);

  // face, moved one pixel the way it's looking
  drawFace(left + look * size, top, size, colors, species, sleeping);

  // hat
  let hat = HATS.find((h) => h.id === pet.hat);
  if (hat && phase === "live") {
    let hatW = hat.rows[0].length;
    let hatLeft = left + ((artW - hatW) / 2 + look + (hat.dx || 0)) * size;
    drawPixels(hat.rows, hatLeft, top + (2 - hat.rows.length) * size, size, colors);
  }

  // remember where it is, for clicks, petting, hearts and the speech bubble
  petBox = { x: x, y: top + (artH * size) / 2, r: artW * size * 0.55, top: top - 6 * size };

  // floating z's while asleep
  if (sleeping) {
    zTimer--;
    if (zTimer <= 0) {
      particles.push({ kind: "z", x: x + size * 6, y: top, vx: 0.06 * P, vy: -0.1 * P, gravity: 0, life: 90 });
      zTimer = 60;
    }
  }
}

// clothes: in the rows the cloth covers, fur (b) and belly (l) become cloth color (c)
function dressUp(art, cloth) {
  if (!cloth || phase !== "live") return art;
  return art.map((line, row) => (cloth.rows.includes(row) ? line.replaceAll("b", "c").replaceAll("l", "c") : line));
}

function drawFace(left, top, size, colors, species, sleeping) {
  // color one square of the face. col and row are positions in PET_ART
  let dot = (col, row, c) => {
    fill(c);
    rect(left + col * size, top + row * size, size, size);
  };
  let K = colors.k;

  // pick a face
  let eyes = "open";
  let blinking = frameCount % 200 < 8;
  if (sleeping || blinking) eyes = "closed";
  else if (cheer > 0) eyes = "happy";
  else if (phase === "live" && (pet.joy < 35 || pet.full < 20)) eyes = "sad";

  let mouth = "smile";
  if (sleeping) mouth = "none";
  else if (mode === "eating") mouth = floor(frameCount / 10) % 2 ? "open" : "smile"; // chomp chomp
  else if (cheer > 0) mouth = "open";
  else if (eyes === "sad") mouth = "sad";

  // panda eye patches
  if (species.eyePatches) {
    fill(colors.e);
    rect(left + 3 * size, top + 3 * size, 3 * size, 4 * size);
    rect(left + 9 * size, top + 3 * size, 3 * size, 4 * size);
  }

  // eyes: the left one starts at column 4, the right one at column 9
  for (let col of [4, 9]) {
    if (eyes === "closed") {
      dot(col, 5, K);
      dot(col + 1, 5, K);
    } else if (eyes === "happy") {
      // ^ ^
      dot(col - 1, 5, K);
      dot(col, 4, K);
      dot(col + 1, 4, K);
      dot(col + 2, 5, K);
    } else {
      dot(col, 4, colors.w); // a sparkle
      dot(col + 1, 4, K);
      dot(col, 5, K);
      dot(col + 1, 5, K);
      if (eyes === "sad") dot(col === 4 ? 5 : 9, 3, K); // worried eyebrows
    }
  }

  // blush and nose
  for (let col of [2, 3, 11, 12]) dot(col, 6, colors.p);
  dot(7, 6, colors.n);

  // mouth
  if (mouth === "smile") {
    dot(6, 7, K);
    dot(8, 7, K);
  } else if (mouth === "open") {
    dot(6, 7, K);
    dot(7, 7, colors.p);
    dot(8, 7, K);
  } else if (mouth === "sad") {
    dot(7, 7, K);
    dot(6, 8, K);
    dot(8, 8, K);
  }

  // kitten whiskers, once it's a bit bigger
  if (species.whiskers && pet.stage >= 1) {
    dot(-1, 6, K);
    dot(-2, 5, K);
    dot(15, 6, K);
    dot(16, 5, K);
  }
}

// ---- food ----

function updateFoods() {
  for (let food of foods) {
    // fall until it hits the ground
    if (food.y < groundY) {
      food.vy += 0.12 * P;
      food.y = min(food.y + food.vy, groundY);
    }
    let art = food.kind === "apple" ? APPLE : BERRY;
    let left = round(food.x - (art[0].length * P) / 2);
    let top = round(food.y - art.length * P);
    drawPixels(art, left, top, P, BASE_COLORS);
  }
}

// ---- particles: hearts, sparkles and z's ----

function hearts(hx, hy, count) {
  for (let i = 0; i < count; i++) {
    particles.push({
      kind: "heart", x: hx + random(-P * 4, P * 4), y: hy,
      vx: random(-0.05, 0.05) * P, vy: random(-0.22, -0.12) * P, gravity: 0, life: 70,
    });
  }
}

function sparks(sx, sy, count) {
  for (let i = 0; i < count; i++) {
    let angle = random(TWO_PI);
    let speed = random(0.15, 0.6) * P;
    particles.push({
      kind: "spark", color: random(["#fff4a3", "#ffffff", "#ff8fab"]),
      x: sx, y: sy, vx: cos(angle) * speed, vy: sin(angle) * speed, gravity: 0.02 * P, life: random(30, 55),
    });
  }
}

function updateParticles() {
  // go backwards so removing one doesn't skip the next
  for (let i = particles.length - 1; i >= 0; i--) {
    let p = particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.vy += p.gravity;
    p.life--;
    let alpha = min(1, p.life / 20) * 255; // fade out at the end

    noStroke();
    if (p.kind === "heart") {
      let size = max(2, floor(P / 2));
      drawPixels(HEART, p.x, p.y, size, BASE_COLORS, false, alpha);
    } else if (p.kind === "z") {
      fill(255, 255, 255, alpha);
      textSize(P * 3);
      textAlign(CENTER, CENTER);
      text("z", p.x, p.y);
    } else {
      let c = color(p.color);
      c.setAlpha(alpha);
      fill(c);
      rect(p.x, p.y, P, P);
    }

    if (p.life <= 0) particles.splice(i, 1);
  }
}

// ---- speech bubble ----

function say(message) {
  bubble.text = message;
  bubble.time = 150; // frames, about 2.5 seconds
}

function drawBubble() {
  if (bubble.time <= 0 || !petBox) return;
  bubble.time--;

  let fontSize = max(8, round(P * 1.8));
  textSize(fontSize);
  let w = textWidth(bubble.text) + P * 6;
  let h = fontSize + P * 5;
  let bx = constrain(petBox.x - w / 2, P * 2, width - w - P * 2);
  let by = petBox.top - h;

  noStroke();
  fill(BASE_COLORS.o);
  rect(bx, by, w, h); // outline
  rect(petBox.x - P / 2, by + h, P, P * 2); // little pointer
  fill("#ffffff");
  rect(bx + P, by + P, w - 2 * P, h - 2 * P);
  fill(BASE_COLORS.o);
  textAlign(CENTER, CENTER);
  text(bubble.text, bx + w / 2, by + h / 2 + 1);
}

// is the mouse inside this circle-shaped box?
function isOver(box) {
  return box && dist(mouseX, mouseY, box.x, box.y) < box.r;
}
