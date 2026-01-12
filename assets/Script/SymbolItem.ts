/**
 * SymbolItem - Symbol显示组件
 * 负责单个Symbol的显示和中奖动画播放
 */

import { SymbolState, SymbolAnimConfig } from "./DataTypes";

const { ccclass, property } = cc._decorator;

@ccclass
export default class SymbolItem extends cc.Component {
    @property(cc.Sprite)
    sprite: cc.Sprite = null;

    @property(cc.Node)
    particleNode: cc.Node = null;

    private symbolId: number = -1;
    private state: SymbolState = SymbolState.NORMAL;
    private originalSpriteFrame: cc.SpriteFrame = null;
    private animationTimers: number[] = []; // 存储动画定时器ID

    // ========== 精确滚动位置记录（文档2.2节）==========
    /** 记录的初始Y坐标（用于PageIndex计算） */
    private startPositionY: number = 0;
    /** 当前PageIndex（第几个循环页） */
    private pageIndex: number = 0;
    /** 可视范围上边界 */
    private maxScopeY: number = 0;
    /** 可视范围下边界 */
    private minScopeY: number = 0;

    /**
     * 设置显示的symbol
     */
    setSymbol(symbolId: number, spriteFrame: cc.SpriteFrame): void {
        this.symbolId = symbolId;
        this.originalSpriteFrame = spriteFrame;

        // 调试日志
        cc.log(`[SymbolItem] setSymbol called - symbolId: ${symbolId}, this.sprite: ${this.sprite}, spriteFrame: ${spriteFrame}`);

        if (this.sprite && spriteFrame) {
            // 设置图片
            this.sprite.spriteFrame = spriteFrame;

            // 根据图片尺寸调整Sprite节点的大小（不改变Symbol节点本身尺寸）
            const rect = spriteFrame.getRect();
            this.sprite.node.setContentSize(rect.width, rect.height);

            cc.log(`[SymbolItem] Symbol ${symbolId} 设置完成，Sprite尺寸: ${rect.width}x${rect.height}px`);
        } else {
            cc.error(`[SymbolItem] 无法设置 Symbol ${symbolId}! this.sprite 为 ${this.sprite ? '有效' : 'null'}, spriteFrame 为 ${spriteFrame ? '有效' : 'null'}`);
        }
    }

    /**
     * 获取当前symbol ID
     */
    getSymbolId(): number {
        return this.symbolId;
    }

    /**
     * 设置状态
     */
    setState(state: SymbolState): void {
        this.state = state;
    }

    /**
     * 获取状态
     */
    getState(): SymbolState {
        return this.state;
    }

    /**
     * 播放中奖动画
     */
    async playWinAnimation(config: SymbolAnimConfig, loops: number): Promise<void> {
        // 先清理之前的定时器
        this.animationTimers.forEach(timerId => clearTimeout(timerId));
        this.animationTimers = [];

        this.setState(SymbolState.WINNING);

        // 显示并播放 Particle 动画（S01 (symbolId=12) 不播放粒子特效）
        if (this.particleNode && this.symbolId !== 12) {
            this.particleNode.active = true;
            const animation = this.particleNode.getComponent(cc.Animation);
            if (animation) {
                animation.play();
            }
        }

        const { frameAnimation, extraScale } = config;

        for (let i = 0; i < loops; i++) {
            // 1. 可选：应用缩放效果
            if (extraScale?.enabled) {
                cc.tween(this.node)
                    .to(0.1, { scale: extraScale.scaleTo })
                    .start();
            }

            // 2. 播放帧动画
            await this.playFrameAnimation(frameAnimation);

            // 3. 恢复缩放
            if (extraScale?.enabled) {
                cc.tween(this.node)
                    .to(0.1, { scale: 1.0 })
                    .start();
            }

            // 循环间隔
            if (i < loops - 1) {
                await this.delay(0.1);
            }
        }

        // 恢复原始状态
        if (this.sprite && this.originalSpriteFrame) {
            this.sprite.spriteFrame = this.originalSpriteFrame;
        }
        this.node.scale = 1.0;
        this.setState(SymbolState.NORMAL);
    }

    /**
     * 停止动画
     */
    stopAnimation(): void {
        // 清理所有定时器
        this.animationTimers.forEach(timerId => clearTimeout(timerId));
        this.animationTimers = [];

        // 停止所有Tween动画
        this.node.stopAllActions();
        cc.Tween.stopAllByTarget(this.node);

        // 隐藏并停止 Particle 动画
        if (this.particleNode) {
            this.particleNode.active = false;
            const animation = this.particleNode.getComponent(cc.Animation);
            if (animation) {
                animation.stop();
            }
        }

        // 恢复原始状态
        if (this.sprite && this.originalSpriteFrame) {
            this.sprite.spriteFrame = this.originalSpriteFrame;
        }
        this.node.scale = 1.0;
        this.setState(SymbolState.NORMAL);
    }

    /**
     * 播放帧动画
     */
    private playFrameAnimation(frameAnim: {
        spriteFrames: cc.SpriteFrame[];
        frameRate: number;
        loopCount: number;
    }): Promise<void> {
        return new Promise((resolve) => {
            const { spriteFrames, frameRate, loopCount } = frameAnim;

            if (!spriteFrames || spriteFrames.length === 0) {
                cc.warn("[SymbolItem] No sprite frames to play!");
                resolve();
                return;
            }

            if (!this.sprite) {
                cc.error("[SymbolItem] Sprite component is null!");
                resolve();
                return;
            }

            const frameDuration = 1.0 / frameRate;
            let currentFrame = 0;
            let currentLoop = 0;

            const playNextFrame = () => {
                // 播放当前帧
                if (spriteFrames[currentFrame]) {
                    const frame = spriteFrames[currentFrame];
                    this.sprite.spriteFrame = frame;
                } else {
                    cc.warn(`[SymbolItem] Frame ${currentFrame} is null or undefined!`);
                }

                currentFrame++;

                // 检查是否播放完一轮
                if (currentFrame >= spriteFrames.length) {
                    currentFrame = 0;
                    currentLoop++;
                }

                // 检查是否完成所有循环
                if (currentLoop < loopCount) {
                    // 使用 setTimeout 代替 scheduleOnce，避免调度器冲突
                    const timerId = setTimeout(() => {
                        // 从定时器列表中移除已完成的定时器
                        const index = this.animationTimers.indexOf(timerId);
                        if (index > -1) {
                            this.animationTimers.splice(index, 1);
                        }

                        if (this.node && this.node.isValid) {
                            playNextFrame();
                        }
                    }, frameDuration * 1000);

                    // 记录定时器ID
                    this.animationTimers.push(timerId);
                } else {
                    resolve();
                }
            };

            playNextFrame();
        });
    }

    /**
     * 延迟工具函数
     */
    private delay(seconds: number): Promise<void> {
        return new Promise((resolve) => {
            this.scheduleOnce(() => resolve(), seconds);
        });
    }

    // ========== 精确滚动位置管理（文档2.2节，4.2节）==========

    /**
     * 记录初始位置和范围（文档2.2节）
     * @param minY 可视范围下边界
     * @param maxY 可视范围上边界
     */
    recordPosition(minY: number, maxY: number): void {
        this.startPositionY = this.node.y;
        this.minScopeY = minY;
        this.maxScopeY = maxY;

        // 计算初始PageIndex
        const rangeHeight = this.maxScopeY - this.minScopeY;
        this.pageIndex = Math.floor((this.startPositionY - this.maxScopeY) / rangeHeight);

        cc.log(`[SymbolItem] recordPosition: startY=${this.startPositionY.toFixed(1)}, pageIndex=${this.pageIndex}, range=[${minY}, ${maxY}]`);
    }

    /**
     * 移动指定距离并检测循环（文档4.2节）
     * @param offsetAllY 累计已移动的总距离
     * @returns true表示PageIndex发生变化（需要换Symbol）
     */
    moveDistance(offsetAllY: number): boolean {
        // 计算理论Y坐标
        const theoreticalY = this.startPositionY - offsetAllY;

        // 计算当前PageIndex
        const rangeHeight = this.maxScopeY - this.minScopeY;
        const currentPageIndex = Math.floor((theoreticalY - this.maxScopeY) / rangeHeight);

        // 检测PageIndex是否变化
        const isChangeLoop = (currentPageIndex !== this.pageIndex);

        if (isChangeLoop) {
            this.pageIndex = currentPageIndex;
        }

        // 映射到显示范围（循环坐标）
        const displayY = theoreticalY - rangeHeight * currentPageIndex;

        // 更新位置
        this.node.y = displayY;

        return isChangeLoop;
    }

    /**
     * 重置PageIndex（用于网络模式的无限循环）
     * @param offsetAllY 当前累计距离
     */
    resetPageIndex(offsetAllY: number): void {
        const theoreticalY = this.startPositionY - offsetAllY;
        const rangeHeight = this.maxScopeY - this.minScopeY;
        this.pageIndex = Math.floor((theoreticalY - this.maxScopeY) / rangeHeight);
    }

    /**
     * 获取当前PageIndex
     */
    getPageIndex(): number {
        return this.pageIndex;
    }

    onDestroy() {
        this.stopAnimation();
    }
}
