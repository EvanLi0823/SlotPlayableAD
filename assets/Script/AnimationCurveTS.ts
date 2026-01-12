/**
 * AnimationCurveTS - 动画曲线类
 *
 * 模拟Unity的AnimationCurve功能，用于Slot转动的曲线驱动
 *
 * 核心特性：
 * - 三次Hermite插值，支持切线控制
 * - 时间采样获取精确位移
 * - 支持曲线编辑（添加/移动关键帧）
 * - 高性能（单次evaluate < 0.1ms）
 *
 * @author Claude Code
 * @date 2025-12-30
 * @version 1.0
 */

/**
 * 关键帧数据结构
 */
export interface Keyframe {
    /** 时间点（秒） */
    time: number;

    /** 位移值（米，需要乘以1000转为像素） */
    value: number;

    /** 入切线斜率（控制进入该点的曲线形状） */
    inTangent: number;

    /** 出切线斜率（控制离开该点的曲线形状） */
    outTangent: number;
}

/**
 * 曲线插值模式
 */
export enum CurveInterpolationMode {
    /** 三次Hermite插值（平滑曲线，支持切线） */
    HERMITE = "hermite",

    /** 线性插值（直线连接） */
    LINEAR = "linear",

    /** 常量插值（阶梯状） */
    CONSTANT = "constant"
}

/**
 * 动画曲线类
 */
export default class AnimationCurveTS {

    /** 关键帧数组（按时间排序） */
    private keys: Keyframe[] = [];

    /** 插值模式 */
    private interpolationMode: CurveInterpolationMode = CurveInterpolationMode.HERMITE;

    /** 缓存：最后一次查询的区间索引（优化性能） */
    private lastSegmentIndex: number = 0;

    /** 统计：evaluate调用次数 */
    private _evaluateCount: number = 0;

    /** 统计：总耗时（毫秒） */
    private _totalEvaluateTime: number = 0;

    /**
     * 构造函数
     * @param keys 初始关键帧数组（可选）
     */
    constructor(keys?: Keyframe[]) {
        if (keys && keys.length > 0) {
            this.keys = keys.map(k => ({ ...k })); // 深拷贝
            this.sortKeys();
        }
    }

    // ========== 公开方法 ==========

    /**
     * 根据时间采样获取位移值
     *
     * 这是核心方法，性能要求：单次调用 < 0.1ms
     *
     * @param time 当前时间（秒）
     * @returns 位移值（米，需要乘以1000转为像素）
     */
    evaluate(time: number): number {
        const startTime = performance.now();

        if (this.keys.length === 0) {
            this.recordEvaluateTime(startTime);
            return 0;
        }

        // 单个关键帧，返回该值
        if (this.keys.length === 1) {
            this.recordEvaluateTime(startTime);
            return this.keys[0].value;
        }

        // 超出范围则返回边界值
        if (time <= this.keys[0].time) {
            this.recordEvaluateTime(startTime);
            return this.keys[0].value;
        }

        if (time >= this.keys[this.keys.length - 1].time) {
            this.recordEvaluateTime(startTime);
            return this.keys[this.keys.length - 1].value;
        }

        // 找到时间所在区间（优化：从上次位置开始查找）
        let segmentIndex = this.findSegment(time);
        this.lastSegmentIndex = segmentIndex;

        const curr = this.keys[segmentIndex];
        const next = this.keys[segmentIndex + 1];

        // 根据插值模式计算
        let result: number;

        switch (this.interpolationMode) {
            case CurveInterpolationMode.HERMITE:
                result = this.hermiteInterpolate(curr, next, time);
                break;

            case CurveInterpolationMode.LINEAR:
                result = this.linearInterpolate(curr, next, time);
                break;

            case CurveInterpolationMode.CONSTANT:
                result = curr.value;
                break;

            default:
                result = this.hermiteInterpolate(curr, next, time);
        }

        this.recordEvaluateTime(startTime);
        return result;
    }

    /**
     * 添加关键帧
     *
     * @param time 时间点
     * @param value 位移值
     * @param inTangent 入切线（默认0）
     * @param outTangent 出切线（默认0）
     */
    addKey(time: number, value: number, inTangent: number = 0, outTangent: number = 0): void {
        this.keys.push({ time, value, inTangent, outTangent });
        this.sortKeys();
    }

    /**
     * 移动关键帧（修改已有关键帧）
     *
     * @param index 关键帧索引
     * @param newKey 新的关键帧数据
     */
    moveKey(index: number, newKey: Keyframe): void {
        if (index >= 0 && index < this.keys.length) {
            this.keys[index] = { ...newKey };
            this.sortKeys();
        } else {
            cc.warn(`[AnimationCurveTS] Invalid key index: ${index}`);
        }
    }

    /**
     * 删除关键帧
     *
     * @param index 关键帧索引
     */
    removeKey(index: number): void {
        if (index >= 0 && index < this.keys.length) {
            this.keys.splice(index, 1);
        } else {
            cc.warn(`[AnimationCurveTS] Invalid key index: ${index}`);
        }
    }

    /**
     * 获取所有关键帧（副本，防止外部修改）
     */
    getKeys(): Keyframe[] {
        return this.keys.map(k => ({ ...k }));
    }

    /**
     * 获取关键帧数量
     */
    getKeyCount(): number {
        return this.keys.length;
    }

    /**
     * 获取指定索引的关键帧
     */
    getKey(index: number): Keyframe | null {
        if (index >= 0 && index < this.keys.length) {
            return { ...this.keys[index] };
        }
        return null;
    }

    /**
     * 克隆曲线
     */
    clone(): AnimationCurveTS {
        const cloned = new AnimationCurveTS();
        cloned.keys = this.keys.map(k => ({ ...k }));
        cloned.interpolationMode = this.interpolationMode;
        return cloned;
    }

    /**
     * 设置插值模式
     */
    setInterpolationMode(mode: CurveInterpolationMode): void {
        this.interpolationMode = mode;
    }

    /**
     * 获取插值模式
     */
    getInterpolationMode(): CurveInterpolationMode {
        return this.interpolationMode;
    }

    /**
     * 清空所有关键帧
     */
    clear(): void {
        this.keys = [];
        this.lastSegmentIndex = 0;
    }

    /**
     * 获取曲线的时间范围
     */
    getTimeRange(): { min: number; max: number } {
        if (this.keys.length === 0) {
            return { min: 0, max: 0 };
        }

        return {
            min: this.keys[0].time,
            max: this.keys[this.keys.length - 1].time
        };
    }

    /**
     * 获取曲线的值范围
     */
    getValueRange(): { min: number; max: number } {
        if (this.keys.length === 0) {
            return { min: 0, max: 0 };
        }

        let min = this.keys[0].value;
        let max = this.keys[0].value;

        for (const key of this.keys) {
            min = Math.min(min, key.value);
            max = Math.max(max, key.value);
        }

        return { min, max };
    }

    /**
     * 获取性能统计信息
     */
    getPerformanceStats(): { count: number; avgTime: number; totalTime: number } {
        return {
            count: this._evaluateCount,
            avgTime: this._evaluateCount > 0 ? this._totalEvaluateTime / this._evaluateCount : 0,
            totalTime: this._totalEvaluateTime
        };
    }

    /**
     * 重置性能统计
     */
    resetPerformanceStats(): void {
        this._evaluateCount = 0;
        this._totalEvaluateTime = 0;
    }

    // ========== 私有方法 ==========

    /**
     * 三次Hermite插值
     *
     * 公式：
     * P(t) = h00 * P0 + h10 * m0 + h01 * P1 + h11 * m1
     *
     * 其中：
     * h00 = 2t³ - 3t² + 1
     * h10 = t³ - 2t² + t
     * h01 = -2t³ + 3t²
     * h11 = t³ - t²
     *
     * @param k1 起始关键帧
     * @param k2 结束关键帧
     * @param time 当前时间
     */
    private hermiteInterpolate(k1: Keyframe, k2: Keyframe, time: number): number {
        const dt = k2.time - k1.time;

        // 归一化时间 t ∈ [0, 1]
        const t = (time - k1.time) / dt;

        const t2 = t * t;
        const t3 = t2 * t;

        // Hermite基函数
        const h00 = 2 * t3 - 3 * t2 + 1;
        const h10 = t3 - 2 * t2 + t;
        const h01 = -2 * t3 + 3 * t2;
        const h11 = t3 - t2;

        // 切线向量（需要乘以时间间隔）
        const m0 = k1.outTangent * dt;
        const m1 = k2.inTangent * dt;

        // 计算插值结果
        return h00 * k1.value + h10 * m0 + h01 * k2.value + h11 * m1;
    }

    /**
     * 线性插值
     *
     * @param k1 起始关键帧
     * @param k2 结束关键帧
     * @param time 当前时间
     */
    private linearInterpolate(k1: Keyframe, k2: Keyframe, time: number): number {
        const dt = k2.time - k1.time;
        const t = (time - k1.time) / dt;

        return k1.value + (k2.value - k1.value) * t;
    }

    /**
     * 找到时间所在的区间索引
     *
     * 优化：从上次位置开始查找（利用时间连续性）
     *
     * @param time 目标时间
     * @returns 区间起始索引
     */
    private findSegment(time: number): number {
        // 先检查上次的位置
        if (this.lastSegmentIndex < this.keys.length - 1) {
            const curr = this.keys[this.lastSegmentIndex];
            const next = this.keys[this.lastSegmentIndex + 1];

            if (time >= curr.time && time <= next.time) {
                return this.lastSegmentIndex;
            }
        }

        // 如果不在上次位置，进行二分查找
        let left = 0;
        let right = this.keys.length - 2;

        while (left <= right) {
            const mid = Math.floor((left + right) / 2);
            const curr = this.keys[mid];
            const next = this.keys[mid + 1];

            if (time >= curr.time && time <= next.time) {
                return mid;
            } else if (time < curr.time) {
                right = mid - 1;
            } else {
                left = mid + 1;
            }
        }

        // 兜底：返回第一个区间
        return 0;
    }

    /**
     * 按时间排序关键帧
     */
    private sortKeys(): void {
        this.keys.sort((a, b) => a.time - b.time);
    }

    /**
     * 记录evaluate耗时
     */
    private recordEvaluateTime(startTime: number): void {
        const elapsed = performance.now() - startTime;
        this._evaluateCount++;
        this._totalEvaluateTime += elapsed;
    }

    // ========== 静态工具方法 ==========

    /**
     * 从两点创建线性曲线
     *
     * @param startTime 起始时间
     * @param startValue 起始值
     * @param endTime 结束时间
     * @param endValue 结束值
     */
    static createLinear(startTime: number, startValue: number, endTime: number, endValue: number): AnimationCurveTS {
        const curve = new AnimationCurveTS();

        const slope = (endValue - startValue) / (endTime - startTime);

        curve.addKey(startTime, startValue, slope, slope);
        curve.addKey(endTime, endValue, slope, slope);

        return curve;
    }

    /**
     * 创建常量曲线
     *
     * @param value 常量值
     * @param duration 持续时间
     */
    static createConstant(value: number, duration: number): AnimationCurveTS {
        const curve = new AnimationCurveTS();

        curve.addKey(0, value, 0, 0);
        curve.addKey(duration, value, 0, 0);
        curve.setInterpolationMode(CurveInterpolationMode.CONSTANT);

        return curve;
    }

    /**
     * 创建EaseIn曲线（缓入）
     *
     * @param startTime 起始时间
     * @param startValue 起始值
     * @param endTime 结束时间
     * @param endValue 结束值
     */
    static createEaseIn(startTime: number, startValue: number, endTime: number, endValue: number): AnimationCurveTS {
        const curve = new AnimationCurveTS();

        const deltaValue = endValue - startValue;
        const deltaTime = endTime - startTime;

        // 起点：出切线为0（慢速启动）
        curve.addKey(startTime, startValue, 0, 0);

        // 终点：入切线较大（快速到达）
        const endTangent = deltaValue / deltaTime * 2;
        curve.addKey(endTime, endValue, endTangent, endTangent);

        return curve;
    }

    /**
     * 创建EaseOut曲线（缓出）
     *
     * @param startTime 起始时间
     * @param startValue 起始值
     * @param endTime 结束时间
     * @param endValue 结束值
     */
    static createEaseOut(startTime: number, startValue: number, endTime: number, endValue: number): AnimationCurveTS {
        const curve = new AnimationCurveTS();

        const deltaValue = endValue - startValue;
        const deltaTime = endTime - startTime;

        // 起点：出切线较大（快速启动）
        const startTangent = deltaValue / deltaTime * 2;
        curve.addKey(startTime, startValue, startTangent, startTangent);

        // 终点：入切线为0（慢速到达）
        curve.addKey(endTime, endValue, 0, 0);

        return curve;
    }

    /**
     * 创建EaseInOut曲线（缓入缓出）
     *
     * @param startTime 起始时间
     * @param startValue 起始值
     * @param endTime 结束时间
     * @param endValue 结束值
     */
    static createEaseInOut(startTime: number, startValue: number, endTime: number, endValue: number): AnimationCurveTS {
        const curve = new AnimationCurveTS();

        const deltaValue = endValue - startValue;
        const deltaTime = endTime - startTime;
        const midTime = (startTime + endTime) / 2;
        const midValue = (startValue + endValue) / 2;

        const tangent = deltaValue / deltaTime * 1.5;

        // 起点：缓入
        curve.addKey(startTime, startValue, 0, tangent);

        // 中点：过渡
        curve.addKey(midTime, midValue, tangent, tangent);

        // 终点：缓出
        curve.addKey(endTime, endValue, tangent, 0);

        return curve;
    }
}
