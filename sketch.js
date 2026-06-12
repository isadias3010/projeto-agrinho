// ============================================
// AGRO SUSTENTÁVEL 2026 - O EQUILÍBRIO
// ============================================

let player, tractor, harvester;
let worldObjects = [];
let animals = [];
let workers = [];
let inventory = { food: 0, money: 5000, eco: 100 };
let currentVehicle = null;
let feedbackMsg = "Bem-vindo ao seu Sítio Sustentável!";
let dialogueMsg = "";
let dialogueTimer = 0;

const WORLD_SIZE = 1200; 
let camX = 0, camY = 0;

function setup() {
  let canvas = createCanvas(800, 600);
  canvas.parent('game-canvas');
  
  // Jogador começa na Sede
  player = new Farmer(WORLD_SIZE/2, WORLD_SIZE/2);
  tractor = new Vehicle(WORLD_SIZE/2 + 100, WORLD_SIZE/2 + 50, "🚜", "TRATOR");
  harvester = new Vehicle(WORLD_SIZE/2 + 250, WORLD_SIZE/2 + 50, "🚜", "COLHEITADEIRA");
  
  initPerfectFarm();
}

function initPerfectFarm() {
  worldObjects = []; animals = []; workers = [];
  
  // --- QUADRANTE 1 (NOROESTE): PECUÁRIA ---
  let q1X = 100, q1Y = 100;
  worldObjects.push(new Pen(q1X, q1Y, 350, 350, "CURRAL", "🐄", "M"));
  for(let i=0; i<4; i++) animals.push(new AnimalEntity("🐄", q1X+50+i*60, q1Y+100, q1X, q1Y, 350, 350));
  workers.push(new WorkerNPC(q1X + 175, q1Y + 380, "👩‍🔬", "Veterinária", "Saúde Animal"));

  // --- QUADRANTE 2 (NORDESTE): POMAR ---
  let q2X = 750, q2Y = 100;
  for(let i=0; i<6; i++) worldObjects.push(new FruitTree(q2X+80+(i%2)*180, q2Y+80+floor(i/2)*120, "🍎"));
  workers.push(new WorkerNPC(q2X + 175, q2Y + 380, "👩‍🌾", "Pomarista", "Colheita de Frutas"));

  // --- QUADRANTE 3 (SUDOESTE): PEQUENOS ANIMAIS ---
  let q3X = 100, q3Y = 750;
  worldObjects.push(new Pen(q3X, q3Y, 160, 160, "GALINHEIRO", "🐓", "G"));
  worldObjects.push(new Pen(q3X + 190, q3Y, 160, 160, "CHIQUEIRO", "🐖", "P"));
  for(let i=0; i<2; i++) animals.push(new AnimalEntity("🐓", q3X+40+i*50, q3Y+80, q3X, q3Y, 160, 160));
  for(let i=0; i<2; i++) animals.push(new AnimalEntity("🐖", q3X+230+i*50, q3Y+80, q3X+190, q3Y, 160, 160));

  // --- QUADRANTE 4 (SUDESTE): AGRICULTURA ---
  let q4X = 750, q4Y = 750;
  for(let i=0; i<6; i++) worldObjects.push(new CropPlot(q4X+100+(i%2)*180, q4Y+80+floor(i/2)*120));
  workers.push(new WorkerNPC(q4X + 175, q4Y + 380, "🧑‍🌾", "Agrônomo", "Gestão de Solo"));

  // --- CENTRO: SEDE DE LUXO ---
  worldObjects.push(new LuxuryMansion(WORLD_SIZE/2 - 120, WORLD_SIZE/2 - 250));
  workers.push(new WorkerNPC(WORLD_SIZE/2, WORLD_SIZE/2 + 100, "👨‍💼", "Caseiro", "Administração"));
}

function draw() {
  background(34, 139, 34); 
  updateCamera();
  
  push();
  translate(-camX, -camY);
  drawInfrastructure(); 
  
  for (let obj of worldObjects) obj.display();
  for (let ani of animals) ani.run();
  for (let wrk of workers) wrk.display();
  
  tractor.display();
  harvester.display();
  
  if (currentVehicle) {
    currentVehicle.move();
    player.x = currentVehicle.x; player.y = currentVehicle.y;
    drawSteeringWheel();
  } else {
    player.move();
    player.display();
  }
  pop();
  
  updateUI();
}

function updateCamera() {
  camX = lerp(camX, player.x - width / 2, 0.1);
  camY = lerp(camY, player.y - height / 2, 0.1);
  camX = constrain(camX, 0, WORLD_SIZE - width);
  camY = constrain(camY, 0, WORLD_SIZE - height);
}

function drawInfrastructure() {
  noStroke();
  fill(139, 69, 19, 60); 
  // Estradas em Cruz (Organização)
  rect(WORLD_SIZE/2 - 50, 0, 100, WORLD_SIZE); // Norte-Sul
  rect(0, WORLD_SIZE/2 - 50, WORLD_SIZE, 100); // Leste-Oeste
  
  // Cercas de Borda
  stroke(60, 30, 10); strokeWeight(10); noFill();
  rect(10, 10, WORLD_SIZE - 20, WORLD_SIZE - 20);
}

function drawSteeringWheel() {
  resetMatrix(); push(); translate(width - 70, height - 70);
  rotate(frameCount * 0.05 * (keyIsDown(LEFT_ARROW) ? -1 : keyIsDown(RIGHT_ARROW) ? 1 : 0));
  stroke(40); strokeWeight(8); noFill(); ellipse(0, 0, 60, 60);
  line(-30, 0, 30, 0); line(0, -30, 0, 30); pop();
}

function updateUI() {
  document.getElementById('food-count').innerText = inventory.food;
  document.getElementById('eco-count').innerText = inventory.eco + "%";
  document.getElementById('money-count').innerText = "R$ " + inventory.money;
  
  // Balão de Diálogo e Feedback na tela
  if (dialogueTimer > 0) {
    fill(255); stroke(0); strokeWeight(2); rect(width/2 - 150, 70, 300, 40, 10);
    fill(0); noStroke(); textAlign(CENTER); textSize(14); text(dialogueMsg, width/2, 95);
    dialogueTimer--;
  } else {
    textAlign(CENTER); fill(255, 255, 0); textSize(16); text(feedbackMsg, width/2, 90);
  }
}

// --- CLASSES ---

class Farmer {
  constructor(x, y) { this.x = x; this.y = y; this.speed = 5; this.showBasket = false; this.basketTimer = 0; }
  move() {
    if (keyIsDown(LEFT_ARROW)) this.x -= this.speed;
    if (keyIsDown(RIGHT_ARROW)) this.x += this.speed;
    if (keyIsDown(UP_ARROW)) this.y -= this.speed;
    if (keyIsDown(DOWN_ARROW)) this.y += this.speed;
    if (this.showBasket && --this.basketTimer <= 0) this.showBasket = false;
  }
  display() { 
    textSize(45); textAlign(CENTER, CENTER); text("👨‍💼", this.x, this.y); 
    if (this.showBasket) { textSize(25); text("🧺", this.x + 25, this.y); }
  }
}

class Vehicle {
  constructor(x, y, emoji, type) { this.x = x; this.y = y; this.emoji = emoji; this.type = type; this.speed = 7; this.angle = 0; }
  move() {
    let dx = 0, dy = 0;
    if (keyIsDown(LEFT_ARROW)) { dx = -this.speed; this.angle = PI; }
    if (keyIsDown(RIGHT_ARROW)) { dx = this.speed; this.angle = 0; }
    if (keyIsDown(UP_ARROW)) { dy = -this.speed; this.angle = -HALF_PI; }
    if (keyIsDown(DOWN_ARROW)) { dy = this.speed; this.angle = HALF_PI; }
    if (dx !== 0 || dy !== 0) { this.x += dx; this.y += dy; }
  }
  display() { 
    push(); translate(this.x, this.y);
    rotate(this.angle);
    if (this.angle === PI) scale(1, -1); 
    textAlign(CENTER, CENTER); textSize(75); text(this.emoji, 0, 0);
    pop();
    textSize(12); fill(255); textAlign(CENTER); text(this.type, this.x, this.y + 45); 
  }
}

class LuxuryMansion {
  constructor(x, y) { this.x = x; this.y = y; }
  display() {
    fill(245); stroke(180); strokeWeight(4); rect(this.x, this.y, 240, 180, 15);
    fill(139, 69, 19); rect(this.x + 20, this.y - 40, 200, 40);
    fill(255); noStroke(); textSize(80); text("🏡", this.x + 120, this.y + 90);
    textSize(16); fill(50); text("SEDE", this.x + 120, this.y + 30);
  }
}

class WorkerNPC {
  constructor(x, y, emoji, role, task) { this.x = x; this.y = y; this.emoji = emoji; this.role = role; this.task = task; }
  display() {
    textSize(40); text(this.emoji, this.x, this.y);
    textSize(12); fill(255); textAlign(CENTER); text(this.role, this.x, this.y + 35);
  }
}

class Pen {
  constructor(x, y, w, h, name, emoji, key) { this.x = x; this.y = y; this.w = w; this.h = h; this.name = name; this.emoji = emoji; this.key = key; }
  display() {
    stroke(101, 67, 33); strokeWeight(5); noFill(); rect(this.x, this.y, this.w, this.h, 10);
    fill(255); textAlign(CENTER); textSize(12); text(`${this.name} [${this.key}]`, this.x + this.w/2, this.y + 20);
  }
}

class AnimalEntity {
  constructor(emoji, x, y, px, py, pw, ph) {
    this.emoji = emoji; this.x = x; this.y = y; this.px = px; this.py = py; this.pw = pw; this.ph = ph;
    this.targetX = x; this.targetY = y;
  }
  run() {
    if (frameCount % 60 === 0 && random() < 0.2) {
      this.targetX = constrain(this.x + random(-50, 50), this.px + 20, this.px + this.pw - 20);
      this.targetY = constrain(this.y + random(-50, 50), this.py + 40, this.py + this.ph - 20);
    }
    this.x = lerp(this.x, this.targetX, 0.05); this.y = lerp(this.y, this.targetY, 0.05);
    textSize(35); text(this.emoji, this.x, this.y);
  }
}

class FruitTree {
  constructor(x, y, emoji) { this.x = x; this.y = y; this.emoji = emoji; this.hasFruit = true; this.timer = 0; }
  display() {
    textSize(80); text("🌳", this.x, this.y);
    if (this.hasFruit) { textSize(30); text(this.emoji, this.x, this.y - 20); }
    else { this.timer++; if (this.timer > 400) this.hasFruit = true; }
    textSize(10); fill(255); text("[F]", this.x, this.y + 45);
  }
}

class CropPlot {
  constructor(x, y) { this.x = x; this.y = y; this.state = "EMPTY"; this.growth = 0; }
  display() {
    fill(101, 67, 33); rect(this.x - 60, this.y - 60, 120, 120, 10);
    if (this.state === "PLANTED") {
      this.growth++; text("🌱", this.x, this.y);
      if (this.growth > 250) this.state = "READY";
    } else if (this.state === "READY") { text("🌽", this.x, this.y); }
    textSize(10); fill(255); text(this.state === "EMPTY" ? "[S]" : this.state === "READY" ? "[C]" : "...", this.x, this.y + 55);
  }
}

function keyPressed() {
  let k = key.toUpperCase();
  if (k === 'E') {
    if (currentVehicle) { currentVehicle = null; feedbackMsg = "Pé no chão."; }
    else {
      if (dist(player.x, player.y, tractor.x, tractor.y) < 80) currentVehicle = tractor;
      else if (dist(player.x, player.y, harvester.x, harvester.y) < 80) currentVehicle = harvester;
    }
  }
  
  // Interação com Funcionários
  if (!currentVehicle) {
    for (let wrk of workers) {
      if (dist(player.x, player.y, wrk.x, wrk.y) < 100) {
        if (key === '1') { dialogueMsg = "Olá, Patrão! Como vai o dia?"; dialogueTimer = 120; }
        if (key === '2') { dialogueMsg = "A produção está excelente hoje!"; dialogueTimer = 120; }
        if (key === '3') { dialogueMsg = "Sustentabilidade em primeiro lugar!"; dialogueTimer = 120; }
      }
    }
  }

  // Ações de Produção
  if (currentVehicle === tractor && k === 'S') {
    for (let obj of worldObjects) {
      if (obj instanceof CropPlot && dist(tractor.x, tractor.y, obj.x, obj.y) < 100 && obj.state === "EMPTY") {
        obj.state = "PLANTED"; obj.growth = 0; feedbackMsg = "Semeando... 🌱";
        inventory.money -= 50; inventory.eco += 1;
      }
    }
  }
  if (currentVehicle === harvester && k === 'C') {
    for (let obj of worldObjects) {
      if (obj instanceof CropPlot && dist(harvester.x, harvester.y, obj.x, obj.y) < 100 && obj.state === "READY") {
        obj.state = "EMPTY"; inventory.food += 50; feedbackMsg = "Colheita realizada! 🌽";
        inventory.money += 200;
      }
    }
  }
  if (!currentVehicle) {
    for (let obj of worldObjects) {
      let d = dist(player.x, player.y, obj.x + (obj.w/2 || 0), obj.y + (obj.h/2 || 0));
      if (d < 120) {
        if (obj.key === 'M' && k === 'M') { inventory.food += 20; inventory.money += 80; feedbackMsg = "Ordenha concluída! 🥛"; }
        else if (obj.key === 'G' && k === 'G') { inventory.food += 10; inventory.money += 40; feedbackMsg = "Ovos coletados! 🥚"; }
        else if (obj instanceof FruitTree && k === 'F' && obj.hasFruit) {
          obj.hasFruit = false; inventory.food += 15; inventory.money += 60; feedbackMsg = "Fruta colhida! 🍎";
          player.showBasket = true; player.basketTimer = 120;
        }
      }
    }
  }
}
