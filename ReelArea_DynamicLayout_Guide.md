# ReelArea动态布局配置指南

## 📐 概述

ReelArea区域已更新为**670x310**像素，Symbol尺寸固定为**130x100**像素。系统会根据ReelArea尺寸自动计算并调整Reel和Symbol的位置。

## 🎯 核心参数

### ReelArea尺寸
```
宽度: 670px
高度: 310px
```

### Symbol尺寸（固定）
```
宽度: 130px
高度: 100px
间距: 4px
```

### 网格布局
```
行数: 3行（可见）
列数: 5列
每列Symbol数: 7个（3个可见 + 4个缓冲）
```

### 实际占用空间
```
宽度: 130px × 5 + 4px × 4 = 666px ✓ (< 670px)
高度: 100px × 3 + 4px × 2 = 308px ✓ (< 310px)
```

## ⚙️ 配置方法

### 1. SlotConfig配置

在Cocos Creator编辑器中，选择包含`SlotConfig`组件的节点，配置以下参数：

```typescript
// 布局配置
rows: 3                  // 行数
reels: 5                 // 列数
reelAreaWidth: 670       // ReelArea宽度
reelAreaHeight: 310      // ReelArea高度

// Symbol尺寸（固定）
symbolWidth: 130         // Symbol宽度
symbolHeight: 100        // Symbol高度
symbolGap: 4             // Symbol间距

// Symbol配置
symbolTypes: 13          // Symbol种类数
symbolsPerReel: 7        // 每列Symbol节点数
visibleSymbolsPerReel: 3 // 每列可见Symbol数
```

### 2. 场景节点结构

在Cocos Creator编辑器中创建以下节点结构：

```
Canvas
  └─ CentralArea
       └─ ReelArea (670×310)
            ├─ Background (690×330, zIndex: -1)
            └─ Mask (670×310, type: RECT)
                 └─ ReelContainer
                      ├─ Reel_0
                      │    ├─ SymbolContainer
                      │    │    ├─ Symbol_0 (130×100)
                      │    │    ├─ Symbol_1 (130×100)
                      │    │    ├─ Symbol_2 (130×100)
                      │    │    ├─ Symbol_3 (130×100)
                      │    │    ├─ Symbol_4 (130×100)
                      │    │    ├─ Symbol_5 (130×100)
                      │    │    └─ Symbol_6 (130×100)
                      │    └─ ReelController组件
                      ├─ Reel_1
                      ├─ Reel_2
                      ├─ Reel_3
                      └─ Reel_4
```

**重要**：
- ReelArea的ContentSize必须设置为670×310
- Mask节点必须添加cc.Mask组件，类型为RECT
- 每个Reel节点必须包含SymbolContainer子节点
- 每个Reel需要挂载ReelController组件

### 3. 挂载组件

在SlotMachine节点上：
- 挂载`SlotMachine`组件
- 配置`config`属性指向SlotConfig组件
- 配置`reelNodes`数组，拖入5个Reel节点

## 🚀 自动计算原理

### Reel的X坐标计算

系统会根据ReelArea宽度和Symbol宽度自动计算Reel的X坐标：

```typescript
// SlotConfig.getReelPositionsX()
unitWidth = symbolWidth + symbolGap = 130 + 4 = 134px
totalWidth = 130 × 5 + 4 × 4 = 666px
startX = -666 / 2 + 130 / 2 = -268px

Reel_0: x = -268px
Reel_1: x = -134px
Reel_2: x = 0px
Reel_3: x = 134px
Reel_4: x = 268px
```

### Symbol的Y坐标计算

系统会根据Symbol高度自动计算每个Reel内Symbol的Y坐标：

```typescript
// SlotConfig.getSymbolPositionsY()
unitHeight = symbolHeight + symbolGap = 100 + 4 = 104px
symbolsPerReel = 7
centerIndex = 3

Symbol_0: y = 312px   (顶部缓冲)
Symbol_1: y = 208px   (顶部缓冲)
Symbol_2: y = 104px   (可见)
Symbol_3: y = 0px     (可见，中心)
Symbol_4: y = -104px  (可见)
Symbol_5: y = -208px  (底部缓冲)
Symbol_6: y = -312px  (底部缓冲)
```

## 📝 使用示例

### 初始化SlotMachine

```typescript
import { SymbolType, SymbolLayout } from "./DataTypes";

// 定义初始布局（3行5列）
const initialLayout: SymbolLayout = [
    [SymbolType.L01, SymbolType.L02, SymbolType.H01, SymbolType.H02, SymbolType.L03],
    [SymbolType.L04, SymbolType.H03, SymbolType.H04, SymbolType.L05, SymbolType.L06],
    [SymbolType.H05, SymbolType.WILD, SymbolType.SCATTER, SymbolType.H01, SymbolType.L01]
];

// 初始化（会自动计算位置）
this.slotMachine.init(initialLayout);
```

### 验证配置

```typescript
// 在初始化时会自动调用验证
// 如需手动验证：
if (this.config.validateLayout()) {
    console.log("布局配置正确");
}
```

### 查看日志

初始化时会输出详细的日志信息：

```
[SlotConfig] 布局验证通过:
[SlotConfig]   ReelArea: 670x310px
[SlotConfig]   Symbol: 130x100px, Gap: 4px
[SlotConfig]   Grid: 3行 x 5列
[SlotConfig]   实际占用: 666x308px

[SlotMachine] 创建5个Reel，X坐标: [-268, -134, 0, 134, 268]

[ReelController] Reel 0: 创建了7个Symbol节点
[ReelController]   Symbol尺寸: 130x100px
[ReelController]   Y坐标: [312, 208, 104, 0, -104, -208, -312]
```

## 🔧 调整ReelArea尺寸

如果需要修改ReelArea尺寸：

### 1. 更新SlotConfig
```typescript
reelAreaWidth: 800   // 新宽度
reelAreaHeight: 400  // 新高度
```

### 2. 更新场景节点尺寸
- ReelArea节点 → ContentSize: 800×400
- Mask节点 → ContentSize: 800×400
- Background节点 → ContentSize: 820×420

### 3. 验证Symbol是否能放下

系统会自动验证：
```
需要宽度: 130×5 + 4×4 = 666px
需要高度: 100×3 + 4×2 = 308px

如果超出ReelArea尺寸，会报错：
[SlotConfig] Symbol宽度超出ReelArea: 需要666px, 实际600px
```

### 4. 调整Symbol尺寸（可选）

如果ReelArea变化较大，可能需要调整Symbol尺寸：
```typescript
symbolWidth: 150   // 更大的Symbol
symbolHeight: 120
```

## 🎨 视觉效果

### 布局示意图

```
┌────────────────────────────────────────────────┐
│             ReelArea (670×310)                 │
│  ┌──────┬──────┬──────┬──────┬──────┐         │
│  │ 130  │ 130  │ 130  │ 130  │ 130  │         │
│  ├──────┼──────┼──────┼──────┼──────┤ 100     │
│  │  L01 │  L02 │  H01 │  H02 │  L03 │         │
│  ├──────┼──────┼──────┼──────┼──────┤ 4       │
│  │  L04 │  H03 │  H04 │  L05 │  L06 │ 100     │
│  ├──────┼──────┼──────┼──────┼──────┤ 4       │
│  │  H05 │ WILD │SCATT │  H01 │  L01 │ 100     │
│  └──────┴──────┴──────┴──────┴──────┘         │
│     ↑     4      4      4      4               │
└────────────────────────────────────────────────┘

宽度占用: 130×5 + 4×4 = 666px (留4px边距)
高度占用: 100×3 + 4×2 = 308px (留2px边距)
```

## ⚠️ 注意事项

### 1. Symbol尺寸不能动态计算
- Symbol尺寸是**固定配置**，不会根据ReelArea自动缩放
- 原因：Symbol图片资源尺寸固定，动态缩放会影响显示质量
- 如需调整：修改`symbolWidth`和`symbolHeight`配置

### 2. Reel和Symbol位置会动态计算
- ✅ Reel的X坐标会根据ReelArea宽度自动居中
- ✅ Symbol的Y坐标会根据Symbol高度自动计算
- ✅ 确保水平和垂直居中对齐

### 3. 必须保证Symbol能放入ReelArea
```
symbolWidth × reels + symbolGap × (reels-1) ≤ reelAreaWidth
symbolHeight × rows + symbolGap × (rows-1) ≤ reelAreaHeight
```

### 4. Mask必须正确配置
- Mask节点的ContentSize必须与ReelArea一致
- Mask类型必须为RECT
- 确保超出部分被裁剪

### 5. 预制体Symbol尺寸
- SymbolPrefab的默认尺寸会被代码覆盖
- 系统会自动调用`symbolNode.setContentSize(width, height)`

## 🔍 调试技巧

### 1. 显示网格线

在ReelArea中添加调试节点：
```typescript
// 显示Symbol边界框
for (let i = 0; i < 7; i++) {
    const debugNode = new cc.Node("Debug");
    debugNode.addComponent(cc.Graphics);
    const g = debugNode.getComponent(cc.Graphics);
    g.strokeColor = cc.Color.RED;
    g.rect(-65, -50, 130, 100);
    g.stroke();
    symbolNode.addChild(debugNode);
}
```

### 2. 检查日志

系统提供详细日志，包括：
- 布局验证结果
- Reel X坐标数组
- Symbol Y坐标数组
- Symbol尺寸信息

### 3. 验证Mask

临时禁用Mask组件，检查Symbol是否正确定位：
```typescript
mask.getComponent(cc.Mask).enabled = false;
```

## 📊 配置对照表

| 配置项 | 默认值 | 说明 | 可修改 |
|--------|--------|------|--------|
| reelAreaWidth | 670 | ReelArea宽度 | ✅ |
| reelAreaHeight | 310 | ReelArea高度 | ✅ |
| symbolWidth | 130 | Symbol宽度（固定） | ✅ |
| symbolHeight | 100 | Symbol高度（固定） | ✅ |
| symbolGap | 4 | Symbol间距 | ✅ |
| rows | 3 | 可见行数 | ✅ |
| reels | 5 | 列数 | ✅ |
| symbolsPerReel | 7 | 每列Symbol节点数 | ✅ |
| visibleSymbolsPerReel | 3 | 每列可见Symbol数 | ⚠️ 必须≤rows |

## 🚀 快速开始

1. **配置SlotConfig**：设置ReelArea尺寸和Symbol尺寸
2. **创建场景结构**：按照节点结构创建ReelArea和Reel节点
3. **挂载组件**：为Reel挂载ReelController，为SlotMachine配置引用
4. **初始化**：调用`slotMachine.init(initialLayout)`
5. **验证**：查看控制台日志，确认位置计算正确

## ✅ 优势总结

| 特性 | 说明 |
|------|------|
| 🎯 **灵活布局** | 支持任意ReelArea尺寸 |
| 📐 **自动居中** | Reel和Symbol自动水平垂直居中 |
| 🔧 **易于调整** | 修改配置即可调整布局 |
| 📊 **尺寸验证** | 自动验证Symbol是否能放入 |
| 🐛 **调试友好** | 详细日志输出，快速定位问题 |
| 🎨 **固定尺寸** | Symbol尺寸固定，保证显示质量 |

---

**相关文档**:
- [Symbol映射配置指南](./SymbolMapping_Configuration_Guide.md)
- [设计文档](./SlotMachine_Design_Document.md)
- [更新日志](./CHANGELOG_SymbolMapping.md)
