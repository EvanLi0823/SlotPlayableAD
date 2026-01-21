# 横竖屏适配系统使用指南

## 目录
- [系统架构](#系统架构)
- [快速开始](#快速开始)
- [详细配置](#详细配置)
- [组件使用](#组件使用)
- [API参考](#api参考)
- [最佳实践](#最佳实践)
- [调试技巧](#调试技巧)

## 系统架构

### 文件结构
```
assets/script/adaptation/
├── OrientationAdaptationManager.ts    # 核心管理器
├── types/
│   └── AdaptationTypes.ts            # 类型定义
├── strategies/
│   ├── LandscapeStrategy.ts          # 横屏策略
│   └── PortraitStrategy.ts           # 竖屏策略
├── components/
│   ├── ResponsiveScaler.ts           # 响应式缩放组件
│   └── AdaptiveWidget.ts             # 自适应Widget组件
└── utils/
    └── SafeAreaAdapter.ts            # 安全区域适配器
```

## 快速开始

### 1. 在 GameScene 中启用适配系统

系统已经在 `GameScene.ts` 中集成，默认自动启用。可以通过 Inspector 面板配置：

- **启用横竖屏适配**: 开启/关闭整个适配系统
- **启用安全区域**: 处理刘海屏、异形屏
- **适配调试模式**: 显示调试信息和安全区域边界

### 2. 手动集成到其他场景

```typescript
import OrientationAdaptationManager from "./adaptation/OrientationAdaptationManager";
import LandscapeStrategy from "./adaptation/strategies/LandscapeStrategy";
import PortraitStrategy from "./adaptation/strategies/PortraitStrategy";
import { DeviceOrientation } from "./adaptation/types/AdaptationTypes";

onLoad() {
    // 获取管理器实例
    const manager = OrientationAdaptationManager.getInstance();

    // 初始化
    manager.initialize(this.node, {
        defaultOrientation: DeviceOrientation.Landscape,
        enableAutoDetection: true,
        enableSafeArea: true,
        enableAnimation: true,
        animationDuration: 0.3
    });

    // 注册策略
    manager.registerStrategy(DeviceOrientation.Landscape, new LandscapeStrategy());
    manager.registerStrategy(DeviceOrientation.Portrait, new PortraitStrategy());
}
```

## 详细配置

### OrientationAdaptationManager 配置选项

```typescript
interface AdaptationManagerConfig {
    defaultOrientation: DeviceOrientation;  // 默认方向
    enableAutoDetection: boolean;           // 自动检测方向变化
    enableSafeArea: boolean;                // 启用安全区域
    enableAnimation: boolean;               // 使用动画过渡
    animationDuration: number;              // 动画时长（秒）
    debugMode: boolean;                     // 调试模式
}
```

### 自定义布局策略

创建自定义策略类：

```typescript
import { AdaptationStrategy, LayoutConfig } from "../types/AdaptationTypes";

export default class CustomStrategy implements AdaptationStrategy {
    name = "CustomStrategy";

    apply(rootNode: cc.Node): void {
        // 实现自定义布局逻辑
    }

    getConfig(): LayoutConfig {
        return {
            designResolution: cc.size(1920, 1080),
            centralAreaSize: cc.size(1920, 1080),
            sideAreaWidth: 0,
            reelAreaSize: cc.size(800, 600),
            fitMode: {
                fitHeight: true,
                fitWidth: false
            }
        };
    }
}
```

## 组件使用

### ResponsiveScaler 组件

自动根据屏幕方向调整节点缩放：

1. **添加组件**: 在 Cocos Creator 编辑器中，给需要自适应缩放的节点添加 `ResponsiveScaler` 组件

2. **配置参数**:
   - **横屏缩放**: 横屏模式下的缩放值 (默认: 1, 1)
   - **竖屏缩放**: 竖屏模式下的缩放值 (默认: 1.5, 1.5)
   - **平板缩放**: 平板设备的特殊缩放值
   - **使用动画**: 是否使用缓动动画
   - **动画时长**: 缩放动画持续时间

3. **代码控制**:
```typescript
// 获取组件
const scaler = node.getComponent(ResponsiveScaler);

// 手动更新缩放
scaler.updateScale(true);  // true = 使用动画

// 设置缩放值
scaler.setLandscapeScale(cc.v2(1.2, 1.2));
scaler.setPortraitScale(cc.v2(2.0, 2.0));
```

### AdaptiveWidget 组件

扩展原生 Widget 功能，支持横竖屏不同的对齐配置：

1. **添加组件**: 给需要自适应对齐的节点添加 `AdaptiveWidget` 组件

2. **配置预设**:
   - 分别为横屏和竖屏配置不同的 Widget 对齐参数
   - 支持安全区域自动调整

3. **代码示例**:
```typescript
// 获取组件
const adaptiveWidget = node.getComponent(AdaptiveWidget);

// 手动更新对齐
adaptiveWidget.updateAlignment(true);

// 动态修改预设
const portraitPreset = new WidgetPreset();
portraitPreset.isAlignTop = true;
portraitPreset.top = 100;
adaptiveWidget.setPortraitPreset(portraitPreset);
```

## API参考

### OrientationAdaptationManager

```typescript
// 获取单例
const manager = OrientationAdaptationManager.getInstance();

// 获取当前方向
const orientation = manager.getCurrentOrientation();

// 手动设置方向
manager.setOrientation(DeviceOrientation.Portrait);

// 添加事件监听
manager.addEventListener(AdaptationEvent.OrientationChanged, (data) => {
    console.log(`方向改变: ${data.previousOrientation} -> ${data.currentOrientation}`);
});

// 强制刷新布局
manager.refresh();
```

### SafeAreaAdapter

```typescript
// 获取安全区域信息
const safeArea = SafeAreaAdapter.getSafeAreaInfo();
console.log(`顶部刘海高度: ${safeArea.topInset}px`);

// 应用安全区域到场景
SafeAreaAdapter.applySafeArea(canvas, 20);  // 20px额外边距

// 检查节点是否在安全区域内
const isSafe = SafeAreaAdapter.isInSafeArea(myNode);

// 自动调整节点到安全区域
SafeAreaAdapter.autoAdjustToSafeArea(myNode);
```

## 最佳实践

### 1. 设计建议
- 使用 **2400×1334** 作为横屏设计分辨率
- 使用 **1334×2400** 作为竖屏设计分辨率
- 核心游戏内容放在中心 **720×1334** 区域
- 重要UI元素避免放在边缘

### 2. 节点配置
- 为重要节点添加 `ResponsiveScaler` 组件
- 为需要对齐的节点添加 `AdaptiveWidget` 组件
- 合理使用 Widget 组件的对齐功能

### 3. 性能优化
- 避免频繁切换方向（使用防抖）
- 减少动画节点数量
- 使用节点池管理动态创建的节点

### 4. 测试覆盖
测试以下设备和场景：
- iPhone 各机型（特别是刘海屏）
- iPad 各尺寸
- Android 手机（16:9, 18:9, 19:9等）
- Android 平板
- 横竖屏快速切换
- 游戏中途旋转屏幕

## 调试技巧

### 1. 开启调试模式
```typescript
// 在 GameScene Inspector 中勾选"适配调试模式"
// 或代码中设置
manager.initialize(canvas, { debugMode: true });
```

### 2. 浏览器控制台命令
```javascript
// 适配管理器已暴露到 window
adaptationManager.getCurrentOrientation();
adaptationManager.setOrientation('portrait');
adaptationManager.refresh();

// 查看安全区域
SafeAreaAdapter.getSafeAreaInfo();
```

### 3. Chrome DevTools 设备模拟
1. 打开 Chrome DevTools (F12)
2. 点击设备模拟按钮
3. 选择不同设备或自定义尺寸
4. 旋转设备查看适配效果

### 4. 调试可视化
开启调试模式后会显示：
- 安全区域边界（绿色线框）
- 危险区域（半透明红色）
- 当前方向和屏幕信息

## 常见问题

### Q: 如何禁用某个节点的自适应？
A: 移除或禁用该节点上的 `ResponsiveScaler` 和 `AdaptiveWidget` 组件。

### Q: 如何自定义过渡动画？
A: 在策略类中实现 `updateWithAnimation` 方法，使用 cc.tween 自定义动画。

### Q: 如何处理不同宽高比？
A: 系统会自动检测并选择合适的布局模板，也可以通过 `AspectRatioInfo` 获取详细信息。

### Q: 安全区域不准确怎么办？
A: 确保使用最新版本的 Cocos Creator 2.4.11，并在真机上测试。

## 扩展开发

### 添加新的布局策略
1. 创建新的策略类，实现 `AdaptationStrategy` 接口
2. 在 `GameScene` 中注册新策略
3. 根据条件切换到新策略

### 集成到其他项目
1. 复制整个 `adaptation` 文件夹
2. 在主场景的 `onLoad` 中初始化
3. 根据项目需求调整策略参数

## 更新日志

### v1.0.0 (2024-01-21)
- ✅ 初始版本发布
- ✅ 支持横竖屏自动切换
- ✅ 支持安全区域适配
- ✅ 提供 ResponsiveScaler 和 AdaptiveWidget 组件
- ✅ 集成到 GameScene

## 联系支持

如有问题或建议，请：
1. 查看调试日志
2. 检查组件配置
3. 参考最佳实践
4. 联系技术支持

---

**注意**: 本系统基于 Cocos Creator 2.4.11 开发，其他版本可能需要调整。