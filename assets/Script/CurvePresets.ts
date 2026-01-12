/**
 * CurvePresets - 曲线预设工厂
 *
 * 提供常用的转动曲线预设，简化配置
 *
 * 预设类型：
 * - 标准5列转动曲线（依次停止）
 * - 快速停止曲线
 * - Anticipation增强曲线
 * - 自定义缓动曲线
 *
 * @author Claude Code
 * @date 2025-12-30
 * @version 1.0
 */

import AnimationCurveTS, { Keyframe, CurveInterpolationMode } from "./AnimationCurveTS";

/**
 * 标准转动曲线配置参数
 */
export interface StandardReelCurveConfig {
    /** Symbol高度（像素） */
    symbolHeight: number;

    /** 加速时长（秒） */
    accelerationTime: number;

    /** 匀速速度（像素/秒） */
    normalSpeed: number;

    /** 减速时长（秒） */
    decelerationTime: number;

    /** 回弹距离（像素） */
    bounceDistance: number;

    /** 回弹时长（秒） */
    bounceDuration: number;

    /** Reel数量 */
    reelCount: number;

    /** 列间停止延迟（秒） */
    stopDelay: number;

    /** 匀速阶段时长（秒，默认1.0） */
    normalDuration?: number;
}

/**
 * 快速停止曲线配置
 */
export interface QuickStopCurveConfig {
    /** 停止距离（像素） */
    stopDistance: number;

    /** 停止时长（秒） */
    stopTime: number;

    /** 缓动类型 */
    easingType?: 'quad' | 'cubic' | 'quart';
}

/**
 * Anticipation曲线配置
 */
export interface AnticipationCurveConfig {
    /** 基础曲线 */
    baseCurve: AnimationCurveTS;

    /** 额外Symbol数量 */
    extraSymbolNum: number;

    /** Symbol高度（像素） */
    symbolHeight: number;

    /** 时间压缩比（降低时间增长幅度） */
    timeCompression?: number;
}

/**
 * 曲线预设工厂类
 */
export default class CurvePresets {

    // ========== 标准转动曲线 ==========

    /**
     * 创建标准5列转动曲线（依次停止）
     *
     * 曲线结构（每个Reel）：
     * - 阶段1: 加速阶段（0 → accelerationTime）
     * - 阶段2: 匀速阶段（accelerationTime → normalDuration）
     * - 阶段3: 减速阶段（normalDuration → bounceStartTime）
     * - 阶段4: 回弹阶段（bounceStartTime → totalTime）
     *
     * @param config 配置参数
     * @returns 曲线数组（每个Reel一条曲线）
     */
    static createStandardReelCurves(config: StandardReelCurveConfig): AnimationCurveTS[] {
        const curves: AnimationCurveTS[] = [];

        const {
            symbolHeight,
            accelerationTime,
            normalSpeed,
            decelerationTime,
            bounceDistance,
            bounceDuration,
            reelCount,
            stopDelay,
            normalDuration = 1.0
        } = config;

        cc.log("[CurvePresets] ========================================");
        cc.log("[CurvePresets] 创建精确对齐的转动曲线...");
        cc.log(`[CurvePresets]   Symbol高度: ${symbolHeight}px`);
        cc.log(`[CurvePresets]   匀速速度: ${normalSpeed} px/s`);
        cc.log(`[CurvePresets]   Reel数量: ${reelCount}`);

        // ========== 步骤1: 计算原始距离 ==========
        const accelDist = 0.5 * normalSpeed * accelerationTime / 1000;      // 米
        const normalDist = normalSpeed * normalDuration / 1000;              // 米
        const decelDist = 0.5 * normalSpeed * decelerationTime / 1000;      // 米
        const rawTotalDist = accelDist + normalDist + decelDist;            // 米
        const rawTotalDistPx = rawTotalDist * 1000;                         // 像素

        cc.log(`[CurvePresets]   原始总距离: ${rawTotalDistPx.toFixed(1)}px`);
        cc.log(`[CurvePresets]     加速: ${(accelDist * 1000).toFixed(1)}px`);
        cc.log(`[CurvePresets]     匀速: ${(normalDist * 1000).toFixed(1)}px`);
        cc.log(`[CurvePresets]     减速: ${(decelDist * 1000).toFixed(1)}px`);

        // ========== 步骤2: 对齐到Symbol边界（关键！）==========
        const rawSymbolCount = rawTotalDistPx / symbolHeight;
        const alignedSymbolCount = Math.round(rawSymbolCount);
        const alignedTotalDistPx = alignedSymbolCount * symbolHeight;
        const alignedTotalDist = alignedTotalDistPx / 1000;

        cc.log(`[CurvePresets]   原始Symbol数: ${rawSymbolCount.toFixed(3)}个`);
        cc.log(`[CurvePresets]   对齐Symbol数: ${alignedSymbolCount}个`);
        cc.log(`[CurvePresets]   对齐总距离: ${alignedTotalDistPx}px`);
        cc.log(`[CurvePresets]   对齐误差: ${(alignedTotalDistPx - rawTotalDistPx).toFixed(1)}px`);

        // ========== 步骤3: 调整各阶段距离以达到精确对齐 ==========
        // 策略：保持加速和匀速不变，调整减速距离
        const adjustedDecelDist = alignedTotalDist - accelDist - normalDist;

        cc.log(`[CurvePresets]   调整后减速距离: ${(adjustedDecelDist * 1000).toFixed(1)}px`);
        cc.log(`[CurvePresets]   验证: ${(accelDist + normalDist + adjustedDecelDist) * 1000}px = ${alignedTotalDistPx}px`);

        // ========== 步骤4: 为每个Reel生成曲线 ==========
        for (let reelIndex = 0; reelIndex < reelCount; reelIndex++) {
            const curve = new AnimationCurveTS();

            // 计算时间点（stopDelay只延长匀速时间）
            const t0 = 0;
            const t1 = accelerationTime;
            const t2 = t1 + normalDuration + (reelIndex * stopDelay);  // 延长匀速时间
            const t3 = t2 + decelerationTime;
            const t4 = t3 + bounceDuration;

            // 计算各阶段的累积位移（米）
            const v0 = 0;
            const v1 = accelDist;
            const v2 = v1 + normalDist;
            const v3 = v2 + adjustedDecelDist;  // 使用调整后的减速距离
            const v4 = v3;  // 无回弹，v4 = v3

            // 计算实际速度（因stopDelay延长时间，匀速段速度降低）
            const actualNormalDuration = normalDuration + (reelIndex * stopDelay);
            const actualNormalSpeed = normalDist / actualNormalDuration;  // 米/秒

            // 基准速度（用于加速和减速阶段，不受stopDelay影响）
            const baseSpeed = normalSpeed / 1000;  // 米/秒

            cc.log(`[CurvePresets] Reel ${reelIndex}:`);
            cc.log(`[CurvePresets]   时间: t1=${t1.toFixed(2)}s, t2=${t2.toFixed(2)}s, t3=${t3.toFixed(2)}s`);
            cc.log(`[CurvePresets]   位移: v1=${(v1*1000).toFixed(1)}px, v2=${(v2*1000).toFixed(1)}px, v3=${(v3*1000).toFixed(1)}px`);
            cc.log(`[CurvePresets]   基准速度: ${(baseSpeed * 1000).toFixed(0)} px/s (用于加速/减速)`);
            cc.log(`[CurvePresets]   实际匀速速度: ${(actualNormalSpeed * 1000).toFixed(0)} px/s`);

            // ========== 使用线性插值确保100%精确 ==========
            // 将减速段分成多个小段，确保线性过渡
            const decelSegments = 5;
            const decelTimeStep = decelerationTime / decelSegments;
            const decelDistStep = adjustedDecelDist / decelSegments;

            // 关键帧0: 起始点（使用基准速度）
            curve.addKey(t0, v0, 0, baseSpeed * 0.5);

            // 关键帧1: 加速结束，进入匀速（过渡到实际匀速速度）
            curve.addKey(t1, v1, baseSpeed, actualNormalSpeed);

            // 关键帧2: 匀速结束，开始减速（从实际匀速速度过渡到减速）
            curve.addKey(t2, v2, actualNormalSpeed, baseSpeed * 0.8);

            // 关键帧3-7: 减速段（分段线性插值，使用基准速度）
            for (let i = 1; i <= decelSegments; i++) {
                const t = t2 + decelTimeStep * i;
                const v = v2 + decelDistStep * i;
                const speedRatio = 1 - (i / decelSegments);  // 速度线性递减
                const speed = baseSpeed * speedRatio * 0.5;  // 使用基准速度

                if (i < decelSegments) {
                    curve.addKey(t, v, speed, speed);
                } else {
                    // 最后一个关键帧：到达精确位置
                    curve.addKey(t, v, speed, 0);
                }
            }

            // 关键帧8: 最终位置（确保关键帧一致性）
            curve.addKey(t4, v4, 0, 0);

            // 强制使用线性插值模式
            curve.setInterpolationMode(CurveInterpolationMode.LINEAR);

            curves.push(curve);

            cc.log(`[CurvePresets]   ✓ 曲线生成完成，总时长${t4.toFixed(2)}s，最终距离${(v4*1000).toFixed(1)}px`);
        }

        cc.log("[CurvePresets] ========================================");
        cc.log(`[CurvePresets] ✓ 所有Reel曲线生成完成`);
        cc.log(`[CurvePresets] ✓ 每个Reel精确转动 ${alignedSymbolCount} 个Symbol (${alignedTotalDistPx}px)`);

        return curves;
    }

    /**
     * 创建快速停止曲线
     *
     * 用于用户点击急停，使用EaseOut曲线快速减速
     *
     * @param config 配置参数
     * @returns 快速停止曲线
     */
    static createQuickStopCurve(config: QuickStopCurveConfig): AnimationCurveTS {
        const { stopDistance, stopTime, easingType = 'quad' } = config;

        const curve = new AnimationCurveTS();
        const dist = stopDistance / 1000;  // 转为米

        // 根据缓动类型设置切线
        let outTangent: number;

        switch (easingType) {
            case 'quad':
                // EaseOutQuad: 快速开始，缓慢结束
                outTangent = (dist / stopTime) * 2;
                break;

            case 'cubic':
                // EaseOutCubic: 更快的开始
                outTangent = (dist / stopTime) * 2.5;
                break;

            case 'quart':
                // EaseOutQuart: 非常快的开始
                outTangent = (dist / stopTime) * 3;
                break;

            default:
                outTangent = (dist / stopTime) * 2;
        }

        curve.addKey(0, 0, 0, outTangent);
        curve.addKey(stopTime, dist, 0, 0);

        cc.log(`[CurvePresets] Quick stop curve created: ${easingType}, ${stopTime}s, ${stopDistance}px`);

        return curve;
    }

    // ========== Anticipation曲线 ==========

    /**
     * 创建Anticipation增强曲线
     *
     * 在原曲线基础上延长时间和距离，增强期待感
     *
     * 原理：
     * 1. 计算额外距离（extraSymbolNum * symbolHeight）
     * 2. 根据匀速段速度计算额外时间
     * 3. 修改最后两个关键帧，延长到达时间
     *
     * @param config Anticipation配置
     * @returns 增强后的曲线
     */
    static createAnticipationCurve(config: AnticipationCurveConfig): AnimationCurveTS {
        const { baseCurve, extraSymbolNum, symbolHeight, timeCompression = 1.2 } = config;

        const newCurve = baseCurve.clone();
        const keys = newCurve.getKeys();

        if (keys.length < 3) {
            cc.warn("[CurvePresets] Base curve has too few keys for Anticipation");
            return newCurve;
        }

        // ===== 计算额外距离和时间 =====

        const extraDistance = (symbolHeight * extraSymbolNum) / 1000;  // 转为米

        // 获取匀速段速度（第1到第2关键帧的平均斜率）
        const k1 = keys[1];
        const k2 = keys[2];
        const velocity = (k2.value - k1.value) / (k2.time - k1.time);

        // 计算额外时间（使用时间压缩比降低时间增长幅度）
        const extraTime = (extraDistance / velocity) / timeCompression;

        cc.log("[CurvePresets] Anticipation enhancement:");
        cc.log(`  Extra symbols: ${extraSymbolNum}`);
        cc.log(`  Extra distance: ${(extraDistance * 1000).toFixed(0)}px`);
        cc.log(`  Extra time: ${extraTime.toFixed(2)}s`);
        cc.log(`  Velocity: ${(velocity * 1000).toFixed(0)}px/s`);

        // ===== 修改最后两个关键帧 =====

        const lastIndex = keys.length - 1;
        const secondLastKey = keys[lastIndex - 1];
        const lastKey = keys[lastIndex];

        // 倒数第2帧：超过目标位置
        newCurve.moveKey(lastIndex - 1, {
            time: secondLastKey.time + extraTime,
            value: secondLastKey.value + extraDistance,
            inTangent: secondLastKey.inTangent,
            outTangent: secondLastKey.outTangent
        });

        // 最后1帧：最终位置
        newCurve.moveKey(lastIndex, {
            time: lastKey.time + extraTime,
            value: lastKey.value + extraDistance,
            inTangent: lastKey.inTangent,
            outTangent: lastKey.outTangent
        });

        cc.log(`  Original end time: ${lastKey.time.toFixed(2)}s`);
        cc.log(`  New end time: ${(lastKey.time + extraTime).toFixed(2)}s`);

        return newCurve;
    }

    /**
     * 延长曲线时间（用于后续Reel同步）
     *
     * 当前面的Reel使用了Anticipation延长时，后续Reel也需要延长相同时间
     *
     * @param baseCurve 基础曲线
     * @param extraTime 额外时间
     * @returns 延长后的曲线
     */
    static extendCurveTime(baseCurve: AnimationCurveTS, extraTime: number): AnimationCurveTS {
        const newCurve = baseCurve.clone();
        const keys = newCurve.getKeys();

        if (keys.length < 3) {
            return newCurve;
        }

        // 计算匀速段速度
        const k1 = keys[1];
        const k2 = keys[2];
        const velocity = (k2.value - k1.value) / (k2.time - k1.time);

        // 计算额外距离
        const extraDistance = velocity * extraTime;

        // 延长减速和回弹阶段（从第3帧开始）
        for (let i = 2; i < keys.length; i++) {
            newCurve.moveKey(i, {
                time: keys[i].time + extraTime,
                value: keys[i].value + extraDistance,
                inTangent: keys[i].inTangent,
                outTangent: keys[i].outTangent
            });
        }

        cc.log(`[CurvePresets] Extended curve time by ${extraTime.toFixed(2)}s`);

        return newCurve;
    }

    // ========== 自定义缓动曲线 ==========

    /**
     * 创建自定义缓动曲线
     *
     * @param type 缓动类型
     * @param startTime 起始时间
     * @param startValue 起始值
     * @param endTime 结束时间
     * @param endValue 结束值
     */
    static createEasingCurve(
        type: 'easeIn' | 'easeOut' | 'easeInOut' | 'linear',
        startTime: number,
        startValue: number,
        endTime: number,
        endValue: number
    ): AnimationCurveTS {

        switch (type) {
            case 'easeIn':
                return AnimationCurveTS.createEaseIn(startTime, startValue, endTime, endValue);

            case 'easeOut':
                return AnimationCurveTS.createEaseOut(startTime, startValue, endTime, endValue);

            case 'easeInOut':
                return AnimationCurveTS.createEaseInOut(startTime, startValue, endTime, endValue);

            case 'linear':
                return AnimationCurveTS.createLinear(startTime, startValue, endTime, endValue);

            default:
                return AnimationCurveTS.createLinear(startTime, startValue, endTime, endValue);
        }
    }

    // ========== 工具方法 ==========

    /**
     * 验证曲线配置是否合理
     *
     * @param curve 曲线
     * @returns 验证结果
     */
    static validateCurve(curve: AnimationCurveTS): { valid: boolean; errors: string[] } {
        const errors: string[] = [];

        // 检查关键帧数量
        if (curve.getKeyCount() < 2) {
            errors.push("曲线至少需要2个关键帧");
        }

        // 检查时间是否递增
        const keys = curve.getKeys();
        for (let i = 1; i < keys.length; i++) {
            if (keys[i].time <= keys[i - 1].time) {
                errors.push(`关键帧${i}的时间不大于前一帧`);
            }
        }

        // 检查值是否递增（对于转动曲线，值应该单调递增）
        for (let i = 1; i < keys.length; i++) {
            if (keys[i].value < keys[i - 1].value) {
                errors.push(`关键帧${i}的值小于前一帧（转动曲线应该单调递增）`);
            }
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }

    /**
     * 计算曲线的平均速度
     *
     * @param curve 曲线
     * @returns 平均速度（像素/秒）
     */
    static calculateAverageSpeed(curve: AnimationCurveTS): number {
        const timeRange = curve.getTimeRange();
        const valueRange = curve.getValueRange();

        const deltaTime = timeRange.max - timeRange.min;
        const deltaValue = valueRange.max - valueRange.min;

        if (deltaTime === 0) {
            return 0;
        }

        // 转换为像素/秒
        return (deltaValue * 1000) / deltaTime;
    }

    /**
     * 打印曲线信息（调试用）
     *
     * @param curve 曲线
     * @param name 曲线名称
     */
    static logCurveInfo(curve: AnimationCurveTS, name: string = "Curve"): void {
        cc.log(`[CurvePresets] ${name} Info:`);
        cc.log(`  Key count: ${curve.getKeyCount()}`);

        const timeRange = curve.getTimeRange();
        const valueRange = curve.getValueRange();

        cc.log(`  Time range: ${timeRange.min.toFixed(2)}s ~ ${timeRange.max.toFixed(2)}s`);
        cc.log(`  Value range: ${(valueRange.min * 1000).toFixed(0)}px ~ ${(valueRange.max * 1000).toFixed(0)}px`);
        cc.log(`  Average speed: ${this.calculateAverageSpeed(curve).toFixed(0)}px/s`);

        cc.log("  Keyframes:");
        const keys = curve.getKeys();
        keys.forEach((key, index) => {
            cc.log(`    [${index}] t=${key.time.toFixed(2)}s, v=${(key.value * 1000).toFixed(0)}px, ` +
                   `in=${key.inTangent.toFixed(2)}, out=${key.outTangent.toFixed(2)}`);
        });
    }
}
