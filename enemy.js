import { TILE_SIZE } from './map.js';
import { Bomb } from './bomb.js';

export class Enemy {
    constructor(gx, gy, id) {
        this.id = id;
        this.w = 30; this.h = 30;
        this.speed = 1.6; 
        this.gx = gx; this.gy = gy;
        this.targetGx = gx; this.targetGy = gy;
        this.x = gx * TILE_SIZE + 5;
        this.y = gy * TILE_SIZE + 5;

        // 数值属性
        this.power = 1;
        this.maxBombs = 1;
        this.bombCooldown = 120;
        this.alive = true;

        // 个性化外观
        const colors = ['#e74c3c', '#9b59b6', '#3498db', '#f1c40f', '#1abc9c', '#e67e22'];
        const names = ["炎魔", "紫魇", "蓝霸", "金角", "哥布林", "火诡"];
        this.color = colors[id % colors.length];
        this.name = names[id % names.length];
        this.type = id % 3; // 0:圆润, 1:独眼, 2:方头愤怒
    }

    update(mapData, player, bombs, explosions, allEnemies) {
        if (!this.alive || !mapData) return;
        if (this.bombCooldown > 0) this.bombCooldown--;

        const pixelTargetX = this.targetGx * TILE_SIZE + 5;
        const pixelTargetY = this.targetGy * TILE_SIZE + 5;

        if (Math.hypot(this.x - pixelTargetX, this.y - pixelTargetY) < this.speed) {
            this.x = pixelTargetX; this.y = pixelTargetY;
            this.gx = this.targetGx; this.gy = this.targetGy;

            // 拾取道具
            const tile = mapData[this.gy][this.gx];
            if (tile === 3) { this.power++; mapData[this.gy][this.gx] = 0; }
            if (tile === 4) { this.maxBombs++; mapData[this.gy][this.gx] = 0; }

            this.planPath(mapData, player, bombs, explosions, allEnemies);
        } else {
            if (this.x < pixelTargetX) this.x += this.speed;
            else if (this.x > pixelTargetX) this.x -= this.speed;
            if (this.y < pixelTargetY) this.y += this.speed;
            else if (this.y > pixelTargetY) this.y -= this.speed;
        }
    }

    planPath(mapData, player, bombs, explosions, allEnemies) {
        const inDanger = this.isPosDangerous(this.gx, this.gy, bombs, explosions);

        if (inDanger) {
            const escape = this.bfs(mapData, bombs, explosions, "SAFE");
            if (escape) return this.moveTo(escape[1]);
        }

        const myBombs = bombs.filter(b => b.ownerId === this.id);
        if (!inDanger && this.bombCooldown <= 0 && myBombs.length < this.maxBombs && 
           (this.isNextToBox(this.gx, this.gy, mapData) || this.isNearEnemy(player, allEnemies))) {
            if (this.bfs(mapData, bombs, explosions, "SAFE")) {
                const b = new Bomb(this.gx, this.gy, this.power);
                b.ownerId = this.id;
                bombs.push(b);
                this.bombCooldown = 180;
                return;
            }
        }

        const itemPath = this.bfs(mapData, bombs, explosions, "ITEM");
        if (itemPath) return this.moveTo(itemPath[1]);

        const huntTarget = (player.alive) ? {x: player.gx, y: player.gy} : this.getNearestEnemy(allEnemies);
        if (huntTarget) {
            const chase = this.bfs(mapData, bombs, explosions, "TARGET", huntTarget);
            if (chase) return this.moveTo(chase[1]);
        }

        this.randomSafeMove(mapData, bombs, explosions);
    }

    moveTo(step) { if (step) { this.targetGx = step.x; this.targetGy = step.y; } }

    bfs(mapData, bombs, explosions, mode, targetPos = null) {
        const queue = [[{x: this.gx, y: this.gy}]];
        const visited = new Set([`${this.gx},${this.gy}`]);
        const moves = [[0,-1],[0,1],[-1,0],[1,0]];

        while (queue.length > 0) {
            const path = queue.shift();
            const curr = path[path.length - 1];

            if (mode === "SAFE" && !this.isPosDangerous(curr.x, curr.y, bombs, explosions)) return path;
            if (mode === "ITEM" && mapData[curr.y][curr.x] >= 3) return path;
            if (mode === "TARGET" && curr.x === targetPos.x && curr.y === targetPos.y) return path;

            for (const [dx, dy] of moves) {
                const nx = curr.x + dx, ny = curr.y + dy;
                if (ny >= 0 && ny < mapData.length && nx >= 0 && nx < mapData[0].length &&
                    (mapData[ny][nx] === 0 || mapData[ny][nx] >= 3) && !visited.has(`${nx},${ny}`)) {
                    if (mode !== "SAFE" && this.isPosDangerous(nx, ny, bombs, explosions)) continue;
                    visited.add(`${nx},${ny}`);
                    queue.push([...path, {x: nx, y: ny}]);
                }
            }
            if (visited.size > 200) break;
        }
        return null;
    }

    isNearEnemy(player, allEnemies) {
        const targets = player.alive ? [...allEnemies, player] : [...allEnemies];
        return targets.some(t => t !== this && t.alive && Math.abs(this.gx - t.gx) + Math.abs(this.gy - t.gy) <= 2);
    }

    getNearestEnemy(allEnemies) {
        let nearest = null, minDist = Infinity;
        allEnemies.forEach(en => {
            if (en === this || !en.alive) return;
            const d = Math.abs(this.gx - en.gx) + Math.abs(this.gy - en.gy);
            if (d < minDist) { minDist = d; nearest = {x: en.gx, y: en.gy}; }
        });
        return nearest;
    }

    isPosDangerous(tx, ty, bombs, explosions) {
        if (explosions.some(ex => ex.x === tx && ex.y === ty)) return true;
        return bombs.some(b => {
            if (b.gx === tx && b.gy === ty) return true;
            return (b.gx === tx && Math.abs(b.gy - ty) <= b.power) || (b.gy === ty && Math.abs(b.gx - tx) <= b.power);
        });
    }

    isNextToBox(gx, gy, mapData) {
        return [[0,1],[0,-1],[1,0],[-1,0]].some(([ox,oy]) => mapData[gy+oy] && mapData[gy+oy][gx+ox] === 2);
    }

    randomSafeMove(mapData, bombs, explosions) {
        const moves = [[0,-1],[0,1],[-1,0],[1,0]].sort(() => Math.random() - 0.5);
        for (let m of moves) {
            const nx = this.gx + m[0], ny = this.gy + m[1];
            if (mapData[ny] && (mapData[ny][nx] === 0 || mapData[ny][nx] >= 3) && !this.isPosDangerous(nx, ny, bombs, explosions)) {
                this.moveTo({x: nx, y: ny}); break;
            }
        }
    }

    draw(ctx) {
        if (!this.alive) return;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        if (this.type === 2) ctx.roundRect(this.x, this.y, this.w, this.h, 4);
        else ctx.roundRect(this.x, this.y, this.w, this.h, 10);
        ctx.fill();

        ctx.fillStyle = 'white';
        if (this.type === 1) { // 独眼
            ctx.beginPath(); ctx.arc(this.x + 15, this.y + 12, 6, 0, 7); ctx.fill();
            ctx.fillStyle = 'black'; ctx.beginPath(); ctx.arc(this.x + 15, this.y + 12, 3, 0, 7); ctx.fill();
        } else { // 双眼
            ctx.fillRect(this.x+6, this.y+8, 6, 6); ctx.fillRect(this.x+18, this.y+8, 6, 6);
            ctx.fillStyle = 'black'; ctx.fillRect(this.x+8, this.y+10, 2, 2); ctx.fillRect(this.x+20, this.y+10, 2, 2);
        }
        ctx.fillStyle = 'white'; ctx.font = 'bold 10px Arial'; ctx.textAlign = 'center';
        ctx.fillText(this.name, this.x + 15, this.y - 5);
    }
}