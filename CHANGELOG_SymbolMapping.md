# 更新说明 - Symbol图片名称映射功能

## 📅 更新日期
2025-12-25

## 🎯 更新内容

### 新增功能：Symbol图片名称映射配置

**之前**：
- Symbol图片必须命名为`symbol_0`, `symbol_1`, `symbol_2`...
- 无法使用有意义的名称如`L01`, `H01`, `W01`

**现在**：
- ✅ 支持通过配置将symbolId映射到任意图片名称
- ✅ 支持使用`L01`, `H01`, `W01`, `S01`等实际名称
- ✅ 提供`SymbolType`枚举提高代码可读性
- ✅ 自动验证配置正确性，详细日志输出

## 📝 修改的文件

### 1. SlotConfig.ts
**新增**：
- `symbolNameMap: string[]` - Symbol名称映射数组
- `getSymbolImageName(symbolId)` - 获取图片名称方法
- `validateSymbolConfig()` - 验证配置方法

```typescript
@property({
    type: [cc.String],
    tooltip: "Symbol图片名称映射表"
})
symbolNameMap: string[] = [
    "L01", "L02", "L03", "L04", "L05", "L06",  // 0-5
    "H01", "H02", "H03", "H04", "H05",         // 6-10
    "W01", "S01"                               // 11-12
];
```

### 2. SlotMachine.ts
**修改**：
- `init()` - 添加配置验证
- `loadSymbolSprites()` - 使用映射加载图片
- `loadWinAnimationFrames()` - 使用映射加载动画帧

**改进**：
- 详细的加载日志
- 图片加载失败提示更友好

### 3. DataTypes.ts
**新增**：
- `SymbolType` 枚举 - 包含所有symbol的常量定义

```typescript
export enum SymbolType {
    L01 = 0,  // 字母9
    L02 = 1,  // 字母10
    ...
    WILD = 11,
    SCATTER = 12
}
```

### 4. GameScene.ts
**修改**：
- `initSlotMachine()` - 展示如何使用`SymbolType`枚举创建布局

### 5. ResultManager.ts
**修改**：
- 导入`SymbolType`，支持使用枚举创建结果

## 📚 新增文档

1. **SymbolMapping_Configuration_Guide.md**
   - 完整的配置指南
   - 详细的使用示例
   - 常见问题解答

2. **SymbolMapping_QuickReference.md**
   - 快速参考手册
   - 配置对照表
   - 常用代码片段

## 🔄 兼容性

### 向后兼容
✅ **完全兼容**旧的命名方式

如果不配置`symbolNameMap`，系统会自动使用默认命名`symbol_0`, `symbol_1`...

```typescript
// 旧项目无需修改，继续使用默认命名
if (!this.symbolNameMap || this.symbolNameMap.length === 0) {
    return `symbol_${symbolId}`;  // 降级到旧命名
}
```

### 迁移建议

**不需要立即迁移**！现有项目可以继续使用旧命名。

**如果要使用新功能**：
1. 在SlotConfig中配置`symbolNameMap`数组
2. 重命名图集中的SpriteFrame，或修改映射配置
3. （可选）使用`SymbolType`枚举替代数字

## 📖 使用示例

### 编辑器配置
```
SlotConfig组件
  └─ Symbol Name Map
      ├─ [0]: "L01"
      ├─ [1]: "L02"
      ...
      └─ [12]: "S01"
```

### 代码使用
```typescript
// 方式1: 使用枚举（推荐）
const layout = [
    [SymbolType.L01, SymbolType.H01, SymbolType.WILD],
    [SymbolType.L02, SymbolType.H02, SymbolType.SCATTER],
    ...
];

// 方式2: 使用数字（向后兼容）
const layout = [
    [0, 6, 11],
    [1, 7, 12],
    ...
];
```

## 🐛 修复的问题

1. ✅ 图片命名必须为`symbol_N`的限制
2. ✅ 无法使用有意义的symbol名称
3. ✅ 图片加载失败时提示不够详细

## ⚡ 性能影响

**无性能影响** - 只是加载时多了一层名称映射，对运行时性能无影响。

## 🎓 学习资源

| 文档 | 说明 |
|------|------|
| [快速参考](./SymbolMapping_QuickReference.md) | 3分钟快速上手 |
| [完整指南](./SymbolMapping_Configuration_Guide.md) | 详细配置和使用说明 |
| [设计文档](./SlotMachine_Design_Document.md) | 架构设计文档 |

## ✨ 推荐用法

```typescript
// 1. 定义Symbol常量（DataTypes.ts中已包含）
import { SymbolType } from "./DataTypes";

// 2. 使用枚举创建布局
const layout = [
    [SymbolType.H01, SymbolType.H02, SymbolType.H03],
    [SymbolType.L01, SymbolType.WILD, SymbolType.L02],
    [SymbolType.L03, SymbolType.SCATTER, SymbolType.L04]
];

// 3. 创建中奖结果
const result: SpinResult = {
    finalLayout: layout,
    winPositions: [
        {row: 1, col: 1, symbolId: SymbolType.WILD}
    ]
};
```

## 🔮 未来计划

- [ ] 支持从JSON文件加载Symbol映射配置
- [ ] 支持多语言Symbol名称
- [ ] Symbol分组和分类管理
- [ ] 可视化Symbol映射配置工具

## 📞 反馈与支持

如有问题或建议，请查看：
- [完整配置指南](./SymbolMapping_Configuration_Guide.md) 的常见问题章节
- 检查控制台日志获取详细错误信息
- 确保配置验证通过：`config.validateSymbolConfig()`

---

**更新版本**: v1.1.0
**最后更新**: 2025-12-25
