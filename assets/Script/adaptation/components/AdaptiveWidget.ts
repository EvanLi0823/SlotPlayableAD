/**
 * Adaptive Widget Component
 * 自适应Widget组件
 * 扩展原生Widget功能，支持横竖屏不同配置
 */

import OrientationAdaptationManager from '../OrientationAdaptationManager';
import {
    DeviceOrientation,
    WidgetAlignment,
    AdaptationEvent
} from '../types/AdaptationTypes';

const { ccclass, property, executeInEditMode, menu } = cc._decorator;

/**
 * Widget配置预设
 */
@ccclass('WidgetPreset')
class WidgetPreset {
    @property({ displayName: '启用左对齐' })
    isAlignLeft: boolean = false;

    @property({
        displayName: '左边距',
        visible() { return this.isAlignLeft; }
    })
    left: number = 0;

    @property({ displayName: '启用右对齐' })
    isAlignRight: boolean = false;

    @property({
        displayName: '右边距',
        visible() { return this.isAlignRight; }
    })
    right: number = 0;

    @property({ displayName: '启用顶对齐' })
    isAlignTop: boolean = false;

    @property({
        displayName: '顶边距',
        visible() { return this.isAlignTop; }
    })
    top: number = 0;

    @property({ displayName: '启用底对齐' })
    isAlignBottom: boolean = false;

    @property({
        displayName: '底边距',
        visible() { return this.isAlignBottom; }
    })
    bottom: number = 0;

    @property({ displayName: '启用水平居中' })
    isAlignHorizontalCenter: boolean = false;

    @property({
        displayName: '水平偏移',
        visible() { return this.isAlignHorizontalCenter; }
    })
    horizontalCenter: number = 0;

    @property({ displayName: '启用垂直居中' })
    isAlignVerticalCenter: boolean = false;

    @property({
        displayName: '垂直偏移',
        visible() { return this.isAlignVerticalCenter; }
    })
    verticalCenter: number = 0;
}

@ccclass
@executeInEditMode
@menu('适配组件/AdaptiveWidget')
export default class AdaptiveWidget extends cc.Component {

    @property({
        type: WidgetPreset,
        displayName: '横屏配置',
        tooltip: '横屏模式下的Widget对齐配置'
    })
    landscapePreset: WidgetPreset = new WidgetPreset();

    @property({
        type: WidgetPreset,
        displayName: '竖屏配置',
        tooltip: '竖屏模式下的Widget对齐配置'
    })
    portraitPreset: WidgetPreset = new WidgetPreset();

    @property({
        displayName: '使用动画',
        tooltip: '切换时是否使用动画过渡'
    })
    useAnimation: boolean = true;

    @property({
        displayName: '动画时长',
        tooltip: '过渡动画持续时间（秒）',
        visible() { return this.useAnimation; },
        min: 0.1,
        max: 2.0
    })
    animationDuration: number = 0.3;

    @property({
        displayName: '考虑安全区域',
        tooltip: '是否自动适配安全区域（刘海屏等）'
    })
    considerSafeArea: boolean = true;

    @property({
        displayName: '安全区域额外边距',
        tooltip: '在安全区域基础上的额外边距',
        visible() { return this.considerSafeArea; }
    })
    safeAreaPadding: number = 20;

    @property({
        displayName: '调试模式',
        tooltip: '显示调试信息'
    })
    debugMode: boolean = false;

    @property({
        displayName: '编辑器预览',
        tooltip: '在编辑器中预览当前方向的效果'
    })
    editorPreview: boolean = false;

    @property({
        type: cc.Enum(DeviceOrientation),
        displayName: '预览方向',
        tooltip: '编辑器中预览的方向',
        visible() { return this.editorPreview; }
    })
    previewOrientation: DeviceOrientation = 'landscape' as DeviceOrientation;

    // 私有变量
    private widget: cc.Widget = null;
    private adaptationManager: OrientationAdaptationManager = null;
    private currentOrientation: DeviceOrientation = 'unknown' as DeviceOrientation;
    private originalAlignment: WidgetAlignment = null;
    private isAnimating: boolean = false;
    private currentTween: cc.Tween = null;

    // ==================== 生命周期 ====================

    onLoad() {
        // 获取或添加Widget组件
        this.widget = this.node.getComponent(cc.Widget);
        if (!this.widget) {
            this.widget = this.node.addComponent(cc.Widget);
        }

        // 保存原始配置
        this.saveOriginalAlignment();

        // 编辑器模式处理
        if (CC_EDITOR) {
            if (this.editorPreview) {
                this.applyPreset(
                    this.previewOrientation === 'portrait'
                        ? this.portraitPreset
                        : this.landscapePreset
                );
            }
            return;
        }

        // 获取适配管理器
        this.adaptationManager = OrientationAdaptationManager.getInstance();

        // 注册事件监听
        this.registerEventListeners();

        // 初始更新
        this.updateAlignment(false);

        if (this.debugMode) {
            console.log(`[AdaptiveWidget] Initialized on node: ${this.node.name}`);
        }
    }

    onEnable() {
        if (!CC_EDITOR) {
            this.registerEventListeners();
            this.updateAlignment(false);
        }
    }

    onDisable() {
        if (!CC_EDITOR) {
            this.unregisterEventListeners();
        }

        if (this.currentTween) {
            this.currentTween.stop();
            this.currentTween = null;
        }
    }

    onDestroy() {
        if (!CC_EDITOR) {
            this.unregisterEventListeners();
        }

        if (this.currentTween) {
            this.currentTween.stop();
            this.currentTween = null;
        }
    }

    // ==================== 编辑器方法 ====================

    onFocusInEditor() {
        if (this.editorPreview) {
            this.applyPreset(
                this.previewOrientation === 'portrait'
                    ? this.portraitPreset
                    : this.landscapePreset
            );
        }
    }

    onLostFocusInEditor() {
        if (this.originalAlignment && this.widget) {
            this.applyAlignment(this.originalAlignment);
        }
    }

    // ==================== 公共方法 ====================

    /**
     * 手动更新对齐
     * @param animate 是否使用动画
     */
    public updateAlignment(animate: boolean = true): void {
        if (!this.adaptationManager || !this.widget) {
            return;
        }

        // 获取当前方向
        this.currentOrientation = this.adaptationManager.getCurrentOrientation();

        // 选择对应的预设
        const preset = this.currentOrientation === 'portrait'
            ? this.portraitPreset
            : this.landscapePreset;

        // 考虑安全区域
        const finalPreset = this.considerSafeArea
            ? this.applySafeArea(preset)
            : preset;

        // 应用配置
        if (animate && this.useAnimation && !this.isAnimating) {
            this.animateToAlignment(finalPreset);
        } else {
            this.applyPreset(finalPreset);
        }
    }

    /**
     * 重置为原始对齐
     */
    public resetAlignment(): void {
        if (this.originalAlignment && this.widget) {
            this.applyAlignment(this.originalAlignment);
        }
    }

    /**
     * 设置横屏预设
     * @param preset Widget预设
     */
    public setLandscapePreset(preset: WidgetPreset): void {
        this.landscapePreset = preset;
        if (this.currentOrientation === 'landscape') {
            this.updateAlignment();
        }
    }

    /**
     * 设置竖屏预设
     * @param preset Widget预设
     */
    public setPortraitPreset(preset: WidgetPreset): void {
        this.portraitPreset = preset;
        if (this.currentOrientation === 'portrait') {
            this.updateAlignment();
        }
    }

    // ==================== 私有方法 ====================

    /**
     * 保存原始对齐配置
     */
    private saveOriginalAlignment(): void {
        if (!this.widget) return;

        this.originalAlignment = {
            left: this.widget.left,
            right: this.widget.right,
            top: this.widget.top,
            bottom: this.widget.bottom,
            horizontalCenter: this.widget.horizontalCenter,
            verticalCenter: this.widget.verticalCenter,
            isAlignLeft: this.widget.isAlignLeft,
            isAlignRight: this.widget.isAlignRight,
            isAlignTop: this.widget.isAlignTop,
            isAlignBottom: this.widget.isAlignBottom,
            isAlignHorizontalCenter: this.widget.isAlignHorizontalCenter,
            isAlignVerticalCenter: this.widget.isAlignVerticalCenter
        };
    }

    /**
     * 注册事件监听
     */
    private registerEventListeners(): void {
        if (this.adaptationManager) {
            this.adaptationManager.addEventListener(
                'orientation-changed' as AdaptationEvent,
                this.onOrientationChanged.bind(this)
            );

            if (this.considerSafeArea) {
                this.adaptationManager.addEventListener(
                    'safe-area-updated' as AdaptationEvent,
                    this.onSafeAreaUpdated.bind(this)
                );
            }
        }
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
                'safe-area-updated' as AdaptationEvent,
                this.onSafeAreaUpdated.bind(this)
            );
        }
    }

    /**
     * 方向改变事件处理
     */
    private onOrientationChanged(data: any): void {
        if (this.debugMode) {
            console.log(`[AdaptiveWidget] Orientation changed on ${this.node.name}:`, data);
        }

        this.updateAlignment();
    }

    /**
     * 安全区域更新事件处理
     */
    private onSafeAreaUpdated(data: any): void {
        if (this.debugMode) {
            console.log(`[AdaptiveWidget] Safe area updated on ${this.node.name}:`, data);
        }

        this.updateAlignment();
    }

    /**
     * 应用安全区域
     * @param preset 原始预设
     * @returns 考虑安全区域后的预设
     */
    private applySafeArea(preset: WidgetPreset): WidgetPreset {
        if (!this.adaptationManager) {
            return preset;
        }

        const safeArea = this.adaptationManager.getSafeAreaInfo();
        if (!safeArea) {
            return preset;
        }

        // 复制预设
        const adjustedPreset = new WidgetPreset();
        Object.assign(adjustedPreset, preset);

        // 应用安全区域偏移
        if (preset.isAlignLeft) {
            adjustedPreset.left = preset.left + safeArea.leftInset + this.safeAreaPadding;
        }

        if (preset.isAlignRight) {
            adjustedPreset.right = preset.right + safeArea.rightInset + this.safeAreaPadding;
        }

        if (preset.isAlignTop) {
            adjustedPreset.top = preset.top + safeArea.topInset + this.safeAreaPadding;
        }

        if (preset.isAlignBottom) {
            adjustedPreset.bottom = preset.bottom + safeArea.bottomInset + this.safeAreaPadding;
        }

        return adjustedPreset;
    }

    /**
     * 应用预设配置
     * @param preset Widget预设
     */
    private applyPreset(preset: WidgetPreset): void {
        if (!this.widget) return;

        this.widget.isAlignLeft = preset.isAlignLeft;
        this.widget.left = preset.left;

        this.widget.isAlignRight = preset.isAlignRight;
        this.widget.right = preset.right;

        this.widget.isAlignTop = preset.isAlignTop;
        this.widget.top = preset.top;

        this.widget.isAlignBottom = preset.isAlignBottom;
        this.widget.bottom = preset.bottom;

        this.widget.isAlignHorizontalCenter = preset.isAlignHorizontalCenter;
        this.widget.horizontalCenter = preset.horizontalCenter;

        this.widget.isAlignVerticalCenter = preset.isAlignVerticalCenter;
        this.widget.verticalCenter = preset.verticalCenter;

        this.widget.updateAlignment();

        if (this.debugMode) {
            console.log(`[AdaptiveWidget] Applied preset on ${this.node.name}`);
        }
    }

    /**
     * 应用对齐配置
     * @param alignment 对齐配置
     */
    private applyAlignment(alignment: WidgetAlignment): void {
        if (!this.widget) return;

        Object.keys(alignment).forEach(key => {
            this.widget[key] = alignment[key];
        });

        this.widget.updateAlignment();
    }

    /**
     * 动画过渡到新的对齐配置
     * @param preset 目标预设
     */
    private animateToAlignment(preset: WidgetPreset): void {
        if (this.isAnimating || !this.node) {
            return;
        }

        this.isAnimating = true;

        // 停止之前的动画
        if (this.currentTween) {
            this.currentTween.stop();
        }

        // 计算目标位置
        const targetPos = this.calculateTargetPosition(preset);

        // 创建位置动画
        this.currentTween = cc.tween(this.node)
            .to(this.animationDuration, {
                position: targetPos
            }, { easing: 'quadOut' })
            .call(() => {
                // 动画结束后应用Widget配置
                this.applyPreset(preset);
                this.isAnimating = false;
                this.currentTween = null;
            })
            .start();
    }

    /**
     * 计算目标位置
     * @param preset Widget预设
     * @returns 目标位置
     */
    private calculateTargetPosition(preset: WidgetPreset): cc.Vec3 {
        const parent = this.node.parent;
        if (!parent) {
            return this.node.position;
        }

        const parentSize = parent.getContentSize();
        let x = this.node.x;
        let y = this.node.y;

        // 计算X位置
        if (preset.isAlignLeft && preset.isAlignRight) {
            x = 0;
        } else if (preset.isAlignLeft) {
            x = -parentSize.width / 2 + preset.left + this.node.width * this.node.anchorX;
        } else if (preset.isAlignRight) {
            x = parentSize.width / 2 - preset.right - this.node.width * (1 - this.node.anchorX);
        } else if (preset.isAlignHorizontalCenter) {
            x = preset.horizontalCenter;
        }

        // 计算Y位置
        if (preset.isAlignTop && preset.isAlignBottom) {
            y = 0;
        } else if (preset.isAlignTop) {
            y = parentSize.height / 2 - preset.top - this.node.height * (1 - this.node.anchorY);
        } else if (preset.isAlignBottom) {
            y = -parentSize.height / 2 + preset.bottom + this.node.height * this.node.anchorY;
        } else if (preset.isAlignVerticalCenter) {
            y = preset.verticalCenter;
        }

        return cc.v3(x, y, this.node.z);
    }
}