/**
 * WinPopupController - 中奖弹窗控制器
 * 显示中奖金额和领取按钮
 */

import { currency } from './CurrencyConverter';

const { ccclass, property } = cc._decorator;

@ccclass
export default class WinPopupController extends cc.Component {
    @property(cc.Node)
    popupNode: cc.Node = null;

    @property(cc.Label)
    amountLabel: cc.Label = null;

    @property(cc.Button)
    claimButton: cc.Button = null;

    @property(cc.Node)
    maskNode: cc.Node = null;

    @property(cc.Node)
    contentNode: cc.Node = null;

    // 回调
    public onClaimClicked: (() => void) | null = null;

    // 状态
    private isShowing: boolean = false;
    private currentAmount: number = 0;
    private isInitialized: boolean = false;
    private originalContentScale: number = 1.0;  // 保存contentNode的原始scale

    onLoad() {
        cc.log("[WinPopupController] ========================================");
        cc.log("[WinPopupController] onLoad called");
        cc.log(`[WinPopupController] this.node: ${this.node.name}, active: ${this.node.active}`);
        cc.log(`[WinPopupController] popupNode: ${this.popupNode ? this.popupNode.name : 'NULL'}`);
        cc.log(`[WinPopupController] contentNode: ${this.contentNode ? this.contentNode.name : 'NULL'}`);
        cc.log(`[WinPopupController] maskNode: ${this.maskNode ? this.maskNode.name : 'NULL'}`);
        cc.log(`[WinPopupController] amountLabel: ${this.amountLabel ? 'exists' : 'NULL'}`);
        cc.log(`[WinPopupController] claimButton: ${this.claimButton ? 'exists' : 'NULL'}`);

        this.initializePopup();

        cc.log("[WinPopupController] onLoad completed");
        cc.log("[WinPopupController] ========================================");
    }

    /**
     * 初始化弹窗（确保即使onLoad未调用也能正常工作）
     */
    private initializePopup(): void {
        if (this.isInitialized) {
            cc.log("[WinPopupController] Already initialized, skipping");
            return;
        }

        cc.log("[WinPopupController] Initializing popup...");

        // 如果popupNode未设置，默认使用组件所在节点
        if (!this.popupNode) {
            cc.warn("[WinPopupController] popupNode not set, using this.node");
            this.popupNode = this.node;
        }

        // 保存contentNode的原始scale（在动画修改之前）
        if (this.contentNode) {
            this.originalContentScale = this.contentNode.scale;
            cc.log(`[WinPopupController] Saved originalContentScale: ${this.originalContentScale}`);
            cc.log(`[WinPopupController] contentNode.scaleX: ${this.contentNode.scaleX}, scaleY: ${this.contentNode.scaleY}`);
        } else {
            cc.warn("[WinPopupController] contentNode is NULL, using default scale 1.0");
        }

        // 初始隐藏
        if (this.popupNode) {
            this.popupNode.active = false;
            cc.log("[WinPopupController] Set popupNode.active = false (initial state)");
        } else {
            cc.error("[WinPopupController] popupNode is NULL in initializePopup!");
        }

        // 监听领取按钮点击
        if (this.claimButton) {
            // 先移除旧的监听器（避免重复注册）
            this.claimButton.node.off("click", this.handleClaimClick, this);
            this.claimButton.node.on("click", this.handleClaimClick, this);
            cc.log("[WinPopupController] Registered claim button click listener");
        } else {
            cc.warn("[WinPopupController] claimButton is NULL, cannot register listener");
        }

        // 监听遮罩点击（可选：点击遮罩关闭）
        if (this.maskNode) {
            this.maskNode.off(cc.Node.EventType.TOUCH_END, this.handleMaskClick, this);
            this.maskNode.on(cc.Node.EventType.TOUCH_END, this.handleMaskClick, this);
            cc.log("[WinPopupController] Registered mask click listener");
        }

        this.isInitialized = true;
        cc.log("[WinPopupController] Initialization completed");
    }

    /**
     * 显示弹窗
     */
    async show(winAmount: number): Promise<void> {
        // 确保已初始化（处理节点初始inactive的情况）
        if (!this.isInitialized) {
            cc.warn("[WinPopupController] Not initialized yet, calling initializePopup()");
            this.initializePopup();
        }

        if (this.isShowing) {
            cc.warn("[WinPopupController] Popup is already showing, skipping");
            return;
        }

        cc.log(`[WinPopupController] ========================================`);
        cc.log(`[WinPopupController] Showing popup with amount: ${winAmount}`);
        cc.log(`[WinPopupController] popupNode: ${this.popupNode ? this.popupNode.name : 'NULL'}`);
        cc.log(`[WinPopupController] contentNode: ${this.contentNode ? this.contentNode.name : 'NULL'}`);
        cc.log(`[WinPopupController] maskNode: ${this.maskNode ? this.maskNode.name : 'NULL'}`);
        cc.log(`[WinPopupController] amountLabel: ${this.amountLabel ? 'exists' : 'NULL'}`);
        cc.log(`[WinPopupController] claimButton: ${this.claimButton ? 'exists' : 'NULL'}`);

        this.isShowing = true;
        this.currentAmount = winAmount;

        // 更新金额文本（使用货币转换和格式化）
        if (this.amountLabel) {
            // 假设winAmount是USD金额，转换为当前语言的货币并格式化
            const formattedAmount = currency.convertAndFormat(winAmount);
            this.amountLabel.string = formattedAmount;
            cc.log(`[WinPopupController] Updated amount label to: ${formattedAmount}`);
        } else {
            cc.error(`[WinPopupController] amountLabel is NULL! Cannot display amount.`);
        }

        // 显示节点
        if (this.popupNode) {
            this.popupNode.active = true;
            cc.log(`[WinPopupController] Set popupNode.active = true`);
            cc.log(`[WinPopupController] popupNode.active: ${this.popupNode.active}`);
            cc.log(`[WinPopupController] popupNode.opacity: ${this.popupNode.opacity}`);
            cc.log(`[WinPopupController] popupNode.position: (${this.popupNode.x}, ${this.popupNode.y})`);
            cc.log(`[WinPopupController] popupNode.parent: ${this.popupNode.parent ? this.popupNode.parent.name : 'NULL'}`);
        } else {
            cc.error(`[WinPopupController] popupNode is NULL! Cannot show popup.`);
        }

        // 播放弹出动画
        cc.log(`[WinPopupController] Starting show animation...`);
        await this.playShowAnimation();
        cc.log(`[WinPopupController] Show animation completed`);
        cc.log(`[WinPopupController] ========================================`);
    }

    /**
     * 隐藏弹窗
     */
    async hide(): Promise<void> {
        if (!this.isShowing) return;

        cc.log("[WinPopupController] Hiding popup");

        // 播放隐藏动画
        await this.playHideAnimation();

        // 隐藏节点
        if (this.popupNode) {
            this.popupNode.active = false;
        }

        this.isShowing = false;
    }

    /**
     * 处理领取按钮点击
     */
    private handleClaimClick(): void {
        if (!this.isShowing) return;

        cc.log("[WinPopupController] Claim button clicked");

        // 播放按钮点击动画
        this.playButtonClickAnimation();

        // 触发回调
        if (this.onClaimClicked) {
            this.onClaimClicked();
        }
    }

    /**
     * 处理遮罩点击（可选）
     */
    private handleMaskClick(): void {
        // 可以选择是否允许点击遮罩关闭
        // cc.log("[WinPopupController] Mask clicked");
    }

    /**
     * 播放弹出动画（backOut缓动）
     */
    private async playShowAnimation(): Promise<void> {
        return new Promise((resolve) => {
            if (!this.contentNode) {
                cc.warn("[WinPopupController] contentNode is NULL, skipping animation");
                resolve();
                return;
            }

            cc.log("[WinPopupController] playShowAnimation started");
            cc.log(`[WinPopupController] contentNode: ${this.contentNode.name}`);
            cc.log(`[WinPopupController] contentNode.scale before animation: ${this.contentNode.scale}`);
            cc.log(`[WinPopupController] contentNode.scaleX: ${this.contentNode.scaleX}, scaleY: ${this.contentNode.scaleY}`);
            cc.log(`[WinPopupController] contentNode.parent: ${this.contentNode.parent ? this.contentNode.parent.name : 'NULL'}`);
            if (this.contentNode.parent) {
                cc.log(`[WinPopupController] contentNode.parent.scale: ${this.contentNode.parent.scale}`);
            }
            cc.log(`[WinPopupController] Using saved originalContentScale: ${this.originalContentScale}`);

            // 初始状态：缩放为0
            this.contentNode.scale = 0;
            this.contentNode.opacity = 0;
            cc.log(`[WinPopupController] Set initial state: scale=0, opacity=0`);

            // 遮罩淡入
            if (this.maskNode) {
                this.maskNode.opacity = 0;
                cc.log(`[WinPopupController] Starting mask fade-in animation`);
                cc.tween(this.maskNode)
                    .to(0.2, { opacity: 180 })
                    .start();
            }

            // 内容弹出（backOut缓动）- 恢复到保存的原始scale
            cc.log(`[WinPopupController] Starting content popup animation (backOut) to scale=${this.originalContentScale}`);
            cc.tween(this.contentNode)
                .to(0.4,
                    { scale: this.originalContentScale, opacity: 255 },  // 使用保存的原始scale
                    { easing: "backOut" }
                )
                .call(() => {
                    cc.log(`[WinPopupController] Content animation completed`);
                    cc.log(`[WinPopupController] contentNode.scale after animation: ${this.contentNode.scale}`);
                    cc.log(`[WinPopupController] contentNode.scaleX: ${this.contentNode.scaleX}, scaleY: ${this.contentNode.scaleY}`);

                    // 播放领取按钮脉冲动画
                    this.playClaimButtonPulse();
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
            this.stopClaimButtonPulse();

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
     * 播放领取按钮脉冲动画
     */
    private playClaimButtonPulse(): void {
        if (!this.claimButton) return;

        const node = this.claimButton.node;

        cc.tween(node)
            .to(0.5, { scale: 1.1 })
            .to(0.5, { scale: 1.0 })
            .union()
            .repeatForever()
            .start();
    }

    /**
     * 停止领取按钮脉冲动画
     */
    private stopClaimButtonPulse(): void {
        if (!this.claimButton) return;

        const node = this.claimButton.node;
        cc.Tween.stopAllByTarget(node);
        node.scale = 1.0;
    }

    /**
     * 播放按钮点击动画
     */
    private playButtonClickAnimation(): void {
        if (!this.claimButton) return;

        const node = this.claimButton.node;

        cc.tween(node)
            .to(0.05, { scale: 0.9 })
            .to(0.1, { scale: 1.1 })
            .to(0.05, { scale: 1.0 })
            .start();
    }

    /**
     * 获取当前中奖金额
     */
    getCurrentAmount(): number {
        return this.currentAmount;
    }

    onDestroy() {
        if (this.claimButton) {
            this.claimButton.node.off("click", this.handleClaimClick, this);
        }

        if (this.maskNode) {
            this.maskNode.off(cc.Node.EventType.TOUCH_END, this.handleMaskClick, this);
        }

        this.stopClaimButtonPulse();
    }
}
