/**
 * RightSidePanelController - 右侧面板控制器
 * 管理右侧Icon和Download按钮（与左侧对称）
 */

const { ccclass, property } = cc._decorator;

@ccclass
export default class RightSidePanelController extends cc.Component {
    @property(cc.Node)
    iconNode: cc.Node = null;

    @property(cc.Button)
    downloadButton: cc.Button = null;

    @property(cc.Sprite)
    iconSprite: cc.Sprite = null;

    @property(cc.Sprite)
    backgroundSprite: cc.Sprite = null;

    // 回调
    public onDownloadClicked: (() => void) | null = null;

    onLoad() {
        // 监听下载按钮点击
        if (this.downloadButton) {
            this.downloadButton.node.on("click", this.handleDownloadClick, this);
        }

        // 播放Icon的闲置动画
        this.playIconIdleAnimation();
    }

    /**
     * 处理下载按钮点击
     */
    private handleDownloadClick(): void {
        cc.log("[RightSidePanelController] Download button clicked");

        // 播放点击动画
        this.playButtonClickAnimation();

        // 触发回调
        if (this.onDownloadClicked) {
            this.onDownloadClicked();
        }
    }

    /**
     * 设置Icon图片
     */
    setIcon(spriteFrame: cc.SpriteFrame): void {
        if (this.iconSprite && spriteFrame) {
            this.iconSprite.spriteFrame = spriteFrame;
        }
    }

    /**
     * 播放Icon闲置动画
     */
    private playIconIdleAnimation(): void {
        if (!this.iconNode) return;

        cc.tween(this.iconNode)
            .to(1.5, { angle: -10 })
            .to(1.5, { angle: 10 })
            .union()
            .repeatForever()
            .start();
    }

    /**
     * 播放按钮点击动画
     */
    private playButtonClickAnimation(): void {
        if (!this.downloadButton) return;

        const node = this.downloadButton.node;

        cc.tween(node)
            .to(0.05, { scale: 0.9 })
            .to(0.1, { scale: 1.1 })
            .to(0.05, { scale: 1.0 })
            .start();
    }

    /**
     * 播放下载按钮脉冲动画
     */
    playDownloadButtonPulse(): void {
        if (!this.downloadButton) return;

        const node = this.downloadButton.node;

        cc.tween(node)
            .to(0.6, { scale: 1.1 })
            .to(0.6, { scale: 1.0 })
            .union()
            .repeatForever()
            .start();
    }

    /**
     * 停止下载按钮脉冲动画
     */
    stopDownloadButtonPulse(): void {
        if (!this.downloadButton) return;

        const node = this.downloadButton.node;
        cc.Tween.stopAllByTarget(node);
        node.scale = 1.0;
    }

    onDestroy() {
        if (this.downloadButton) {
            this.downloadButton.node.off("click", this.handleDownloadClick, this);
        }

        if (this.iconNode) {
            cc.Tween.stopAllByTarget(this.iconNode);
        }

        this.stopDownloadButtonPulse();
    }
}
