# 场景节点手动创建详细步骤

由于Cocos Creator的限制，**运行时创建的节点无法保存到场景文件**。因此需要在编辑器中手动创建节点。

本指南提供**最详细的分步创建说明**，跟着做即可完成。

---

## 📋 准备工作

1. 打开Cocos Creator
2. 创建新场景或打开现有场景
3. 确保场景中有Canvas节点
4. 准备好本文档（边看边操作）

---

## 🎯 创建步骤（按顺序）

### 第一部分：基础结构（5个节点）

#### 1. 创建Background
1. 右键 `Canvas` → **创建节点 → 创建空节点**
2. 重命名为 `Background`
3. 在属性检查器中设置：
   - Position: (0, 0)
   - Size: Width=2400, Height=1334
   - Color: 灰色 (100, 100, 100)
4. 添加组件 Widget：
   - 勾选 Top、Bottom、Left、Right
   - 都设为 0

#### 2. 创建LeftSide
1. 右键 `Canvas` → 创建空节点 → 命名 `LeftSide`
2. 属性：Position=(-780, 0), Size=(840, 1334)
3. 右键 `LeftSide` → 创建空节点 → 命名 `LeftPanel`
4. 在 `LeftPanel` 下创建3个子节点：
   - `Background`: Size=(140, 400), Color=蓝色(50, 100, 150)
   - `Icon`: Position=(0, 80), Size=(80, 80), Color=黄色(255, 200, 0)
   - `DownloadBtn`: Position=(0, -80), Size=(120, 50), Color=绿色(0, 200, 100)
     - 为 `DownloadBtn` 添加 **Button** 组件

#### 3. 创建RightSide（与LeftSide对称）
1. **复制LeftSide节点**（Ctrl+D / Cmd+D）
2. 重命名为 `RightSide`
3. 修改Position为 **(780, 0)**
4. 展开 `RightSide/RightPanel`，确认子节点也都复制了

#### 4. 创建PopupLayer
1. 右键 `Canvas` → 创建空节点 → `PopupLayer`
2. 属性：Position=(0, 0), Size=(2400, 1334)

#### 5. 创建AnimationLayer
1. 右键 `Canvas` → 创建空节点 → `AnimationLayer`
2. 属性：Position=(0, 0), Size=(2400, 1334)
3. 右键 `AnimationLayer` → 创建空节点 → `CashFlyContainer`

---

### 第二部分：中央游戏区域（最复杂）

#### 6. 创建CentralArea
1. 右键 `Canvas` → 创建空节点 → `CentralArea`
2. 属性：Position=(0, 0), Size=(720, 1334)

#### 7. 创建TopBar
1. 右键 `CentralArea` → 创建空节点 → `TopBar`
2. 属性：Position=(0, 550), Size=(720, 120)
3. 在 `TopBar` 下创建：
   - `Background`: Size=(720, 120), Color=紫色(80, 50, 100)
   - `AmountLabel`: Position=(0, 0)
     - 添加 **Label** 组件
     - String: "$1000"
     - Font Size: 48

#### 8. 创建BottomBar
1. 右键 `CentralArea` → 创建空节点 → `BottomBar`
2. 属性：Position=(0, -550), Size=(720, 150)
3. 右键 `BottomBar` → 创建空节点 → `SpinButton`
4. `SpinButton` 属性：Position=(0, 0), Size=(200, 80), Color=红色(200, 50, 50)
5. 添加 **Button** 组件
6. 在 `SpinButton` 下创建：
   - `Background`: Size=(200, 80), zIndex=-1, Color=(180, 40, 40)
   - `Label`: 添加Label组件，String="SPIN", Font Size=36

#### 9. 创建ReelArea（动态加载方式）

**重要说明**：本节采用**动态加载**方式，Reel和Symbol通过Prefab在运行时动态创建，位置根据ReelArea的Size自动计算。

**9.1 创建基础结构**
1. 右键 `CentralArea` → 创建空节点 → `ReelArea`
2. 属性：Position=(0, 100), Size=(670, 310)
   - **注意**：Size可以在编辑器中调整，代码会自动根据新尺寸计算布局
3. 在 `ReelArea` 下创建：
   - `Background`: Size=(670, 310), zIndex=-1, Color=(40, 40, 80)
   - `Mask`: Size=(670, 310)
     - 添加 **Mask** 组件，Type=RECT

**9.2 创建ReelContainer（空节点）**
1. 右键 `Mask` → 创建空节点 → `ReelContainer`
2. Position=(0, 0)
3. **不需要手动创建Reel和Symbol节点**，它们将在运行时通过代码动态创建

**9.3 创建Symbol Prefab（重要！）**

Symbol Prefab是动态加载的模板，需要先创建：

1. **在Scene中创建临时Symbol节点**：
   - 右键场景根节点 → 创建空节点 → `Symbol`
   - 设置Size=(130, 100)

2. **添加Sprite组件**：
   - 点击 Add Component → Renderer Component → Sprite
   - 配置：
     - Type: SIMPLE
     - Size Mode: CUSTOM
     - Trim: 不勾选
   - Sprite Frame: 暂不设置（将在代码中动态设置）

3. **添加SymbolItem脚本**：
   - 点击 Add Component → Custom Script → SymbolItem
   - 在SymbolItem.ts中需要实现：
     ```typescript
     @ccclass
     export default class SymbolItem extends cc.Component {
         private symbolId: number = 0;
         private spriteFrames: cc.SpriteFrame[] = [];

         init(spriteFrames: cc.SpriteFrame[]) {
             this.spriteFrames = spriteFrames;
         }

         setSymbol(symbolId: number) {
             this.symbolId = symbolId;
             const sprite = this.getComponent(cc.Sprite);
             if (sprite && this.spriteFrames[symbolId]) {
                 sprite.spriteFrame = this.spriteFrames[symbolId];
             }
         }

         getSymbolId(): number {
             return this.symbolId;
         }
     }
     ```

4. **制作成Prefab**：
   - 将场景中的 `Symbol` 节点拖拽到资源管理器的 `assets/Prefabs/` 文件夹
   - 生成 `Symbol.prefab` 文件
   - 删除场景中的临时Symbol节点

**9.4 配置SlotMachine组件**

1. **选中SlotMachine节点**
2. **添加SlotMachine脚本组件**
3. **配置属性**：
   - Symbol Prefab: 拖拽 `assets/Prefabs/Symbol.prefab`
   - Symbol Sprite Frames: 添加13个Symbol的SpriteFrame
     - L01, L02, L03, L04, L05, L06 (ID: 0-5)
     - H01, H02, H03, H04, H05 (ID: 6-10)
     - W01 (ID: 11)
     - S01 (ID: 12)
   - Reel Area: 拖拽场景中的 `ReelArea` 节点

**9.5 SlotMachine脚本实现要点**

```typescript
@ccclass
export default class SlotMachine extends cc.Component {
    @property(cc.Prefab)
    symbolPrefab: cc.Prefab = null;

    @property([cc.SpriteFrame])
    symbolSpriteFrames: cc.SpriteFrame[] = [];

    @property(cc.Node)
    reelArea: cc.Node = null;

    private reels: ReelController[] = [];

    onLoad() {
        this.init();
    }

    init() {
        // 1. 获取ReelArea尺寸
        const reelAreaSize = this.reelArea.getContentSize();

        // 2. 配置
        const config = {
            reelAreaWidth: reelAreaSize.width,
            reelAreaHeight: reelAreaSize.height,
            rows: 3,
            cols: 5,
            symbolGap: 4,
            symbolPrefab: this.symbolPrefab
        };

        // 3. 计算布局
        const layout = this.calculateLayout(config);

        // 4. 动态创建Reel和Symbol
        this.createReels(config, layout);
    }

    calculateLayout(config) {
        const { reelAreaWidth, reelAreaHeight, rows, cols, symbolGap } = config;

        // 计算Symbol尺寸
        const symbolWidth = (reelAreaWidth - symbolGap * (cols - 1)) / cols;
        const symbolHeight = (reelAreaHeight - symbolGap * (rows - 1)) / rows;
        const unitWidth = symbolWidth + symbolGap;
        const unitHeight = symbolHeight + symbolGap;

        // 计算Reel的X坐标
        const totalWidth = symbolWidth * cols + symbolGap * (cols - 1);
        const startX = -totalWidth / 2 + symbolWidth / 2;
        const reelPositionsX = [];
        for (let i = 0; i < cols; i++) {
            reelPositionsX[i] = startX + i * unitWidth;
        }

        // 计算Symbol的Y坐标（7个Symbol）
        const symbolsPerReel = 7;
        const centerIndex = 3;
        const symbolPositionsY = [];
        for (let i = 0; i < symbolsPerReel; i++) {
            const offset = (i - centerIndex) * unitHeight;
            symbolPositionsY[i] = -offset;
        }

        return {
            symbolWidth,
            symbolHeight,
            unitWidth,
            unitHeight,
            reelPositionsX,
            symbolPositionsY
        };
    }

    createReels(config, layout) {
        const reelContainer = this.reelArea.getChildByName('ReelContainer')
                           || this.reelArea.getChildByName('Mask').getChildByName('ReelContainer');

        for (let col = 0; col < config.cols; col++) {
            // 创建Reel节点
            const reelNode = new cc.Node(`Reel_${col}`);
            reelNode.setPosition(layout.reelPositionsX[col], 0);
            reelNode.parent = reelContainer;

            // 创建SymbolContainer
            const symbolContainer = new cc.Node('SymbolContainer');
            symbolContainer.parent = reelNode;

            // 创建Symbol
            for (let i = 0; i < 7; i++) {
                const symbolNode = cc.instantiate(this.symbolPrefab);
                symbolNode.name = `Symbol_${i}`;
                symbolNode.setContentSize(layout.symbolWidth, layout.symbolHeight);
                symbolNode.setPosition(0, layout.symbolPositionsY[i]);
                symbolNode.parent = symbolContainer;

                // 初始化Symbol
                const symbolItem = symbolNode.getComponent('SymbolItem');
                if (symbolItem) {
                    symbolItem.init(this.symbolSpriteFrames);
                    symbolItem.setSymbol(Math.floor(Math.random() * 13));
                }
            }
        }
    }
}
```

**9.6 运行时动态调整（可选）**

如果需要在运行时调整ReelArea尺寸：
```typescript
// 在SlotMachine中添加
updateReelAreaSize(newWidth: number, newHeight: number) {
    this.reelArea.setContentSize(newWidth, newHeight);

    // 重新计算布局并更新所有节点
    const config = {
        reelAreaWidth: newWidth,
        reelAreaHeight: newHeight,
        rows: 3,
        cols: 5,
        symbolGap: 4,
        symbolPrefab: this.symbolPrefab
    };

    const layout = this.calculateLayout(config);

    // 更新所有Reel和Symbol的位置和尺寸
    // ... (详见设计文档)
}
```

#### 10. 创建SlotMachine控制器节点
1. 右键 `CentralArea` → 创建空节点 → `SlotMachine`
2. 属性：Position=(0, 100)

---

### 第三部分：弹窗系统

#### 11. 创建WinPopup

**11.1 基础结构**
1. 右键 `PopupLayer` → 创建空节点 → `WinPopup`
2. 属性：Position=(0, 0), Size=(2400, 1334)
3. **取消勾选 Active**（初始隐藏）

**11.2 创建Mask和Content**
1. 在 `WinPopup` 下创建 `Mask`：
   - Size=(2400, 1334)
   - Color=黑色(0, 0, 0)
   - Opacity=180
2. 在 `WinPopup` 下创建 `Content`：
   - Size=(500, 400)
   - Color=金色(255, 200, 0)

**11.3 Content子节点**
在 `Content` 下创建：
1. `Background`: Size=(500, 400), zIndex=-1, Color=(230, 180, 0)
2. `AmountLabel`: Position=(0, 80)
   - 添加Label组件
   - String="$1000"
   - Font Size=64
3. `ClaimButton`: Position=(0, -80), Size=(200, 80), Color=绿色(0, 200, 100)
   - 添加Button组件
   - 创建子节点 `Label`：
     - Label组件，String="CLAIM", Font Size=32

#### 12. 创建DownloadPopup

**方法1：复制WinPopup后修改**
1. 复制 `WinPopup` 节点（Ctrl+D）
2. 重命名为 `DownloadPopup`
3. 修改 `Content` 的Color为蓝色(100, 150, 255)
4. 修改 `Background` 的Color为(80, 130, 230)
5. 将 `AmountLabel` 重命名为 `MessageLabel`
   - 修改String为 "Download to continue!"
   - Font Size=28
6. 将 `ClaimButton` 重命名为 `DownloadButton`
   - Size=(250, 90)
   - Color=橙色(255, 100, 0)
   - Label的String改为 "DOWNLOAD"

---

### 第四部分：最后的控制器

#### 13. 创建GameSceneController
1. 右键 `Canvas` → 创建空节点 → `GameSceneController`
2. Position=(0, 0)

---

## ✅ 完成检查

创建完成后，你的层级结构应该是：

```
Canvas
├── Background
├── LeftSide
│   └── LeftPanel
│       ├── Background
│       ├── Icon
│       └── DownloadBtn
├── CentralArea
│   ├── TopBar
│   │   ├── Background
│   │   └── AmountLabel
│   ├── ReelArea
│   │   ├── Background
│   │   └── Mask
│   │       └── ReelContainer
│   │           ├── Reel_0
│   │           │   └── SymbolContainer
│   │           │       ├── Symbol_0 ~ Symbol_6 (7个)
│   │           ├── Reel_1 (同样7个Symbol)
│   │           ├── Reel_2
│   │           ├── Reel_3
│   │           └── Reel_4
│   ├── BottomBar
│   │   └── SpinButton
│   │       ├── Background
│   │       └── Label
│   └── SlotMachine
├── RightSide
│   └── RightPanel
│       ├── Background
│       ├── Icon
│       └── DownloadBtn
├── PopupLayer
│   ├── WinPopup (Active=false)
│   │   ├── Mask
│   │   └── Content
│   │       ├── Background
│   │       ├── AmountLabel
│   │       └── ClaimButton
│   │           └── Label
│   └── DownloadPopup (Active=false)
│       ├── Mask
│       └── Content
│           ├── Background
│           ├── MessageLabel
│           └── DownloadButton
│               └── Label
├── AnimationLayer
│   └── CashFlyContainer
└── GameSceneController
```

**节点总数：约70个**（比运行时创建的少，但结构完整）

---

## 💾 保存

创建完成后：
1. **Ctrl+S / Cmd+S** 保存场景
2. 关闭并重新打开，验证节点都保存了

---

## 🎯 下一步

节点创建完成后，继续按照 `SCENE_SETUP_GUIDE.md` 的步骤：
1. 为各个节点添加脚本组件
2. 配置组件属性
3. 导入资源

---

## 🕐 预估时间

- **快速创建**（熟练）: 15-20分钟
- **首次创建**（边看边做）: 30-40分钟
- **ReelArea部分**: 10-15分钟（最复杂）

---

## 💡 技巧

### 技巧1：使用复制加速
- LeftSide创建好后，复制得到RightSide，只改Position
- Reel_0创建好后，复制4次得到其他Reel
- WinPopup创建好后，复制得到DownloadPopup

### 技巧2：批量设置
- 同时选中多个节点，可以批量设置某些属性（如Color）

### 技巧3：使用搜索
- 在层级管理器顶部的搜索框可以快速定位节点

### 技巧4：锁定节点
- 创建好的节点可以锁定，避免误操作

---

## ❓ 常见问题

**Q: 创建Symbol太慢了？**
A: 创建第一个Symbol后，复制6次，然后只修改Position Y即可。

**Q: 忘记某个节点的属性？**
A: 参考本文档的表格，或运行SceneBuilder在浏览器中查看。

**Q: 可以简化吗？**
A: 可以先创建核心的ReelArea和SlotMachine，其他UI之后再加。

---

## 🎉 完成！

手动创建虽然需要时间，但：
- ✅ 节点会永久保存在场景文件中
- ✅ 完全掌控每个节点的创建
- ✅ 更深入理解场景结构

创建完成后就可以开始添加脚本组件了！加油！💪
