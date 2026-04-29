// utils.js
export function checkCollision(nx, ny, width, height, map, TILE_SIZE) {
    const margin = 4; // 碰撞宽容度
    const corners = [
        {x: nx + margin, y: ny + margin},
        {x: nx + width - margin, y: ny + margin},
        {x: nx + margin, y: ny + height - margin},
        {x: nx + width - margin, y: ny + height - margin}
    ];
    
    for (let p of corners) {
        let gx = Math.floor(p.x / TILE_SIZE);
        let gy = Math.floor(p.y / TILE_SIZE);
        // 判定地图边界、墙壁(1)和木箱(2)
        if (!map[gy] || map[gy][gx] === undefined || map[gy][gx] === 1 || map[gy][gx] === 2) {
            return false;
        }
    }
    return true;
}