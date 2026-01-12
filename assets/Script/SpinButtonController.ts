/**
 * SpinButtonController - Spin按钮控制器
 * 管理按钮状态、点击事件和动画
 */

const { ccclass, property } = cc._decorator;

@ccclass
export default class SpinButtonController extends cc.Component {
    @property(cc.Button)
    spinButton: cc.Button = null;

    @property(cc.Node)
    buttonNode: cc.Node = null;

    @property(cc.Label)
    buttonLabel: cc.Label = null;

    // 回调
    public onSpinClicked: (() => void) | null = null;

    // 状态
    private isSpinning: boolean = false;

    onLoad() {
        if (!this.buttonNode && this.spinButton) {
            this.buttonNode = this.spinButton.node;
        }

        // 监听点击事件
        if (this.spinButton) {
            this.spinButton.node.on("click", this.handleSpinClick, this);
        }
    }

    /**
     * 处理Spin按钮点击
     */
    private handleSpinClick(): void {
        if (this.isSpinning) {
            cc.log("[SpinButtonController] Button is disabled during spin");
            return;
        }

        cc.log("[SpinButtonController] Spin button clicked");

        // 播放点击动画
        this.playClickAnimation();

        // 触发回调
        if (this.onSpinClicked) {
            this.onSpinClicked();
        }
    }

    /**
     * 设置按钮启用/禁用
     */
    setEnabled(enabled: boolean): void {
        this.isSpinning = !enabled;

        if (this.spinButton) {
            this.spinButton.interactable = enabled;
        }

        // 更新按钮外观
        if (this.buttonNode) {
            this.buttonNode.opacity = enabled ? 255 : 150;
        }

        // 更新文本
        if (this.buttonLabel) {
            this.buttonLabel.string = enabled ? "SPIN" : "SPINNING...";
        }
    }

    /**
     * 播放按钮点击动画
     */
    private playClickAnimation(): void {
        if (!this.buttonNode) return;

        cc.tween(this.buttonNode)
            .to(0.05, { scale: 0.95 })
            .to(0.1, { scale: 1.05 })
            .to(0.05, { scale: 1.0 })
            .start();
    }

    /**
     * 播放按钮呼吸动画（闲置时）
     */
    playIdleAnimation(): void {
        if (!this.buttonNode || this.isSpinning) return;

        cc.tween(this.buttonNode)
            .to(0.8, { scale: 1.05 })
            .to(0.8, { scale: 1.0 })
            .union()
            .repeatForever()
            .start();
    }

    /**
     * 停止呼吸动画
     */
    stopIdleAnimation(): void {
        if (!this.buttonNode) return;

        cc.Tween.stopAllByTarget(this.buttonNode);
        this.buttonNode.scale = 1.0;
    }

    onDestroy() {
        if (this.spinButton) {
            this.spinButton.node.off("click", this.handleSpinClick, this);
        }

        this.stopIdleAnimation();
    }
}
