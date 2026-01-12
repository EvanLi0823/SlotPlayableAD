# Symbol图片名称映射配置指南

## 概述

该功能允许您通过配置将`symbolId`（0-12）映射到实际的图片名称（如`L01`, `H01`, `W01`, `S01`），而不是使用固定的命名规则`symbol_0`, `symbol_1`...

## 配置方法

### 1. 在编辑器中配置（推荐）

1. 在层级管理器中选择包含`SlotMachine`组件的节点
2. 在属性检查器中找到`SlotConfig`组件
3. 找到`Symbol Name Map`属性
4. 点击展开数组，配置每个symbolId对应的图片名称

**配置示例**:
```
Size: 13
Element 0: "L01"   // symbolId 0 -> L01.png (字母9)
Element 1: "L02"   // symbolId 1 -> L02.png (字母10)
Element 2: "L03"   // symbolId 2 -> L03.png (字母J)
Element 3: "L04"   // symbolId 3 -> L04.png (字母Q)
Element 4: "L05"   // symbolId 4 -> L05.png (字母K)
Element 5: "L06"   // symbolId 5 -> L06.png (字母A)
Element 6: "H01"   // symbolId 6 -> H01.png (圣诞帽)
Element 7: "H02"   // symbolId 7 -> H02.png (礼物盒)
Element 8: "H03"   // symbolId 8 -> H03.png (铃铛)
Element 9: "H04"   // symbolId 9 -> H04.png (拐杖糖)
Element 10: "H05"  // symbolId 10 -> H05.png (圣诞树)
Element 11: "W01"  // symbolId 11 -> W01.png (Wild)
Element 12: "S01"  // symbolId 12 -> S01.png (Scatter)
```

### 2. 在代码中配置（可选）

如果需要在代码中动态修改映射：

```typescript
// 在GameScene或其他初始化脚本中
const slotConfig = this.slotMachine.config;

slotConfig.symbolNameMap = [
    "L01", "L02", "L03", "L04", "L05", "L06",  // Low value symbols (0-5)
    "H01", "H02", "H03", "H04", "H05",         // High value symbols (6-10)
    "W01", "S01"                               // Special symbols (11-12)
];

// 更新symbolTypes匹配数组长度
slotConfig.symbolTypes = slotConfig.symbolNameMap.length;
```

## 资源命名规范

### 普通状态图片命名

图片必须按照映射表中配置的名称命名，存放在SpriteAtlas中：

```
assets/Texture/Symbols.plist (图集)
  ├── L01 (SpriteFrame名称)
  ├── L02
  ├── L03
  ├── L04
  ├── L05
  ├── L06
  ├── H01
  ├── H02
  ├── H03
  ├── H04
  ├── H05
  ├── W01
  └── S01
```

**重要**: 图集中的SpriteFrame名称必须与`symbolNameMap`中配置的名称**完全一致**（区分大小写）。

### 中奖动画帧序列命名

中奖动画帧序列命名规则：`{图片名称}_win/frame_00`, `frame_01`...

```
assets/Texture/WinAnimations.plist (图集)
  ├── L01_win/frame_00
  ├── L01_win/frame_01
  ├── L01_win/frame_02
  ├── ...
  ├── H01_win/frame_00
  ├── H01_win/frame_01
  ├── ...
  ├── W01_win/frame_00
  ├── W01_win/frame_01
  └── ...
```

## 使用示例

### 示例1：使用symbolId创建布局

```typescript
// 在GameScene中定义初始布局
const initialLayout = [
    [0, 6, 11, 7, 1],   // 第0行: L01, H01, W01, H02, L02
    [2, 7, 8, 9, 3],    // 第1行: L03, H02, H03, H04, L04
    [4, 10, 12, 6, 5]   // 第2行: L05, H05, S01, H01, L06
];

// 初始化SlotMachine（symbolId会自动映射到对应图片）
this.slotMachine.init(initialLayout);
```

### 示例2：生成测试结果

```typescript
// 创建一个中奖结果（H02礼物盒横向连线）
const spinResult: SpinResult = {
    finalLayout: [
        [0, 1, 2, 3, 4],
        [7, 7, 7, 7, 7],  // 全是symbolId=7 (H02礼物盒)
        [5, 6, 8, 9, 10]
    ],
    winPositions: [
        {row: 1, col: 0, symbolId: 7},
        {row: 1, col: 1, symbolId: 7},
        {row: 1, col: 2, symbolId: 7},
        {row: 1, col: 3, symbolId: 7},
        {row: 1, col: 4, symbolId: 7}
    ]
};

this.slotMachine.spin(spinResult);
```

### 示例3：定义Symbol常量（推荐）

为了代码可读性，建议定义常量：

```typescript
// 在DataTypes.ts或单独的文件中添加
export enum SymbolType {
    // Low value symbols (0-5)
    L01 = 0,  // 9
    L02 = 1,  // 10
    L03 = 2,  // J
    L04 = 3,  // Q
    L05 = 4,  // K
    L06 = 5,  // A

    // High value symbols (6-10)
    H01 = 6,  // 圣诞帽
    H02 = 7,  // 礼物盒
    H03 = 8,  // 铃铛
    H04 = 9,  // 拐杖糖
    H05 = 10, // 圣诞树

    // Special symbols (11-12)
    WILD = 11,     // W01
    SCATTER = 12   // S01
}

// 使用常量创建布局（更直观）
const initialLayout = [
    [SymbolType.L01, SymbolType.H01, SymbolType.WILD, SymbolType.H02, SymbolType.L02],
    [SymbolType.L03, SymbolType.H02, SymbolType.H03, SymbolType.H04, SymbolType.L04],
    [SymbolType.L05, SymbolType.H05, SymbolType.SCATTER, SymbolType.H01, SymbolType.L06]
];
```

## 验证配置

系统会自动验证配置的正确性：

```typescript
// 在SlotMachine初始化时自动调用
if (!this.config.validateSymbolConfig()) {
    cc.error("Symbol configuration invalid!");
}
```

**验证规则**:
1. `symbolNameMap`数组不能为空
2. `symbolNameMap.length`必须等于`symbolTypes`
3. 图集中必须存在对应名称的SpriteFrame

## 调试日志

开启日志后，控制台会显示详细的加载信息：

```
[SlotMachine] Loading symbol sprites with name mapping...
[SlotMachine]   ✓ Symbol 0: L01
[SlotMachine]   ✓ Symbol 1: L02
[SlotMachine]   ✓ Symbol 2: L03
...
[SlotMachine]   ✓ Symbol 11: W01
[SlotMachine]   ✓ Symbol 12: S01
[SlotMachine] Loaded 13/13 symbol sprites
```

如果某个图片加载失败：
```
[SlotMachine]   ✗ Symbol sprite not found: H06 (symbolId: 10)
[SlotMachine]     Please check if the image exists in the atlas with exact name: "H06"
```

## 常见问题

### Q1: 图片加载失败怎么办？

**A**: 检查以下几点：
1. 图集中的SpriteFrame名称是否与配置完全一致（区分大小写）
2. `symbolTypes`是否等于`symbolNameMap`数组长度
3. 图集是否正确拖拽到`SlotConfig`的`symbolAtlas`属性

### Q2: 能否使用不同的命名规则？

**A**: 可以！`symbolNameMap`支持任意命名，例如：
- `["sym_a", "sym_b", "sym_c", ...]`
- `["icon1", "icon2", "icon3", ...]`
- `["cherry", "lemon", "orange", ...]`

只需确保图集中存在对应名称的SpriteFrame即可。

### Q3: 如何修改现有项目的命名？

**A**:
1. 方案1（推荐）：在图集中重命名SpriteFrame，使其匹配`symbolNameMap`
2. 方案2：修改`symbolNameMap`配置，使其匹配图集中的SpriteFrame名称

### Q4: 中奖动画帧序列必须遵循固定命名吗？

**A**: 是的，中奖动画帧序列必须遵循`{图片名称}_win/frame_XX`的命名规则。如需自定义，可以修改`SlotMachine.loadWinAnimationFrames()`方法。

## 完整配置流程

1. **准备资源**:
   - 创建Symbol图片（L01.png, L02.png, H01.png...）
   - 创建中奖动画帧序列（L01_win/frame_00.png...）

2. **导入到Cocos Creator**:
   - 将图片导入到`assets/Texture/Symbols/`目录
   - 将图片打包到SpriteAtlas

3. **配置SlotConfig**:
   - 拖拽图集到`symbolAtlas`属性
   - 配置`symbolNameMap`数组
   - 确保`symbolTypes = symbolNameMap.length`

4. **测试验证**:
   - 运行场景
   - 检查控制台日志确认所有图片加载成功
   - 测试spin功能确认图片显示正确

## 总结

使用Symbol映射配置的优势：

✅ **灵活性**: 支持任意命名规则，不受`symbol_0`, `symbol_1`限制
✅ **可读性**: 图片名称更直观（H01表示高价值符号1）
✅ **可维护性**: 修改映射关系只需调整配置，无需修改代码
✅ **扩展性**: 轻松添加新symbol，只需扩展数组
✅ **调试友好**: 详细的日志输出，快速定位问题

---

**相关文件**:
- `assets/Script/SlotConfig.ts` - 配置类
- `assets/Script/SlotMachine.ts` - 加载逻辑
- `assets/Script/DataTypes.ts` - 数据结构定义
