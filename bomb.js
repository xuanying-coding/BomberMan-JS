// bomb.js
import { TILE_SIZE, mapData } from './map.js';

export class Bomb {
    constructor(gx, gy, power) {
        this.gx = gx;
        this.gy = gy;
        this.power = power;
        this.timer = 120; // 2秒左右
    }

    draw(ctx) {
        let pulse = Math.sin(Date.now() / 100) * 3;
        ctx.fillStyle = '#e74c3c';
        ctx.beginPath();
        ctx.arc(this.gx * TILE_SIZE + TILE_SIZE/2, this.gy * TILE_SIZE + TILE_SIZE/2, TILE_SIZE/3 + pulse, 0, Math.PI*2);
        ctx.fill();
    }
}

export class Explosion {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.timer = 20; // 显示0.3秒左右
    }

    draw(ctx) {
        ctx.fillStyle = 'rgba(255, 230, 0, 0.7)';
        ctx.fillRect(this.x * TILE_SIZE, this.y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
    }
}

// bomb.js - 核心片段修改
export function triggerExplosion(bomb, explosions, mapData) {
    const dirs = [[0,0], [0,1], [0,-1], [1,0], [-1,0]];
    dirs.forEach(d => {
        for (let i = 0; i <= bomb.power; i++) {
            if (i === 0 && (d[0]!==0 || d[1]!==0)) continue; 
            
            let tx = bomb.gx + d[0] * i;
            let ty = bomb.gy + d[1] * i;

            if (!mapData[ty] || mapData[ty][tx] === 1) break; // 撞墙停止
            
            explosions.push({ x: tx, y: ty, timer: 20 });

            if (mapData[ty][tx] === 2) { // 撞到木箱
                const rand = Math.random();
                if (rand > 0.85) {
                    mapData[ty][tx] = 3; // 🔥 威力
                } else if (rand > 0.7) {
                    mapData[ty][tx] = 4; // 💣 数量
                } else {
                    mapData[ty][tx] = 0; // 炸空
                }
                break; 
            }
        }
    });
}