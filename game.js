const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Game Variables
let health = 10;
let money = 100;
let enemies = [];
let towers = [];
let gameRunning = false;

// Enemy Path
const path = [
  { x: 0, y: 250 },
  { x: 200, y: 250 },
  { x: 200, y: 400 },
  { x: 500, y: 400 },
  { x: 500, y: 100 },
  { x: 800, y: 100 },
  { x: 800, y: 500 },
  { x: 1000, y: 500 }
];

// Classes
class Enemy {
  constructor() {
    this.x = path[0].x;
    this.y = path[0].y;
    this.speed = 2;
    this.health = 10;
    this.pathIndex = 0;
  }

  move() {
    const target = path[this.pathIndex + 1];
    if (!target) return;

    const dx = target.x - this.x;
    const dy = target.y - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance <= this.speed) {
      this.pathIndex++;
      if (this.pathIndex >= path.length - 1) {
        health--;
        enemies = enemies.filter((e) => e !== this);
        updateStats();
      }
    } else {
      this.x += (dx / distance) * this.speed;
      this.y += (dy / distance) * this.speed;
    }
  }

  draw() {
    ctx.fillStyle = "red";
    ctx.beginPath();
    ctx.arc(this.x, this.y, 10, 0, Math.PI * 2);
    ctx.fill();
  }
}

class Tower {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.range = 100;
    this.damage = 5;
    this.fireRate = 30; // Frames between shots
    this.cooldown = 0;
    this.projectiles = [];
    this.selected = false; // Track if the tower is selected
  }

  shoot() {
    if (this.cooldown > 0) {
      this.cooldown--;
      return;
    }

    for (let enemy of enemies) {
      const dx = enemy.x - this.x;
      const dy = enemy.y - this.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance <= this.range) {
        this.projectiles.push(new Projectile(this.x, this.y, enemy));
        this.cooldown = this.fireRate;
        break;
      }
    }
  }

  draw() {
    ctx.fillStyle = "blue";
    ctx.beginPath();
    ctx.arc(this.x, this.y, 15, 0, Math.PI * 2);
    ctx.fill();

    // Draw range if selected
    if (this.selected) {
      ctx.strokeStyle = "lightblue";
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.range, 0, Math.PI * 2);
      ctx.stroke();
    }

    for (let projectile of this.projectiles) {
      projectile.move();
      projectile.draw();
    }
    this.projectiles = this.projectiles.filter((p) => !p.reachedTarget);
  }
}

class Projectile {
  constructor(x, y, target) {
    this.x = x;
    this.y = y;
    this.target = target;
    this.speed = 5;
    this.reachedTarget = false;
  }

  move() {
    const dx = this.target.x - this.x;
    const dy = this.target.y - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance <= this.speed) {
      this.target.health -= 5; // Apply damage
      if (this.target.health <= 0) {
        money += 10;
        enemies = enemies.filter((e) => e !== this.target);
        updateStats();
      }
      this.reachedTarget = true;
    } else {
      this.x += (dx / distance) * this.speed;
      this.y += (dy / distance) * this.speed;
    }
  }

  draw() {
    ctx.fillStyle = "yellow";
    ctx.beginPath();
    ctx.arc(this.x, this.y, 5, 0, Math.PI * 2);
    ctx.fill();
  }
}

// Event Handlers
canvas.addEventListener("click", (e) => {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  for (let tower of towers) {
    const dx = x - tower.x;
    const dy = y - tower.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance <= 15) {
      tower.selected = !tower.selected;
      showUpgradePanel(tower);
      return;
    }
  }

  if (money >= 50) {
    towers.push(new Tower(x, y));
    money -= 50;
    updateStats();
  }
});

function showUpgradePanel(tower) {
  const panel = document.getElementById("upgrade-panel");
  const stats = document.getElementById("defender-stats");

  panel.style.display = "block";
  stats.innerHTML = `
    Range: ${tower.range}<br>
    Damage: ${tower.damage}<br>
    Fire Rate: ${tower.fireRate}
  `;

  document.getElementById("upgrade-range").onclick = () => upgradeTower(tower, "range", 20);
  document.getElementById("upgrade-damage").onclick = () => upgradeTower(tower, "damage", 30);
  document.getElementById("upgrade-speed").onclick = () => upgradeTower(tower, "fireRate", 40);
}

function upgradeTower(tower, stat, cost) {
  if (money >= cost) {
    money -= cost;
    tower[stat] += stat === "fireRate" ? -5 : 10; // Decrease fire rate for faster shooting
    updateStats();
    showUpgradePanel(tower);
  }
}

function updateStats() {
  document.getElementById("health").innerText = health;
  document.getElementById("money").innerText = money;
}

function spawnEnemy() {
  if (gameRunning) {
    enemies.push(new Enemy());
    setTimeout(spawnEnemy, 2000); // Spawn every 2 seconds
  }
}

function gameLoop() {
  if (!gameRunning) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = "white";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(path[0].x, path[0].y);
  for (let p of path) {
    ctx.lineTo(p.x, p.y);
  }
  ctx.stroke();

  for (let enemy of enemies) {
    enemy.move();
    enemy.draw();
  }

  for (let tower of towers) {
    tower.shoot();
    tower.draw();
  }

  if (health <= 0) {
    alert("Game Over!");
    gameRunning = false;
  } else {
    requestAnimationFrame(gameLoop);
  }
}

document.getElementById("start-button").addEventListener("click", () => {
  if (!gameRunning) {
    gameRunning = true;
    spawnEnemy();
    gameLoop();
  }
});
