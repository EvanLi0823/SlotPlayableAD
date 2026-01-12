/**
 * CashFlyAnimController - 现金飞行动画控制器
 * 管理现金图标从源位置飞行到目标位置的贝塞尔曲线动画
 */

const { ccclass, property } = cc._decorator;

@ccclass
export default class CashFlyAnimController extends cc.Component {
    @property(cc.Node)
    cashCoinPrefab: cc.Node = null;

    @property(cc.Node)
    animationContainer: cc.Node = null;

    @property(cc.SpriteFrame)
    cashCoinSprite: cc.SpriteFrame = null;

    @property({ tooltip: "飞行时长（秒）" })
    flyDuration: number = 1.2;

    @property({ tooltip: "旋转圈数" })
    rotationCount: number = 2;

    /**
     * 播放现金飞行动画
     * @param startPos 起始位置（世界坐标）
     * @param endPos 目标位置（世界坐标）
     * @param count 金币数量
     */
    async playCashFly(startPos: cc.Vec2, endPos: cc.Vec2, count: number = 1): Promise<void> {
        const promises: Promise<void>[] = [];

        for (let i = 0; i < count; i++) {
            const delay = i * 0.1; // 多个金币依次延迟
            promises.push(this.createAndAnimateCoin(startPos, endPos, delay));
        }

        await Promise.all(promises);
    }

    /**
     * 创建并播放单个金币动画
     */
    private async createAndAnimateCoin(
        startPos: cc.Vec2,
        endPos: cc.Vec2,
        delay: number
    ): Promise<void> {
        return new Promise((resolve) => {
            // 创建金币节点
            const coinNode = this.createCoinNode();
            if (!coinNode) {
                resolve();
                return;
            }

            // 添加到容器
            const container = this.animationContainer || this.node;
            container.addChild(coinNode);

            // 转换坐标到容器本地坐标系
            const localStartPos = container.convertToNodeSpaceAR(startPos);
            const localEndPos = container.convertToNodeSpaceAR(endPos);

            // 设置初始位置
            coinNode.position = cc.v3(localStartPos.x, localStartPos.y, 0);

            // 延迟后播放动画
            this.scheduleOnce(() => {
                this.animateCoin(coinNode, localStartPos, localEndPos, () => {
                    // 动画完成，销毁节点
                    coinNode.destroy();
                    resolve();
                });
            }, delay);
        });
    }

    /**
     * 创建金币节点
     */
    private createCoinNode(): cc.Node {
        let coinNode: cc.Node;

        if (this.cashCoinPrefab) {
            // 使用预制体
            coinNode = cc.instantiate(this.cashCoinPrefab);
        } else {
            // 动态创建
            coinNode = new cc.Node("CashCoin");
            const sprite = coinNode.addComponent(cc.Sprite);

            if (this.cashCoinSprite) {
                sprite.spriteFrame = this.cashCoinSprite;
            } else {
                cc.warn("[CashFlyAnimController] No cash coin sprite provided");
            }

            // 设置大小
            coinNode.width = 60;
            coinNode.height = 60;
        }

        return coinNode;
    }

    /**
     * 播放金币贝塞尔曲线飞行动画
     */
    private animateCoin(
        coinNode: cc.Node,
        startPos: cc.Vec2,
        endPos: cc.Vec2,
        onComplete: () => void
    ): void {
        // 计算贝塞尔曲线控制点
        const controlPoint1 = this.calculateControlPoint1(startPos, endPos);
        const controlPoint2 = this.calculateControlPoint2(startPos, endPos);

        // 同时播放：位置、旋转、缩放
        const duration = this.flyDuration;

        // 位置动画（贝塞尔曲线）
        cc.tween(coinNode)
            .bezierTo(
                duration,
                cc.v2(controlPoint1.x, controlPoint1.y),
                cc.v2(controlPoint2.x, controlPoint2.y),
                cc.v2(endPos.x, endPos.y)
            )
            .call(() => {
                if (onComplete) {
                    onComplete();
                }
            })
            .start();

        // 旋转动画
        cc.tween(coinNode)
            .to(duration, { angle: 360 * this.rotationCount })
            .start();

        // 缩放动画（先放大后缩小）
        cc.tween(coinNode)
            .to(duration * 0.3, { scale: 1.2 })
            .to(duration * 0.7, { scale: 0.8 })
            .start();
    }

    /**
     * 计算贝塞尔曲线第一个控制点
     */
    private calculateControlPoint1(startPos: cc.Vec2, endPos: cc.Vec2): cc.Vec2 {
        const midX = (startPos.x + endPos.x) / 2;
        const midY = (startPos.y + endPos.y) / 2;

        // 向上偏移
        const offsetY = Math.abs(endPos.y - startPos.y) * 0.5 + 150;

        return cc.v2(midX - 100, midY + offsetY);
    }

    /**
     * 计算贝塞尔曲线第二个控制点
     */
    private calculateControlPoint2(startPos: cc.Vec2, endPos: cc.Vec2): cc.Vec2 {
        const midX = (startPos.x + endPos.x) / 2;
        const midY = (startPos.y + endPos.y) / 2;

        // 向上偏移
        const offsetY = Math.abs(endPos.y - startPos.y) * 0.5 + 100;

        return cc.v2(midX + 100, midY + offsetY);
    }

    /**
     * 播放简化版飞行动画（单个金币，无延迟）
     */
    async playSimpleCashFly(startPos: cc.Vec2, endPos: cc.Vec2): Promise<void> {
        return this.createAndAnimateCoin(startPos, endPos, 0);
    }
}
