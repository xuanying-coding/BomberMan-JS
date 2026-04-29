import { TILE_SIZE, ROWS, COLS, mapData, drawMap, loadLevelData } from './map.js';
import { Player } from './player.js';
import { Enemy } from './enemy.js';
import { Bomb, triggerExplosion } from './bomb.js';

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let gameState = "MENU"; 
let score = 0;
let player, enemies = [], bombs = [], explosions = [];

window.initGame = function(levelId) {
    loadLevelData(levelId);
    canvas.width = COLS * TILE_SIZE;
    canvas.height = ROWS * TILE_SIZE;

    document.getElementById('mainMenu').style.display = 'none';
    document.getElementById('gameUI').style.display = 'flex'; 

    player = new Player(1, 1);
    player.alive = true;
    
    // 生成不同个性的敌人
    enemies = [
        new Enemy(COLS - 2, ROWS - 2, 0), 
        new Enemy(COLS - 2, 1, 1), 
        new Enemy(1, ROWS - 2, 2),
        new Enemy(Math.floor(COLS/2), ROWS - 2, 3)
    ];

    bombs = []; explosions = []; score = 0;
    gameState = "PLAYING";
};

window.addEventListener('keydown', e => {
    if (gameState !== "PLAYING" || !player.alive) return;
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) player.move(e.key, mapData);
    if (e.code === 'Space' && player.currentBombs < player.maxBombs) {
        if (!bombs.some(b => b.gx === player.gx && b.gy === player.gy)) {
            const b = new Bomb(player.gx, player.gy, player.power);
            b.ownerId = 'player'; bombs.push(b); player.currentBombs++;
        }
    }
});

function update() {
    if (gameState !== "PLAYING") return;

    enemies.forEach(en => en.update(mapData, player, bombs, explosions, enemies));

    for (let i = bombs.length - 1; i >= 0; i--) {
        const b = bombs[i];
        if (--b.timer <= 0) {
            triggerExplosion(b, explosions, mapData);
            bombs.splice(i, 1);
            if (b.ownerId === 'player' && player.currentBombs > 0) player.currentBombs--;
        }
    }

    for (let i = explosions.length - 1; i >= 0; i--) {
        const ex = explosions[i];
        if (player.alive && player.gx === ex.x && player.gy === ex.y) player.alive = false;
        enemies.forEach((en, ei) => {
            const egx = Math.floor((en.x + en.w/2)/TILE_SIZE), egy = Math.floor((en.y + en.h/2)/TILE_SIZE);
            if (en.alive && egx === ex.x && egy === ex.y) {
                en.alive = false;
                if (player.alive) score += 200;
            }
        });
        if (--ex.timer <= 0) explosions.splice(i, 1);
    }

    // 存活判定
    const aliveEnemies = enemies.filter(e => e.alive);
    const totalAlive = (player.alive ? 1 : 0) + aliveEnemies.length;

    if (totalAlive <= 1) {
        // 游戏结束条件：只剩一人或全部阵亡
        if (totalAlive === 1) {
            endGame(player.alive);
        } else if (totalAlive === 0) {
            endGame(false);
        }
    }

    updateUI(aliveEnemies);
}

function updateUI(aliveEnemies) {
    document.getElementById('scoreVal').innerText = score;
    document.getElementById('powerVal').innerText = player.alive ? player.power : "RIP";
    document.getElementById('bombMaxVal').innerText = player.alive ? player.maxBombs : "RIP";

    const list = document.getElementById('enemyStatsList');
    if (list) {
        list.innerHTML = aliveEnemies.map(en => `
            <div class="enemy-stat-row" style="border-left: 4px solid ${en.color}">
                <span style="color:${en.color};font-weight:bold">${en.name}</span>
                <span>${en.power}🔥 ${en.maxBombs}💣</span>
            </div>
        `).join('');
    }
}

function gameLoop() {
    if (gameState === "PLAYING") {
        update();
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawMap(ctx);
        bombs.forEach(b => b.draw(ctx));
        ctx.fillStyle = 'rgba(255, 69, 0, 0.6)';
        explosions.forEach(ex => ctx.fillRect(ex.x * TILE_SIZE, ex.y * TILE_SIZE, TILE_SIZE, TILE_SIZE));
        if (player.alive) player.draw(ctx);
        enemies.forEach(en => en.draw(ctx));
    }
    requestAnimationFrame(gameLoop);
}

function endGame(isWin) {
    gameState = "GAMEOVER";
    setTimeout(() => {
        alert(isWin ? "🏆 恭喜！你是最后的幸存者！" : "💥 游戏结束！");
        location.reload();
    }, 1000);
}

gameLoop();