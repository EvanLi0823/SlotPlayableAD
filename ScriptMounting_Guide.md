# 脚本挂载节点结构说明

## 🌳 完整场景节点结构

```
Canvas
  ├─ GameSceneController (节点)                      ← GameScene 组件
  │
  ├─ Background (节点)
  │
  ├─ LeftSide (节点)
  │    └─ LeftPanel (节点)                           ← LeftSidePanelController 组件
  │         ├─ Icon
  │         └─ DownloadBtn
  │
  ├─ CentralArea (节点)
  │    ├─ TopBar (节点)                              ← TopBarController 组件
  │    │    ├─ Background
  │    │    └─ AmountLabel
  │    │
  │    ├─ ReelArea (节点)                            ← 670×310
  │    │    ├─ Background
  │    │    └─ Mask (节点)                           ← cc.Mask 组件
  │    │         └─ ReelContainer (节点)
  │    │              ├─ Reel_0 (节点)               ← ReelController 组件
  │    │              │    └─ SymbolContainer (节点)
  │    │              │         ├─ Symbol_0 (节点)   ← SymbolItem 组件 (从预制体实例化)
  │    │              │         ├─ Symbol_1 (节点)   ← SymbolItem 组件
  │    │              │         ├─ Symbol_2 (节点)   ← SymbolItem 组件
  │    │              │         ├─ Symbol_3 (节点)   ← SymbolItem 组件
  │    │              │         ├─ Symbol_4 (节点)   ← SymbolItem 组件
  │    │              │         ├─ Symbol_5 (节点)   ← SymbolItem 组件
  │    │              │         └─ Symbol_6 (节点)   ← SymbolItem 组件
  │    │              ├─ Reel_1 (节点)               ← ReelController 组件
  │    │              ├─ Reel_2 (节点)               ← ReelController 组件
  │    │              ├─ Reel_3 (节点)               ← ReelController 组件
  │    │              └─ Reel_4 (节点)               ← ReelController 组件
  │    │
  │    ├─ SlotMachine (节点)                         ← SlotMachine 组件
  │    │                                             ← SlotConfig 组件
  │    │
  │    └─ BottomBar (节点)
  │         └─ SpinButton (节点)                     ← SpinButtonController 组件
  │              ├─ Background
  │              └─ Label
  │
  ├─ RightSide (节点)
  │    └─ RightPanel (节点)                          ← RightSidePanelController 组件
  │         ├─ Icon
  │         └─ DownloadBtn
  │
  ├─ PopupLayer (节点)
  │    ├─ WinPopup (节点)                            ← WinPopupController 组件
  │    │    ├─ Mask
  │    │    └─ Content
  │    │         ├─ Background
  │    │         ├─ AmountLabel
  │    │         └─ ClaimButton
  │    │
  │    └─ DownloadPopup (节点)                       ← DownloadPopupController 组件
  │         ├─ Mask
  │         └─ Content
  │              ├─ Background
  │              ├─ MessageLabel
  │              └─ DownloadButton
  │
  └─ AnimationLayer (节点)
       └─ CashFlyContainer (节点)                    ← CashFlyAnimController 组件
```

## 📋 脚本挂载清单

### 1. 主控制器脚本

| 脚本名称 | 挂载节点 | 作用 |
|---------|---------|------|
| `GameScene.ts` | GameSceneController | 游戏主场景控制器，协调所有子系统 |
| `SlotMachine.ts` | SlotMachine | Slot机核心逻辑，管理Reel和中奖动画 |
| `SlotConfig.ts` | SlotMachine | 配置组件，存储所有游戏参数 |

### 2. UI控制器脚本

| 脚本名称 | 挂载节点 | 作用 |
|---------|---------|------|
| `TopBarController.ts` | TopBar | 顶部栏控制器，显示余额等信息 |
| `SpinButtonController.ts` | SpinButton | Spin按钮控制器，处理点击事件 |
| `LeftSidePanelController.ts` | LeftPanel | 左侧面板控制器 |
| `RightSidePanelController.ts` | RightPanel | 右侧面板控制器 |

### 3. 弹窗脚本

| 脚本名称 | 挂载节点 | 作用 |
|---------|---------|------|
| `WinPopupController.ts` | WinPopup | 中奖弹窗控制器 |
| `DownloadPopupController.ts` | DownloadPopup | 下载弹窗控制器 |

### 4. 核心游戏逻辑脚本

| 脚本名称 | 挂载节点 | 作用 |
|---------|---------|------|
| `ReelController.ts` | Reel_0 ~ Reel_4 | 单个Reel控制器，管理Symbol滚动 |
| `SymbolItem.ts` | Symbol_0 ~ Symbol_6 (每个Reel下) | Symbol显示和动画，**从预制体实例化** |

### 5. 动画脚本

| 脚本名称 | 挂载节点 | 作用 |
|---------|---------|------|
| `CashFlyAnimController.ts` | CashFlyContainer | 金币飞行动画控制器 |

### 6. 纯逻辑类（不挂载）

| 脚本名称 | 类型 | 作用 |
|---------|-----|------|
| `GridManager.ts` | 纯类 | 管理Symbol网格，不挂载到节点 |
| `ResultManager.ts` | 纯类 | 管理Spin结果，不挂载到节点 |
| `WinAnimationController.ts` | 纯类 | 协调中奖动画，不挂载到节点 |
| `DataTypes.ts` | 类型定义 | 数据结构和枚举定义 |

## 🔗 脚本引用关系

### GameScene (主控制器)

```typescript
@ccclass
export default class GameScene extends cc.Component {
    @property(SlotMachine)
    slotMachine: SlotMachine = null;              // → 引用SlotMachine节点

    @property(TopBarController)
    topBar: TopBarController = null;              // → 引用TopBar节点

    @property(SpinButtonController)
    spinButton: SpinButtonController = null;      // → 引用SpinButton节点

    @property(LeftSidePanelController)
    leftSidePanel: LeftSidePanelController = null;

    @property(RightSidePanelController)
    rightSidePanel: RightSidePanelController = null;

    @property(WinPopupController)
    winPopup: WinPopupController = null;          // → 引用WinPopup节点

    @property(DownloadPopupController)
    downloadPopup: DownloadPopupController = null;

    @property(CashFlyAnimController)
    cashFlyAnim: CashFlyAnimController = null;
}
```

### SlotMachine

```typescript
@ccclass
export default class SlotMachine extends cc.Component {
    @property(SlotConfig)
    config: SlotConfig = null;                    // → 引用同节点的SlotConfig组件

    @property([cc.Node])
    reelNodes: cc.Node[] = [];                    // → 引用5个Reel节点 (Reel_0 ~ Reel_4)

    // 内部创建的纯逻辑对象
    private reelControllers: ReelController[] = [];      // 从reelNodes获取
    private gridManager: GridManager = new GridManager();
    private resultManager: ResultManager = new ResultManager();
    private winAnimController: WinAnimationController = new WinAnimationController();
}
```

### ReelController

```typescript
@ccclass
export default class ReelController extends cc.Component {
    @property(cc.Prefab)
    symbolPrefab: cc.Prefab = null;               // → 引用Symbol预制体

    @property(cc.Node)
    symbolContainer: cc.Node = null;              // → 引用SymbolContainer子节点

    // 运行时创建的Symbol实例
    private symbolItems: SymbolItem[] = [];       // 从symbolPrefab实例化7个
}
```

### SymbolItem (从预制体实例化)

```typescript
@ccclass
export default class SymbolItem extends cc.Component {
    @property(cc.Sprite)
    sprite: cc.Sprite = null;                     // → 引用Sprite子节点的Sprite组件
}
```

## 📦 预制体说明

### Symbol预制体 (SymbolPrefab.prefab)

**结构**：
```
Symbol (根节点)
  ├─ SymbolItem 组件
  └─ Sprite (子节点)
       └─ cc.Sprite 组件
```

**配置**：
```
SymbolItem组件
  └─ Sprite: 拖入Sprite子节点的Sprite组件
```

**实例化位置**：
- 由`ReelController`在运行时实例化
- 每个Reel创建7个Symbol实例
- 添加到`SymbolContainer`节点下

## 🎯 详细挂载步骤

### 步骤1：创建主场景节点

在Cocos Creator层级管理器中创建以下节点（按上面的结构树）：

```
Canvas
  ├─ GameSceneController
  ├─ LeftSide/LeftPanel
  ├─ CentralArea/
  │    ├─ TopBar
  │    ├─ ReelArea/Mask/ReelContainer/
  │    │    ├─ Reel_0/SymbolContainer
  │    │    ├─ Reel_1/SymbolContainer
  │    │    ├─ Reel_2/SymbolContainer
  │    │    ├─ Reel_3/SymbolContainer
  │    │    └─ Reel_4/SymbolContainer
  │    ├─ SlotMachine (空节点)
  │    └─ BottomBar/SpinButton
  ├─ RightSide/RightPanel
  ├─ PopupLayer/
  │    ├─ WinPopup
  │    └─ DownloadPopup
  └─ AnimationLayer/CashFlyContainer
```

### 步骤2：挂载组件

#### GameSceneController节点
```
添加组件: GameScene
```

#### SlotMachine节点
```
添加组件: SlotMachine
添加组件: SlotConfig
```

#### 每个Reel节点 (Reel_0 ~ Reel_4)
```
添加组件: ReelController
```

#### TopBar节点
```
添加组件: TopBarController
```

#### SpinButton节点
```
添加组件: SpinButtonController
添加组件: cc.Button
```

#### LeftPanel节点
```
添加组件: LeftSidePanelController
```

#### RightPanel节点
```
添加组件: RightSidePanelController
```

#### WinPopup节点
```
添加组件: WinPopupController
```

#### DownloadPopup节点
```
添加组件: DownloadPopupController
```

#### CashFlyContainer节点
```
添加组件: CashFlyAnimController
```

#### Mask节点
```
添加组件: cc.Mask
设置Type: RECT
```

### 步骤3：配置组件属性

#### GameScene组件配置

在属性检查器中：
```
GameScene组件
  ├─ Slot Machine: 拖入SlotMachine节点
  ├─ Top Bar: 拖入TopBar节点
  ├─ Spin Button: 拖入SpinButton节点
  ├─ Left Side Panel: 拖入LeftPanel节点
  ├─ Right Side Panel: 拖入RightPanel节点
  ├─ Win Popup: 拖入WinPopup节点
  ├─ Download Popup: 拖入DownloadPopup节点
  └─ Cash Fly Anim: 拖入CashFlyContainer节点
```

#### SlotMachine组件配置

```
SlotMachine组件
  ├─ Config: 拖入同节点的SlotConfig组件
  └─ Reel Nodes (数组, Size: 5):
       ├─ [0]: 拖入Reel_0节点
       ├─ [1]: 拖入Reel_1节点
       ├─ [2]: 拖入Reel_2节点
       ├─ [3]: 拖入Reel_3节点
       └─ [4]: 拖入Reel_4节点
```

#### SlotConfig组件配置

```
SlotConfig组件
  ├─ Rows: 3
  ├─ Reels: 5
  ├─ Reel Area Width: 670
  ├─ Reel Area Height: 310
  ├─ Symbol Width: 130
  ├─ Symbol Height: 100
  ├─ Symbol Gap: 4
  ├─ Symbol Types: 13
  ├─ Symbols Per Reel: 7
  ├─ Visible Symbols Per Reel: 3
  ├─ Symbol Name Map (数组, Size: 13):
  │    ├─ [0]: "L01"
  │    ├─ [1]: "L02"
  │    ├─ ...
  │    └─ [12]: "S01"
  ├─ Symbol Atlas: 拖入Symbols图集
  ├─ Win Anim Atlas: 拖入WinAnimations图集
  └─ ... (其他配置参数)
```

#### ReelController组件配置 (每个Reel)

```
ReelController组件
  ├─ Symbol Prefab: 拖入Symbol预制体
  └─ Symbol Container: 拖入该Reel下的SymbolContainer节点
```

### 步骤4：创建Symbol预制体

创建预制体文件：`assets/Prefabs/SymbolPrefab.prefab`

**结构**：
```
Symbol (根节点)
  ├─ ContentSize: 130×100
  ├─ SymbolItem 组件
  └─ Sprite (子节点)
       ├─ Position: (0, 0)
       └─ cc.Sprite 组件
```

**配置**：
```
SymbolItem组件
  └─ Sprite: 拖入Sprite子节点的Sprite组件
```

## 🔄 运行时实例化

### Symbol的动态创建

Symbol节点**不需要手动创建**，而是由`ReelController`在运行时自动创建：

```typescript
// ReelController.createSymbols()

for (let i = 0; i < 7; i++) {
    // 1. 从预制体实例化
    const symbolNode = cc.instantiate(this.symbolPrefab);

    // 2. 获取SymbolItem组件
    const symbolItem = symbolNode.getComponent(SymbolItem);

    // 3. 设置位置和图片
    symbolNode.setPosition(0, yPos);
    symbolItem.setSymbol(symbolId, spriteFrame);

    // 4. 添加到SymbolContainer
    this.symbolContainer.addChild(symbolNode);
}
```

**结果**：每个Reel下的SymbolContainer会包含7个Symbol节点。

## 📊 节点层级对照表

| 节点路径 | 挂载脚本 | 父节点 | 子节点 |
|---------|---------|--------|--------|
| Canvas/GameSceneController | GameScene | Canvas | - |
| Canvas/CentralArea/SlotMachine | SlotMachine, SlotConfig | CentralArea | - |
| Canvas/CentralArea/ReelArea/Mask/ReelContainer/Reel_0 | ReelController | ReelContainer | SymbolContainer |
| Canvas/CentralArea/ReelArea/Mask/ReelContainer/Reel_0/SymbolContainer/Symbol_0 | SymbolItem | SymbolContainer | Sprite |
| Canvas/CentralArea/TopBar | TopBarController | CentralArea | Background, AmountLabel |
| Canvas/CentralArea/BottomBar/SpinButton | SpinButtonController | BottomBar | Background, Label |

## 🎮 初始化顺序

```
1. GameScene.onLoad()
   ↓
2. GameScene.initSlotMachine()
   ↓
3. SlotMachine.init(initialLayout)
   ↓
4. SlotMachine.initReelControllers()
   ↓
5. ReelController.init() (5个Reel)
   ↓
6. ReelController.createSymbols() (每个Reel创建7个Symbol)
   ↓
7. SymbolItem.setSymbol() (设置图片)
```

## ⚠️ 常见错误

### 1. 组件未挂载
```
❌ 错误：Reel节点忘记挂载ReelController组件
✅ 解决：在每个Reel_0~Reel_4节点上添加ReelController组件
```

### 2. 引用未配置
```
❌ 错误：SlotMachine.reelNodes数组为空
✅ 解决：在SlotMachine组件中配置reelNodes数组，拖入5个Reel节点
```

### 3. 预制体未配置
```
❌ 错误：ReelController.symbolPrefab为null
✅ 解决：在ReelController组件中拖入Symbol预制体
```

### 4. SymbolContainer未配置
```
❌ 错误：ReelController.symbolContainer为null
✅ 解决：在ReelController组件中拖入该Reel下的SymbolContainer子节点
```

### 5. Sprite组件未配置
```
❌ 错误：SymbolItem.sprite为null
✅ 解决：在Symbol预制体的SymbolItem组件中，拖入Sprite子节点的Sprite组件
```

## 📝 检查清单

### 场景创建检查

- [ ] Canvas节点已创建
- [ ] GameSceneController节点已创建并挂载GameScene组件
- [ ] SlotMachine节点已创建并挂载SlotMachine和SlotConfig组件
- [ ] 5个Reel节点已创建 (Reel_0 ~ Reel_4)
- [ ] 每个Reel节点已挂载ReelController组件
- [ ] 每个Reel下有SymbolContainer子节点
- [ ] TopBar、SpinButton、弹窗等UI节点已创建并挂载对应组件
- [ ] Mask节点已添加cc.Mask组件

### 组件配置检查

- [ ] GameScene的所有引用已配置（slotMachine, topBar等）
- [ ] SlotMachine.config已配置（指向SlotConfig组件）
- [ ] SlotMachine.reelNodes已配置（5个Reel节点）
- [ ] 每个ReelController.symbolPrefab已配置（Symbol预制体）
- [ ] 每个ReelController.symbolContainer已配置（SymbolContainer节点）
- [ ] SlotConfig的图集已配置（symbolAtlas, winAnimAtlas）
- [ ] SlotConfig的symbolNameMap已配置（13个元素）

### 预制体检查

- [ ] Symbol预制体已创建
- [ ] Symbol预制体结构正确（Symbol节点 → Sprite子节点）
- [ ] Symbol节点挂载SymbolItem组件
- [ ] Sprite子节点挂载cc.Sprite组件
- [ ] SymbolItem.sprite已配置（指向Sprite组件）

## 🎯 快速参考

### 必须手动创建的节点
- Canvas及其子节点结构
- Reel_0 ~ Reel_4节点
- 各UI节点（TopBar, SpinButton等）
- Symbol预制体

### 运行时自动创建的节点
- Symbol_0 ~ Symbol_6 (每个Reel下)
- 由ReelController从预制体实例化

### 纯逻辑对象（不对应节点）
- GridManager
- ResultManager
- WinAnimationController

---

**相关文档**:
- [Symbol预制体结构指南](./SymbolPrefab_Structure_Guide.md)
- [中奖动画机制说明](./WinAnimation_Mechanism_Guide.md)
- [ReelArea动态布局指南](./ReelArea_DynamicLayout_Guide.md)

**版本**: v1.0.0
**最后更新**: 2025-12-25
