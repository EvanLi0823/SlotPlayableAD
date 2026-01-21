/**
 * Orientation Adaptation Type Definitions
 * 横竖屏适配系统类型定义
 * @module AdaptationTypes
 */

/**
 * Device orientation enumeration
 * 设备方向枚举
 */
export enum DeviceOrientation {
    /** 横屏模式 */
    Landscape = 'landscape',
    /** 竖屏模式 */
    Portrait = 'portrait',
    /** 未知方向 */
    Unknown = 'unknown'
}

/**
 * Screen size category
 * 屏幕尺寸分类
 */
export enum ScreenSize {
    /** 手机屏幕 */
    Phone = 'phone',
    /** 平板屏幕 */
    Tablet = 'tablet',
    /** 桌面屏幕 */
    Desktop = 'desktop'
}

/**
 * Layout configuration interface
 * 布局配置接口
 */
export interface LayoutConfig {
    /** 设计分辨率 */
    designResolution: cc.Size;
    /** 中心游戏区域大小 */
    centralAreaSize: cc.Size;
    /** 侧边区域宽度 */
    sideAreaWidth: number;
    /** 转轮区域大小 */
    reelAreaSize: cc.Size;
    /** Canvas适配模式 */
    fitMode: {
        fitHeight: boolean;
        fitWidth: boolean;
    };
    /** 符号缩放比例 */
    symbolScale?: number;
    /** 按钮缩放比例 */
    buttonScale?: number;
    /** 文字缩放比例 */
    textScale?: number;
}

/**
 * Adaptation strategy interface
 * 适配策略接口
 */
export interface AdaptationStrategy {
    /** 策略名称 */
    name: string;

    /**
     * Apply adaptation strategy
     * 应用适配策略
     * @param rootNode 根节点（Canvas）
     */
    apply(rootNode: cc.Node): void;

    /**
     * Update layout with animation
     * 带动画更新布局
     * @param rootNode 根节点
     * @param duration 动画时长
     */
    updateWithAnimation?(rootNode: cc.Node, duration: number): void;

    /**
     * Get layout configuration
     * 获取布局配置
     */
    getConfig(): LayoutConfig;
}

/**
 * Safe area information
 * 安全区域信息
 */
export interface SafeAreaInfo {
    /** 顶部安全边距 */
    topInset: number;
    /** 底部安全边距 */
    bottomInset: number;
    /** 左侧安全边距 */
    leftInset: number;
    /** 右侧安全边距 */
    rightInset: number;
    /** 安全区域矩形 */
    safeRect: cc.Rect;
}

/**
 * Widget alignment configuration
 * Widget对齐配置
 */
export interface WidgetAlignment {
    /** 左边距 */
    left?: number;
    /** 右边距 */
    right?: number;
    /** 顶部边距 */
    top?: number;
    /** 底部边距 */
    bottom?: number;
    /** 水平中心偏移 */
    horizontalCenter?: number;
    /** 垂直中心偏移 */
    verticalCenter?: number;
    /** 是否启用左对齐 */
    isAlignLeft?: boolean;
    /** 是否启用右对齐 */
    isAlignRight?: boolean;
    /** 是否启用顶对齐 */
    isAlignTop?: boolean;
    /** 是否启用底对齐 */
    isAlignBottom?: boolean;
    /** 是否启用水平居中 */
    isAlignHorizontalCenter?: boolean;
    /** 是否启用垂直居中 */
    isAlignVerticalCenter?: boolean;
}

/**
 * Responsive scale configuration
 * 响应式缩放配置
 */
export interface ResponsiveScaleConfig {
    /** 横屏缩放 */
    landscapeScale: cc.Vec2;
    /** 竖屏缩放 */
    portraitScale: cc.Vec2;
    /** 平板缩放 */
    tabletScale: cc.Vec2;
    /** 使用动画过渡 */
    useAnimation: boolean;
    /** 动画时长(秒) */
    animationDuration: number;
    /** 缓动函数 */
    easing: string;
}

/**
 * Node adaptation configuration
 * 节点适配配置
 */
export interface NodeAdaptationConfig {
    /** 节点路径 */
    nodePath: string;
    /** 横屏配置 */
    landscape: {
        /** 位置 */
        position?: cc.Vec2;
        /** 缩放 */
        scale?: cc.Vec2;
        /** 大小 */
        size?: cc.Size;
        /** 透明度 */
        opacity?: number;
        /** 是否激活 */
        active?: boolean;
        /** Widget配置 */
        widget?: WidgetAlignment;
    };
    /** 竖屏配置 */
    portrait: {
        /** 位置 */
        position?: cc.Vec2;
        /** 缩放 */
        scale?: cc.Vec2;
        /** 大小 */
        size?: cc.Size;
        /** 透明度 */
        opacity?: number;
        /** 是否激活 */
        active?: boolean;
        /** Widget配置 */
        widget?: WidgetAlignment;
    };
}

/**
 * Adaptation event types
 * 适配事件类型
 */
export enum AdaptationEvent {
    /** 方向改变事件 */
    OrientationChanged = 'orientation-changed',
    /** 适配开始事件 */
    AdaptationStart = 'adaptation-start',
    /** 适配完成事件 */
    AdaptationComplete = 'adaptation-complete',
    /** 安全区域更新事件 */
    SafeAreaUpdated = 'safe-area-updated',
    /** 屏幕尺寸改变事件 */
    ScreenSizeChanged = 'screen-size-changed'
}

/**
 * Adaptation event data
 * 适配事件数据
 */
export interface AdaptationEventData {
    /** 当前方向 */
    currentOrientation: DeviceOrientation;
    /** 之前方向 */
    previousOrientation?: DeviceOrientation;
    /** 屏幕尺寸 */
    screenSize: cc.Size;
    /** 屏幕分类 */
    screenCategory: ScreenSize;
    /** 安全区域信息 */
    safeArea?: SafeAreaInfo;
}

/**
 * Adaptation manager configuration
 * 适配管理器配置
 */
export interface AdaptationManagerConfig {
    /** 默认方向 */
    defaultOrientation: DeviceOrientation;
    /** 启用自动检测 */
    enableAutoDetection: boolean;
    /** 启用安全区域 */
    enableSafeArea: boolean;
    /** 启用动画过渡 */
    enableAnimation: boolean;
    /** 全局动画时长 */
    animationDuration: number;
    /** 调试模式 */
    debugMode: boolean;
}

/**
 * Preset layout templates
 * 预设布局模板
 */
export enum LayoutTemplate {
    /** 三栏布局（横屏） */
    ThreeColumn = 'three-column',
    /** 单栏布局（竖屏） */
    SingleColumn = 'single-column',
    /** 两栏布局 */
    TwoColumn = 'two-column',
    /** 自定义布局 */
    Custom = 'custom'
}

/**
 * Animation easing types
 * 动画缓动类型
 */
export enum EasingType {
    Linear = 'linear',
    QuadIn = 'quadIn',
    QuadOut = 'quadOut',
    QuadInOut = 'quadInOut',
    CubicIn = 'cubicIn',
    CubicOut = 'cubicOut',
    CubicInOut = 'cubicInOut',
    BackOut = 'backOut',
    ElasticOut = 'elasticOut'
}

/**
 * Device aspect ratio category
 * 设备宽高比分类
 */
export interface AspectRatioInfo {
    /** 实际宽高比 */
    ratio: number;
    /** 是否为宽屏 */
    isWideScreen: boolean;
    /** 是否为长屏 */
    isTallScreen: boolean;
    /** 是否为标准比例 */
    isStandard: boolean;
    /** 推荐的布局模板 */
    recommendedTemplate: LayoutTemplate;
}