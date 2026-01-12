/**
 * WinAnimationController - 中奖动画控制器
 * 协调多个symbol的中奖动画播放
 */

import { SpinResult, WinPlayMode, SymbolAnimConfig } from "./DataTypes";
import GridManager from "./GridManager";
import SymbolItem from "./SymbolItem";

const { ccclass } = cc._decorator;

@ccclass
export default class WinAnimationController {
    private gridManager: GridManager = null;
    private animConfigs: Map<number, SymbolAnimConfig> = new Map();
    private loopCount: number = 3;

    /**
     * 初始化
     */
    init(gridManager: GridManager, loopCount: number): void {
        this.gridManager = gridManager;
        this.loopCount = loopCount;
    }

    /**
     * 设置动画配置
     */
    setAnimConfigs(configs: SymbolAnimConfig[]): void {
        this.animConfigs.clear();
        for (const config of configs) {
            this.animConfigs.set(config.symbolId, config);
        }
    }

    /**
     * 播放中奖动画
     */
    async play(result: SpinResult, mode: WinPlayMode = WinPlayMode.SIMULTANEOUS): Promise<void> {
        cc.log("[WinAnimationController] play() called, result:", result);
        cc.log("[WinAnimationController] winPositions:", result.winPositions);
        cc.log("[WinAnimationController] animConfigs size:", this.animConfigs.size);

        if (!result.winPositions || result.winPositions.length === 0) {
            cc.log("[WinAnimationController] No win positions, skipping animation");
            return;
        }

        cc.log("[WinAnimationController] Starting animation with mode:", mode);

        switch (mode) {
            case WinPlayMode.SIMULTANEOUS:
                await this.playSIMULTANEOUS(result);
                break;
            case WinPlayMode.BY_LINE:
                await this.playBY_LINE(result);
                break;
            case WinPlayMode.SEQUENTIAL:
                await this.playSEQUENTIAL(result);
                break;
        }

        cc.log("[WinAnimationController] Animation completed");
    }

    /**
     * 停止所有动画
     */
    stopAll(): void {
        // 这里可以遍历所有symbols并停止动画
        cc.log("[WinAnimationController] Stop all animations");
    }

    /**
     * 模式1: SIMULTANEOUS（同时播放）
     */
    private async playSIMULTANEOUS(result: SpinResult): Promise<void> {
        const { winPositions } = result;

        cc.log("[WinAnimationController] playSIMULTANEOUS - winPositions count:", winPositions.length);

        // 1. 获取所有中奖symbol实例
        const winSymbols = this.gridManager.getSymbolsByPositions(winPositions);
        cc.log("[WinAnimationController] Got winSymbols count:", winSymbols.length);

        // 验证获取到的symbol是否正确
        for (let i = 0; i < winPositions.length; i++) {
            const pos = winPositions[i];
            const symbol = winSymbols[i];
            if (symbol) {
                const actualSymbolId = symbol.getSymbolId();
                cc.log(`[WinAnimationController] WinPosition[${i}]: (row=${pos.row}, col=${pos.col}) expected symbolId=${pos.symbolId}, actual symbolId=${actualSymbolId}, ${actualSymbolId === pos.symbolId ? '✓ MATCH' : '✗ MISMATCH'}`);
            } else {
                cc.error(`[WinAnimationController] WinPosition[${i}]: (row=${pos.row}, col=${pos.col}) symbol is NULL!`);
            }
        }

        // 2. 为每个symbol获取对应的动画配置并播放
        const animPromises = winSymbols.map((symbol, index) => {
            const symbolId = symbol.getSymbolId();
            cc.log(`[WinAnimationController] Processing symbol ${index}: symbolId=${symbolId}`);

            const config = this.getAnimConfig(symbolId);
            if (config) {
                cc.log(`[WinAnimationController] Symbol ${index} has config, playing animation`);
                return symbol.playWinAnimation(config, this.loopCount);
            } else {
                cc.warn(`[WinAnimationController] Symbol ${index} (id=${symbolId}) has NO config!`);
                return Promise.resolve();
            }
        });

        cc.log("[WinAnimationController] Starting", animPromises.length, "animations...");

        // 3. 等待所有动画完成
        await Promise.all(animPromises);

        cc.log("[WinAnimationController] All animations finished");
    }

    /**
     * 模式2: BY_LINE（按线播放）
     * 逐条播放中奖线，每条线上的Symbol同时高亮
     */
    private async playBY_LINE(result: SpinResult): Promise<void> {
        const { winLines } = result;

        cc.log("[WinAnimationController] playBY_LINE mode");

        if (!winLines || winLines.length === 0) {
            cc.warn("[WinAnimationController] No winLines, falling back to SIMULTANEOUS mode");
            // 如果没有winLines，降级为SIMULTANEOUS模式
            await this.playSIMULTANEOUS(result);
            return;
        }

        cc.log(`[WinAnimationController] Playing ${winLines.length} win lines sequentially`);

        // 逐条播放中奖线
        for (let i = 0; i < winLines.length; i++) {
            const line = winLines[i];

            cc.log(`[WinAnimationController] ========================================`);
            cc.log(`[WinAnimationController] Playing line ${i + 1}/${winLines.length}`);
            cc.log(`[WinAnimationController]   Symbol: ${line.symbol}`);
            cc.log(`[WinAnimationController]   Consecutive Reels: ${line.consecutiveReels}`);
            cc.log(`[WinAnimationController]   Path Count: ${line.pathCount}`);
            cc.log(`[WinAnimationController]   Positions: ${line.participatingPositions.length}个`);

            // 转换participatingPositions为WinPosition数组
            const winPositions = line.participatingPositions.map(([row, col]) => {
                // 从布局中获取实际的symbolId
                const symbolId = result.finalLayout[row][col];
                return { row, col, symbolId };
            });

            // 获取这条线上的symbols
            const lineSymbols = this.gridManager.getSymbolsByPositions(winPositions);

            cc.log(`[WinAnimationController]   Got ${lineSymbols.length} symbols for this line`);

            // 同时播放这条线上的所有symbol
            const animPromises = lineSymbols.map((symbol, idx) => {
                const symbolId = symbol.getSymbolId();
                const config = this.getAnimConfig(symbolId);

                if (config) {
                    cc.log(`[WinAnimationController]   Playing symbol ${idx}: id=${symbolId}`);
                    return symbol.playWinAnimation(config, this.loopCount);
                } else {
                    cc.warn(`[WinAnimationController]   Symbol ${idx}: id=${symbolId} has NO config`);
                    return Promise.resolve();
                }
            });

            // 等待这条线的所有动画完成
            await Promise.all(animPromises);

            cc.log(`[WinAnimationController] Line ${i + 1} animation completed`);

            // 延迟后播放下一条线（最后一条线不需要延迟）
            if (i < winLines.length - 1) {
                cc.log(`[WinAnimationController] Waiting 0.3s before next line...`);
                await this.delay(0.3);
            }
        }

        cc.log("[WinAnimationController] ========================================");
        cc.log("[WinAnimationController] All lines animation completed");
    }

    /**
     * 模式3: SEQUENTIAL（顺序播放）
     */
    private async playSEQUENTIAL(result: SpinResult): Promise<void> {
        const { winPositions } = result;

        // 按位置顺序（从左到右，从上到下）排序
        const sortedPositions = [...winPositions].sort((a, b) => {
            if (a.col !== b.col) return a.col - b.col;
            return a.row - b.row;
        });

        // 逐个播放
        for (const pos of sortedPositions) {
            const symbol = this.gridManager.getSymbolAt(pos.row, pos.col);
            if (symbol) {
                const config = this.getAnimConfig(pos.symbolId);
                if (config) {
                    await symbol.playWinAnimation(config, 1);
                    await this.delay(0.1);
                }
            }
        }
    }

    /**
     * 获取动画配置
     */
    private getAnimConfig(symbolId: number): SymbolAnimConfig | null {
        return this.animConfigs.get(symbolId) || null;
    }

    /**
     * 延迟工具函数
     */
    private delay(seconds: number): Promise<void> {
        return new Promise((resolve) => {
            setTimeout(() => resolve(), seconds * 1000);
        });
    }
}
