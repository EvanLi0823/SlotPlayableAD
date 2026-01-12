/**
 * FrameAnimationPlayer - 帧动画播放器
 * 用于播放序列帧动画，替代粒子特效
 *
 * 特点：
 * 1. 支持循环/单次播放
 * 2. 支持播放速度控制
 * 3. 支持播放完成回调
 * 4. 对象池优化，避免频繁创建销毁
 * 5. 支持多层叠加效果
 */

const { ccclass, property } = cc._decorator;

/**
 * 帧动画配置
 */
export interface FrameAnimConfig {
    /** 动画名称 */
    name: string;

    /** 精灵帧数组 */
    frames: cc.SpriteFrame[];

    /** 帧率（帧/秒） */
    frameRate: number;

    /** 循环次数（-1为无限循环，0为单次） */
    loopCount: number;

    /** 是否播放完成后自动隐藏 */
    autoHide: boolean;

    /** 混合模式 */
    blendMode?: cc.Sprite.BlendFactor;
}

/**
 * 帧动画播放状态
 */
enum AnimState {
    IDLE,       // 空闲
    PLAYING,    // 播放中
    PAUSED,     // 暂停
    STOPPED     // 停止
}

@ccclass
export default class FrameAnimationPlayer extends cc.Component {

    @property(cc.Sprite)
    sprite: cc.Sprite = null;

    @property({
        tooltip: "是否自动播放"
    })
    autoPlay: boolean = false;

    @property({
        tooltip: "默认帧率"
    })
    defaultFrameRate: number = 24;

    // ========== 私有属性 ==========

    /** 当前配置 */
    private currentConfig: FrameAnimConfig | null = null;

    /** 当前帧索引 */
    private currentFrameIndex: number = 0;

    /** 当前循环次数 */
    private currentLoopCount: number = 0;

    /** 播放状态 */
    private state: AnimState = AnimState.IDLE;

    /** 帧间隔时间 */
    private frameInterval: number = 0;

    /** 累积时间 */
    private accumulatedTime: number = 0;

    /** 播放完成回调 */
    private onCompleteCallback: (() => void) | null = null;

    /** 每帧回调 */
    private onFrameCallback: ((frameIndex: number) => void) | null = null;

    /** 播放速度倍率 */
    private speedScale: number = 1.0;

    // ========== 生命周期 ==========

    onLoad() {
        if (!this.sprite) {
            this.sprite = this.getComponent(cc.Sprite);
        }

        if (!this.sprite) {
            cc.error("[FrameAnimationPlayer] No Sprite component found!");
        }
    }

    update(dt: number) {
        if (this.state !== AnimState.PLAYING || !this.currentConfig) {
            return;
        }

        // 累加时间
        this.accumulatedTime += dt * this.speedScale;

        // 检查是否需要切换帧
        if (this.accumulatedTime >= this.frameInterval) {
            this.accumulatedTime -= this.frameInterval;
            this.nextFrame();
        }
    }

    // ========== 公开方法 ==========

    /**
     * 播放动画
     * @param config 动画配置
     * @param onComplete 播放完成回调
     */
    play(config: FrameAnimConfig, onComplete?: () => void): void {
        if (!config || !config.frames || config.frames.length === 0) {
            cc.warn("[FrameAnimationPlayer] Invalid animation config");
            return;
        }

        // 停止当前动画
        this.stop();

        // 设置新配置
        this.currentConfig = config;
        this.currentFrameIndex = 0;
        this.currentLoopCount = 0;
        this.accumulatedTime = 0;
        this.onCompleteCallback = onComplete || null;

        // 计算帧间隔
        this.frameInterval = 1.0 / config.frameRate;

        // 显示节点
        this.node.active = true;

        // 设置第一帧
        this.setFrame(0);

        // 设置混合模式（如果指定）
        if (config.blendMode !== undefined) {
            this.sprite.srcBlendFactor = config.blendMode;
        }

        // 开始播放
        this.state = AnimState.PLAYING;

        cc.log(`[FrameAnimationPlayer] Playing animation: ${config.name}, frames: ${config.frames.length}, fps: ${config.frameRate}`);
    }

    /**
     * 停止播放
     */
    stop(): void {
        if (this.state === AnimState.IDLE) return;

        this.state = AnimState.STOPPED;
        this.currentFrameIndex = 0;
        this.accumulatedTime = 0;

        if (this.currentConfig?.autoHide) {
            this.node.active = false;
        }
    }

    /**
     * 暂停播放
     */
    pause(): void {
        if (this.state === AnimState.PLAYING) {
            this.state = AnimState.PAUSED;
        }
    }

    /**
     * 恢复播放
     */
    resume(): void {
        if (this.state === AnimState.PAUSED) {
            this.state = AnimState.PLAYING;
        }
    }

    /**
     * 设置播放速度
     * @param scale 速度倍率（1.0为正常速度，2.0为2倍速）
     */
    setSpeed(scale: number): void {
        this.speedScale = Math.max(0.1, scale);
    }

    /**
     * 设置每帧回调
     */
    setOnFrameCallback(callback: (frameIndex: number) => void): void {
        this.onFrameCallback = callback;
    }

    /**
     * 是否正在播放
     */
    isPlaying(): boolean {
        return this.state === AnimState.PLAYING;
    }

    /**
     * 获取当前帧索引
     */
    getCurrentFrame(): number {
        return this.currentFrameIndex;
    }

    /**
     * 获取总帧数
     */
    getTotalFrames(): number {
        return this.currentConfig?.frames.length || 0;
    }

    // ========== 私有方法 ==========

    /**
     * 切换到下一帧
     */
    private nextFrame(): void {
        if (!this.currentConfig) return;

        this.currentFrameIndex++;

        // 检查是否到达末尾
        if (this.currentFrameIndex >= this.currentConfig.frames.length) {
            this.currentLoopCount++;

            // 检查循环次数
            if (this.currentConfig.loopCount === -1) {
                // 无限循环
                this.currentFrameIndex = 0;
            } else if (this.currentLoopCount >= this.currentConfig.loopCount + 1) {
                // 播放完成
                this.onAnimationComplete();
                return;
            } else {
                // 继续下一轮循环
                this.currentFrameIndex = 0;
            }
        }

        // 设置当前帧
        this.setFrame(this.currentFrameIndex);

        // 触发帧回调
        if (this.onFrameCallback) {
            this.onFrameCallback(this.currentFrameIndex);
        }
    }

    /**
     * 设置指定帧
     */
    private setFrame(index: number): void {
        if (!this.currentConfig || !this.sprite) return;

        const frame = this.currentConfig.frames[index];
        if (frame) {
            this.sprite.spriteFrame = frame;
        }
    }

    /**
     * 动画播放完成
     */
    private onAnimationComplete(): void {
        cc.log(`[FrameAnimationPlayer] Animation complete: ${this.currentConfig?.name}`);

        this.state = AnimState.IDLE;

        // 自动隐藏
        if (this.currentConfig?.autoHide) {
            this.node.active = false;
        }

        // 触发完成回调
        if (this.onCompleteCallback) {
            this.onCompleteCallback();
            this.onCompleteCallback = null;
        }
    }
}

// ========== 帧动画管理器 ==========

/**
 * 帧动画管理器
 * 管理多个帧动画播放器，支持对象池
 */
export class FrameAnimationManager {

    /** 动画配置缓存 */
    private animConfigs: Map<string, FrameAnimConfig> = new Map();

    /** 播放器对象池 */
    private playerPool: FrameAnimationPlayer[] = [];

    /** 正在使用的播放器 */
    private activePlayers: Set<FrameAnimationPlayer> = new Set();

    /** 预创建的播放器数量 */
    private readonly POOL_SIZE = 5;

    /** 播放器预制体 */
    private playerPrefab: cc.Prefab | null = null;

    /** 父节点 */
    private parentNode: cc.Node | null = null;

    /**
     * 初始化
     */
    init(parentNode: cc.Node, playerPrefab?: cc.Prefab): void {
        this.parentNode = parentNode;
        this.playerPrefab = playerPrefab || null;

        // 预创建播放器
        if (this.playerPrefab) {
            for (let i = 0; i < this.POOL_SIZE; i++) {
                this.createPlayer();
            }
        }
    }

    /**
     * 注册动画配置
     */
    registerAnimation(config: FrameAnimConfig): void {
        this.animConfigs.set(config.name, config);
        cc.log(`[FrameAnimationManager] Registered animation: ${config.name}`);
    }

    /**
     * 批量注册动画
     */
    registerAnimations(configs: FrameAnimConfig[]): void {
        for (const config of configs) {
            this.registerAnimation(config);
        }
    }

    /**
     * 播放动画
     * @param animName 动画名称
     * @param position 播放位置
     * @param onComplete 完成回调
     */
    play(
        animName: string,
        position: cc.Vec2 | cc.Vec3,
        onComplete?: () => void
    ): FrameAnimationPlayer | null {

        const config = this.animConfigs.get(animName);
        if (!config) {
            cc.warn(`[FrameAnimationManager] Animation not found: ${animName}`);
            return null;
        }

        // 从对象池获取播放器
        const player = this.getPlayer();
        if (!player) {
            cc.error("[FrameAnimationManager] Failed to get player from pool");
            return null;
        }

        // 设置位置
        player.node.setPosition(position);

        // 播放动画
        player.play(config, () => {
            // 回调
            if (onComplete) {
                onComplete();
            }
            // 回收播放器
            this.recyclePlayer(player);
        });

        return player;
    }

    /**
     * 停止所有动画
     */
    stopAll(): void {
        for (const player of this.activePlayers) {
            player.stop();
        }
        this.activePlayers.clear();
        this.playerPool.push(...Array.from(this.activePlayers));
    }

    /**
     * 从对象池获取播放器
     */
    private getPlayer(): FrameAnimationPlayer | null {
        let player: FrameAnimationPlayer | null = null;

        // 从对象池获取
        if (this.playerPool.length > 0) {
            player = this.playerPool.pop()!;
        } else {
            // 对象池为空，创建新的
            player = this.createPlayer();
        }

        if (player) {
            this.activePlayers.add(player);
        }

        return player;
    }

    /**
     * 回收播放器
     */
    private recyclePlayer(player: FrameAnimationPlayer): void {
        this.activePlayers.delete(player);
        this.playerPool.push(player);
        player.node.active = false;
    }

    /**
     * 创建播放器
     */
    private createPlayer(): FrameAnimationPlayer | null {
        if (!this.parentNode) {
            cc.error("[FrameAnimationManager] Parent node not set");
            return null;
        }

        let playerNode: cc.Node;

        if (this.playerPrefab) {
            playerNode = cc.instantiate(this.playerPrefab);
        } else {
            // 动态创建
            playerNode = new cc.Node("FrameAnimPlayer");
            const sprite = playerNode.addComponent(cc.Sprite);
            const player = playerNode.addComponent(FrameAnimationPlayer);
            player.sprite = sprite;
        }

        playerNode.setPosition(0, 0);
        playerNode.active = false;
        this.parentNode.addChild(playerNode);

        const player = playerNode.getComponent(FrameAnimationPlayer);
        if (player) {
            this.playerPool.push(player);
        }

        return player;
    }

    /**
     * 清理
     */
    destroy(): void {
        this.stopAll();

        for (const player of this.playerPool) {
            if (player && player.node) {
                player.node.destroy();
            }
        }

        this.playerPool = [];
        this.activePlayers.clear();
        this.animConfigs.clear();
    }
}
