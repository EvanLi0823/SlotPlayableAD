/**
 * CurveSystemTest - 曲线系统单元测试和性能测试
 *
 * 测试内容：
 * 1. AnimationCurveTS 基础功能
 * 2. Hermite插值精度验证
 * 3. CurvePresets 曲线生成
 * 4. CurveLoader JSON加载
 * 5. 性能测试（evaluate耗时）
 *
 * @author Claude Code
 * @date 2025-12-30
 */

import AnimationCurveTS, { Keyframe, CurveInterpolationMode } from "./AnimationCurveTS";
import CurvePresets from "./CurvePresets";
import CurveLoader from "./CurveLoader";

const { ccclass, property } = cc._decorator;

/**
 * 测试结果
 */
interface TestResult {
    name: string;
    passed: boolean;
    message: string;
    duration?: number;
}

@ccclass
export default class CurveSystemTest extends cc.Component {

    @property(cc.Label)
    resultLabel: cc.Label = null;

    @property({
        tooltip: "是否在onLoad时自动运行测试"
    })
    autoRun: boolean = true;

    private results: TestResult[] = [];

    onLoad() {
        if (this.autoRun) {
            this.runAllTests();
        }
    }

    /**
     * 运行所有测试
     */
    async runAllTests(): Promise<void> {
        cc.log("=== 开始曲线系统测试 ===\n");

        this.results = [];

        // 基础功能测试
        this.testBasicFunctions();

        // Hermite插值测试
        this.testHermiteInterpolation();

        // 曲线预设测试
        this.testCurvePresets();

        // JSON加载测试
        await this.testCurveLoader();

        // 性能测试
        this.testPerformance();

        // 输出结果
        this.displayResults();

        cc.log("\n=== 测试完成 ===");
    }

    // ========== 基础功能测试 ==========

    private testBasicFunctions(): void {
        cc.log("\n【测试1: 基础功能】");

        try {
            const curve = new AnimationCurveTS();

            // 测试1.1: 添加关键帧
            curve.addKey(0, 0, 0, 1);
            curve.addKey(1, 1, 1, 0);

            this.assert(
                "1.1 添加关键帧",
                curve.getKeyCount() === 2,
                `期望2个关键帧，实际${curve.getKeyCount()}个`
            );

            // 测试1.2: 获取关键帧
            const key0 = curve.getKey(0);
            this.assert(
                "1.2 获取关键帧",
                key0 !== null && key0.time === 0 && key0.value === 0,
                `关键帧0数据正确`
            );

            // 测试1.3: 时间范围
            const timeRange = curve.getTimeRange();
            this.assert(
                "1.3 时间范围",
                timeRange.min === 0 && timeRange.max === 1,
                `时间范围 ${timeRange.min}~${timeRange.max}`
            );

            // 测试1.4: 值范围
            const valueRange = curve.getValueRange();
            this.assert(
                "1.4 值范围",
                valueRange.min === 0 && valueRange.max === 1,
                `值范围 ${valueRange.min}~${valueRange.max}`
            );

            // 测试1.5: 克隆
            const cloned = curve.clone();
            this.assert(
                "1.5 克隆曲线",
                cloned.getKeyCount() === curve.getKeyCount(),
                `克隆成功，${cloned.getKeyCount()}个关键帧`
            );

            // 测试1.6: 移除关键帧
            curve.removeKey(0);
            this.assert(
                "1.6 移除关键帧",
                curve.getKeyCount() === 1,
                `移除后剩余${curve.getKeyCount()}个关键帧`
            );

        } catch (error) {
            this.addResult({
                name: "基础功能测试",
                passed: false,
                message: `异常: ${error.message}`
            });
        }
    }

    // ========== Hermite插值测试 ==========

    private testHermiteInterpolation(): void {
        cc.log("\n【测试2: Hermite插值精度】");

        try {
            // 创建简单曲线: (0, 0) → (1, 1)，线性
            const curve = AnimationCurveTS.createLinear(0, 0, 1, 1);

            // 测试2.1: 边界值
            const v0 = curve.evaluate(0);
            const v1 = curve.evaluate(1);

            this.assert(
                "2.1 边界值测试",
                Math.abs(v0 - 0) < 0.001 && Math.abs(v1 - 1) < 0.001,
                `起点=${v0.toFixed(3)}, 终点=${v1.toFixed(3)}`
            );

            // 测试2.2: 中点值（线性应该是0.5）
            const vMid = curve.evaluate(0.5);
            this.assert(
                "2.2 线性插值中点",
                Math.abs(vMid - 0.5) < 0.001,
                `中点值=${vMid.toFixed(3)}，误差=${Math.abs(vMid - 0.5).toFixed(6)}`
            );

            // 测试2.3: 超出范围
            const vBefore = curve.evaluate(-1);
            const vAfter = curve.evaluate(2);
            this.assert(
                "2.3 超出范围返回边界值",
                vBefore === 0 && vAfter === 1,
                `before=${vBefore}, after=${vAfter}`
            );

            // 测试2.4: Hermite平滑曲线
            const smoothCurve = new AnimationCurveTS();
            smoothCurve.addKey(0, 0, 0, 2);    // 快速启动
            smoothCurve.addKey(1, 1, 0, 0);    // 慢速到达

            const values = [];
            for (let t = 0; t <= 1; t += 0.1) {
                values.push(smoothCurve.evaluate(t));
            }

            // 检查单调性（值应该递增）
            let monotonic = true;
            for (let i = 1; i < values.length; i++) {
                if (values[i] < values[i - 1]) {
                    monotonic = false;
                    break;
                }
            }

            this.assert(
                "2.4 Hermite曲线单调性",
                monotonic,
                `曲线${monotonic ? '单调递增' : '存在递减'}`
            );

            // 测试2.5: 精度测试（采样100个点）
            let maxError = 0;
            const testCurve = AnimationCurveTS.createLinear(0, 0, 10, 10);

            for (let t = 0; t <= 10; t += 0.1) {
                const v = testCurve.evaluate(t);
                const expected = t;
                const error = Math.abs(v - expected);
                maxError = Math.max(maxError, error);
            }

            this.assert(
                "2.5 精度测试（100采样点）",
                maxError < 0.001,  // 误差 < 0.1%
                `最大误差=${(maxError * 100).toFixed(4)}%`
            );

        } catch (error) {
            this.addResult({
                name: "Hermite插值测试",
                passed: false,
                message: `异常: ${error.message}`
            });
        }
    }

    // ========== 曲线预设测试 ==========

    private testCurvePresets(): void {
        cc.log("\n【测试3: 曲线预设生成】");

        try {
            // 测试3.1: 标准5列曲线
            const standardCurves = CurvePresets.createStandardReelCurves({
                symbolHeight: 100,
                accelerationTime: 0.2,
                normalSpeed: 800,
                decelerationTime: 0.5,
                bounceDistance: 8,
                bounceDuration: 0.15,
                reelCount: 5,
                stopDelay: 0.2
            });

            this.assert(
                "3.1 标准5列曲线生成",
                standardCurves.length === 5,
                `生成${standardCurves.length}条曲线`
            );

            // 测试3.2: 验证依次停止（每条曲线的总时长应该递增）
            let timesIncreasing = true;
            for (let i = 1; i < standardCurves.length; i++) {
                const prev = standardCurves[i - 1].getTimeRange().max;
                const curr = standardCurves[i].getTimeRange().max;
                if (curr <= prev) {
                    timesIncreasing = false;
                    break;
                }
            }

            this.assert(
                "3.2 依次停止验证",
                timesIncreasing,
                `时长${timesIncreasing ? '依次递增' : '存在错误'}`
            );

            // 测试3.3: 快速停止曲线
            const quickStopCurve = CurvePresets.createQuickStopCurve({
                stopDistance: 500,
                stopTime: 0.5,
                easingType: 'quad'
            });

            this.assert(
                "3.3 快速停止曲线",
                quickStopCurve.getKeyCount() === 2,
                `生成${quickStopCurve.getKeyCount()}个关键帧`
            );

            // 测试3.4: Anticipation增强
            const baseCurve = standardCurves[0];
            const antiCurve = CurvePresets.createAnticipationCurve({
                baseCurve: baseCurve,
                extraSymbolNum: 40,
                symbolHeight: 100,
                timeCompression: 1.2
            });

            const baseTime = baseCurve.getTimeRange().max;
            const antiTime = antiCurve.getTimeRange().max;

            this.assert(
                "3.4 Anticipation增强",
                antiTime > baseTime,
                `原时长=${baseTime.toFixed(2)}s, 增强后=${antiTime.toFixed(2)}s`
            );

            // 测试3.5: 曲线验证
            const validation = CurvePresets.validateCurve(standardCurves[0]);

            this.assert(
                "3.5 曲线验证工具",
                validation.valid,
                validation.valid ? "验证通过" : `错误: ${validation.errors.join(', ')}`
            );

        } catch (error) {
            this.addResult({
                name: "曲线预设测试",
                passed: false,
                message: `异常: ${error.message}`
            });
        }
    }

    // ========== CurveLoader测试 ==========

    private async testCurveLoader(): Promise<void> {
        cc.log("\n【测试4: CurveLoader加载】");

        try {
            // 测试4.1: 从JSON对象加载
            const jsonConfig = {
                name: "test_curve",
                interpolationMode: "hermite",
                keyframes: [
                    { time: 0, value: 0, inTangent: 0, outTangent: 1 },
                    { time: 1, value: 1, inTangent: 1, outTangent: 0 }
                ]
            };

            const result1 = CurveLoader.loadFromJSON(jsonConfig);

            this.assert(
                "4.1 从JSON对象加载",
                result1.success && result1.curve !== undefined,
                result1.success ? "加载成功" : result1.error || "未知错误"
            );

            // 测试4.2: JSON字符串加载
            const jsonString = JSON.stringify(jsonConfig);
            const result2 = CurveLoader.loadFromJSONString(jsonString);

            this.assert(
                "4.2 从JSON字符串加载",
                result2.success,
                result2.success ? "加载成功" : result2.error || "未知错误"
            );

            // 测试4.3: 导出为JSON
            if (result1.curve) {
                const exported = CurveLoader.exportToJSON(result1.curve, "exported_curve", "测试导出");

                this.assert(
                    "4.3 导出为JSON",
                    exported.name === "exported_curve" && exported.keyframes.length === 2,
                    `导出成功: ${exported.keyframes.length}个关键帧`
                );
            }

            // 测试4.4: 缓存管理
            CurveLoader.cacheCurve("test1", result1.curve!);
            const cached = CurveLoader.getCachedCurve("test1");

            this.assert(
                "4.4 曲线缓存",
                cached !== null,
                `缓存${cached ? '成功' : '失败'}`
            );

            // 测试4.5: 从资源加载（异步）
            try {
                const result3 = await CurveLoader.loadFromResource("curves/example_curve");

                this.assert(
                    "4.5 从资源加载",
                    result3.success,
                    result3.success ? `加载成功: ${result3.curve?.getKeyCount()}个关键帧` : result3.error || "未知错误"
                );
            } catch (error) {
                this.assert(
                    "4.5 从资源加载",
                    false,
                    `资源加载失败（文件可能不存在）: ${error.message}`
                );
            }

        } catch (error) {
            this.addResult({
                name: "CurveLoader测试",
                passed: false,
                message: `异常: ${error.message}`
            });
        }
    }

    // ========== 性能测试 ==========

    private testPerformance(): void {
        cc.log("\n【测试5: 性能测试】");

        try {
            // 创建测试曲线
            const curve = new AnimationCurveTS();
            curve.addKey(0, 0, 0, 1);
            curve.addKey(1, 1, 1, 1);
            curve.addKey(2, 2, 1, 0);

            // 测试5.1: 单次evaluate耗时
            const iterations = 1000;
            const startTime = performance.now();

            for (let i = 0; i < iterations; i++) {
                const t = Math.random() * 2;
                curve.evaluate(t);
            }

            const endTime = performance.now();
            const avgTime = (endTime - startTime) / iterations;

            this.assert(
                "5.1 evaluate性能（1000次）",
                avgTime < 0.1,  // 单次 < 0.1ms
                `平均耗时=${avgTime.toFixed(4)}ms（要求<0.1ms）`
            );

            // 测试5.2: 获取性能统计
            curve.resetPerformanceStats();

            for (let i = 0; i < 100; i++) {
                curve.evaluate(i / 100 * 2);
            }

            const stats = curve.getPerformanceStats();

            this.assert(
                "5.2 性能统计",
                stats.count === 100 && stats.avgTime < 0.1,
                `调用${stats.count}次，平均${stats.avgTime.toFixed(4)}ms`
            );

            // 测试5.3: 复杂曲线性能
            const complexCurve = new AnimationCurveTS();
            for (let i = 0; i <= 10; i++) {
                complexCurve.addKey(i, i, 1, 1);
            }

            const startTime2 = performance.now();

            for (let i = 0; i < iterations; i++) {
                const t = Math.random() * 10;
                complexCurve.evaluate(t);
            }

            const endTime2 = performance.now();
            const avgTime2 = (endTime2 - startTime2) / iterations;

            this.assert(
                "5.3 复杂曲线性能（11帧）",
                avgTime2 < 0.15,  // 稍微放宽要求
                `平均耗时=${avgTime2.toFixed(4)}ms`
            );

            // 测试5.4: 内存占用估算
            const memBefore = (performance as any).memory?.usedJSHeapSize || 0;

            const curves: AnimationCurveTS[] = [];
            for (let i = 0; i < 100; i++) {
                curves.push(AnimationCurveTS.createLinear(0, 0, 10, 10));
            }

            const memAfter = (performance as any).memory?.usedJSHeapSize || 0;
            const memIncrease = (memAfter - memBefore) / 1024 / 1024;

            this.assert(
                "5.4 内存占用（100条曲线）",
                memIncrease < 5,  // 增加 < 5MB
                memBefore > 0 ? `增加${memIncrease.toFixed(2)}MB` : "内存API不可用"
            );

        } catch (error) {
            this.addResult({
                name: "性能测试",
                passed: false,
                message: `异常: ${error.message}`
            });
        }
    }

    // ========== 辅助方法 ==========

    private assert(name: string, condition: boolean, message: string): void {
        const passed = condition;

        this.addResult({
            name,
            passed,
            message: `${passed ? '✓' : '✗'} ${message}`
        });

        if (passed) {
            cc.log(`  ✓ ${name}: ${message}`);
        } else {
            cc.error(`  ✗ ${name}: ${message}`);
        }
    }

    private addResult(result: TestResult): void {
        this.results.push(result);
    }

    private displayResults(): void {
        const passed = this.results.filter(r => r.passed).length;
        const total = this.results.length;
        const passRate = ((passed / total) * 100).toFixed(1);

        let summary = `\n${"=".repeat(50)}\n`;
        summary += `测试总结: ${passed}/${total} 通过 (${passRate}%)\n`;
        summary += `${"=".repeat(50)}\n\n`;

        // 分组显示失败的测试
        const failed = this.results.filter(r => !r.passed);
        if (failed.length > 0) {
            summary += `失败的测试 (${failed.length}):\n`;
            for (const result of failed) {
                summary += `  ✗ ${result.name}: ${result.message}\n`;
            }
            summary += "\n";
        }

        cc.log(summary);

        // 更新UI
        if (this.resultLabel) {
            this.resultLabel.string = `测试完成\n${passed}/${total} 通过\n${passRate}%`;
        }
    }

    /**
     * 手动运行测试（供按钮调用）
     */
    onRunTestsButtonClick(): void {
        this.runAllTests();
    }
}
