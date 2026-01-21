/**
 * Responsive Scaler Component
 * 响应式缩放组件
 * 可挂载到任何节点，根据屏幕方向自动调整缩放
 */

import OrientationAdaptationManager from '../OrientationAdaptationManager';
import {
    DeviceOrientation,
    ScreenSize,
    AdaptationEvent,
    ResponsiveScaleConfig,
    EasingType
} from '../types/AdaptationTypes';

const { ccclass, property } = cc._decorator;

@ccclass
export default class ResponsiveScaler extends cc.Component {

    @property({
        type: cc.Vec2,
        displayName: '横屏缩放',
        tooltip: '横屏模式下的缩放值'
    })
    landscapeScale: cc.Vec2 = cc.v2(1, 1);

    @property({
        type: cc.Vec2,
        displayName: '竖屏缩放',
        tooltip: '竖屏模式下的缩放值'
    })
    portraitScale: cc.Vec2 = cc.v2(1.5, 1.5);

    @property({
        type: cc.Vec2,
        displayName: '平板缩放',
        tooltip: '平板设备的缩放值'
    })
    tabletScale: cc.Vec2 = cc.v2(1.2, 1.2);

    @property({
        displayName: '使用动画',
        tooltip: '是否使用动画过渡'
    })
    useAnimation: boolean = true;

    @property({
        displayName: '动画时长',
        tooltip: '缩放动画的持续时间（秒）',
        visible() { return this.useAnimation; },
        min: 0.1,
        max: 2.0
    })
    animationDuration: number = 0.3;

    @property({
        type: cc.Enum(EasingType),
        displayName: '缓动类型',
        tooltip: '动画缓动函数',
        visible() { return this.useAnimation; }
    })
    easingType: EasingType = EasingType.QuadOut;

    @property({
        displayName: '独立X/Y缩放',
        tooltip: '是否允许X和Y轴独立缩放'
    })
    independentScale: boolean = false;

    @property({
        displayName: '考虑屏幕尺寸',
        tooltip: '是否根据设备类型（手机/平板）调整缩放'
    })
    considerScreenSize: boolean = true;

    @property({
        displayName: '最小缩放',
        tooltip: '最小缩放限制',
        min: 0.1,
        max: 1.0
    })
    minScale: number = 0.5;

    @property({
        displayName: '最大缩放',
        tooltip: '最大缩放限制',
        min: 1.0,
        max: 5.0
    })
    maxScale: number = 3.0;

    @property({
        displayName: '延迟时间',
        tooltip: '延迟多少秒后开始缩放（用于错开动画）',
        min: 0,
        max: 2.0
    })
    delayTime: number = 0;

    @property({
        displayName: '调试模式',
        tooltip: '显示调试信息'
    })
    debugMode: boolean = false;

    // 私有变量
    private adaptationManager: OrientationAdaptationManager = null;
    private currentOrientation: DeviceOrientation = 'unknown' as DeviceOrientation;
    private currentScreenSize: ScreenSize = 'phone' as ScreenSize;
    private originalScale: cc.Vec2 = null;
    private isAnimating: boolean = false;
    private currentTween: cc.Tween = null;

    // ==================== 生命周期 ====================

    onLoad() {
        // 保存原始缩放
        this.originalScale = cc.v2(this.node.scaleX, this.node.scaleY);

        // 获取适配管理器
        this.adaptationManager = OrientationAdaptationManager.getInstance();

        // 注册事件监听
        this.registerEventListeners();

        // 初始更新
        this.scheduleOnce(() => {
            this.updateScale(false);
        }, this.delayTime);

        if (this.debugMode) {
            console.log(`[ResponsiveScaler] Initialized on node: ${this.node.name}`);
        }
    }

    onEnable() {
        // 重新注册事件（防止节点被禁用后重新启用时丢失监听）
        this.registerEventListeners();
        this.updateScale(false);
    }

    onDisable() {
        // 取消事件监听
        this.unregisterEventListeners();

        // 停止当前动画
        if (this.currentTween) {
            this.currentTween.stop();
            this.currentTween = null;
        }
    }

    onDestroy() {
        this.unregisterEventListeners();

        if (this.currentTween) {
            this.currentTween.stop();
            this.currentTween = null;
        }
    }

    // ==================== 公共方法 ====================

    /**
     * 手动更新缩放
     * @param animate 是否使用动画
     */
    public updateScale(animate: boolean = true): void {
        if (!this.adaptationManager) {
            return;
        }

        // 获取当前方向和屏幕信息
        this.currentOrientation = this.adaptationManager.getCurrentOrientation();
        const screenInfo = this.adaptationManager.getScreenInfo();
        if (screenInfo) {
            this.currentScreenSize = screenInfo.category;
        }

        // 计算目标缩放
        const targetScale = this.calculateTargetScale();

        // 应用缩放
        if (animate && this.useAnimation && !this.isAnimating) {
            this.animateToScale(targetScale);
        } else {
            this.setScale(targetScale);
        }
    }

    /**
     * 重置为原始缩放
     * @param animate 是否使用动画
     */
    public resetScale(animate: boolean = true): void {
        if (!this.originalScale) {
            return;
        }

        if (animate && this.useAnimation) {
            this.animateToScale(this.originalScale);
        } else {
            this.setScale(this.originalScale);
        }
    }

    /**
     * 设置横屏缩放
     * @param scale 缩放值
     */
    public setLandscapeScale(scale: cc.Vec2): void {
        this.landscapeScale = scale;
        if (this.currentOrientation === 'landscape') {
            this.updateScale();
        }
    }

    /**
     * 设置竖屏缩放
     * @param scale 缩放值
     */
    public setPortraitScale(scale: cc.Vec2): void {
        this.portraitScale = scale;
        if (this.currentOrientation === 'portrait') {
            this.updateScale();
        }
    }

    // ==================== 私有方法 ====================

    /**
     * 注册事件监听
     */
    private registerEventListeners(): void {
        if (this.adaptationManager) {
            this.adaptationManager.addEventListener(
                'orientation-changed' as AdaptationEvent,
                this.onOrientationChanged.bind(this)
            );

            this.adaptationManager.addEventListener(
                'screen-size-changed' as AdaptationEvent,
                this.onScreenSizeChanged.bind(this)
            );
        }

        // 监听Canvas大小变化
        cc.view.on('canvas-resize', this.onCanvasResize, this);
    }

    /**
     * 取消事件监听
     */
    private unregisterEventListeners(): void {
        if (this.adaptationManager) {
            this.adaptationManager.removeEventListener(
                'orientation-changed' as AdaptationEvent,
                this.onOrientationChanged.bind(this)
            );

            this.adaptationManager.removeEventListener(
                'screen-size-changed' as AdaptationEvent,
                this.onScreenSizeChanged.bind(this)
            );
        }

        cc.view.off('canvas-resize', this.onCanvasResize, this);
    }

    /**
     * 方向改变事件处理
     */
    private onOrientationChanged(data: any): void {
        if (this.debugMode) {
            console.log(`[ResponsiveScaler] Orientation changed on ${this.node.name}:`, data);
        }

        // 延迟更新，给其他组件时间处理
        this.scheduleOnce(() => {
            this.updateScale();
        }, this.delayTime);
    }

    /**
     * 屏幕尺寸改变事件处理
     */
    private onScreenSizeChanged(data: any): void {
        if (this.considerScreenSize) {
            this.updateScale();
        }
    }

    /**
     * Canvas尺寸改变事件处理
     */
    private onCanvasResize(): void {
        this.updateScale();
    }

    /**
     * 计算目标缩放值
     */
    private calculateTargetScale(): cc.Vec2 {
        let targetScale: cc.Vec2;

        // 根据方向选择基础缩放
        if (this.currentOrientation === 'portrait') {
            targetScale = this.portraitScale.clone();
        } else {
            targetScale = this.landscapeScale.clone();
        }

        // 根据屏幕尺寸调整
        if (this.considerScreenSize && this.currentScreenSize === 'tablet') {
            // 平板设备使用特殊缩放
            const tabletFactor = cc.v2(
                this.tabletScale.x / this.landscapeScale.x,
                this.tabletScale.y / this.landscapeScale.y
            );
            targetScale.x *= tabletFactor.x;
            targetScale.y *= tabletFactor.y;
        }

        // 应用缩放限制
        targetScale.x = Math.max(this.minScale, Math.min(this.maxScale, targetScale.x));
        targetScale.y = Math.max(this.minScale, Math.min(this.maxScale, targetScale.y));

        // 如果不允许独立缩放，使用统一值
        if (!this.independentScale) {
            const uniformScale = Math.max(targetScale.x, targetScale.y);
            targetScale.x = uniformScale;
            targetScale.y = uniformScale;
        }

        // 考虑原始缩放
        if (this.originalScale) {
            targetScale.x *= this.originalScale.x;
            targetScale.y *= this.originalScale.y;
        }

        return targetScale;
    }

    /**
     * 动画缩放到目标值
     */
    private animateToScale(targetScale: cc.Vec2): void {
        if (this.isAnimating) {
            return;
        }

        this.isAnimating = true;

        // 停止之前的动画
        if (this.currentTween) {
            this.currentTween.stop();
        }

        // 获取缓动函数
        const easing = this.getEasingFunction();

        // 创建缩放动画
        this.currentTween = cc.tween(this.node)
            .to(this.animationDuration, {
                scaleX: targetScale.x,
                scaleY: targetScale.y
            }, { easing })
            .call(() => {
                this.isAnimating = false;
                this.currentTween = null;

                if (this.debugMode) {
                    console.log(`[ResponsiveScaler] Animation completed on ${this.node.name}`);
                }
            })
            .start();
    }

    /**
     * 直接设置缩放
     */
    private setScale(scale: cc.Vec2): void {
        this.node.scaleX = scale.x;
        this.node.scaleY = scale.y;

        if (this.debugMode) {
            console.log(`[ResponsiveScaler] Scale set on ${this.node.name}:`, scale);
        }
    }

    /**
     * 获取缓动函数名称
     */
    private getEasingFunction(): string {
        switch (this.easingType) {
            case EasingType.Linear:
                return 'linear';
            case EasingType.QuadIn:
                return 'quadIn';
            case EasingType.QuadOut:
                return 'quadOut';
            case EasingType.QuadInOut:
                return 'quadInOut';
            case EasingType.CubicIn:
                return 'cubicIn';
            case EasingType.CubicOut:
                return 'cubicOut';
            case EasingType.CubicInOut:
                return 'cubicInOut';
            case EasingType.BackOut:
                return 'backOut';
            case EasingType.ElasticOut:
                return 'elasticOut';
            default:
                return 'quadOut';
        }
    }
}