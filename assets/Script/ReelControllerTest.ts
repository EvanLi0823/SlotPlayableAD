/**
 * ReelControllerTest - 曲线驱动测试
 * 测试ReelController的曲线驱动功能
 *
 * 测试内容：
 * 1. 单个Reel的曲线驱动转动
 * 2. 关键时间点回调
 * 3. 精确对齐
 * 4. 回弹效果（通过曲线内嵌）
 *
 * @author Claude Code
 * @date 2025-12-31
 */

import ReelController from "./ReelController";
import CurvePresets from "./CurvePresets";
import AnimationCurveTS from "./AnimationCurveTS";
import SlotConfig from "./SlotConfig";

const { ccclass, property } = cc._decorator;

interface TestResult {
    name: string;
    passed: boolean;
    message: string;
}

@ccclass
export default class ReelControllerTest extends cc.Component {

    @property(cc.Label)
    resultLabel: cc.Label = null;

    @property(SlotConfig)
    config: SlotConfig = null;

    @property(ReelController)
    testReel: ReelController = null;

    @property({
        tooltip: "是否在onLoad时自动运行测试"
    })
    autoRun: boolean = true;

    private results: TestResult[] = [];
    private testCurve: AnimationCurveTS = null;

    onLoad() {
        if (this.autoRun) {
            this.scheduleOnce(() => {
                this.runAllTests();
            }, 1.0);
        }
    }

    /**
     * 运行所有测试
     */
    async runAllTests(): Promise<void> {
        cc.log("=== 开始ReelController曲线驱动测试 ===\n");

        this.results = [];

        // 前置检查：确保testReel已初始化
        if (!this.initializeTestReel()) {
            cc.error("测试Reel初始化失败，测试终止");
            return;
        }

        // 测试1: 创建标准曲线
        this.testCreateStandardCurve();

        // 测试2: 曲线参数验证
        this.testCurveParameters();

        // 测试3: 启动曲线驱动转动
        await this.testStartSpinWithCurve();

        // 输出结果
        this.displayResults();

        cc.log("\n=== 测试完成 ===");
    }

    /**
     * 初始化测试Reel
     */
    private initializeTestReel(): boolean {
        cc.log("\n【前置准备：初始化测试Reel】");

        if (!this.testReel) {
            cc.error("  ✗ testReel未设置，请在Inspector中配置");
            return false;
        }

        if (!this.config) {
            cc.error("  ✗ config未设置，请在Inspector中配置");
            return false;
        }

        // 加载Symbol图片
        const symbolSprites = this.loadSymbolSprites();
        if (symbolSprites.length === 0) {
            cc.error("  ✗ Symbol图片加载失败");
            return false;
        }

        // 初始化ReelController
        const initialSymbols = [0, 1, 2, 3, 4, 5, 6];  // 初始符号序列
        this.testReel.init(0, initialSymbols, this.config, symbolSprites);

        cc.log("  ✓ 测试Reel初始化成功");
        return true;
    }

    /**
     * 加载Symbol图片（从配置的SpriteFrame数组）
     */
    private loadSymbolSprites(): cc.SpriteFrame[] {
        const sprites: cc.SpriteFrame[] = [];

        if (!this.config.symbolFrames || this.config.symbolFrames.length === 0) {
            cc.error("  ✗ Symbol frames未设置");
            return sprites;
        }

        for (let i = 0; i < this.config.symbolTypes; i++) {
            const frame = this.config.symbolFrames[i];

            if (frame) {
                sprites.push(frame);
            } else {
                cc.warn(`  ⚠ Symbol sprite未找到: index ${i}`);
                // 使用第一个图片作为占位符
                if (sprites.length > 0) {
                    sprites.push(sprites[0]);
                }
            }
        }

        cc.log(`  ✓ 加载了${sprites.length}/${this.config.symbolTypes}个Symbol图片`);
        return sprites;
    }

    // ========== 测试1: 创建标准曲线 ==========

    private testCreateStandardCurve(): void {
        cc.log("\n【测试1: 创建标准曲线】");

        try {
            const curves = CurvePresets.createStandardReelCurves({
                symbolHeight: 172,
                accelerationTime: 0.2,
                normalSpeed: 800,
                decelerationTime: 0.5,
                bounceDistance: 8,
                bounceDuration: 0.15,
                reelCount: 5,
                stopDelay: 0.2
            });

            this.assert(
                "1.1 曲线数量",
                curves.length === 5,
                `生成${curves.length}条曲线（期望5条）`
            );

            // 保存第一条曲线用于后续测试
            this.testCurve = curves[0];

            this.assert(
                "1.2 曲线关键帧数量",
                this.testCurve.getKeyCount() === 5,
                `关键帧数量: ${this.testCurve.getKeyCount()}（期望5个）`
            );

            // 验证时长递增（依次停止）
            let timesIncreasing = true;
            for (let i = 1; i < curves.length; i++) {
                const prev = curves[i - 1].getTimeRange().max;
                const curr = curves[i].getTimeRange().max;
                if (curr <= prev) {
                    timesIncreasing = false;
                    break;
                }
            }

            this.assert(
                "1.3 依次停止验证",
                timesIncreasing,
                `时长${timesIncreasing ? '依次递增' : '存在错误'}`
            );

        } catch (error) {
            this.addResult({
                name: "创建标准曲线",
                passed: false,
                message: `异常: ${error.message}`
            });
        }
    }

    // ========== 测试2: 曲线参数验证 ==========

    private testCurveParameters(): void {
        cc.log("\n【测试2: 曲线参数验证】");

        try {
            if (!this.testCurve) {
                this.assert("2.0 前置条件", false, "测试曲线未创建");
                return;
            }

            const keys = this.testCurve.getKeys();
            const timeRange = this.testCurve.getTimeRange();
            const valueRange = this.testCurve.getValueRange();

            this.assert(
                "2.1 时间范围",
                timeRange.min === 0 && timeRange.max > 0,
                `时间范围: ${timeRange.min.toFixed(2)}s ~ ${timeRange.max.toFixed(2)}s`
            );

            this.assert(
                "2.2 距离范围",
                valueRange.min === 0 && valueRange.max > 0,
                `距离范围: ${valueRange.min.toFixed(3)}m ~ ${valueRange.max.toFixed(3)}m`
            );

            // 验证关键帧时间递增
            let timeIncreasing = true;
            for (let i = 1; i < keys.length; i++) {
                if (keys[i].time <= keys[i - 1].time) {
                    timeIncreasing = false;
                    break;
                }
            }

            this.assert(
                "2.3 关键帧时间递增",
                timeIncreasing,
                `关键帧时间${timeIncreasing ? '单调递增' : '存在错误'}`
            );

            // 打印曲线详细信息
            cc.log("  曲线关键帧详情:");
            for (let i = 0; i < keys.length; i++) {
                const k = keys[i];
                cc.log(`    帧${i}: t=${k.time.toFixed(2)}s, v=${(k.value * 1000).toFixed(0)}px, in=${k.inTangent.toFixed(2)}, out=${k.outTangent.toFixed(2)}`);
            }

        } catch (error) {
            this.addResult({
                name: "曲线参数验证",
                passed: false,
                message: `异常: ${error.message}`
            });
        }
    }

    // ========== 测试3: 启动曲线驱动转动 ==========

    private async testStartSpinWithCurve(): Promise<void> {
        cc.log("\n【测试3: 启动曲线驱动转动】");

        try {
            if (!this.testReel) {
                this.assert("3.0 前置条件", false, "测试Reel未设置");
                return;
            }

            if (!this.testCurve) {
                this.assert("3.0 前置条件", false, "测试曲线未创建");
                return;
            }

            // 目标符号
            const targetSymbols = [0, 1, 2]; // 假设是3个可见符号

            cc.log("  启动转动...");

            // 监听事件
            let bounceTriggered = false;
            let stopTriggered = false;

            this.testReel.node.on("reel-bounce", () => {
                cc.log("  ✓ 回弹事件触发");
                bounceTriggered = true;
            });

            this.testReel.node.on("reel-stopped", () => {
                cc.log("  ✓ 停止事件触发");
                stopTriggered = true;
            });

            // 启动转动
            this.testReel.startSpinWithCurve(this.testCurve, targetSymbols, false);

            this.assert(
                "3.1 转动启动",
                this.testReel.isReelSpinning(),
                "Reel已开始转动"
            );

            // 等待转动完成
            const totalTime = this.testCurve.getTimeRange().max;
            cc.log(`  等待转动完成（${totalTime.toFixed(2)}s）...`);

            await this.delay(totalTime + 0.5);

            this.assert(
                "3.2 转动停止",
                !this.testReel.isReelSpinning(),
                "Reel已停止转动"
            );

            this.assert(
                "3.3 回弹事件",
                bounceTriggered,
                bounceTriggered ? "回弹事件已触发" : "回弹事件未触发"
            );

            this.assert(
                "3.4 停止事件",
                stopTriggered,
                stopTriggered ? "停止事件已触发" : "停止事件未触发"
            );

            // 验证最终位置（可视符号）
            const finalSymbols = this.testReel.getCurrentVisibleSymbols();
            const symbolsMatch = JSON.stringify(finalSymbols) === JSON.stringify(targetSymbols);

            this.assert(
                "3.5 符号对齐",
                symbolsMatch,
                `最终符号: [${finalSymbols}]${symbolsMatch ? ' ✓' : ' ✗ (期望: [' + targetSymbols + '])'}`
            );

        } catch (error) {
            this.addResult({
                name: "启动曲线驱动转动",
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

    private delay(seconds: number): Promise<void> {
        return new Promise((resolve) => {
            this.scheduleOnce(() => resolve(), seconds);
        });
    }

    /**
     * 手动运行测试（供按钮调用）
     */
    onRunTestsButtonClick(): void {
        this.runAllTests();
    }
}
