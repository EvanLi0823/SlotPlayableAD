/**
 * TopBarController - 上栏控制器
 * 管理提现金额显示和数字滚动动画
 */

const { ccclass, property } = cc._decorator;

@ccclass
export default class TopBarController extends cc.Component {
    @property(cc.Label)
    amountLabel: cc.Label = null;

    @property(cc.Node)
    iconNode: cc.Node = null;

    private currentAmount: number = 0;

    onLoad() {
        this.setAmount(1000); // 默认金额
    }

    /**
     * 设置显示金额
     */
    setAmount(amount: number): void {
        this.currentAmount = amount;
        if (this.amountLabel) {
            this.amountLabel.string = `$${amount}`;
        }
    }

    /**
     * 获取当前金额
     */
    getAmount(): number {
        return this.currentAmount;
    }

    /**
     * 获取金额框位置（用于飞行动画）
     */
    getCashoutPosition(): cc.Vec2 {
        if (this.amountLabel) {
            return this.amountLabel.node.convertToWorldSpaceAR(cc.Vec2.ZERO);
        }
        return this.node.convertToWorldSpaceAR(cc.Vec2.ZERO);
    }

    /**
     * 更新金额（带数字滚动动画）
     */
    async animateAmountChange(fromAmount: number, toAmount: number, duration: number): Promise<void> {
        return new Promise((resolve) => {
            const startTime = Date.now();
            const diff = toAmount - fromAmount;

            const updateAmount = () => {
                const elapsed = (Date.now() - startTime) / 1000;
                const progress = Math.min(elapsed / duration, 1.0);

                // 使用缓动函数
                const easedProgress = this.easeOutCubic(progress);
                const currentAmount = fromAmount + diff * easedProgress;

                this.currentAmount = currentAmount;
                if (this.amountLabel) {
                    this.amountLabel.string = `$${Math.floor(currentAmount)}`;
                }

                if (progress < 1.0) {
                    requestAnimationFrame(updateAmount);
                } else {
                    this.currentAmount = toAmount;
                    if (this.amountLabel) {
                        this.amountLabel.string = `$${toAmount}`;
                    }
                    resolve();
                }
            };

            updateAmount();
        });
    }

    /**
     * 播放金额增加动画（可选的额外效果）
     */
    playAddAmountAnimation(addedAmount: number): void {
        // 可以添加"+XXX"飞入动画等效果
        cc.log(`[TopBarController] Added amount: +${addedAmount}`);

        // 简单的缩放动画
        if (this.amountLabel) {
            const node = this.amountLabel.node;
            cc.tween(node)
                .to(0.2, { scale: 1.2 })
                .to(0.2, { scale: 1.0 })
                .start();
        }
    }

    /**
     * 缓动函数：easeOutCubic
     */
    private easeOutCubic(t: number): number {
        return 1 - Math.pow(1 - t, 3);
    }
}
