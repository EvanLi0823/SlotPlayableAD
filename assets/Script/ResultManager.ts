/**
 * ResultManager - 结果管理器
 * 提供和管理spin结果，支持随机结果生成（测试用）
 */

import { SpinResult, SymbolLayout, WinPosition, WinLine, SymbolType } from "./DataTypes";
import SlotConfig from "./SlotConfig";

const { ccclass } = cc._decorator;

@ccclass
export default class ResultManager {
    private nextResult: SpinResult | null = null;
    private config: SlotConfig = null;

    /**
     * 初始化
     */
    init(config: SlotConfig): void {
        this.config = config;
    }

    /**
     * 设置下一次spin的结果
     */
    setNextResult(result: SpinResult): void {
        if (this.validateResult(result)) {
            this.nextResult = result;
        } else {
            cc.warn("[ResultManager] Invalid result provided");
        }
    }

    /**
     * 获取下一次spin的结果
     */
    getNextResult(): SpinResult | null {
        const result = this.nextResult;
        this.nextResult = null; // 清空
        return result;
    }

    /**
     * 验证结果数据
     */
    validateResult(result: SpinResult): boolean {
        if (!result || !result.finalLayout) {
            return false;
        }

        const { finalLayout, winPositions } = result;

        // 1. 验证finalLayout尺寸
        if (finalLayout.length !== this.config.rows) {
            cc.warn("[ResultManager] Invalid finalLayout rows");
            return false;
        }

        for (const row of finalLayout) {
            if (row.length !== this.config.reels) {
                cc.warn("[ResultManager] Invalid finalLayout cols");
                return false;
            }

            // 验证symbolId范围
            for (const symbolId of row) {
                if (symbolId < 0 || symbolId >= this.config.symbolTypes) {
                    cc.warn("[ResultManager] Invalid symbolId:", symbolId);
                    return false;
                }
            }
        }

        // 2. 验证winPositions坐标
        for (const pos of winPositions) {
            if (pos.row < 0 || pos.row >= this.config.rows) {
                cc.warn("[ResultManager] Invalid winPosition row:", pos.row);
                return false;
            }
            if (pos.col < 0 || pos.col >= this.config.reels) {
                cc.warn("[ResultManager] Invalid winPosition col:", pos.col);
                return false;
            }

            // 验证位置的symbolId与finalLayout一致
            if (finalLayout[pos.row][pos.col] !== pos.symbolId) {
                cc.warn("[ResultManager] WinPosition symbolId mismatch");
                return false;
            }
        }

        return true;
    }

    /**
     * 生成随机结果（测试用）
     */
    generateRandomResult(hasWin: boolean): SpinResult {
        const finalLayout: SymbolLayout = [];
        const winPositions: WinPosition[] = [];

        // 生成随机布局
        for (let row = 0; row < this.config.rows; row++) {
            finalLayout[row] = [];
            for (let col = 0; col < this.config.reels; col++) {
                finalLayout[row][col] = Math.floor(Math.random() * this.config.symbolTypes);
            }
        }

        // 如果需要中奖，强制中间一行相同
        if (hasWin) {
            const winSymbolId = Math.floor(Math.random() * this.config.symbolTypes);
            const winRow = 1; // 中间行

            for (let col = 0; col < this.config.reels; col++) {
                finalLayout[winRow][col] = winSymbolId;
                winPositions.push({ row: winRow, col, symbolId: winSymbolId });
            }
        }

        return {
            finalLayout,
            winPositions,
            winAmount: hasWin ? 100 + Math.floor(Math.random() * 900) : 0
        };
    }

    /**
     * 生成指定symbol的中奖结果
     */
    generateWinResult(
        symbolId: number,
        lineType: "horizontal" | "diagonal" = "horizontal"
    ): SpinResult {
        const finalLayout: SymbolLayout = [];
        const winPositions: WinPosition[] = [];
        const winLines: WinLine[] = [];

        // 生成随机布局
        for (let row = 0; row < this.config.rows; row++) {
            finalLayout[row] = [];
            for (let col = 0; col < this.config.reels; col++) {
                finalLayout[row][col] = Math.floor(Math.random() * this.config.symbolTypes);
            }
        }

        // 设置中奖线
        if (lineType === "horizontal") {
            // 横线中奖（中间一行）
            const winRow = 1;
            const positions: [number, number][] = [];

            for (let col = 0; col < this.config.reels; col++) {
                finalLayout[winRow][col] = symbolId;
                winPositions.push({ row: winRow, col, symbolId });
                positions.push([winRow, col]);
            }

            winLines.push({
                lineId: 2,
                positions,
                symbolId
            });
        } else if (lineType === "diagonal") {
            // 对角线中奖
            const positions: [number, number][] = [];

            for (let col = 0; col < this.config.reels && col < this.config.rows; col++) {
                const row = col;
                finalLayout[row][col] = symbolId;
                winPositions.push({ row, col, symbolId });
                positions.push([row, col]);
            }

            winLines.push({
                lineId: 4,
                positions,
                symbolId
            });
        }

        return {
            finalLayout,
            winPositions,
            winLines,
            winAmount: 200 + Math.floor(Math.random() * 800)
        };
    }

    /**
     * 检查中奖线（243 Ways机制）
     *
     * 规则：
     * 1. 从第1轴开始，后续轴连续匹配相同Symbol或Wild
     * 2. 至少前3个轴匹配才算中奖
     * 3. Wild(W01)可以替代任何Symbol，但第1轴结果不会出现Wild
     * 4. 路径数 = 轴1匹配数 × 轴2匹配数 × 轴3匹配数 × ...
     *
     * @param layout 最终布局 layout[row][reel]
     * @returns 中奖线数组
     */
    checkWinLines(layout: SymbolLayout): WinLine[] {
        const winLines: WinLine[] = [];
        const rows = layout.length;      // 3
        const reels = layout[0].length;  // 5
        const WILD = SymbolType.WILD;    // 11

        cc.log("[ResultManager] ========================================");
        cc.log("[ResultManager] 开始检查中奖线 (243 Ways机制)");
        cc.log("[ResultManager] 布局:");
        for (let row = 0; row < rows; row++) {
            cc.log(`[ResultManager]   Row ${row}: [${layout[row].join(', ')}]`);
        }

        // 获取第1轴所有不重复的Symbol（排除Wild，因为第1轴结果不会有Wild）
        const firstReelSymbolsSet = new Set<number>();
        for (let row = 0; row < rows; row++) {
            const symbol = layout[row][0];
            if (symbol !== WILD) {
                firstReelSymbolsSet.add(symbol);
            }
        }

        const firstReelSymbols = Array.from(firstReelSymbolsSet);
        cc.log(`[ResultManager] 第1轴起始Symbol: [${firstReelSymbols.join(', ')}]`);
        cc.log(`[ResultManager] 第1轴Symbol数量: ${firstReelSymbols.length}`);

        // 对每个起始Symbol进行检查
        for (let i = 0; i < firstReelSymbols.length; i++) {
            const startSymbol = firstReelSymbols[i];
            cc.log(`[ResultManager] ──────────────────────────────────────`);
            cc.log(`[ResultManager] 检查 Symbol ${startSymbol} (${i + 1}/${firstReelSymbols.length}):`);

            // 计算从这个Symbol开始的连续轴数和路径数
            let consecutiveReels = 0;
            let pathCount = 1; // 累计路径数
            const participatingPositions: [number, number][] = [];

            for (let reel = 0; reel < reels; reel++) {
                // 统计当前轴有多少个匹配的Symbol
                let matchCount = 0;
                const matchedRows: number[] = [];

                for (let row = 0; row < rows; row++) {
                    const currentSymbol = layout[row][reel];

                    // 匹配条件：当前Symbol等于startSymbol 或 是Wild
                    if (currentSymbol === startSymbol || currentSymbol === WILD) {
                        matchCount++;
                        matchedRows.push(row);
                        participatingPositions.push([row, reel]);
                    }
                }

                cc.log(`[ResultManager]   轴${reel}: ${matchCount}个匹配 (rows: [${matchedRows.join(', ')}])`);

                if (matchCount > 0) {
                    // 有匹配，连续数+1
                    consecutiveReels++;
                    pathCount *= matchCount; // 路径数累乘
                } else {
                    // 连续中断
                    cc.log(`[ResultManager]   轴${reel}中断，连续数=${consecutiveReels}`);
                    break;
                }
            }

            // 至少3连才算中奖
            if (consecutiveReels >= 3) {
                cc.log(`[ResultManager] ✅ Symbol ${startSymbol} 中奖!`);
                cc.log(`[ResultManager]   连续轴数: ${consecutiveReels}`);
                cc.log(`[ResultManager]   路径数: ${pathCount}`);
                cc.log(`[ResultManager]   参与位置: ${participatingPositions.length}个`);

                winLines.push({
                    symbol: startSymbol,
                    consecutiveReels: consecutiveReels,
                    pathCount: pathCount,
                    participatingPositions: participatingPositions
                });
            } else {
                cc.log(`[ResultManager] ❌ Symbol ${startSymbol} 未中奖 (只有${consecutiveReels}连)`);
            }
        }

        cc.log("[ResultManager] ========================================");
        cc.log(`[ResultManager] 中奖线总数: ${winLines.length}`);
        if (winLines.length > 0) {
            for (let i = 0; i < winLines.length; i++) {
                const line = winLines[i];
                cc.log(`[ResultManager] 中奖线${i + 1}: Symbol ${line.symbol}, ${line.consecutiveReels}连, ${line.pathCount}条路径`);
            }
        } else {
            cc.log(`[ResultManager] 没有中奖`);
        }
        cc.log("[ResultManager] ========================================");

        return winLines;
    }

    /**
     * 生成无中奖结果
     */
    generateNoWinResult(): SpinResult {
        const finalLayout: SymbolLayout = [];

        // 生成随机布局，确保没有连线
        for (let row = 0; row < this.config.rows; row++) {
            finalLayout[row] = [];
            for (let col = 0; col < this.config.reels; col++) {
                // 使用不同的随机数确保没有连线
                const symbolId = (row * this.config.reels + col) % this.config.symbolTypes;
                finalLayout[row][col] = symbolId;
            }
        }

        return {
            finalLayout,
            winPositions: [],
            winAmount: 0
        };
    }
}
