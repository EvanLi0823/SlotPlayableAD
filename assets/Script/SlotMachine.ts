/**
 * SlotMachine - 主控制器（曲线驱动版本）
 * 协调所有子系统，处理spin流程
 *
 * 核心改进：
 * - 使用曲线驱动替代速度控制
 * - 简化spin流程（不再分离start/stop）
 *
 * @author Claude Code
 * @date 2025-12-31
 */

import { SlotState, SpinResult, SymbolLayout, SymbolAnimConfig, WinPlayMode } from "./DataTypes";
import SlotConfig from "./SlotConfig";
import ReelController from "./ReelController";
import GridManager from "./GridManager";
import ResultManager from "./ResultManager";
import WinAnimationController from "./WinAnimationController";
import CurvePresets from "./CurvePresets";

const { ccclass, property } = cc._decorator;

@ccclass
export default class SlotMachine extends cc.Component {
    @property(SlotConfig)
    config: SlotConfig = null;

    @property(cc.Node)
    reelContainer: cc.Node = null;

    // 子系统
    private reelControllers: ReelController[] = [];
    private gridManager: GridManager = new GridManager();
    private resultManager: ResultManager = new ResultManager();
    private winAnimController: WinAnimationController = new WinAnimationController();

    // 状态
    private currentState: SlotState = SlotState.IDLE;
    private currentResult: SpinResult | null = null;
    private stoppedReelCount: number = 0;

    // 回调
    public onSpinComplete: ((result: SpinResult) => Promise<void>) | null = null;
    public onWinAnimComplete: (() => void) | null = null;
    public onStateChange: ((state: SlotState) => void) | null = null;

    /**
     * 初始化
     */
    init(initialLayout: SymbolLayout): void {
        cc.log("[SlotMachine] Initializing...");

        // 验证布局配置
        // 注释原因：symbol图片本身存在透明边界，无需验证布局尺寸
        // if (!this.config.validateLayout()) {
        //     cc.error("[SlotMachine] Layout configuration invalid!");
        // }

        // 验证Symbol配置
        if (!this.config.validateSymbolConfig()) {
            cc.error("[SlotMachine] Symbol configuration invalid! Please check SlotConfig.");
        }

        // 初始化结果管理器
        this.resultManager.init(this.config);

        // 初始化滚轴控制器（动态设置位置）
        this.initReelControllers(initialLayout);

        // 初始化网格管理器
        this.gridManager.init(this.reelControllers, this.config.rows, this.config.reels);
        this.gridManager.setInitialLayout(initialLayout);

        // 初始化中奖动画控制器
        this.winAnimController.init(this.gridManager, this.config.winAnimationLoops);

        // 加载Symbol动画配置
        this.loadSymbolAnimConfigs();

        // 设置状态
        this.setState(SlotState.IDLE);

        cc.log("[SlotMachine] Initialized successfully");
    }

    /**
     * 初始化滚轴控制器
     */
    private initReelControllers(initialLayout: SymbolLayout): void {
        const symbolSprites = this.loadSymbolSprites();

        // 获取动态计算的Reel X坐标数组
        const reelPositionsX = this.config.getReelPositionsX();

        cc.log(`[SlotMachine] 创建${this.config.reels}个Reel，X坐标: [${reelPositionsX.map(x => x.toFixed(0)).join(', ')}]`);

        for (let i = 0; i < this.config.reels; i++) {
            // 动态创建Reel节点
            const reelNode = cc.instantiate(this.config.reelPrefab);
            reelNode.name = `Reel_${i}`;

            // 动态设置Reel的X坐标
            reelNode.setPosition(reelPositionsX[i], 0);

            // 设置Reel的宽度为Symbol宽度
            reelNode.width = this.config.symbolWidth;

            // 添加到容器
            this.reelContainer.addChild(reelNode);

            const controller = reelNode.getComponent(ReelController);

            if (controller) {
                // 获取该列的初始symbols
                const columnSymbols = initialLayout.map((row) => row[i]);
                controller.init(i, columnSymbols, this.config, symbolSprites);
                this.reelControllers.push(controller);

                // 监听reel事件
                reelNode.on("reel-stopped", this.onReelStopped, this);
                reelNode.on("reel-bounce", this.onReelBounce, this);
            }
        }

        cc.log(`[SlotMachine] 所有Reel初始化完成`);
    }

    /**
     * 加载Symbol图片（从配置的SpriteFrame数组）
     */
    private loadSymbolSprites(): cc.SpriteFrame[] {
        const sprites: cc.SpriteFrame[] = [];

        if (!this.config.symbolFrames || this.config.symbolFrames.length === 0) {
            cc.error("[SlotMachine] Symbol frames not set! Please assign symbolFrames in SlotConfig.");
            return sprites;
        }

        cc.log("[SlotMachine] Loading symbol sprites from frames array...");

        for (let i = 0; i < this.config.symbolTypes; i++) {
            const frame = this.config.symbolFrames[i];

            if (frame) {
                sprites.push(frame);
                cc.log(`[SlotMachine]   ✓ Symbol ${i}: frame loaded`);
            } else {
                cc.warn(`[SlotMachine]   ✗ Symbol sprite not found at index ${i}`);
                cc.warn(`[SlotMachine]     Please ensure symbolFrames array has ${this.config.symbolTypes} elements`);
            }
        }

        cc.log(`[SlotMachine] Loaded ${sprites.length}/${this.config.symbolTypes} symbol sprites`);

        return sprites;
    }

    /**
     * 加载Symbol动画配置（从配置的SpriteFrame数组）
     */
    private loadSymbolAnimConfigs(): void {
        cc.log("[SlotMachine] Loading symbol animation configs...");
        cc.log("[SlotMachine] ================================");
        const configs: SymbolAnimConfig[] = [];

        for (let i = 0; i < this.config.symbolTypes; i++) {
            const frames = this.loadWinAnimationFrames(i);

            if (frames.length > 0) {
                configs.push({
                    symbolId: i,
                    frameAnimation: {
                        spriteFrames: frames,
                        frameRate: 10,  // 降低帧率：15->10，使动画更慢、更明显
                        loopCount: 1
                    },
                    extraScale: {
                        enabled: false,  // 禁用缩放效果
                        scaleTo: 1.0
                    }
                });
                cc.log(`[SlotMachine]   ✓ Symbol ${i}: Added config with ${frames.length} frames`);
            } else {
                cc.warn(`[SlotMachine]   ⚠ Symbol ${i}: No animation frames configured!`);
                cc.warn(`[SlotMachine]     Please assign frames to ${this.getWinFramesPropertyName(i)} in SlotConfig`);

                // 尝试使用 H01 (symbol 6) 作为备用动画
                const fallbackFrames = this.config.getWinAnimationFrames(6);
                if (fallbackFrames.length > 0) {
                    configs.push({
                        symbolId: i,
                        frameAnimation: {
                            spriteFrames: fallbackFrames,
                            frameRate: 10,  // 降低帧率：15->10
                            loopCount: 1
                        },
                        extraScale: {
                            enabled: false,
                            scaleTo: 1.0
                        }
                    });
                    cc.log(`[SlotMachine]   ↳ Using H01 (symbol 6) as fallback: ${fallbackFrames.length} frames`);
                } else {
                    cc.error(`[SlotMachine]   ✗ No fallback animation available! Symbol ${i} will have NO animation.`);
                }
            }
        }

        cc.log("[SlotMachine] ================================");
        cc.log(`[SlotMachine] Summary: Loaded ${configs.length}/${this.config.symbolTypes} animation configs`);

        // 打印配置的 symbolId 列表
        const configuredIds = configs.map(c => c.symbolId);
        cc.log(`[SlotMachine] Configured symbol IDs: [${configuredIds.join(', ')}]`);

        this.winAnimController.setAnimConfigs(configs);
    }

    /**
     * 获取动画帧属性名称（用于调试提示）
     */
    private getWinFramesPropertyName(symbolId: number): string {
        const names = [
            "L01_WinFrames", "L02_WinFrames", "L03_WinFrames", "L04_WinFrames",
            "L05_WinFrames", "L06_WinFrames", "H01_WinFrames", "H02_WinFrames",
            "H03_WinFrames", "H04_WinFrames", "H05_WinFrames", "W01_WinFrames",
            "S01_WinFrames"
        ];
        return names[symbolId] || `Unknown_${symbolId}`;
    }

    /**
     * 加载单个symbol的中奖动画帧序列（从配置的独立SpriteFrame数组）
     */
    private loadWinAnimationFrames(symbolId: number): cc.SpriteFrame[] {
        const frames = this.config.getWinAnimationFrames(symbolId);
        return frames;
    }

    /**
     * 开始spin（曲线驱动版本）
     */
    spin(result: SpinResult): void {
        if (this.currentState !== SlotState.IDLE) {
            cc.warn("[SlotMachine] Cannot spin, current state:", this.currentState);
            return;
        }

        cc.log("[SlotMachine] ========================================");
        cc.log("[SlotMachine] Starting spin (curve-driven)...");
        cc.log("[SlotMachine] SpinResult.finalLayout:");
        for (let row = 0; row < result.finalLayout.length; row++) {
            cc.log(`[SlotMachine]   Row ${row}: [${result.finalLayout[row].join(', ')}]`);
        }

        // 隐藏所有 Particle 节点
        this.gridManager.hideAllParticles();
        cc.log("[SlotMachine] All particles hidden");

        // 保存结果
        this.currentResult = result;
        this.stoppedReelCount = 0;

        // 设置状态
        this.setState(SlotState.SPINNING);

        // 生成标准曲线（使用配置参数）
        const curves = CurvePresets.createStandardReelCurves({
            symbolHeight: this.config.getSymbolUnitHeight(),  // 使用单位高度（包含间距）
            accelerationTime: this.config.spinAccelerationTime,
            normalSpeed: this.config.spinNormalSpeed,
            decelerationTime: this.config.spinDecelerationTime,
            bounceDistance: this.config.bounceBackDistance,
            bounceDuration: this.config.bounceBackDuration,
            reelCount: this.config.reels,
            stopDelay: this.config.reelStopDelay,
            normalDuration: this.config.spinNormalDuration
        });

        const { finalLayout } = result;

        cc.log("[SlotMachine] 各Reel的目标symbols（从上到下）:");
        // 同时启动所有reel（使用各自的曲线）
        for (let i = 0; i < this.reelControllers.length; i++) {
            const reel = this.reelControllers[i];

            // 获取该列的目标symbols（从上到下）
            const targetSymbols = finalLayout.map((row) => row[i]);

            cc.log(`[SlotMachine]   Reel ${i}: [${targetSymbols.join(', ')}]`);

            // 使用曲线驱动（目前不启用Anticipation）
            reel.startSpinWithCurve(curves[i], targetSymbols, false);
        }
        cc.log("[SlotMachine] ========================================");
    }

    /**
     * Reel回弹回调
     */
    private onReelBounce(reelIndex: number): void {
        cc.log(`[SlotMachine] Reel ${reelIndex} bounce`);
        // 可以在这里播放音效或其他反馈
    }

    /**
     * 单个reel停止回调
     */
    private onReelStopped(reelIndex: number): void {
        cc.log(`[SlotMachine] Reel ${reelIndex} stopped`);

        this.stoppedReelCount++;

        // 检查是否所有reel都已停止
        if (this.stoppedReelCount >= this.reelControllers.length) {
            this.onAllReelsStopped();
        }
    }

    /**
     * 所有reel停止后的处理
     */
    private async onAllReelsStopped(): Promise<void> {
        try {
            cc.log("[SlotMachine] All reels stopped");

            this.setState(SlotState.STOPPED);

            // 获取当前布局
            const currentLayout = this.gridManager.getCurrentLayout();
            this.gridManager.updateLayout(currentLayout);

            cc.log("[SlotMachine] ========================================");
            cc.log("[SlotMachine] 当前布局:");
            for (let row = 0; row < currentLayout.length; row++) {
                cc.log(`[SlotMachine]   Row ${row}: [${currentLayout[row].join(', ')}]`);
            }

            // ========== 检查中奖线（243 Ways机制）==========
            const winLines = this.resultManager.checkWinLines(currentLayout);

            // 更新当前结果的winLines
            if (this.currentResult) {
                this.currentResult.winLines = winLines;

                // 从winLines提取winPositions
                if (winLines.length > 0) {
                    const positionSet = new Set<string>();
                    const winPositions = [];

                    for (const line of winLines) {
                        for (const [row, col] of line.participatingPositions) {
                            const key = `${row},${col}`;
                            if (!positionSet.has(key)) {
                                positionSet.add(key);
                                winPositions.push({
                                    row,
                                    col,
                                    symbolId: currentLayout[row][col]
                                });
                            }
                        }
                    }

                    this.currentResult.winPositions = winPositions;
                    cc.log(`[SlotMachine] 更新winPositions: ${winPositions.length}个位置`);
                }

                cc.log("[SlotMachine] 中奖结果:");
                cc.log("[SlotMachine]   中奖线数: ", winLines.length);
                cc.log("[SlotMachine]   中奖位置数: ", this.currentResult.winPositions.length);
                for (let i = 0; i < winLines.length; i++) {
                    const line = winLines[i];
                    cc.log(`[SlotMachine]   线${i + 1}: Symbol ${line.symbol}, ${line.consecutiveReels}连, ${line.pathCount}条路径`);
                }
            }
            cc.log("[SlotMachine] ========================================");

            // 延迟后播放中奖动画
            cc.log("[SlotMachine] Starting delay...");
            await this.delay(this.config.winAnimationDelay);
            cc.log("[SlotMachine] Delay finished");

            if (this.currentResult && this.currentResult.winPositions.length > 0) {
                cc.log("[SlotMachine] Should play win animation!");
                await this.playWinAnimation();
            } else {
                cc.log("[SlotMachine] No win positions, skipping animation");
            }

            // 触发完成回调
            cc.log("[SlotMachine] Triggering onSpinComplete callback...");
            if (this.onSpinComplete && this.currentResult) {
                await this.onSpinComplete(this.currentResult);
            }
            cc.log("[SlotMachine] Callback finished");

            // 恢复IDLE状态（在回调完成后）
            this.setState(SlotState.IDLE);
        } catch (error) {
            cc.error("[SlotMachine] Error in onAllReelsStopped:", error);
            cc.error("[SlotMachine] Error stack:", error.stack);
        }
    }

    /**
     * 播放中奖动画
     */
    private async playWinAnimation(): Promise<void> {
        if (!this.currentResult) return;

        cc.log("[SlotMachine] Playing win animation, winPositions:", this.currentResult.winPositions);

        this.setState(SlotState.WIN_ANIMATION);

        // 使用 BY_LINE 模式：按中奖线逐条播放
        await this.winAnimController.play(this.currentResult, WinPlayMode.BY_LINE);

        cc.log("[SlotMachine] Win animation completed");

        if (this.onWinAnimComplete) {
            this.onWinAnimComplete();
        }
    }

    /**
     * 设置状态
     */
    private setState(state: SlotState): void {
        if (this.currentState !== state) {
            cc.log(`[SlotMachine] State change: ${this.currentState} -> ${state}`);
            this.currentState = state;

            if (this.onStateChange) {
                this.onStateChange(state);
            }
        }
    }

    /**
     * 获取当前状态
     */
    getState(): SlotState {
        return this.currentState;
    }

    /**
     * 获取当前布局
     */
    getCurrentLayout(): SymbolLayout {
        return this.gridManager.getCurrentLayout();
    }

    /**
     * 获取结果管理器（用于测试）
     */
    getResultManager(): ResultManager {
        return this.resultManager;
    }

    /**
     * 延迟工具函数
     */
    private delay(seconds: number): Promise<void> {
        return new Promise((resolve) => {
            this.scheduleOnce(() => resolve(), seconds);
        });
    }

    onDestroy() {
        // 清理事件监听
        for (const controller of this.reelControllers) {
            controller.node.off("reel-stopped", this.onReelStopped, this);
            controller.node.off("reel-bounce", this.onReelBounce, this);
        }
    }
}
