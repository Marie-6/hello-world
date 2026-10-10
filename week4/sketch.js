function setup() {
      createCanvas(600, 600);
  noStroke();
}

function draw() {
  background(0);
  let t = frameCount * 0.05;

  for (let x = 0; x < width; x += 20) {
    for (let y = 0; y < height; y += 20) {
      let d = dist(x, y, mouseX, mouseY);
      let r = 10 + 10 * sin(t + d * 0.05);
      let wave = sin(t + d * 0.1);
      fill(200 + 55 * wave, 100 + 155 * wave, 200 + 55 * wave);
      ellipse(x, y, r, r);
    }
  }
}