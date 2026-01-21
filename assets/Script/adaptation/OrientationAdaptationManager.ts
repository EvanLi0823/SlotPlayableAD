/**
 * Orientation Adaptation Manager
 * 横竖屏适配管理器 - 单例模式
 * 负责管理整个适配系统的核心逻辑
 */

import {
    DeviceOrientation,
    AdaptationStrategy,
    LayoutConfig,
    AdaptationManagerConfig,
    AdaptationEvent,
    AdaptationEventData,
    ScreenSize,
    SafeAreaInfo,
    AspectRatioInfo,
    LayoutTemplate
} from './types/AdaptationTypes';

const { ccclass, property } = cc._decorator;

@ccclass
export default class OrientationAdaptationManager {
    private static instance: OrientationAdaptationManager = null;

    // 当前设备方向
    private currentOrientation: DeviceOrientation = 'unknown' as DeviceOrientation;

    // 上一次的设备方向
    private previousOrientation: DeviceOrientation = 'unknown' as DeviceOrientation;

    // 适配策略映射表
    private strategies: Map<DeviceOrientation, AdaptationStrategy> = new Map();

    // 当前使用的策略
    private currentStrategy: AdaptationStrategy = null;

    // 管理器配置
    private config: AdaptationManagerConfig = {
        defaultOrientation: 'landscape' as DeviceOrientation,
        enableAutoDetection: true,
        enableSafeArea: true,
        enableAnimation: true,
        animationDuration: 0.3,
        debugMode: false
    };

    // 根节点引用
    private rootNode: cc.Node = null;

    // 事件监听器集合
    private eventListeners: Map<AdaptationEvent, Function[]> = new Map();

    // 安全区域信息
    private safeAreaInfo: SafeAreaInfo = null;

    // 屏幕信息缓存
    private screenInfo: {
        size: cc.Size;
        category: ScreenSize;
        aspectRatio: AspectRatioInfo;
    } = null;

    // 是否已初始化
    private initialized: boolean = false;

    // 方向检测定时器
    private detectionTimer: number = null;

    /**
     * 获取单例实例
     */
    public static getInstance(): OrientationAdaptationManager {
        if (!OrientationAdaptationManager.instance) {
            OrientationAdaptationManager.instance = new OrientationAdaptationManager();
        }
        return OrientationAdaptationManager.instance;
    }

    /**
     * 私有构造函数
     */
    private constructor() {
        this.initializeEventListeners();
    }

    /**
     * 初始化管理器
     * @param rootNode Canvas根节点
     * @param config 配置选项
     */
    public initialize(rootNode: cc.Node, config?: Partial<AdaptationManagerConfig>): void {
        if (this.initialized) {
            console.warn('[AdaptationManager] Already initialized');
            return;
        }

        this.rootNode = rootNode;

        // 合并配置
        if (config) {
            this.config = { ...this.config, ...config };
        }

        // 初始化屏幕信息
        this.updateScreenInfo();

        // 初始化安全区域
        if (this.config.enableSafeArea) {
            this.updateSafeArea();
        }

        // 检测初始方向
        this.detectOrientation();

        // 启动自动检测
        if (this.config.enableAutoDetection) {
            this.startAutoDetection();
        }

        // 监听窗口大小变化
        this.registerSystemEvents();

        this.initialized = true;

        if (this.config.debugMode) {
            console.log('[AdaptationManager] Initialized with config:', this.config);
        }
    }

    /**
     * 注册适配策略
     * @param orientation 设备方向
     * @param strategy 适配策略
     */
    public registerStrategy(orientation: DeviceOrientation, strategy: AdaptationStrategy): void {
        this.strategies.set(orientation, strategy);

        if (this.config.debugMode) {
            console.log(`[AdaptationManager] Registered strategy for ${orientation}: ${strategy.name}`);
        }

        // 如果是当前方向，立即应用
        if (orientation === this.currentOrientation && this.rootNode) {
            this.applyStrategy(strategy);
        }
    }

    /**
     * 手动设置方向
     * @param orientation 目标方向
     */
    public setOrientation(orientation: DeviceOrientation): void {
        if (orientation === this.currentOrientation) {
            return;
        }

        this.previousOrientation = this.currentOrientation;
        this.currentOrientation = orientation;

        this.applyCurrentStrategy();
        this.emitOrientationChange();
    }

    /**
     * 获取当前方向
     */
    public getCurrentOrientation(): DeviceOrientation {
        return this.currentOrientation;
    }

    /**
     * 获取当前策略
     */
    public getCurrentStrategy(): AdaptationStrategy {
        return this.currentStrategy;
    }

    /**
     * 获取当前布局配置
     */
    public getCurrentLayoutConfig(): LayoutConfig {
        return this.currentStrategy ? this.currentStrategy.getConfig() : null;
    }

    /**
     * 获取安全区域信息
     */
    public getSafeAreaInfo(): SafeAreaInfo {
        return this.safeAreaInfo;
    }

    /**
     * 获取屏幕信息
     */
    public getScreenInfo() {
        return this.screenInfo;
    }

    /**
     * 添加事件监听
     * @param event 事件类型
     * @param callback 回调函数
     */
    public addEventListener(event: AdaptationEvent, callback: Function): void {
        if (!this.eventListeners.has(event)) {
            this.eventListeners.set(event, []);
        }

        const listeners = this.eventListeners.get(event);
        if (!listeners.includes(callback)) {
            listeners.push(callback);
        }
    }

    /**
     * 移除事件监听
     * @param event 事件类型
     * @param callback 回调函数
     */
    public removeEventListener(event: AdaptationEvent, callback: Function): void {
        const listeners = this.eventListeners.get(event);
        if (listeners) {
            const index = listeners.indexOf(callback);
            if (index >= 0) {
                listeners.splice(index, 1);
            }
        }
    }

    /**
     * 强制刷新布局
     */
    public refresh(): void {
        this.updateScreenInfo();
        this.updateSafeArea();
        this.applyCurrentStrategy();
    }

    /**
     * 销毁管理器
     */
    public destroy(): void {
        this.stopAutoDetection();
        this.unregisterSystemEvents();
        this.eventListeners.clear();
        this.strategies.clear();
        this.rootNode = null;
        this.initialized = false;
        OrientationAdaptationManager.instance = null;
    }

    // ==================== 私有方法 ====================

    /**
     * 初始化事件监听器映射
     */
    private initializeEventListeners(): void {
        // 手动初始化所有事件类型
        this.eventListeners.set('orientation-changed' as AdaptationEvent, []);
        this.eventListeners.set('adaptation-start' as AdaptationEvent, []);
        this.eventListeners.set('adaptation-complete' as AdaptationEvent, []);
        this.eventListeners.set('safe-area-updated' as AdaptationEvent, []);
        this.eventListeners.set('screen-size-changed' as AdaptationEvent, []);
    }

    /**
     * 检测当前方向
     */
    private detectOrientation(): void {
        const frameSize = cc.view.getFrameSize();
        const aspectRatio = frameSize.width / frameSize.height;

        let detectedOrientation: DeviceOrientation;

        if (Math.abs(aspectRatio - 1) < 0.1) {
            // 接近正方形，使用默认方向
            detectedOrientation = this.config.defaultOrientation;
        } else if (aspectRatio > 1) {
            detectedOrientation = 'landscape' as DeviceOrientation;
        } else {
            detectedOrientation = 'portrait' as DeviceOrientation;
        }

        if (detectedOrientation !== this.currentOrientation) {
            this.previousOrientation = this.currentOrientation;
            this.currentOrientation = detectedOrientation;
            this.applyCurrentStrategy();
            this.emitOrientationChange();
        }
    }

    /**
     * 应用当前方向的策略
     */
    private applyCurrentStrategy(): void {
        const strategy = this.strategies.get(this.currentOrientation);

        if (!strategy) {
            console.warn(`[AdaptationManager] No strategy registered for orientation: ${this.currentOrientation}`);
            return;
        }

        if (!this.rootNode) {
            console.warn('[AdaptationManager] Root node not set');
            return;
        }

        this.emitEvent('adaptation-start' as AdaptationEvent);

        if (this.config.enableAnimation && this.currentStrategy) {
            // 使用动画过渡
            if (strategy.updateWithAnimation) {
                strategy.updateWithAnimation(this.rootNode, this.config.animationDuration);
            } else {
                strategy.apply(this.rootNode);
            }
        } else {
            // 直接应用
            strategy.apply(this.rootNode);
        }

        this.currentStrategy = strategy;

        // 延迟发送完成事件，确保动画完成
        const delay = this.config.enableAnimation ? this.config.animationDuration * 1000 : 0;
        setTimeout(() => {
            this.emitEvent('adaptation-complete' as AdaptationEvent);
        }, delay);
    }

    /**
     * 应用指定策略
     * @param strategy 适配策略
     */
    private applyStrategy(strategy: AdaptationStrategy): void {
        if (!this.rootNode) {
            return;
        }

        strategy.apply(this.rootNode);
        this.currentStrategy = strategy;
    }

    /**
     * 更新屏幕信息
     */
    private updateScreenInfo(): void {
        const frameSize = cc.view.getFrameSize();
        const visibleSize = cc.view.getVisibleSize();
        const aspectRatio = frameSize.width / frameSize.height;

        // 判断屏幕类别
        let category: ScreenSize;
        const diagonal = Math.sqrt(frameSize.width * frameSize.width + frameSize.height * frameSize.height);

        if (diagonal < 768) {
            category = 'phone' as ScreenSize;
        } else if (diagonal < 1366) {
            category = 'tablet' as ScreenSize;
        } else {
            category = 'desktop' as ScreenSize;
        }

        // 判断宽高比类型
        const aspectRatioInfo: AspectRatioInfo = {
            ratio: aspectRatio,
            isWideScreen: aspectRatio > 1.8,  // 18:9 或更宽
            isTallScreen: aspectRatio < 0.56,  // 9:16 或更高
            isStandard: aspectRatio > 1.3 && aspectRatio < 1.8,
            recommendedTemplate: this.getRecommendedTemplate(aspectRatio)
        };

        this.screenInfo = {
            size: visibleSize,
            category,
            aspectRatio: aspectRatioInfo
        };

        this.emitEvent('screen-size-changed' as AdaptationEvent);
    }

    /**
     * 获取推荐的布局模板
     * @param aspectRatio 宽高比
     */
    private getRecommendedTemplate(aspectRatio: number): LayoutTemplate {
        if (aspectRatio > 1.5) {
            return 'three-column' as LayoutTemplate;
        } else if (aspectRatio < 0.75) {
            return 'single-column' as LayoutTemplate;
        } else {
            return 'two-column' as LayoutTemplate;
        }
    }

    /**
     * 更新安全区域
     */
    private updateSafeArea(): void {
        // Cocos Creator 2.4.x 的安全区域获取方式
        if (cc.sys.platform === cc.sys.IPHONE || cc.sys.platform === cc.sys.ANDROID) {
            const safeArea = cc.sys.getSafeAreaRect();
            const visibleSize = cc.view.getVisibleSize();

            this.safeAreaInfo = {
                topInset: visibleSize.height - safeArea.height - safeArea.y,
                bottomInset: safeArea.y,
                leftInset: safeArea.x,
                rightInset: visibleSize.width - safeArea.width - safeArea.x,
                safeRect: safeArea
            };

            this.emitEvent('safe-area-updated' as AdaptationEvent);
        } else {
            // PC 或其他平台，没有安全区域
            this.safeAreaInfo = {
                topInset: 0,
                bottomInset: 0,
                leftInset: 0,
                rightInset: 0,
                safeRect: cc.rect(0, 0, cc.view.getVisibleSize().width, cc.view.getVisibleSize().height)
            };
        }
    }

    /**
     * 启动自动检测
     */
    private startAutoDetection(): void {
        if (this.detectionTimer) {
            return;
        }

        // 每500ms检测一次方向变化
        this.detectionTimer = setInterval(() => {
            this.detectOrientation();
        }, 500) as any;
    }

    /**
     * 停止自动检测
     */
    private stopAutoDetection(): void {
        if (this.detectionTimer) {
            clearInterval(this.detectionTimer);
            this.detectionTimer = null;
        }
    }

    /**
     * 注册系统事件
     */
    private registerSystemEvents(): void {
        // 监听窗口大小变化
        cc.view.on('canvas-resize', this.onCanvasResize, this);
    }

    /**
     * 取消注册系统事件
     */
    private unregisterSystemEvents(): void {
        cc.view.off('canvas-resize', this.onCanvasResize, this);
    }

    /**
     * Canvas大小变化处理
     */
    private onCanvasResize(): void {
        this.updateScreenInfo();
        this.updateSafeArea();
        this.detectOrientation();
    }

    /**
     * 触发方向改变事件
     */
    private emitOrientationChange(): void {
        const eventData: AdaptationEventData = {
            currentOrientation: this.currentOrientation,
            previousOrientation: this.previousOrientation,
            screenSize: this.screenInfo ? this.screenInfo.size : cc.view.getVisibleSize(),
            screenCategory: this.screenInfo ? this.screenInfo.category : 'phone' as ScreenSize,
            safeArea: this.safeAreaInfo
        };

        this.emitEvent('orientation-changed' as AdaptationEvent, eventData);
    }

    /**
     * 触发事件
     * @param event 事件类型
     * @param data 事件数据
     */
    private emitEvent(event: AdaptationEvent, data?: any): void {
        const listeners = this.eventListeners.get(event);
        if (listeners) {
            listeners.forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`[AdaptationManager] Error in event listener for ${event}:`, error);
                }
            });
        }

        if (this.config.debugMode) {
            console.log(`[AdaptationManager] Event emitted: ${event}`, data);
        }
    }
}