// map.js

export const TILE_SIZE = 32; // 地图变大后，缩小格子尺寸以适应屏幕
export let ROWS = 25; 
export let COLS = 25;

// 关卡原始模板
const LEVEL_CONFIG = {
    1: {
        name: "宏伟森林",
        rows: 25,
        cols: 25,
        colors: { wall: '#27ae60', floor: '#2d3e50', box: '#e67e22' },
        density: 0.6 // 箱子分布密度
    },
    2: {
        name: "时空工厂",
        rows: 31,
        cols: 31,
        colors: { wall: '#7f8c8d', floor: '#2c3e50', box: '#d35400' },
        density: 0.4
    },
    3: {
        name: "寒冰迷宫",
        rows: 25,
        cols: 25,
        colors: { wall: '#ecf0f1', floor: '#34495e', box: '#2980b9' },
        density: 0.7
    }
};

export let mapData = [];
let currentStyle = LEVEL_CONFIG[1].colors;

/**
 * 核心修改：自动生成大型地图数据
 * 采用经典泡泡堂布局：外围墙壁 + 内部固定柱子 + 随机木箱
 */
function generateMapData(rows, cols, density) {
    let data = [];
    for (let r = 0; r < rows; r++) {
        let row = [];
        for (let c = 0; c < cols; c++) {
            // 1. 边界必须是墙 (1)
            if (r === 0 || r === rows - 1 || c === 0 || c === cols - 1) {
                row.push(1);
            } 
            // 2. 内部固定支柱 (奇数行奇数列)
            else if (r % 2 === 0 && c % 2 === 0) {
                row.push(1);
            } 
            // 3. 保护出生点：角落 3x3 区域必须留白 (0)
            else if ((r < 3 && c < 3) || 
                     (r < 3 && c > cols - 4) || 
                     (r > rows - 4 && c < 3) || 
                     (r > rows - 4 && c > cols - 4)) {
                row.push(0);
            } 
            // 4. 其余地方随机生成木箱 (2)
            else {
                row.push(Math.random() < density ? 2 : 0);
            }
        }
        data.push(row);
    }
    return data;
}

export function loadLevelData(id) {
    const config = LEVEL_CONFIG[id] || LEVEL_CONFIG[1];
    
    // 更新全局行列数
    ROWS = config.rows;
    COLS = config.cols;
    
    // 动态生成地图数据
    mapData = generateMapData(ROWS, COLS, config.density);
    currentStyle = config.colors;
}

export function drawMap(ctx) {
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            const tile = mapData[r][c];
            const x = c * TILE_SIZE;
            const y = r * TILE_SIZE;

            // 绘制地板
            ctx.fillStyle = currentStyle.floor;
            ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);

            if (tile === 1) {
                // 墙壁：带一点阴影效果
                ctx.fillStyle = currentStyle.wall;
                ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
                ctx.strokeStyle = "rgba(0,0,0,0.3)";
                ctx.strokeRect(x + 2, y + 2, TILE_SIZE - 4, TILE_SIZE - 4);
            } 
            else if (tile === 2) {
                // 木箱
                ctx.fillStyle = currentStyle.box;
                ctx.fillRect(x + 1, y + 1, TILE_SIZE - 2, TILE_SIZE - 2);
                ctx.strokeStyle = "rgba(0,0,0,0.1)";
                ctx.strokeRect(x + 4, y + 4, TILE_SIZE - 8, TILE_SIZE - 8);
            } 
            else if (tile >= 3) {
                drawSpecial(ctx, x, y, tile);
            }
        }
    }
}

function drawSpecial(ctx, x, y, type) {
    const icons = { 3: "🔥", 4: "💣", 6: "🌀", 7: "➔", 8: "❄️" };
    const icon = icons[type] || "";
    
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `${Math.floor(TILE_SIZE * 0.6)}px Arial`;
    ctx.fillStyle = "white";
    ctx.fillText(icon, x + TILE_SIZE / 2, y + TILE_SIZE / 2);
}