# Symbol映射配置 - 快速参考

## 📌 核心概念

将**symbolId**（0-12）映射到**实际图片名称**（如`L01`, `H01`, `W01`），实现灵活的资源管理。

## ⚙️ 配置步骤（3步）

### 1️⃣ 配置SlotConfig

在编辑器中找到`SlotConfig`组件 → 展开`Symbol Name Map`数组：

```
Size: 13
[0] = "L01"  // symbolId 0 映射到 L01.png
[1] = "L02"  // symbolId 1 映射到 L02.png
...
[11] = "W01" // symbolId 11 映射到 W01.png (Wild)
[12] = "S01" // symbolId 12 映射到 S01.png (Scatter)
```

### 2️⃣ 准备图片资源

确保SpriteAtlas中的SpriteFrame名称与配置一致：

```
Symbol Atlas:
  ├── L01 ✓
  ├── L02 ✓
  ├── H01 ✓
  ...
  ├── W01 ✓
  └── S01 ✓

Win Animation Atlas:
  ├── L01_win/frame_00 ✓
  ├── L01_win/frame_01 ✓
  ...
  ├── H01_win/frame_00 ✓
  └── ...
```

### 3️⃣ 在代码中使用

```typescript
import { SymbolType } from "./DataTypes";

// 使用枚举创建布局（推荐）
const layout = [
    [SymbolType.L01, SymbolType.H01, SymbolType.WILD],
    [SymbolType.L02, SymbolType.H02, SymbolType.SCATTER],
    [SymbolType.L03, SymbolType.H03, SymbolType.H04]
];

// 或使用数字（不推荐）
const layout2 = [
    [0, 6, 11],  // L01, H01, WILD
    [1, 7, 12],  // L02, H02, SCATTER
    [2, 8, 9]    // L03, H03, H04
];
```

## 🎯 SymbolType枚举对照表

| 枚举常量 | symbolId | 图片名称 | 说明 |
|---------|----------|---------|------|
| `SymbolType.L01` | 0 | L01 | 字母9 |
| `SymbolType.L02` | 1 | L02 | 字母10 |
| `SymbolType.L03` | 2 | L03 | 字母J |
| `SymbolType.L04` | 3 | L04 | 字母Q |
| `SymbolType.L05` | 4 | L05 | 字母K |
| `SymbolType.L06` | 5 | L06 | 字母A |
| `SymbolType.H01` | 6 | H01 | 圣诞帽 |
| `SymbolType.H02` | 7 | H02 | 礼物盒 |
| `SymbolType.H03` | 8 | H03 | 铃铛 |
| `SymbolType.H04` | 9 | H04 | 拐杖糖 |
| `SymbolType.H05` | 10 | H05 | 圣诞树 |
| `SymbolType.WILD` | 11 | W01 | Wild符号 |
| `SymbolType.SCATTER` | 12 | S01 | Scatter符号 |

## 🔍 验证与调试

### 运行时日志

```
[SlotMachine] Loading symbol sprites with name mapping...
[SlotMachine]   ✓ Symbol 0: L01
[SlotMachine]   ✓ Symbol 1: L02
...
[SlotMachine] Loaded 13/13 symbol sprites
```

### 常见错误

❌ **图片加载失败**
```
[SlotMachine]   ✗ Symbol sprite not found: H06 (symbolId: 10)
```
**解决**: 检查图集中是否存在名为`H06`的SpriteFrame

❌ **配置长度不匹配**
```
[SlotConfig] symbolNameMap length (10) does not match symbolTypes (13)
```
**解决**: 确保`symbolNameMap.length === symbolTypes`

## 📝 使用示例

### 创建随机布局
```typescript
// 使用SymbolType枚举数组
const symbolPool = [
    SymbolType.L01, SymbolType.L02, SymbolType.L03,
    SymbolType.H01, SymbolType.H02, SymbolType.WILD
];

function getRandomSymbol(): number {
    return symbolPool[Math.floor(Math.random() * symbolPool.length)];
}

const randomLayout: SymbolLayout = [
    [getRandomSymbol(), getRandomSymbol(), getRandomSymbol()],
    [getRandomSymbol(), getRandomSymbol(), getRandomSymbol()],
    [getRandomSymbol(), getRandomSymbol(), getRandomSymbol()]
];
```

### 创建中奖结果
```typescript
// H02礼物盒横向连线中奖
const winResult: SpinResult = {
    finalLayout: [
        [SymbolType.L01, SymbolType.L02, SymbolType.L03, SymbolType.L04, SymbolType.L05],
        [SymbolType.H02, SymbolType.H02, SymbolType.H02, SymbolType.H02, SymbolType.H02], // 全是H02
        [SymbolType.L06, SymbolType.H01, SymbolType.H03, SymbolType.H04, SymbolType.H05]
    ],
    winPositions: [
        {row: 1, col: 0, symbolId: SymbolType.H02},
        {row: 1, col: 1, symbolId: SymbolType.H02},
        {row: 1, col: 2, symbolId: SymbolType.H02},
        {row: 1, col: 3, symbolId: SymbolType.H02},
        {row: 1, col: 4, symbolId: SymbolType.H02}
    ]
};
```

## 🛠️ 辅助函数

### SlotConfig方法

```typescript
// 获取图片名称
config.getSymbolImageName(0);  // 返回 "L01"
config.getSymbolImageName(11); // 返回 "W01"

// 验证配置
if (config.validateSymbolConfig()) {
    console.log("配置正确");
}
```

## ✅ 优势总结

| 特性 | 说明 |
|------|------|
| 🎨 **灵活命名** | 支持任意图片命名规则 |
| 📖 **代码可读** | 使用枚举提高代码可读性 |
| 🔧 **易于维护** | 修改映射无需改代码 |
| 🚀 **快速扩展** | 新增symbol只需扩展数组 |
| 🐛 **调试友好** | 详细日志快速定位问题 |

---

**相关文档**:
- [完整配置指南](./SymbolMapping_Configuration_Guide.md)
- [设计文档](./SlotMachine_Design_Document.md)
