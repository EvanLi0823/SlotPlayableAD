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

    @property(cc.Node)
    guideHandNode: cc.Node = null;

    // 回调
    public onSpinClicked: (() => void) | null = null;

    // 状态
    private isSpinning: boolean = false;
    private isFirstTime: boolean = true;  // 是否第一次进入游戏

    onLoad() {
        if (!this.buttonNode && this.spinButton) {
            this.buttonNode = this.spinButton.node;
        }

        // 初始隐藏小手引导
        if (this.guideHandNode) {
            this.guideHandNode.active = false;
        }

        // 监听点击事件
        if (this.spinButton) {
            this.spinButton.node.on("click", this.handleSpinClick, this);
        }
    }

    start() {
        // 游戏启动后显示小手引导
        if (this.isFirstTime) {
            this.showGuideHand();
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

        // 首次点击时隐藏小手引导
        if (this.isFirstTime) {
            this.hideGuideHand();
            this.isFirstTime = false;
        }

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
    }

    /**
     * 显示小手引导
     */
    showGuideHand(): void {
        if (!this.guideHandNode) {
            cc.warn("[SpinButtonController] guideHandNode is not set");
            return;
        }

        cc.log("[SpinButtonController] Showing guide hand");

        // 显示节点
        this.guideHandNode.active = true;
        this.guideHandNode.opacity = 255;
        this.guideHandNode.scale = 1.0;

        // 播放放大缩小动画
        this.playGuideHandAnimation();
    }

    /**
     * 隐藏小手引导
     */
    hideGuideHand(): void {
        if (!this.guideHandNode) return;

        cc.log("[SpinButtonController] Hiding guide hand");

        // 停止动画
        cc.Tween.stopAllByTarget(this.guideHandNode);

        // 直接隐藏（无淡出动画）
        this.guideHandNode.active = false;
    }

    /**
     * 播放小手引导动画（放大缩小循环）
     */
    private playGuideHandAnimation(): void {
        if (!this.guideHandNode) return;

        cc.tween(this.guideHandNode)
            .to(0.6, { scale: 1.5 }, { easing: "sineInOut" })
            .to(0.6, { scale: 1.0 }, { easing: "sineInOut" })
            .union()
            .repeatForever()
            .start();
    }

    /**
     * 手动触发小手引导显示（可选，用于调试或重置）
     */
    resetGuideHand(): void {
        this.isFirstTime = true;
        this.showGuideHand();
    }

    onDestroy() {
        if (this.spinButton) {
            this.spinButton.node.off("click", this.handleSpinClick, this);
        }

        // 停止小手动画
        if (this.guideHandNode) {
            cc.Tween.stopAllByTarget(this.guideHandNode);
        }
    }
}
