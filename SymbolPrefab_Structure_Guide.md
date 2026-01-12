# Symbol预制体结构说明

## 📦 预制体结构

```
Symbol (SymbolPrefab)
  ├─ SymbolItem 组件
  ├─ ContentSize: 130×100 (固定尺寸)
  └─ Sprite (子节点)
       ├─ Sprite 组件
       ├─ ContentSize: 根据图片自动调整
       └─ AnchorPoint: (0.5, 0.5)
```

## 🎯 尺寸管理策略

### Symbol节点（父节点）
- **尺寸**：固定 130×100 像素
- **作用**：定义Symbol的逻辑占位空间
- **配置**：在`SlotConfig`中配置
- **用途**：用于计算布局、间距、碰撞等

### Sprite节点（子节点）
- **尺寸**：根据图片实际尺寸自动调整
- **作用**：显示Symbol图片
- **自动调整**：`SymbolItem.setSymbol()`时自动设置
- **用途**：显示实际的Symbol图像

## 💡 设计理由

### 为什么要分离Symbol节点和Sprite节点？

1. **逻辑与显示分离**
   - Symbol节点：逻辑层，固定尺寸，用于布局计算
   - Sprite节点：显示层，可变尺寸，适应不同图片

2. **灵活适配不同尺寸图片**
   - 不同Symbol图片尺寸可能不同（如Wild、Scatter通常更大）
   - 图片可以超出Symbol节点范围，实现溢出效果

3. **简化布局计算**
   - Reel位置计算基于固定的Symbol节点尺寸
   - 不受图片实际尺寸影响

4. **支持特效和动画**
   - Symbol节点可以添加背景、边框、粒子特效
   - Sprite节点专注于图片显示和动画

## 🔧 创建Symbol预制体

### 步骤1：创建节点结构

在Cocos Creator中：

1. **创建Symbol节点**
   ```
   - 节点名称: Symbol
   - ContentSize: 130×100
   - AnchorPoint: (0.5, 0.5)
   ```

2. **添加Sprite子节点**
   ```
   - 节点名称: Sprite
   - Position: (0, 0)
   - AnchorPoint: (0.5, 0.5)
   - 添加 cc.Sprite 组件
   ```

3. **挂载SymbolItem组件**
   ```
   - 在Symbol节点上添加 SymbolItem 组件
   - 配置 sprite 属性：拖入Sprite子节点的Sprite组件
   ```

### 步骤2：配置属性

在SymbolItem组件属性检查器中：

```
SymbolItem组件
  └─ Sprite: 拖入Sprite子节点的Sprite组件
```

### 步骤3：保存为预制体

1. 将Symbol节点拖到assets目录，保存为预制体
2. 命名为`SymbolPrefab.prefab`

## 📐 尺寸示例

### 场景1：普通Symbol（L01-L06, H01-H05）

```
Symbol节点 (130×100)
  └─ Sprite节点 (121×110) - 图片实际尺寸

显示效果：
┌─────────────────────┐ 130px
│  ┌───────────────┐  │
│  │   L01 图片    │  │ 110px (图片)
│  └───────────────┘  │
└─────────────────────┘ 100px (Symbol节点)
      121px (图片)
```

### 场景2：特殊Symbol（Wild: W01）

```
Symbol节点 (130×100)
  └─ Sprite节点 (150×150) - 更大的图片

显示效果：
    ┌──────────────────┐
    │                  │
┌───┼──────────────────┼───┐
│   │   W01 图片       │   │ 150px (图片，超出Symbol节点)
│   │  (Wild符号)      │   │
└───┼──────────────────┼───┘
    │                  │
    └──────────────────┘
    130px (Symbol节点)
```

### 场景3：超高Symbol（Scatter: S01）

```
Symbol节点 (130×100)
  └─ Sprite节点 (138×220) - 超高图片

显示效果：
     ┌─────────────┐
     │             │
     │             │
┌────┼─────────────┼────┐
│    │   S01 图片  │    │ 220px (图片)
│    │  (Scatter)  │    │
└────┼─────────────┼────┘
     │             │
     │             │
     └─────────────┘
     130px (Symbol节点)
```

## 🎨 实际应用

### 图片尺寸规范

根据设计文档，Symbol图片尺寸如下：

| Symbol类型 | 图片尺寸 | 说明 |
|-----------|----------|------|
| L01-L06 | 121×110 | 低价值符号（字母） |
| H01-H05 | 121×110 | 高价值符号（圣诞主题） |
| W01 (Wild) | 150×150 | Wild符号（更大） |
| S01 (Scatter) | 138×220 | Scatter符号（超高） |

### Symbol节点固定尺寸

无论图片尺寸如何，Symbol节点统一为：
```
宽度: 130px
高度: 100px
```

## 🔄 工作流程

### 创建Symbol时

```typescript
// ReelController.createSymbols()

1. 实例化预制体
   const symbolNode = cc.instantiate(this.symbolPrefab);

2. 设置Symbol节点尺寸（固定130×100）
   symbolNode.setContentSize(130, 100);

3. 设置图片（自动调整Sprite子节点尺寸）
   symbolItem.setSymbol(symbolId, spriteFrame);

   内部逻辑：
   - sprite.spriteFrame = spriteFrame
   - const rect = spriteFrame.getRect()
   - sprite.node.setContentSize(rect.width, rect.height)
```

### 运行时日志

```
[SymbolItem] Symbol 0 设置完成，Sprite尺寸: 121x110px
[SymbolItem] Symbol 6 设置完成，Sprite尺寸: 121x110px
[SymbolItem] Symbol 11 设置完成，Sprite尺寸: 150x150px  (Wild)
[SymbolItem] Symbol 12 设置完成，Sprite尺寸: 138x220px  (Scatter)

[ReelController] Reel 0: 创建了7个Symbol节点
[ReelController]   Symbol节点尺寸: 130x100px
[ReelController]   Y坐标: [312, 208, 104, 0, -104, -208, -312]
```

## ⚙️ 代码实现

### SymbolItem.ts

```typescript
@property(cc.Sprite)
sprite: cc.Sprite = null;  // 拖入Sprite子节点的Sprite组件

setSymbol(symbolId: number, spriteFrame: cc.SpriteFrame): void {
    this.symbolId = symbolId;
    this.originalSpriteFrame = spriteFrame;

    if (this.sprite && spriteFrame) {
        // 设置图片
        this.sprite.spriteFrame = spriteFrame;

        // 根据图片尺寸调整Sprite节点的大小（不改变Symbol节点本身尺寸）
        const rect = spriteFrame.getRect();
        this.sprite.node.setContentSize(rect.width, rect.height);

        cc.log(`[SymbolItem] Symbol ${symbolId} 设置完成，Sprite尺寸: ${rect.width}x${rect.height}px`);
    }
}
```

### ReelController.ts

```typescript
private createSymbols(initialSymbols: number[]): void {
    for (let i = 0; i < symbolCount; i++) {
        const symbolNode = cc.instantiate(this.symbolPrefab);
        const symbolItem = symbolNode.getComponent(SymbolItem);

        // 设置Symbol节点的固定尺寸
        symbolNode.setContentSize(this.config.symbolWidth, this.config.symbolHeight);

        // 设置symbol图片（会根据图片尺寸自动调整Sprite子节点大小）
        symbolItem.setSymbol(symbolId, spriteFrame);

        this.symbolContainer.addChild(symbolNode);
    }
}
```

## 🎯 优势总结

| 特性 | 说明 |
|------|------|
| 🎨 **灵活显示** | 支持不同尺寸的Symbol图片 |
| 📐 **固定布局** | 布局计算基于固定尺寸，不受图片影响 |
| ✨ **视觉效果** | 支持图片溢出，实现特殊视觉效果 |
| 🔧 **易于维护** | 逻辑与显示分离，便于扩展和修改 |
| 🎭 **动画支持** | 可独立控制Symbol节点和Sprite节点动画 |
| 📦 **资源灵活** | 随时替换不同尺寸的图片资源 |

## ⚠️ 注意事项

### 1. Sprite组件配置

必须在SymbolItem组件中正确配置Sprite属性：
```
SymbolItem (组件)
  └─ Sprite: 必须拖入Sprite子节点的Sprite组件
```

### 2. 节点层级结构

预制体必须严格按照以下结构：
```
Symbol (根节点)
  └─ Sprite (子节点)
       └─ cc.Sprite (组件)
```

### 3. 锚点设置

建议两个节点都设置为中心锚点：
```
Symbol: AnchorPoint (0.5, 0.5)
Sprite: AnchorPoint (0.5, 0.5)
```

### 4. 图片溢出

Sprite图片可以超出Symbol节点范围，这是正常现象：
- 用于实现Wild、Scatter等特殊符号的视觉效果
- 确保Mask正确配置，控制可见区域

### 5. 中奖动画

中奖动画应该应用到Symbol节点（父节点），而不是Sprite节点：
```typescript
// 正确：应用到Symbol节点
cc.tween(this.node)
    .to(0.1, { scale: 1.1 })
    .start();

// 错误：不要只应用到Sprite节点
// cc.tween(this.sprite.node).to(0.1, { scale: 1.1 }).start();
```

## 🔍 调试技巧

### 显示Symbol边界

在开发时，可以显示Symbol节点的边界框：

```typescript
// 在Symbol节点上添加边框
const debugGraphics = this.node.addComponent(cc.Graphics);
debugGraphics.strokeColor = cc.Color.GREEN;
debugGraphics.rect(-65, -50, 130, 100);
debugGraphics.stroke();
```

### 显示Sprite边界

同样可以显示Sprite节点的实际尺寸：

```typescript
// 在Sprite节点上添加边框
const spriteDebug = this.sprite.node.addComponent(cc.Graphics);
spriteDebug.strokeColor = cc.Color.RED;
const size = this.sprite.node.getContentSize();
spriteDebug.rect(-size.width/2, -size.height/2, size.width, size.height);
spriteDebug.stroke();
```

### 检查节点尺寸

在控制台输出节点尺寸信息：

```typescript
cc.log(`Symbol节点尺寸: ${this.node.width}x${this.node.height}`);
cc.log(`Sprite节点尺寸: ${this.sprite.node.width}x${this.sprite.node.height}`);
```

## 📚 相关文档

- [ReelArea动态布局配置指南](./ReelArea_DynamicLayout_Guide.md)
- [Symbol映射配置指南](./SymbolMapping_Configuration_Guide.md)
- [设计文档](./SlotMachine_Design_Document.md)

---

**版本**: v1.0.0
**最后更新**: 2025-12-25
