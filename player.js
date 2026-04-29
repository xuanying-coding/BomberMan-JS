// player.js
import { TILE_SIZE } from './map.js';

export class Player {
    constructor(gx, gy, color = '#3498db') {
        this.gx = gx;
        this.gy = gy;
        this.x = this.gx * TILE_SIZE + 5;
        this.y = this.gy * TILE_SIZE + 5;
        this.w = 30;
        this.h = 30;
        this.power = 1;      // 炸弹半径
        this.maxBombs = 1;   // 可放置上限
        this.currentBombs = 0;
        this.color = color;
    }

    // player.js

move(dir, mapData) {
    let nextGX = this.gx;
    let nextGY = this.gy;

    if (dir === 'ArrowUp') nextGY--;
    if (dir === 'ArrowDown') nextGY++;
    if (dir === 'ArrowLeft') nextGX--;
    if (dir === 'ArrowRight') nextGX++;

    // 1. 基础碰撞检查 (0为平地, >=3为道具或特殊地形)
    if (mapData[nextGY] && (mapData[nextGY][nextGX] === 0 || mapData[nextGY][nextGX] >= 3)) {
        this.gx = nextGX;
        this.gy = nextGY;
        
        // 2. 处理地形效果
        this.handleTerrain(dir, mapData);

        // 更新像素坐标
        this.x = this.gx * TILE_SIZE + 5;
        this.y = this.gy * TILE_SIZE + 5;
        return true;
    }
    return false;
}

handleTerrain(dir, mapData) {
    const currentTile = mapData[this.gy][this.gx];

    // --- A. 冰面逻辑 (Ice) ---
    if (currentTile === 8) {
        // 冰面会让你沿着原方向再滑一格
        let slideX = this.gx;
        let slideY = this.gy;
        if (dir === 'ArrowUp') slideY--;
        if (dir === 'ArrowDown') slideY++;
        if (dir === 'ArrowLeft') slideX--;
        if (dir === 'ArrowRight') slideX++;

        // 如果滑行的下一格是空的或是道具，就滑过去
        if (mapData[slideY] && (mapData[slideY][slideX] === 0 || mapData[slideY][slideX] >= 3)) {
            // 延迟一小会儿执行滑行，手感更好（或者直接瞬间移动）
            this.gx = slideX;
            this.gy = slideY;
        }
    }

    // --- B. 传送带逻辑 (Conveyor) ---
    if (currentTile === 7) {
        // 假设传送带统一向右推
        if (mapData[this.gy][this.gx + 1] === 0) {
            this.gx += 1;
        }
    }

    // --- C. 传送门逻辑 (Portal) ---
    if (currentTile === 6) {
        // 寻找地图上另一个传送门的位置
        for (let r = 0; r < mapData.length; r++) {
            for (let c = 0; c < mapData[r].length; c++) {
                if (mapData[r][c] === 6 && (r !== this.gy || c !== this.gx)) {
                    this.gx = c;
                    this.gy = r;
                    return; // 传送一次即停止
                }
            }
        }
    }
    
    // --- D. 道具拾取 (保持原样) ---
    if (currentTile === 3) { this.power++; mapData[this.gy][this.gx] = 0; }
    if (currentTile === 4) { this.maxBombs++; mapData[this.gy][this.gx] = 0; }
}

    draw(ctx) {
    ctx.font = "30px serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    // 用一个宇航员或者机器人来代表玩家
    ctx.fillText("🧑‍🚀", this.x + TILE_SIZE/2 - 5, this.y + TILE_SIZE/2 - 5);
}

}