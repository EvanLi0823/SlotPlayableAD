/**
 * DownloadPopupController - 下载弹窗控制器
 * 显示下载提示和下载按钮
 */

import { i18n } from './LocalizationManager';

const { ccclass, property } = cc._decorator;

@ccclass
export default class DownloadPopupController extends cc.Component {
    @property(cc.Node)
    popupNode: cc.Node = null;

    @property(cc.Label)
    messageLabel: cc.Label = null;

    @property(cc.Button)
    downloadButton: cc.Button = null;

    @property(cc.Label)
    downloadButtonLabel: cc.Label = null;

    @property(cc.Node)
    maskNode: cc.Node = null;

    @property(cc.Node)
    contentNode: cc.Node = null;

    // 回调
    public onDownloadClicked: (() => void) | null = null;

    // 状态
    private isShowing: boolean = false;

    onLoad() {
        // 初始隐藏
        if (this.popupNode) {
            this.popupNode.active = false;
        }

        // 更新下载按钮文本为当前语言
        this.updateDownloadButtonText();

        // 监听下载按钮点击
        if (this.downloadButton) {
            this.downloadButton.node.on("click", this.handleDownloadClick, this);
        }
    }

    /**
     * 更新下载按钮文本
     */
    private updateDownloadButtonText(): void {
        if (this.downloadButtonLabel) {
            const downloadText = i18n.getText('download');
            this.downloadButtonLabel.string = downloadText;
            cc.log(`[DownloadPopupController] Updated button text to: ${downloadText}`);
        } else if (this.downloadButton) {
            // 如果没有设置downloadButtonLabel，尝试从按钮子节点获取Label组件
            const label = this.downloadButton.node.getComponentInChildren(cc.Label);
            if (label) {
                const downloadText = i18n.getText('download');
                label.string = downloadText;
                cc.log(`[DownloadPopupController] Updated button text (from child) to: ${downloadText}`);
            }
        }
    }

    /**
     * 显示弹窗
     */
    async show(message?: string): Promise<void> {
        if (this.isShowing) return;

        cc.log("[DownloadPopupController] Showing popup");

        this.isShowing = true;

        // 更新下载按钮文本（确保使用最新的语言设置）
        this.updateDownloadButtonText();

        // 更新消息文本
        if (this.messageLabel && message) {
            this.messageLabel.string = message;
        } else if (this.messageLabel) {
            // 使用本地化的提示文本
            this.messageLabel.string = i18n.getText('tipLbl');
        }

        // 显示节点
        if (this.popupNode) {
            this.popupNode.active = true;
        }

        // 播放弹出动画
        await this.playShowAnimation();
    }

    /**
     * 隐藏弹窗
     */
    async hide(): Promise<void> {
        if (!this.isShowing) return;

        cc.log("[DownloadPopupController] Hiding popup");

        // 播放隐藏动画
        await this.playHideAnimation();

        // 隐藏节点
        if (this.popupNode) {
            this.popupNode.active = false;
        }

        this.isShowing = false;
    }

    /**
     * 处理下载按钮点击
     */
    private handleDownloadClick(): void {
        if (!this.isShowing) return;

        cc.log("[DownloadPopupController] Download button clicked");

        // 播放按钮点击动画
        this.playButtonClickAnimation();

        // 触发回调
        if (this.onDownloadClicked) {
            this.onDownloadClicked();
        }
    }

    /**
     * 播放弹出动画（backOut缓动）
     */
    private async playShowAnimation(): Promise<void> {
        return new Promise((resolve) => {
            if (!this.contentNode) {
                resolve();
                return;
            }

            // 初始状态
            this.contentNode.scale = 0;
            this.contentNode.opacity = 0;

            // 遮罩淡入
            if (this.maskNode) {
                this.maskNode.opacity = 0;
                cc.tween(this.maskNode)
                    .to(0.2, { opacity: 180 })
                    .start();
            }

            // 内容弹出（backOut缓动）
            cc.tween(this.contentNode)
                .to(0.4,
                    { scale: 1.0, opacity: 255 },
                    { easing: "backOut" }
                )
                .call(() => {
                    // 播放下载按钮脉冲动画
                    this.playDownloadButtonPulse();
                    resolve();
                })
                .start();
        });
    }

    /**
     * 播放隐藏动画
     */
    private async playHideAnimation(): Promise<void> {
        return new Promise((resolve) => {
            if (!this.contentNode) {
                resolve();
                return;
            }

            // 停止脉冲动画
            this.stopDownloadButtonPulse();

            // 内容缩小
            cc.tween(this.contentNode)
                .to(0.2, { scale: 0.8, opacity: 0 })
                .start();

            // 遮罩淡出
            if (this.maskNode) {
                cc.tween(this.maskNode)
                    .to(0.2, { opacity: 0 })
                    .call(() => resolve())
                    .start();
            } else {
                setTimeout(() => resolve(), 200);
            }
        });
    }

    /**
     * 播放下载按钮脉冲动画
     */
    private playDownloadButtonPulse(): void {
        if (!this.downloadButton) return;

        const node = this.downloadButton.node;

        cc.tween(node)
            .to(0.6, { scale: 1.15 })
            .to(0.6, { scale: 1.0 })
            .union()
            .repeatForever()
            .start();
    }

    /**
     * 停止下载按钮脉冲动画
     */
    private stopDownloadButtonPulse(): void {
        if (!this.downloadButton) return;

        const node = this.downloadButton.node;
        cc.Tween.stopAllByTarget(node);
        node.scale = 1.0;
    }

    /**
     * 播放按钮点击动画
     */
    private playButtonClickAnimation(): void {
        if (!this.downloadButton) return;

        const node = this.downloadButton.node;

        cc.tween(node)
            .to(0.05, { scale: 0.95 })
            .to(0.1, { scale: 1.2 })
            .to(0.05, { scale: 1.0 })
            .start();
    }

    onDestroy() {
        if (this.downloadButton) {
            this.downloadButton.node.off("click", this.handleDownloadClick, this);
        }

        this.stopDownloadButtonPulse();
    }
}
