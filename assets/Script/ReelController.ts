/**
 * ReelController - 滚轴控制器（曲线驱动版本）
 * 管理单列的所有SymbolItem，执行滚动动画
 *
 * 核心改进：
 * - 使用AnimationCurve驱动替代速度控制
 * - 支持Anticipation机制
 * - 精确的时间控制和回调
 *
 * @author Claude Code
 * @date 2025-12-31
 */

import SymbolItem from "./SymbolItem";
import SlotConfig from "./SlotConfig";
import AnimationCurveTS from "./AnimationCurveTS";

const { ccclass, property } = cc._decorator;

@ccclass
export default class ReelController extends cc.Component {
    @property(cc.Node)
    symbolContainer: cc.Node = null;

    // ========== 基础属性 ==========
    private reelIndex: number = 0;
    private symbolItems: SymbolItem[] = [];
    private config: SlotConfig = null;
    private symbolSpriteFrames: cc.SpriteFrame[] = [];
    private symbolPrefab: cc.Prefab = null;

    // ========== 曲线驱动相关 ==========

    /** 当前使用的速度曲线 */
    private speedCurve: AnimationCurveTS = null;

    /** 转动已运行时间 */
    private spinRunningTime: number = 0;

    /** 曲线总时长 */
    private totalSpinTime: number = 0;

    /** 曲线总距离（像素） */
    private totalDistance: number = 0;

    /** 上一帧的位移（用于计算delta） */
    private lastDistance: number = 0;

    /** 是否启用Anticipation */
    private isAnticipation: boolean = false;

    /** 转动状态 */
    private isSpinning: boolean = false;

    /** 目标符号列表 */
    private targetSymbols: number[] = [];

    // ========== 精确停止机制（文档5节）==========

    /**
     * 停止时SymbolItem数组中对应棋盘第0行的索引
     * 根据总转动距离预计算，用于精确映射结果Symbol到数组位置
     */
    private stopIndexInRenders: number = 0;

    /**
     * 上次的停止索引（用于累加计算）
     */
    private lastStopIndexInRenders: number = 0;

    /**
     * 当前帧需要设置结果Symbol的索引列表
     * 每帧清空并重新填充
     */
    private finalBoardIdsOneFrame: number[] = [];

    // ========== 可视范围边界（文档2.2节）==========
    /** 可视范围上边界MaxY */
    private maxY: number = 0;
    /** 可视范围下边界MinY */
    private minY: number = 0;

    // ========== 关键时间点 ==========

    /** 减速开始时间点 */
    private slowDownTime: number = 0;

    /** 回弹开始时间点 */
    private bounceTime: number = 0;

    /** 是否已触发减速回调 */
    private hasSlowDownCallback: boolean = false;

    /** 是否已触发回弹回调 */
    private hasBounceCallback: boolean = false;

    /**
     * 初始化
     */
    init(
        reelIndex: number,
        initialSymbols: number[],
        config: SlotConfig,
        symbolSprites: cc.SpriteFrame[]
    ): void {
        this.reelIndex = reelIndex;
        this.config = config;
        this.symbolSpriteFrames = symbolSprites;
        this.symbolPrefab = config.symbolPrefab;

        // ========== 初始化stopIndexInRenders ==========
        // 根据getSymbolPositionsY()的布局，index [0,1,2]可见
        // 使用映射公式: positionY = (index - stopIndexInRenders + N) % N
        // 要让 index=0 → positionY=0，需要: 0 = (0 - stopIndexInRenders + 6) % 6
        // 解得: stopIndexInRenders = 0
        this.stopIndexInRenders = 0;
        this.lastStopIndexInRenders = 0;

        // ========== 计算可视范围边界（文档2.2节）==========
        this.initMaxMinPosition();

        cc.log(`[ReelController] Reel ${this.reelIndex} 初始化:`);
        cc.log(`[ReelController]   symbolsPerReel: ${this.config.symbolsPerReel}`);
        cc.log(`[ReelController]   visibleSymbolsPerReel: ${this.config.visibleSymbolsPerReel}`);
        cc.log(`[ReelController]   初始stopIndexInRenders: ${this.stopIndexInRenders}`);
        cc.log(`[ReelController]   可视范围: [${this.minY.toFixed(0)}, ${this.maxY.toFixed(0)}]`);

        // 创建symbol节点
        this.createSymbols(initialSymbols);
    }

    /**
     * 创建symbol节点
     */
    private createSymbols(initialSymbols: number[]): void {
        const symbolCount = this.config.symbolsPerReel;

        // 获取动态计算的Y坐标数组
        const symbolPositionsY = this.config.getSymbolPositionsY();

        for (let i = 0; i < symbolCount; i++) {
            const symbolNode = cc.instantiate(this.symbolPrefab);
            const symbolItem = symbolNode.getComponent(SymbolItem);

            // 设置位置（使用动态计算的Y坐标）
            const yPos = symbolPositionsY[i];
            symbolNode.setPosition(0, yPos);

            // 设置Symbol节点的固定尺寸
            symbolNode.setContentSize(this.config.symbolWidth, this.config.symbolHeight);

            // 设置symbol图片（会根据图片尺寸自动调整Sprite子节点大小）
            const symbolId = initialSymbols[i % initialSymbols.length];
            const spriteFrame = this.symbolSpriteFrames[symbolId];
            symbolItem.setSymbol(symbolId, spriteFrame);

            // ========== 记录初始位置（文档2.2节）==========
            symbolItem.recordPosition(this.minY, this.maxY);

            // 添加到容器
            this.symbolContainer.addChild(symbolNode);
            this.symbolItems.push(symbolItem);
        }

        cc.log(`[ReelController] Reel ${this.reelIndex}: 创建了${symbolCount}个Symbol节点`);
        cc.log(`[ReelController]   Symbol节点尺寸: ${this.config.symbolWidth}x${this.config.symbolHeight}px`);
        cc.log(`[ReelController]   Y坐标: [${symbolPositionsY.map(y => y.toFixed(0)).join(', ')}]`);

        // 打印所有symbols的实际位置和symbolId
        cc.log(`[ReelController] Reel ${this.reelIndex} 所有Symbol的详细信息:`);
        for (let i = 0; i < this.symbolItems.length; i++) {
            const item = this.symbolItems[i];
            cc.log(`[ReelController]   index=${i}, Y坐标=${item.node.y.toFixed(0)}, symbolId=${item.getSymbolId()}, pageIndex=${item.getPageIndex()}`);
        }
    }

    // ========== 曲线驱动核心方法 ==========

    /**
     * 使用曲线开始转动（新版本）
     * @param curve 速度曲线
     * @param targetSymbols 目标符号列表
     * @param isAnti 是否为Anticipation模式
     */
    startSpinWithCurve(curve: AnimationCurveTS, targetSymbols: number[], isAnti: boolean = false): void {
        // 重置转动状态
        this.isSpinning = true;
        this.speedCurve = curve;
        this.isAnticipation = isAnti;
        this.targetSymbols = targetSymbols;

        // 重置状态变量
        this.spinRunningTime = 0;
        this.lastDistance = 0;
        this.hasSlowDownCallback = false;
        this.hasBounceCallback = false;
        this.finalBoardIdsOneFrame = [];

        // 从曲线获取时间和距离信息
        const keys = curve.getKeys();
        this.totalSpinTime = keys[keys.length - 1].time;
        this.totalDistance = keys[keys.length - 1].value * 1000;  // 转为像素

        // ========== 核心：预计算停止索引（文档5.2节）==========
        // 公式: StopIndexInRenders = (LastStopIndexInRenders + Round(totalDistance / symbolHeight)) % symbolCount
        const symbolHeight = this.config.getSymbolUnitHeight();
        const symbolCount = this.config.symbolsPerReel;
        const rotatedSymbols = Math.round(this.totalDistance / symbolHeight);

        // 保存上次停止索引（文档5.2节）
        this.lastStopIndexInRenders = this.stopIndexInRenders;

        // 预计算停止后的索引偏移（累加）
        this.stopIndexInRenders = (this.lastStopIndexInRenders + rotatedSymbols) % symbolCount;

        cc.log(`[ReelController] ========================================`);
        cc.log(`[ReelController] Reel ${this.reelIndex} 开始转动（曲线驱动）`);
        cc.log(`[ReelController]   总时长: ${this.totalSpinTime.toFixed(2)}s`);
        cc.log(`[ReelController]   总距离: ${this.totalDistance.toFixed(1)}px`);
        cc.log(`[ReelController]   Symbol高度: ${symbolHeight}px`);
        cc.log(`[ReelController]   转动Symbol数: ${rotatedSymbols}个`);
        cc.log(`[ReelController]   旧StopIndexInRenders: ${this.lastStopIndexInRenders}`);
        cc.log(`[ReelController]   新StopIndexInRenders: ${this.stopIndexInRenders}`);
        cc.log(`[ReelController]   计算公式: (${this.lastStopIndexInRenders} + ${rotatedSymbols}) % ${symbolCount} = ${this.stopIndexInRenders}`);
        cc.log(`[ReelController]   目标symbols: [${targetSymbols.join(', ')}]`);
        cc.log(`[ReelController]   Anticipation: ${isAnti}`);

        // 计算关键时间点
        if (keys.length >= 3) {
            // 倒数第3帧开始减速
            this.slowDownTime = keys[keys.length - 3].time;
        }
        if (keys.length >= 2 && !isAnti) {
            // 倒数第2帧回弹（非Anticipation模式）
            this.bounceTime = keys[keys.length - 2].time;
        }

        cc.log(`[ReelController] ========================================`);
    }

    /**
     * Update循环（曲线驱动版本）
     */
    protected update(dt: number): void {
        if (!this.isSpinning) return;

        // 累加时间
        this.spinRunningTime += dt;

        // 检查是否还在转动时间内
        if (this.spinRunningTime < this.totalSpinTime) {

            // 从曲线采样当前位移
            const currentDistance = this.speedCurve.evaluate(this.spinRunningTime) * 1000;
            const deltaDistance = currentDistance - this.lastDistance;

            // 每100帧打印一次移动信息（用于调试）
            if (Math.random() < 0.01) {  // 约1%的概率打印
                cc.log(`[ReelController] Reel ${this.reelIndex} update: time=${this.spinRunningTime.toFixed(2)}s, currentDistance=${currentDistance.toFixed(1)}px, deltaDistance=${deltaDistance.toFixed(2)}px`);
            }

            // 移动所有Symbol（传入移动前的距离用于判断）
            this.moveSymbolsByCurve(deltaDistance, currentDistance);

            // 更新lastDistance
            this.lastDistance = currentDistance;

            // ========== 关键回调时间点 ==========

            // 1. 减速回调
            if (!this.hasSlowDownCallback && this.spinRunningTime >= this.slowDownTime) {
                this.hasSlowDownCallback = true;
                this.onSlowDownStart();
            }

            // 2. 回弹回调（非Anticipation模式）
            if (!this.hasBounceCallback && !this.isAnticipation &&
                this.spinRunningTime >= this.bounceTime) {
                this.hasBounceCallback = true;
                this.onBounceBack();
            }

        } else {
            // ========== 关键修正：完成前执行最后一次精确移动 ==========
            // 由于帧率原因，最后一帧的spinRunningTime会超过totalSpinTime
            // 导致最后一段距离没有被移动，必须补上这段距离

            // 计算剩余距离（从lastDistance到totalDistance）
            const remainingDistance = this.totalDistance - this.lastDistance;

            if (Math.abs(remainingDistance) > 0.1) {
                // 执行最后一次移动，确保到达精确位置
                this.moveSymbolsByCurve(remainingDistance, this.totalDistance);
                this.lastDistance = this.totalDistance;

                cc.log(`[ReelController] Reel ${this.reelIndex}: 最后一次精确移动: ${remainingDistance.toFixed(1)}px`);
            }

            // 转动时间结束
            this.onSpinComplete();
        }
    }

    /**
     * 基于曲线的Symbol移动（使用PageIndex机制，文档4节）
     * @param deltaDistance 本帧移动距离
     * @param currentDistance 当前累计移动距离（用于判断是否在最后一页）
     */
    private moveSymbolsByCurve(deltaDistance: number, currentDistance: number): void {
        const symbolCount = this.config.symbolsPerReel;

        // 清空当前帧的结果Symbol列表
        this.finalBoardIdsOneFrame = [];

        // ========== 使用PageIndex机制移动（文档4.2节）==========
        for (let i = 0; i < this.symbolItems.length; i++) {
            const item = this.symbolItems[i];

            // 调用SymbolItem的moveDistance方法，返回是否PageIndex变化
            const isChangeLoop = item.moveDistance(currentDistance);

            if (isChangeLoop) {
                // PageIndex变化，需要换Symbol
                cc.log(`[ReelController] Reel ${this.reelIndex} symbol循环: index=${i}, pageIndex=${item.getPageIndex()}, currentDistance=${currentDistance.toFixed(0)}`);

                // ========== 判断是否在最后一页（文档5.3节）==========
                const inLastPage = this.isRunStop(currentDistance);
                const remaining = this.totalDistance - currentDistance;
                const lastPageDist = this.lastPageDistance();

                cc.log(`[ReelController] Reel ${this.reelIndex} symbol循环检测:`);
                cc.log(`  currentDistance: ${currentDistance.toFixed(0)}px, totalDistance: ${this.totalDistance.toFixed(0)}px`);
                cc.log(`  remaining: ${remaining.toFixed(0)}px, lastPageDist: ${lastPageDist.toFixed(0)}px`);
                cc.log(`  inLastPage: ${inLastPage}, stopIndexInRenders: ${this.stopIndexInRenders}`);

                if (inLastPage) {
                    // 在最后一页：将索引添加到列表，稍后由finalBoardSetRenders设置
                    this.finalBoardIdsOneFrame.push(i);
                    cc.log(`  → 最后一页，添加到待设置列表`);
                } else {
                    // 正常滚动中：设置为随机Symbol
                    const newSymbolId = this.getNextSymbolId(i);
                    const spriteFrame = this.symbolSpriteFrames[newSymbolId];
                    item.setSymbol(newSymbolId, spriteFrame);
                    cc.log(`  → 正常滚动，设置随机symbol: ${newSymbolId}`);
                }
            }
        }

        // 处理最后一页的Symbol设置（文档5.3节）
        if (this.finalBoardIdsOneFrame.length > 0) {
            this.finalBoardSetRenders();
        }
    }

    /**
     * 获取底部边界
     */
    private getBottomBound(): number {
        const unitHeight = this.config.getSymbolUnitHeight();
        const symbolCount = this.config.symbolsPerReel;
        return -unitHeight * (symbolCount / 2 + 1);
    }

    // ========== 可视范围计算（文档2.2节）==========

    /**
     * 初始化MaxY和MinY（修正版：让循环在可见区域下方发生）
     *
     * 问题分析：
     * - 原方案：minY=-495, maxY=165，导致symbols循环后出现在可见区域上方
     * - 新方案：调整maxY，让循环传送点在可见区域下方
     *
     * Symbol初始分布（中心点）：
     * - index 0: Y = 110  (可见区域内，positionY=0)
     * - index 1: Y = 0    (可见区域内，positionY=1)
     * - index 2: Y = -110 (可见区域内，positionY=2)
     * - index 3: Y = -220 (可见区域下方)
     * - index 4: Y = -330 (可见区域下方)
     * - index 5: Y = -440 (可见区域下方)
     *
     * 可见区域：Y ∈ [-165, 165]（reelAreaHeight=330）
     *
     * 修正策略：
     * - 让maxY在可见区域下方边界附近，这样循环后symbols从下方进入
     * - minY保持足够低，确保循环范围=660px
     *
     * 计算：
     * - 希望循环范围 = 6 * 110 = 660px
     * - 让maxY = -minY，这样范围对称
     * - maxY - minY = 660
     * - 如果 maxY = -minY，则 2*maxY = 660，maxY = 330
     * - 但这样maxY=330还是太高，会在可见区域上方
     *
     * 最佳方案：
     * - 让循环边界完全在可见区域下方
     * - maxY = 可见区域下边界 - 一点余量 = -165 - 55 = -220
     * - minY = maxY - 660 = -220 - 660 = -880
     */
    private initMaxMinPosition(): void {
        const symbolHeight = this.config.getSymbolUnitHeight();  // 110
        const symbolCount = this.config.symbolsPerReel;  // 6
        const requiredRangeHeight = symbolCount * symbolHeight;  // 660

        // 新策略：让maxY在可见区域下方
        // 可见区域下边界约为 -165
        // 让maxY稍微低于可见区域下边界
        this.maxY = -165 - symbolHeight / 2;  // -165 - 55 = -220
        this.minY = this.maxY - requiredRangeHeight;  // -220 - 660 = -880

        const rangeHeight = this.maxY - this.minY;

        cc.log(`[ReelController] 可视范围计算（修正版）:`);
        cc.log(`  symbolHeight = ${symbolHeight}px`);
        cc.log(`  symbolCount = ${symbolCount}`);
        cc.log(`  需要的循环范围 = ${requiredRangeHeight}px`);
        cc.log(`  循环范围 minY = ${this.minY.toFixed(1)}`);
        cc.log(`  循环范围 maxY = ${this.maxY.toFixed(1)}`);
        cc.log(`  循环范围高度 = ${rangeHeight.toFixed(1)}px`);
        cc.log(`  可见区域范围 = [-165, 165]`);
        cc.log(`  验证：${rangeHeight.toFixed(1)} = ${requiredRangeHeight}? ${Math.abs(rangeHeight - requiredRangeHeight) < 0.1 ? '✓' : '✗'}`);
    }

    // ========== 最后一页判断（文档3.4节）==========

    /**
     * 判断是否进入最后一页
     * @param currentDistance 当前已移动距离
     * @returns true表示进入最后一页，应该开始设置结果Symbol
     */
    private isRunStop(currentDistance: number): boolean {
        const remaining = this.totalDistance - currentDistance;
        return remaining <= this.lastPageDistance();
    }

    /**
     * 计算最后一页距离（文档5.3节）
     *
     * 公式（文档版本）：
     * LastPageDistance = ReelShowNum * SymbolHeight + ExtraDistance()
     * ExtraDistance = (NumMore - 1) * SymbolHeight
     * NumMore = Ceil((ReelSymbolNum - ReelShowNum) / 2)
     *
     * 目的：确保在进入最后一页时，剩余距离足够让所有可见Symbol都有机会被正确设置
     */
    private lastPageDistance(): number {
        const symbolHeight = this.config.getSymbolUnitHeight();
        const visibleCount = this.config.visibleSymbolsPerReel;
        const symbolCount = this.config.symbolsPerReel;

        // 计算上下多余的Symbol数量
        const numMore = Math.ceil((symbolCount - visibleCount) / 2);

        // 计算额外距离
        const extraDistance = (numMore - 1) * symbolHeight;

        // 最后一页距离
        const lastPageDist = visibleCount * symbolHeight + extraDistance;

        cc.log(`[ReelController] lastPageDistance计算（文档5.3节）:`);
        cc.log(`  symbolCount=${symbolCount}, visibleCount=${visibleCount}, symbolHeight=${symbolHeight}`);
        cc.log(`  numMore = Ceil((${symbolCount} - ${visibleCount}) / 2) = ${numMore}`);
        cc.log(`  extraDistance = (${numMore} - 1) * ${symbolHeight} = ${extraDistance}`);
        cc.log(`  lastPageDist = ${visibleCount} * ${symbolHeight} + ${extraDistance} = ${lastPageDist}`);

        return lastPageDist;
    }

    /**
     * 映射SymbolItem数组索引到棋盘行号（文档3.5节）
     * @param index SymbolItem数组索引
     * @returns positionY 棋盘行号（0表示可见区域第一行）
     */
    private mapIndexToPositionY(index: number): number {
        const symbolCount = this.config.symbolsPerReel;
        // 核心映射公式: positionY = (index - StopIndexInRenders + N) % N
        return (index - this.stopIndexInRenders + symbolCount) % symbolCount;
    }

    // ==========

    /**
     * 获取下一个Symbol ID（用于正常滚动）
     * 新机制下，此方法仅在正常滚动阶段使用，最后一页由finalBoardSetRenders处理
     * @param _symbolIndex symbol的索引（保留参数用于未来扩展）
     */
    private getNextSymbolId(_symbolIndex: number): number {
        // 正常滚动中，返回随机Symbol
        return Math.floor(Math.random() * this.config.symbolTypes);
    }

    /**
     * 精确设置结果Symbol（文档3.5节）
     * 在Symbol越界重新定位后调用，根据映射关系判断是设置结果还是随机Symbol
     */
    private finalBoardSetRenders(): void {
        if (this.finalBoardIdsOneFrame.length === 0) {
            return;
        }

        const visibleCount = this.config.visibleSymbolsPerReel;

        cc.log(`[ReelController] Reel ${this.reelIndex} finalBoardSetRenders: 处理${this.finalBoardIdsOneFrame.length}个symbol`);
        cc.log(`  stopIndexInRenders: ${this.stopIndexInRenders}`);
        cc.log(`  targetSymbols: [${this.targetSymbols.join(', ')}]`);

        for (let k = 0; k < this.finalBoardIdsOneFrame.length; k++) {
            const index = this.finalBoardIdsOneFrame[k];

            // 核心映射计算（文档3.5节）
            // positionY = (index - stopIndexInRenders + N) % N
            const positionY = this.mapIndexToPositionY(index);

            cc.log(`  处理index=${index} → positionY=${positionY}`);

            if (positionY < visibleCount) {
                // 屏幕内：设置为结果Symbol
                const symbolId = this.targetSymbols[positionY];
                const currentSymbolId = this.symbolItems[index].getSymbolId();
                const spriteFrame = this.symbolSpriteFrames[symbolId];
                this.symbolItems[index].setSymbol(symbolId, spriteFrame);

                cc.log(`    → 可见区域，设置为目标symbol: ${currentSymbolId} → ${symbolId}`);
            } else {
                // 屏幕外：继续随机
                const randomSymbolId = Math.floor(Math.random() * this.config.symbolTypes);
                const spriteFrame = this.symbolSpriteFrames[randomSymbolId];
                this.symbolItems[index].setSymbol(randomSymbolId, spriteFrame);
                cc.log(`    → 不可见区域，设置为随机symbol: ${randomSymbolId}`);
            }
        }

        // 清空列表，准备下一帧
        this.finalBoardIdsOneFrame = [];
    }

    // ==========

    // ========== 关键时间点回调 ==========

    /**
     * 减速开始回调
     */
    private onSlowDownStart(): void {
        cc.log(`[ReelController] Reel ${this.reelIndex}: 减速开始`);

        // 可以在这里播放减速音效
        // AudioManager.playSFX("reel_slowdown");
    }

    /**
     * 回弹回调
     */
    private onBounceBack(): void {
        cc.log(`[ReelController] Reel ${this.reelIndex}: 回弹`);

        // 播放停止音效
        // AudioManager.playSFX("reel_stop");

        // 通知SlotMachine
        this.node.emit("reel-bounce", this.reelIndex);
    }

    /**
     * 验证并修正目标symbols（文档3.5节设计）
     *
     * 核心逻辑:
     * 1. 遍历所有可见位置(positionY = 0 到 visibleCount-1)
     * 2. 通过反向映射计算对应的数组索引: index = (positionY + stopIndexInRenders) % N
     * 3. 检查当前Symbol是否匹配目标
     * 4. 如果不匹配，强制修正为目标Symbol
     *
     * 这是最后的保险机制，确保停止时结果100%准确
     */
    private verifyAndFixTargetSymbols(): void {
        const visibleCount = this.config.visibleSymbolsPerReel;
        const symbolCount = this.config.symbolsPerReel;

        let fixedCount = 0;
        const fixes: string[] = [];

        cc.log(`[ReelController] Reel ${this.reelIndex} 验证目标symbols:`);
        cc.log(`[ReelController]   stopIndexInRenders: ${this.stopIndexInRenders}`);
        cc.log(`[ReelController]   targetSymbols: [${this.targetSymbols.join(', ')}]`);

        // ========== 打印所有symbol的实际Y坐标 ==========
        cc.log(`[ReelController]   所有Symbol的Y坐标:`);
        for (let i = 0; i < this.symbolItems.length; i++) {
            const item = this.symbolItems[i];
            const symbolId = item.getSymbolId();
            const yPos = item.node.y;
            const positionY = this.mapIndexToPositionY(i);
            // 判断是否在可见范围内（Y ∈ [-155, 155]）
            const isVisible = (yPos >= -155 && yPos <= 155) ? "✓ 可见" : "不可见";
            cc.log(`[ReelController]     index=${i}, positionY=${positionY}, Y=${yPos.toFixed(0)}, symbolId=${symbolId} ${isVisible}`);
        }

        cc.log(`[ReelController]   根据stopIndexInRenders映射的可见symbols:`);
        for (let positionY = 0; positionY < visibleCount; positionY++) {
            // 反向映射公式（文档3.5节）
            // positionY = (index - stopIndexInRenders + N) % N
            // 反向求解: index = (positionY + stopIndexInRenders) % N
            const index = (positionY + this.stopIndexInRenders) % symbolCount;

            // 检查目标Symbol数组是否越界
            if (positionY >= this.targetSymbols.length) {
                cc.warn(`[ReelController] Reel ${this.reelIndex} 警告: positionY=${positionY}超出targetSymbols范围(${this.targetSymbols.length})`);
                continue;
            }

            const currentSymbolId = this.symbolItems[index].getSymbolId();
            const targetSymbolId = this.targetSymbols[positionY];
            const yPos = this.symbolItems[index].node.y;

            cc.log(`[ReelController]   positionY=${positionY} → index=${index} (Y=${yPos.toFixed(0)}), 当前=${currentSymbolId}, 目标=${targetSymbolId}`);

            if (currentSymbolId !== targetSymbolId) {
                // 强制修正不匹配的Symbol
                fixes.push(`位置${positionY}(index=${index}, Y=${yPos.toFixed(0)}): ${currentSymbolId}->${targetSymbolId}`);

                const spriteFrame = this.symbolSpriteFrames[targetSymbolId];
                if (spriteFrame) {
                    this.symbolItems[index].setSymbol(targetSymbolId, spriteFrame);
                    fixedCount++;
                } else {
                    cc.error(`[ReelController] Reel ${this.reelIndex} 错误: symbolId=${targetSymbolId}的SpriteFrame不存在!`);
                }
            }
        }

        // 日志输出
        if (fixedCount === 0) {
            cc.log(`[ReelController] Reel ${this.reelIndex} ✓ 结果Symbol验证通过，无需修正`);
        } else {
            cc.warn(`[ReelController] Reel ${this.reelIndex} ⚠ 修正了${fixedCount}个Symbol:`);
            cc.warn(`  ${fixes.join(', ')}`);
            cc.warn(`  StopIndexInRenders: ${this.stopIndexInRenders}`);
            cc.warn(`  这表明最后一页设置逻辑可能存在问题，请检查!`);
        }
    }

    /**
     * 转动完成
     */
    private onSpinComplete(): void {
        this.isSpinning = false;

        cc.log(`[ReelController] Reel ${this.reelIndex}: 转动完成`);

        // 打印完成前的 symbol 位置
        cc.log(`[ReelController] Reel ${this.reelIndex} 完成前的symbol位置:`);
        for (let i = 0; i < this.symbolItems.length; i++) {
            cc.log(`  index=${i}, Y=${this.symbolItems[i].node.y.toFixed(1)}, symbolId=${this.symbolItems[i].getSymbolId()}`);
        }

        // 精确对齐
        this.alignSymbols();

        // 打印对齐后的 symbol 位置
        cc.log(`[ReelController] Reel ${this.reelIndex} 对齐后的symbol位置:`);
        for (let i = 0; i < this.symbolItems.length; i++) {
            cc.log(`  index=${i}, Y=${this.symbolItems[i].node.y.toFixed(1)}, symbolId=${this.symbolItems[i].getSymbolId()}`);
        }

        // ========== 最终验证修正（最重要！）==========
        // 作为最后一道保险，确保结果100%准确
        this.verifyAndFixTargetSymbols();

        // Anticipation模式下，完成时才触发回弹
        if (this.isAnticipation && !this.hasBounceCallback) {
            this.onBounceBack();
        }

        // 通知停止
        this.node.emit("reel-stopped", this.reelIndex);
    }

    /**
     * 精确对齐symbols
     * 根据 stopIndexInRenders 确定哪个 symbol 应该在哪个位置，然后对齐
     *
     * 新策略：
     * 1. 根据 stopIndexInRenders 确定 positionY=0 对应的 index
     * 2. 该 symbol 应该在 Y=110 的位置（无间距版本）
     * 3. 计算偏移量，将所有symbols统一调整
     */
    private alignSymbols(): void {
        const unitHeight = this.config.getSymbolUnitHeight();
        const symbolCount = this.config.symbolsPerReel;
        const visibleCount = this.config.visibleSymbolsPerReel;

        // 根据 stopIndexInRenders 反向计算：positionY=0 应该对应哪个 index
        // positionY = (index - stopIndexInRenders + N) % N
        // 当 positionY = 0 时，反向求解：
        // 0 = (index - stopIndexInRenders + N) % N
        // 即 index = stopIndexInRenders
        const targetIndex = this.stopIndexInRenders;

        // positionY=0 的 symbol 应该在 Y=110 的位置（可见区域第一行，无间距版本）
        const targetY = 110;
        const currentY = this.symbolItems[targetIndex].node.y;
        const offset = targetY - currentY;

        cc.log(`[ReelController] Reel ${this.reelIndex} 对齐调整:`);
        cc.log(`  stopIndexInRenders: ${this.stopIndexInRenders}`);
        cc.log(`  positionY=0 对应 index=${targetIndex}`);
        cc.log(`  该symbol当前Y=${currentY.toFixed(1)}, 目标Y=${targetY}, 偏移=${offset.toFixed(1)}px`);

        // 检查偏移量是否过大
        if (Math.abs(offset) > unitHeight / 2) {
            cc.error(`[ReelController] Reel ${this.reelIndex} 对齐偏移过大！`);
            cc.error(`  偏移量: ${offset.toFixed(1)}px (超过半个symbol ${unitHeight/2}px)`);
            cc.error(`  这说明曲线计算的总距离有误，请检查曲线生成逻辑！`);
        }

        // 无论偏移多大，都进行调整
        if (Math.abs(offset) > 0.1) {
            for (let i = 0; i < this.symbolItems.length; i++) {
                this.symbolItems[i].node.y += offset;
            }
            cc.log(`  ✓ 已对齐所有symbols (偏移${offset.toFixed(1)}px)`);
        } else {
            cc.log(`  ✓ 已对齐，无需调整`);
        }

        // 验证对齐结果
        cc.log(`  对齐后的Y坐标:`);
        for (let i = 0; i < symbolCount; i++) {
            const positionY = this.mapIndexToPositionY(i);
            const isVisible = positionY < visibleCount;
            cc.log(`    index=${i}, positionY=${positionY}, Y=${this.symbolItems[i].node.y.toFixed(1)} ${isVisible ? '✓ 应该可见' : ''}`);
        }
    }

    // ========== 兼容旧接口（用于过渡） ==========

    /**
     * 开始滚动（兼容旧版本，已废弃）
     * @deprecated 使用 startSpinWithCurve 代替
     */
    startSpin(): void {
        cc.warn(`[ReelController] startSpin() 已废弃，请使用 startSpinWithCurve()`);
    }

    /**
     * 停止滚动到指定结果（兼容旧版本，已废弃）
     * @param _targetSymbols 目标符号（已不使用，仅保留接口兼容性）
     * @deprecated 在 startSpinWithCurve 中直接传入目标符号
     */
    stopSpin(_targetSymbols: number[]): void {
        cc.warn(`[ReelController] stopSpin() 已废弃，请在 startSpinWithCurve 中传入目标符号`);
    }

    // ========== 工具方法 ==========

    /**
     * 获取当前可见的symbol ID数组
     *
     * 根据文档设计：使用stopIndexInRenders进行逻辑映射
     *
     * 映射公式：
     * - 正向: positionY = (index - stopIndexInRenders + N) % N
     * - 反向: index = (positionY + stopIndexInRenders) % N
     *
     * 其中 positionY=0 代表可见区域的第0行（最上方）
     */
    getCurrentVisibleSymbols(): number[] {
        const result: number[] = [];
        const visibleCount = this.config.visibleSymbolsPerReel;
        const symbolCount = this.config.symbolsPerReel;

        for (let positionY = 0; positionY < visibleCount; positionY++) {
            // 反向映射：从逻辑位置计算数组索引
            const index = (positionY + this.stopIndexInRenders) % symbolCount;
            result.push(this.symbolItems[index].getSymbolId());
        }

        return result;
    }

    /**
     * 获取指定行的SymbolItem（根据stopIndexInRenders映射）
     * @param row 行号（0-based，0表示可见区域第一行）
     * @returns SymbolItem对象，如果越界则返回null
     */
    getSymbolItemAtRow(row: number): SymbolItem | null {
        const visibleCount = this.config.visibleSymbolsPerReel;

        if (row < 0 || row >= visibleCount) {
            cc.warn(`[ReelController] Row ${row} out of visible range (0-${visibleCount - 1})`);
            return null;
        }

        const symbolCount = this.config.symbolsPerReel;

        // 反向映射：已知positionY（即row），求对应的index
        // 由于 positionY = (index - stopIndexInRenders + N) % N
        // 所以 index = (positionY + stopIndexInRenders) % N
        const index = (row + this.stopIndexInRenders) % symbolCount;

        return this.symbolItems[index];
    }

    /**
     * 检查是否正在滚动
     */
    isReelSpinning(): boolean {
        return this.isSpinning;
    }

    /**
     * 获取转动进度（0-1）
     */
    getSpinProgress(): number {
        if (!this.isSpinning || this.totalSpinTime === 0) {
            return 0;
        }
        return Math.min(this.spinRunningTime / this.totalSpinTime, 1);
    }

    /**
     * 获取当前转动时间
     */
    getSpinRunningTime(): number {
        return this.spinRunningTime;
    }
}
