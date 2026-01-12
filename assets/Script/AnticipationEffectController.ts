/**
 * AnticipationEffectController - Anticipation特效控制器
 * 使用帧动画替代粒子特效
 */

import FrameAnimationPlayer, { FrameAnimConfig, FrameAnimationManager } from "./FrameAnimationPlayer";
import SlotConfig from "./SlotConfig";

const { ccclass, property } = cc._decorator;

/**
 * Anticipation特效类型
 */
export enum AnticipationType {
    /** 雷电特效 */
    LIGHTNING = "lightning",

    /** 光芒特效 */
    GLOW = "glow",

    /** 火焰特效 */
    FIRE = "fire",

    /** 星光特效 */
    STAR = "star",

    /** 能量波特效 */
    ENERGY_WAVE = "energy_wave"
}

/**
 * Anticipation特效配置
 */
interface AnticipationEffectConfig {
    /** 特效类型 */
    type: AnticipationType;

    /** 持续时间（秒） */
    duration: number;

    /** 是否循环播放 */
    loop: boolean;

    /** 帧动画配置 */
    animConfig: FrameAnimConfig;
}

@ccclass
export default class AnticipationEffectController extends cc.Component {

    @property(cc.Node)
    effectContainer: cc.Node = null;

    @property(cc.SpriteAtlas)
    effectAtlas: cc.SpriteAtlas = null;

    @property({
        type: cc.Enum(AnticipationType),
        tooltip: "默认特效类型"
    })
    defaultEffectType: AnticipationType = AnticipationType.LIGHTNING;

    // ========== 私有属性 ==========

    /** 帧动画管理器 */
    private animManager: FrameAnimationManager = new FrameAnimationManager();

    /** 特效配置缓存 */
    private effectConfigs: Map<AnticipationType, AnticipationEffectConfig> = new Map();

    /** 当前播放的特效 */
    private currentEffects: Map<number, FrameAnimationPlayer> = new Map();

    // ========== 生命周期 ==========

    onLoad() {
        if (!this.effectContainer) {
            this.effectContainer = this.node;
        }

        // 初始化动画管理器
        this.animManager.init(this.effectContainer);

        // 加载预设特效
        this.loadPresetEffects();
    }

    /**
     * 加载预设特效配置
     */
    private loadPresetEffects(): void {
        // 雷电特效
        this.registerEffect({
            type: AnticipationType.LIGHTNING,
            duration: 0.5,
            loop: true,
            animConfig: {
                name: "anticipation_lightning",
                frames: this.loadFrames("lightning", 12),
                frameRate: 24,
                loopCount: -1,  // 无限循环
                autoHide: true,
                blendMode: cc.macro.BlendFactor.ONE  // 加法混合
            }
        });

        // 光芒特效
        this.registerEffect({
            type: AnticipationType.GLOW,
            duration: 0.6,
            loop: true,
            animConfig: {
                name: "anticipation_glow",
                frames: this.loadFrames("glow", 16),
                frameRate: 20,
                loopCount: -1,
                autoHide: true,
                blendMode: cc.macro.BlendFactor.ONE
            }
        });

        // 火焰特效
        this.registerEffect({
            type: AnticipationType.FIRE,
            duration: 0.8,
            loop: true,
            animConfig: {
                name: "anticipation_fire",
                frames: this.loadFrames("fire", 20),
                frameRate: 25,
                loopCount: -1,
                autoHide: true,
                blendMode: cc.macro.BlendFactor.ONE
            }
        });

        // 星光特效
        this.registerEffect({
            type: AnticipationType.STAR,
            duration: 0.4,
            loop: true,
            animConfig: {
                name: "anticipation_star",
                frames: this.loadFrames("star", 10),
                frameRate: 25,
                loopCount: -1,
                autoHide: true,
                blendMode: cc.macro.BlendFactor.ONE
            }
        });

        // 能量波特效
        this.registerEffect({
            type: AnticipationType.ENERGY_WAVE,
            duration: 0.7,
            loop: true,
            animConfig: {
                name: "anticipation_energy_wave",
                frames: this.loadFrames("energy_wave", 14),
                frameRate: 20,
                loopCount: -1,
                autoHide: true,
                blendMode: cc.macro.BlendFactor.ONE
            }
        });
    }

    /**
     * 加载帧序列
     */
    private loadFrames(effectName: string, frameCount: number): cc.SpriteFrame[] {
        const frames: cc.SpriteFrame[] = [];

        if (!this.effectAtlas) {
            cc.warn(`[AnticipationEffect] Effect atlas not set for ${effectName}`);
            return frames;
        }

        for (let i = 0; i < frameCount; i++) {
            // 命名规则: {effectName}_frame_00, frame_01...
            const frameName = `${effectName}_frame_${i.toString().padStart(2, "0")}`;
            const frame = this.effectAtlas.getSpriteFrame(frameName);

            if (frame) {
                frames.push(frame);
            } else {
                cc.warn(`[AnticipationEffect] Frame not found: ${frameName}`);
            }
        }

        cc.log(`[AnticipationEffect] Loaded ${frames.length} frames for ${effectName}`);

        return frames;
    }

    /**
     * 注册特效配置
     */
    private registerEffect(config: AnticipationEffectConfig): void {
        this.effectConfigs.set(config.type, config);
        this.animManager.registerAnimation(config.animConfig);
    }

    // ========== 公开方法 ==========

    /**
     * 播放Anticipation特效
     * @param reelIndex Reel索引
     * @param position 特效位置
     * @param type 特效类型（可选）
     */
    playEffect(
        reelIndex: number,
        position: cc.Vec2 | cc.Vec3,
        type?: AnticipationType
    ): void {

        const effectType = type || this.defaultEffectType;
        const config = this.effectConfigs.get(effectType);

        if (!config) {
            cc.warn(`[AnticipationEffect] Effect config not found: ${effectType}`);
            return;
        }

        cc.log(`[AnticipationEffect] Playing ${effectType} effect for Reel ${reelIndex}`);

        // 停止该Reel上已有的特效
        this.stopEffect(reelIndex);

        // 播放新特效
        const player = this.animManager.play(
            config.animConfig.name,
            position,
            () => {
                cc.log(`[AnticipationEffect] Effect complete for Reel ${reelIndex}`);
                this.currentEffects.delete(reelIndex);
            }
        );

        if (player) {
            this.currentEffects.set(reelIndex, player);
        }
    }

    /**
     * 停止特效
     * @param reelIndex Reel索引
     */
    stopEffect(reelIndex: number): void {
        const player = this.currentEffects.get(reelIndex);
        if (player) {
            player.stop();
            this.currentEffects.delete(reelIndex);
        }
    }

    /**
     * 停止所有特效
     */
    stopAllEffects(): void {
        for (const [reelIndex, player] of this.currentEffects) {
            player.stop();
        }
        this.currentEffects.clear();
    }

    /**
     * 播放完整的Anticipation序列
     * 包括：高亮背景 + 帧动画特效 + 震动反馈
     *
     * @param reelIndex Reel索引
     * @param reelNode Reel节点
     * @param effectType 特效类型
     */
    async playFullAnticipationSequence(
        reelIndex: number,
        reelNode: cc.Node,
        effectType?: AnticipationType
    ): Promise<void> {

        cc.log(`[AnticipationEffect] Playing full Anticipation sequence for Reel ${reelIndex}`);

        // 1. 高亮背景
        await this.highlightReel(reelNode);

        // 2. 播放帧动画特效
        const effectPosition = reelNode.getPosition();
        this.playEffect(reelIndex, effectPosition, effectType);

        // 3. 震动反馈
        if (cc.sys.isMobile) {
            this.vibrateDevice();
        }

        // 4. 播放音效（由外部控制）
        cc.systemEvent.emit("anticipation-effect-start", reelIndex);
    }

    /**
     * 高亮Reel
     */
    private async highlightReel(reelNode: cc.Node): Promise<void> {
        return new Promise((resolve) => {
            const highlightNode = reelNode.getChildByName("Highlight");

            if (highlightNode) {
                highlightNode.active = true;
                highlightNode.opacity = 0;

                cc.tween(highlightNode)
                    .to(0.2, { opacity: 255 })
                    .call(() => resolve())
                    .start();
            } else {
                // 如果没有Highlight节点，创建一个
                this.createHighlightNode(reelNode);
                resolve();
            }
        });
    }

    /**
     * 创建高亮节点
     */
    private createHighlightNode(reelNode: cc.Node): cc.Node {
        const highlightNode = new cc.Node("Highlight");
        const sprite = highlightNode.addComponent(cc.Sprite);

        // 设置纯色
        sprite.type = cc.Sprite.Type.SIMPLE;

        // 创建纯色材质
        const texture = new cc.Texture2D();
        texture.initWithData(new Uint8Array([255, 255, 255, 255]), cc.Texture2D.PixelFormat.RGBA8888, 1, 1);
        const spriteFrame = new cc.SpriteFrame(texture);
        sprite.spriteFrame = spriteFrame;

        // 设置颜色（金黄色）
        highlightNode.color = cc.color(255, 215, 0);
        highlightNode.opacity = 0;

        // 设置尺寸
        highlightNode.width = reelNode.width;
        highlightNode.height = reelNode.height;

        // 设置层级
        highlightNode.zIndex = -1;

        reelNode.addChild(highlightNode);

        return highlightNode;
    }

    /**
     * 震动设备
     */
    private vibrateDevice(): void {
        // Cocos Creator的震动API
        if (cc.sys.isMobile && cc.sys.os === cc.sys.OS_ANDROID) {
            // Android震动
            jsb?.reflection?.callStaticMethod(
                "org/cocos2dx/lib/Cocos2dxHelper",
                "vibrate",
                "(F)V",
                0.1
            );
        } else if (cc.sys.isMobile && cc.sys.os === cc.sys.OS_IOS) {
            // iOS震动（需要原生插件支持）
            cc.log("[AnticipationEffect] Vibration triggered (iOS)");
        }

        // Web端的震动API
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate(100); // 震动100ms
        }
    }

    onDestroy() {
        this.stopAllEffects();
        this.animManager.destroy();
    }
}

// ========== 使用示例 ==========

/**
 * 在ReelController中集成Anticipation特效
 *
 * 使用方法：
 *
 * 1. 在ReelController中添加引用：
 *
 * @property(AnticipationEffectController)
 * anticipationEffect: AnticipationEffectController = null;
 *
 * 2. 在需要播放特效的地方调用：
 *
 * private async playAnticipationEffect(): Promise<void> {
 *     if (!this.isAnticipation || !this.anticipationEffect) return;
 *
 *     // 播放完整序列
 *     await this.anticipationEffect.playFullAnticipationSequence(
 *         this.reelIndex,
 *         this.node,
 *         AnticipationType.LIGHTNING
 *     );
 *
 *     // 或者只播放特效
 *     this.anticipationEffect.playEffect(
 *         this.reelIndex,
 *         cc.v2(0, 0),
 *         AnticipationType.GLOW
 *     );
 * }
 *
 * 3. 停止特效：
 *
 * private onSpinComplete(): void {
 *     // 停止Anticipation特效
 *     if (this.anticipationEffect) {
 *         this.anticipationEffect.stopEffect(this.reelIndex);
 *     }
 * }
 */
