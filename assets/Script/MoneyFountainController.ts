/**
 * MoneyFountainController - 飞钱喷泉动画控制器
 * 实现从底部中心点向上喷射、向两侧散开、最后下落并渐隐消失的金钱动画效果
 */

const { ccclass, property } = cc._decorator;

/** 单个金钱粒子的数据 */
interface MoneyParticle {
    node: cc.Node;           // 节点
    velocity: cc.Vec2;       // 速度
    rotation: number;        // 旋转速度
    lifetime: number;        // 生命周期
    currentLife: number;     // 当前生命
    active: boolean;         // 是否激活
    peakY: number;           // 最高点Y坐标（用于判断是否开始下落）
}

@ccclass
export default class MoneyFountainController extends cc.Component {

    @property(cc.Prefab)
    moneyPrefab: cc.Prefab = null;  // 金钱图片预制体（如果使用预制体）

    @property(cc.SpriteFrame)
    moneySpriteFrame: cc.SpriteFrame = null;  // 金钱图片（如果直接使用图片）

    @property({
        tooltip: "粒子池大小"
    })
    poolSize: number = 100;

    @property({
        tooltip: "每秒发射粒子数"
    })
    emitRate: number = 40;

    @property({
        tooltip: "初始向上速度范围 [min, max]"
    })
    initialVelocityY: cc.Vec2 = new cc.Vec2(600, 900);

    @property({
        tooltip: "初始横向速度范围 [min, max]"
    })
    initialVelocityX: cc.Vec2 = new cc.Vec2(-250, 250);

    @property({
        tooltip: "重力加速度"
    })
    gravity: number = -1200;

    @property({
        tooltip: "粒子生命周期（秒）"
    })
    particleLifetime: number = 3.0;

    @property({
        tooltip: "旋转速度范围 [min, max]（度/秒）"
    })
    rotationSpeed: cc.Vec2 = new cc.Vec2(-360, 360);

    @property({
        tooltip: "粒子大小范围 [min, max]"
    })
    particleScale: cc.Vec2 = new cc.Vec2(0.8, 1.5);

    @property({
        tooltip: "动画持续时间（秒），0表示无限循环"
    })
    duration: number = 0;

    @property({
        tooltip: "发射点偏移（相对于节点位置）"
    })
    emitOffset: cc.Vec2 = new cc.Vec2(0, 0);

    @property({
        tooltip: "下落渐隐开始高度百分比（0-1，1表示从最高点开始）"
    })
    fadeStartRatio: number = 0.5;

    @property({
        tooltip: "渐隐速度（透明度减少速度，0-255/秒）"
    })
    fadeSpeed: number = 200;

    // 私有变量
    private particlePool: MoneyParticle[] = [];
    private emitTimer: number = 0;
    private totalTimer: number = 0;
    private isPlaying: boolean = false;

    onLoad() {
        cc.log('[MoneyFountain] ========================================');
        cc.log('[MoneyFountain] onLoad called');
        cc.log(`[MoneyFountain] node.name: ${this.node.name}`);
        cc.log(`[MoneyFountain] node.active: ${this.node.active}`);
        cc.log(`[MoneyFountain] node.width: ${this.node.width}, node.height: ${this.node.height}`);
        cc.log(`[MoneyFountain] node.position: (${this.node.x}, ${this.node.y})`);
        cc.log(`[MoneyFountain] node.worldPosition: (${this.node.convertToWorldSpaceAR(cc.Vec2.ZERO).x.toFixed(0)}, ${this.node.convertToWorldSpaceAR(cc.Vec2.ZERO).y.toFixed(0)})`);

        // 获取屏幕尺寸
        const canvas = cc.game.canvas;
        cc.log(`[MoneyFountain] Canvas size: ${canvas.width} x ${canvas.height}`);
        cc.log(`[MoneyFountain] Design resolution: ${cc.view.getDesignResolutionSize().width} x ${cc.view.getDesignResolutionSize().height}`);

        cc.log(`[MoneyFountain] poolSize: ${this.poolSize}`);
        cc.log(`[MoneyFountain] emitRate: ${this.emitRate}`);
        cc.log(`[MoneyFountain] moneySpriteFrame: ${this.moneySpriteFrame ? 'exists' : 'NULL'}`);
        cc.log(`[MoneyFountain] moneyPrefab: ${this.moneyPrefab ? 'exists' : 'NULL'}`);

        // 确保节点有合理的尺寸（即使是空节点）
        // 这样可以避免因为尺寸为0导致的渲染问题
        if (this.node.width === 0 || this.node.height === 0) {
            cc.warn('[MoneyFountain] Node size is (0, 0), setting to (1, 1) to avoid rendering issues');
            this.node.setContentSize(1, 1);
        }

        // 初始化粒子池
        this.initParticlePool();

        cc.log(`[MoneyFountain] Particle pool initialized with ${this.particlePool.length} particles`);
        cc.log('[MoneyFountain] ========================================');
    }

    /**
     * 初始化粒子池
     */
    private initParticlePool(): void {
        for (let i = 0; i < this.poolSize; i++) {
            const particle = this.createParticle();
            this.particlePool.push(particle);
        }
    }

    /**
     * 创建一个粒子对象
     */
    private createParticle(): MoneyParticle {
        let node: cc.Node;

        // 优先使用预制体，其次使用SpriteFrame
        if (this.moneyPrefab) {
            node = cc.instantiate(this.moneyPrefab);
            cc.log('[MoneyFountain] Created particle from prefab');
        } else if (this.moneySpriteFrame) {
            node = new cc.Node('Money');
            const sprite = node.addComponent(cc.Sprite);
            sprite.spriteFrame = this.moneySpriteFrame;

            // 确保sprite有尺寸
            if (sprite.spriteFrame) {
                const rect = sprite.spriteFrame.getRect();
                node.width = rect.width;
                node.height = rect.height;
                cc.log(`[MoneyFountain] Created particle from spriteFrame, size: ${rect.width}x${rect.height}`);
            }
        } else {
            // 如果都没有，创建一个可见的测试节点
            node = new cc.Node('Money');
            const sprite = node.addComponent(cc.Sprite);

            // 创建一个简单的纯色纹理作为默认显示
            const canvas = document.createElement('canvas');
            canvas.width = 50;
            canvas.height = 50;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#FFD700'; // 金色
            ctx.beginPath();
            ctx.arc(25, 25, 25, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 2;
            ctx.stroke();

            const texture = new cc.Texture2D();
            texture.initWithElement(canvas);
            const spriteFrame = new cc.SpriteFrame(texture);
            sprite.spriteFrame = spriteFrame;

            node.width = 50;
            node.height = 50;

            cc.warn('[MoneyFountain] No prefab or spriteFrame provided, using default yellow circle');
        }

        node.parent = this.node;
        node.active = false;

        // 设置高 zIndex 确保粒子在最上层显示
        node.zIndex = 9999;

        cc.log(`[MoneyFountain] Particle node created: ${node.name}, parent: ${node.parent ? node.parent.name : 'NULL'}, zIndex: ${node.zIndex}`);

        return {
            node: node,
            velocity: cc.Vec2.ZERO,
            rotation: 0,
            lifetime: this.particleLifetime,
            currentLife: 0,
            active: false,
            peakY: 0
        };
    }

    /**
     * 获取一个可用的粒子
     */
    private getAvailableParticle(): MoneyParticle | null {
        for (const particle of this.particlePool) {
            if (!particle.active) {
                return particle;
            }
        }
        return null;
    }

    /**
     * 发射一个粒子
     */
    private emitParticle(): void {
        const particle = this.getAvailableParticle();
        if (!particle) {
            cc.warn('[MoneyFountain] No available particle in pool');
            return;
        }

        // 激活粒子
        particle.active = true;
        particle.node.active = true;
        particle.currentLife = 0;

        // 设置初始位置（发射点）
        particle.node.setPosition(this.emitOffset.x, this.emitOffset.y);
        particle.peakY = this.emitOffset.y;

        // 随机初始速度
        const velocityX = this.randomRange(this.initialVelocityX.x, this.initialVelocityX.y);
        const velocityY = this.randomRange(this.initialVelocityY.x, this.initialVelocityY.y);
        particle.velocity = new cc.Vec2(velocityX, velocityY);

        // 随机旋转速度
        particle.rotation = this.randomRange(this.rotationSpeed.x, this.rotationSpeed.y);

        // 随机大小
        const scale = this.randomRange(this.particleScale.x, this.particleScale.y);
        particle.node.scale = scale;

        // 重置生命周期
        particle.lifetime = this.particleLifetime;

        // 设置初始透明度
        particle.node.opacity = 255;

        // 详细的调试信息
        const sprite = particle.node.getComponent(cc.Sprite);
        cc.log(`[MoneyFountain] Particle emitted:`);
        cc.log(`  - Position: (${this.emitOffset.x}, ${this.emitOffset.y})`);
        cc.log(`  - Velocity: (${velocityX.toFixed(0)}, ${velocityY.toFixed(0)})`);
        cc.log(`  - Scale: ${scale.toFixed(2)}`);
        cc.log(`  - Node active: ${particle.node.active}`);
        cc.log(`  - Node opacity: ${particle.node.opacity}`);
        cc.log(`  - Has sprite: ${sprite ? 'YES' : 'NO'}`);
        if (sprite) {
            cc.log(`  - Sprite has frame: ${sprite.spriteFrame ? 'YES' : 'NO'}`);
        }
        cc.log(`  - World position: (${particle.node.convertToWorldSpaceAR(cc.Vec2.ZERO).x.toFixed(0)}, ${particle.node.convertToWorldSpaceAR(cc.Vec2.ZERO).y.toFixed(0)})`);
    }

    /**
     * 更新粒子状态
     */
    private updateParticle(particle: MoneyParticle, dt: number): void {
        if (!particle.active) return;

        // 更新生命周期
        particle.currentLife += dt;

        // 如果生命周期结束，回收粒子
        if (particle.currentLife >= particle.lifetime) {
            this.recycleParticle(particle);
            return;
        }

        // 应用重力
        particle.velocity.y += this.gravity * dt;

        // 更新位置
        const pos = particle.node.getPosition();
        pos.x += particle.velocity.x * dt;
        pos.y += particle.velocity.y * dt;
        particle.node.setPosition(pos);

        // 记录最高点
        if (pos.y > particle.peakY) {
            particle.peakY = pos.y;
        }

        // 更新旋转
        particle.node.angle += particle.rotation * dt;

        // 渐隐效果 - 当粒子开始下落时
        if (particle.velocity.y < 0) {  // 速度向下，说明开始下落
            const fallDistance = particle.peakY - pos.y;  // 下落距离
            const totalFallDistance = particle.peakY - this.emitOffset.y;  // 总高度差

            if (totalFallDistance > 0) {
                // 计算下落进度（0-1）
                const fallProgress = fallDistance / totalFallDistance;

                // 当下落到一定程度后开始渐隐
                if (fallProgress >= this.fadeStartRatio) {
                    // 计算渐隐进度（0-1）
                    const fadeProgress = (fallProgress - this.fadeStartRatio) / (1 - this.fadeStartRatio);

                    // 使用平滑的渐隐曲线
                    const opacity = 255 * (1 - fadeProgress);
                    particle.node.opacity = Math.max(0, opacity);

                    // 如果完全透明，提前回收
                    if (particle.node.opacity <= 0) {
                        this.recycleParticle(particle);
                        return;
                    }
                }
            }
        }

        // 额外的生命周期淡出（兜底保护）
        const lifeRatio = particle.currentLife / particle.lifetime;
        if (lifeRatio > 0.9) {
            const fadeRatio = 1 - (lifeRatio - 0.9) / 0.1;
            const currentOpacity = particle.node.opacity;
            particle.node.opacity = Math.min(currentOpacity, 255 * fadeRatio);
        }
    }

    /**
     * 回收粒子
     */
    private recycleParticle(particle: MoneyParticle): void {
        particle.active = false;
        particle.node.active = false;
        particle.node.setPosition(0, 0);
        particle.node.opacity = 255;
        particle.peakY = 0;
    }

    /**
     * 开始播放动画
     */
    public play(): void {
        cc.log('[MoneyFountain] ========================================');
        cc.log('[MoneyFountain] play() called');
        cc.log(`[MoneyFountain] isPlaying before: ${this.isPlaying}`);
        cc.log(`[MoneyFountain] node.active: ${this.node.active}`);
        cc.log(`[MoneyFountain] poolSize: ${this.particlePool.length}`);
        cc.log(`[MoneyFountain] duration: ${this.duration}`);
        cc.log(`[MoneyFountain] emitRate: ${this.emitRate}`);

        if (this.isPlaying) {
            cc.log('[MoneyFountain] Already playing, stopping first');
            this.stop();
        }

        this.isPlaying = true;
        this.emitTimer = 0;
        this.totalTimer = 0;

        cc.log('[MoneyFountain] Animation started, isPlaying = true');
        cc.log('[MoneyFountain] ========================================');
    }

    /**
     * 停止动画
     */
    public stop(): void {
        this.isPlaying = false;
        this.emitTimer = 0;
        this.totalTimer = 0;

        // 回收所有粒子
        for (const particle of this.particlePool) {
            if (particle.active) {
                this.recycleParticle(particle);
            }
        }

        cc.log('[MoneyFountain] Animation stopped');
    }

    /**
     * 每帧更新
     */
    update(dt: number): void {
        // 检查是否有活跃的粒子或正在播放
        const hasActiveParticles = this.particlePool.some(p => p.active);

        if (!this.isPlaying && !hasActiveParticles) {
            return;
        }

        // 更新总时间
        if (this.isPlaying) {
            this.totalTimer += dt;

            // 检查是否超过持续时间（duration为0表示无限循环）
            if (this.duration > 0 && this.totalTimer >= this.duration) {
                // 停止发射新粒子，但继续更新已有粒子
                cc.log('[MoneyFountain] Duration ended, stopping emission');
                this.isPlaying = false;
            }
        }

        // 发射新粒子
        if (this.isPlaying) {
            this.emitTimer += dt;
            const emitInterval = 1.0 / this.emitRate;

            while (this.emitTimer >= emitInterval) {
                this.emitParticle();
                this.emitTimer -= emitInterval;
            }
        }

        // 更新所有活跃的粒子
        let activeCount = 0;
        for (const particle of this.particlePool) {
            if (particle.active) {
                this.updateParticle(particle, dt);
                activeCount++;
            }
        }

        // 检查是否所有粒子都已结束
        if (!this.isPlaying && activeCount === 0) {
            cc.log('[MoneyFountain] All particles finished');
        }
    }

    /**
     * 获取随机数
     */
    private randomRange(min: number, max: number): number {
        return min + Math.random() * (max - min);
    }

    /**
     * 设置金钱图片（运行时动态设置）
     */
    public setMoneySpriteFrame(spriteFrame: cc.SpriteFrame): void {
        this.moneySpriteFrame = spriteFrame;

        // 更新已有粒子的图片
        for (const particle of this.particlePool) {
            const sprite = particle.node.getComponent(cc.Sprite);
            if (sprite) {
                sprite.spriteFrame = spriteFrame;
            }
        }
    }

    /**
     * 销毁时清理
     */
    onDestroy(): void {
        this.stop();
    }
}
