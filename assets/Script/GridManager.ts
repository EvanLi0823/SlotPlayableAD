/**
 * GridManager - 网格管理器
 * 管理当前牌面布局，提供坐标转换
 */

import { SymbolLayout, WinPosition } from "./DataTypes";
import SymbolItem from "./SymbolItem";
import ReelController from "./ReelController";

const { ccclass } = cc._decorator;

@ccclass
export default class GridManager {
    private reelControllers: ReelController[] = [];
    private currentLayout: SymbolLayout = [];
    private rows: number = 3;
    private reels: number = 5;

    /**
     * 初始化
     */
    init(reelControllers: ReelController[], rows: number, reels: number): void {
        this.reelControllers = reelControllers;
        this.rows = rows;
        this.reels = reels;
    }

    /**
     * 设置初始布局
     */
    setInitialLayout(layout: SymbolLayout): void {
        this.currentLayout = this.copyLayout(layout);
    }

    /**
     * 获取当前布局
     */
    getCurrentLayout(): SymbolLayout {
        // 从每个reel获取当前可见的symbols
        const layout: SymbolLayout = [];

        for (let row = 0; row < this.rows; row++) {
            layout[row] = [];
        }

        for (let col = 0; col < this.reels; col++) {
            const reel = this.reelControllers[col];
            const symbols = reel.getCurrentVisibleSymbols();

            for (let row = 0; row < this.rows; row++) {
                layout[row][col] = symbols[row];
            }
        }

        this.currentLayout = layout;
        return this.copyLayout(layout);
    }

    /**
     * 更新布局
     */
    updateLayout(newLayout: SymbolLayout): void {
        if (this.validateLayout(newLayout)) {
            this.currentLayout = this.copyLayout(newLayout);
        } else {
            cc.warn("[GridManager] Invalid layout provided");
        }
    }

    /**
     * 根据行列获取SymbolItem
     */
    getSymbolAt(row: number, col: number): SymbolItem | null {
        if (row < 0 || row >= this.rows || col < 0 || col >= this.reels) {
            cc.warn(`[GridManager] Invalid position: row=${row}, col=${col}`);
            return null;
        }

        const reel = this.reelControllers[col];
        if (!reel) {
            cc.warn(`[GridManager] Reel controller not found at col=${col}`);
            return null;
        }

        // 使用ReelController提供的方法获取指定行的SymbolItem
        // 这个方法会根据stopIndexInRenders动态计算正确的索引
        const symbolItem = reel.getSymbolItemAtRow(row);

        if (!symbolItem) {
            cc.warn(`[GridManager] SymbolItem not found at row=${row}, col=${col}`);
        }

        return symbolItem;
    }

    /**
     * 批量获取SymbolItem
     */
    getSymbolsByPositions(positions: WinPosition[]): SymbolItem[] {
        const items: SymbolItem[] = [];

        for (const pos of positions) {
            const item = this.getSymbolAt(pos.row, pos.col);
            if (item) {
                items.push(item);
            }
        }

        return items;
    }

    /**
     * 验证布局是否有效
     */
    validateLayout(layout: SymbolLayout): boolean {
        if (!layout || layout.length !== this.rows) {
            return false;
        }

        for (const row of layout) {
            if (!row || row.length !== this.reels) {
                return false;
            }

            // 检查symbolId是否在有效范围内
            for (const symbolId of row) {
                if (symbolId < 0 || !Number.isInteger(symbolId)) {
                    return false;
                }
            }
        }

        return true;
    }

    /**
     * 复制布局（深拷贝）
     */
    private copyLayout(layout: SymbolLayout): SymbolLayout {
        return layout.map(row => [...row]);
    }

    /**
     * 隐藏所有 Particle 节点
     */
    hideAllParticles(): void {
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.reels; col++) {
                const symbolItem = this.getSymbolAt(row, col);
                if (symbolItem) {
                    symbolItem.stopAnimation();
                }
            }
        }
    }

    /**
     * 打印当前布局（用于调试）
     */
    printLayout(): void {
        const layout = this.getCurrentLayout();
        cc.log("[GridManager] Current Layout:");
        for (let row = 0; row < this.rows; row++) {
            cc.log(`Row ${row}: [${layout[row].join(", ")}]`);
        }
    }
}
