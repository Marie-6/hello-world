// Visual Animal — a little dachshund 🐶
// Move the mouse: it walks after you
// Hover on its head: it gets happy
// Click: it jumps and barks

// colors
let FUR, FUR_DARK, CREAM, NOSE, PINK, COLLAR, GOLD;

// dog state
let dogX;
let dir = 1; // 1 = facing right, -1 = facing left
let vx = 0;
let walkPhase = 0;
let jumpY = 0;
let vy = 0;
let barkTimer = 0;
let blinkTimer = 0;
let happy = false;
let targetX;

let hearts = [];
let clouds = [];

function setup() {
  createCanvas(windowWidth, windowHeight);

  FUR = color(196, 120, 64);
  FUR_DARK = color(150, 85, 42);
  CREAM = color(245, 214, 170);
  NOSE = color(60, 40, 35);
  PINK = color(255, 140, 160);
  COLLAR = color(230, 70, 90);
  GOLD = color(250, 200, 70);

  dogX = width / 2;
  targetX = width / 2;

  for (let i = 0; i < 5; i++) {
    clouds.push({ x: random(width), y: random(40, height * 0.35), s: random(0.6, 1.3) });
  }
}

function draw() {
  let s = dogScale();
  let groundY = height * 0.72;

  drawBackground(groundY);

  // ---- movement: walk toward the mouse ----
  let dx = targetX - dogX;
  let desired = constrain(dx * 0.05, -4, 4);
  if (abs(dx) < 30 * s) desired = 0;
  vx = lerp(vx, desired, 0.1);
  dogX += vx;
  if (vx > 0.3) dir = 1;
  if (vx < -0.3) dir = -1;
  let walking = abs(vx) > 0.4;
  walkPhase += abs(vx) * 0.09;

  // ---- jump physics ----
  vy += 0.8;
  jumpY += vy;
  if (jumpY > 0) {
    jumpY = 0;
    vy = 0;
  }

  // ---- happy when the mouse is near its head ----
  let headX = dogX + dir * 128 * s;
  let headY = groundY - 62 * s + jumpY - 45 * s;
  happy = dist(mouseX, mouseY, headX, headY) < 70 * s || barkTimer > 0;

  // ---- blink ----
  blinkTimer--;
  if (blinkTimer < -random(120, 260)) blinkTimer = 7;

  // shadow (shrinks while jumping)
  let shadowW = map(jumpY, -150 * s, 0, 120, 260) * s;
  noStroke();
  fill(0, 0, 0, 30);
  ellipse(dogX + dir * 20 * s, groundY + 4 * s, shadowW, 22 * s);

  // the dog
  let bob = walking ? sin(walkPhase * 2) * 2.5 * s : 0;
  push();
  translate(dogX, groundY - 62 * s + jumpY + bob);
  scale(dir * s, s);
  drawDog(walking);
  pop();

  // bark bubble
  if (barkTimer > 0) {
    drawBark(headX + dir * 70 * s, headY - 70 * s, s);
    barkTimer--;
  }

  updateHearts();
  drawHint();
}

// ------------------------------------------------------------
// The dog is drawn facing right, centered at (0, 0).
// Body is ~240 wide, paws touch y = 62.
// ------------------------------------------------------------
function drawDog(walking) {
  let t = frameCount;
  let swing = walking ? sin(walkPhase) * 0.5 : 0;
  let breathe = walking ? 0 : sin(t * 0.05) * 1.5;
  let wagSpeed = happy ? 0.6 : 0.2;
  let wag = sin(t * wagSpeed) * (happy ? 0.55 : 0.3);

  noStroke();

  // far legs (darker, behind body)
  fill(FUR_DARK);
  drawLeg(-70, -swing);
  drawLeg(80, swing);

  // tail
  push();
  translate(-112, -18);
  rotate(-0.9 + wag);
  fill(FUR);
  rectMode(CENTER);
  rect(0, -24, 13, 50, 7);
  pop();

  // long sausage body
  fill(FUR);
  rectMode(CENTER);
  rect(0, 0, 240, 72 + breathe, 36);

  // back spot
  fill(FUR_DARK);
  ellipse(-30, -22, 70, 22);

  // chest patch
  fill(CREAM);
  ellipse(100, 12, 46, 46);

  // near legs
  fill(FUR);
  drawLeg(-90, swing);
  drawLeg(60, -swing);

  // neck
  fill(FUR);
  ellipse(105, -22, 62, 66);

  // collar + tag
  push();
  translate(94, -16);
  rotate(-0.28);
  fill(COLLAR);
  rect(0, 0, 14, 66, 7);
  fill(GOLD);
  circle(4, 34, 15);
  fill(255, 255, 255, 150);
  circle(1, 31, 5);
  pop();

  drawHead(t);
}

function drawLeg(x, angle) {
  push();
  translate(x, 18);
  rotate(angle);
  rectMode(CORNER);
  rect(-9, 0, 18, 40, 9);
  // paw
  ellipse(3, 40, 26, 14);
  pop();
}

function drawHead(t) {
  let tilt = happy ? sin(t * 0.15) * 0.06 : 0;

  push();
  translate(128, -45);
  rotate(tilt);

  // head
  fill(FUR);
  ellipse(0, 0, 90, 82);

  // snout
  fill(CREAM);
  ellipse(42, 14, 66, 44);

  // nose
  fill(NOSE);
  ellipse(72, 6, 20, 15);
  fill(255, 255, 255, 160);
  ellipse(69, 3, 6, 4);

  // mouth
  noFill();
  stroke(NOSE);
  strokeWeight(2.5);
  arc(56, 24, 18, 12, 0, PI);
  arc(40, 24, 18, 12, 0, PI);
  noStroke();

  // tongue
  if (happy) {
    fill(PINK);
    ellipse(48, 36, 16, 20);
    stroke(220, 100, 120);
    strokeWeight(1.5);
    line(48, 30, 48, 42);
    noStroke();
  }

  // eye
  if (happy) {
    // ^ ^ happy eye
    noFill();
    stroke(NOSE);
    strokeWeight(3.5);
    arc(14, -10, 18, 16, PI + 0.3, TWO_PI - 0.3);
    noStroke();
  } else if (blinkTimer > 0) {
    stroke(NOSE);
    strokeWeight(3.5);
    line(6, -10, 22, -10);
    noStroke();
  } else {
    fill(NOSE);
    ellipse(14, -10, 17, 20);
    fill(255);
    circle(18, -15, 6);
    circle(11, -6, 3);
  }

  // blush
  fill(255, 130, 150, 110);
  ellipse(16, 12, 20, 11);

  // floppy ear
  let earSwing = sin(t * 0.08) * 0.08 + (jumpY < 0 ? -0.5 : 0);
  push();
  translate(-18, -26);
  rotate(0.35 + earSwing);
  fill(FUR_DARK);
  ellipse(0, 34, 36, 76);
  pop();

  pop();
}

// ------------------------------------------------------------

function drawBackground(groundY) {
  background(255, 240, 225);

  // sun
  noStroke();
  fill(255, 220, 140);
  circle(width * 0.85, height * 0.18, 90);

  // clouds
  fill(255);
  for (let c of clouds) {
    c.x += 0.2 * c.s;
    if (c.x > width + 100) c.x = -100;
    ellipse(c.x, c.y, 90 * c.s, 40 * c.s);
    ellipse(c.x + 30 * c.s, c.y - 12 * c.s, 60 * c.s, 40 * c.s);
    ellipse(c.x - 25 * c.s, c.y - 8 * c.s, 50 * c.s, 32 * c.s);
  }

  // grass
  fill(190, 225, 170);
  rect(0, groundY - 6, width, height - groundY + 6);
  fill(170, 210, 150);
  for (let x = 0; x < width; x += 40) {
    ellipse(x + 10, groundY + 30 + (x % 80 === 0 ? 20 : 0), 30, 8);
  }
}

function drawBark(x, y, s) {
  push();
  translate(x, y);
  let pop1 = 1 + sin(barkTimer * 0.4) * 0.05;
  scale(s * pop1);
  noStroke();
  fill(255);
  ellipse(0, 0, 110, 70);
  triangle(-30 * dir, 20, -10 * dir, 28, -45 * dir, 50);
  fill(NOSE);
  textAlign(CENTER, CENTER);
  textSize(30);
  textStyle(BOLD);
  text("汪!", 0, 0);
  pop();
}

function drawHeart(x, y, r) {
  circle(x - r / 2, y, r);
  circle(x + r / 2, y, r);
  triangle(x - r, y + r * 0.15, x + r, y + r * 0.15, x, y + r * 1.15);
}

function updateHearts() {
  noStroke();
  for (let i = hearts.length - 1; i >= 0; i--) {
    let h = hearts[i];
    h.x += h.vx;
    h.y += h.vy;
    h.life -= 1;
    fill(255, 120, 150, map(h.life, 0, 60, 0, 255));
    drawHeart(h.x, h.y, h.r);
    if (h.life <= 0) hearts.splice(i, 1);
  }
}

function drawHint() {
  fill(120, 90, 70, 160);
  noStroke();
  textAlign(CENTER, BOTTOM);
  textStyle(NORMAL);
  textSize(14);
  text("移动鼠标让它跟着走 · 摸摸它的头 · 点击让它跳", width / 2, height - 16);
}

function dogScale() {
  return constrain(min(width, height) / 480, 0.5, 1.6);
}

// ------------------------------------------------------------

function mouseMoved() {
  targetX = mouseX;
}

function mouseDragged() {
  targetX = mouseX;
}

function mousePressed() {
  targetX = mouseX;
  let s = dogScale();
  if (jumpY === 0) vy = -14 * s;
  barkTimer = 45;
  let headX = dogX + dir * 128 * s;
  let headY = height * 0.72 - 107 * s;
  for (let i = 0; i < 6; i++) {
    hearts.push({
      x: headX + random(-30, 30) * s,
      y: headY - 40 * s,
      vx: random(-1, 1),
      vy: random(-2.5, -1),
      r: random(8, 14) * s,
      life: 60,
    });
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
