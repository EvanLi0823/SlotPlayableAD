# Slot老虎机功能开发文档

## 项目信息
- **项目名称**: MySlotPlayableAD
- **引擎版本**: Cocos Creator 2.4.11
- **文档版本**: v1.0
- **最后更新**: 2025-12-25

---

## 一、需求概述

### 1.1 功能描述
实现一个3行5列的Slot老虎机仿真效果，支持：
- 初始牌面可配置
- 点击Spin按钮触发滚轴旋转
- 根据预设结果精确停止
- 每个symbol具有独立的中奖动画
- 可指定特定symbol播放中奖动画

### 1.2 核心参数
- **布局**: 3行 × 5列（3 rows × 5 reels）
- **可见symbol数**: 15个
- **滚动方向**: 垂直向下滚动
- **停止方式**: 逐列依次停止

---

## 二、整体架构设计

### 2.1 界面布局设计

#### 整体布局结构（全屏）
```
┌────────────────────────────────────────────────────────────┐
│                                                            │
│  ┌──────┐   ┌─────────────────────────┐   ┌──────┐       │
│  │      │   │     Top Bar (上栏)       │   │      │       │
│  │      │   │  ┌─────────────────┐    │   │      │       │
│  │      │   │  │ 提现金额显示框   │    │   │      │       │
│  │ Left │   │  └─────────────────┘    │   │Right │       │
│  │ Side │   ├─────────────────────────┤   │ Side │       │
│  │      │   │                         │   │      │       │
│  │ 图标 │   │    中间游戏区域          │   │ 下载 │       │
│  │ Icon │   │                         │   │ 按钮 │       │
│  │ 区域 │   │  ┌─────────────────┐    │   │ 区域 │       │
│  │      │   │  │   Reel Area     │    │   │      │       │
│  │      │   │  │  340x180px      │    │   │      │       │
│  │      │   │  │  带背景图        │    │   │      │       │
│  │      │   │  └─────────────────┘    │   │      │       │
│  │      │   │                         │   │      │       │
│  │      │   ├─────────────────────────┤   │      │       │
│  │      │   │   Bottom Bar (下栏)     │   │      │       │
│  │      │   │  ┌─────────────────┐    │   │      │       │
│  │      │   │  │   Spin Button   │    │   │      │       │
│  │      │   │  └─────────────────┘    │   │      │       │
│  └──────┘   └─────────────────────────┘   └──────┘       │
│                                                            │
└────────────────────────────────────────────────────────────┘

总尺寸:
- 全屏设计尺寸: 2400 x 1334
- 中间游戏区域: 720 x 1334
- 左侧区域: 840px（固定宽度）
- 右侧区域: 840px（固定宽度）
- 计算: 左侧(840) + 中间(720) + 右侧(840) = 2400
```

#### 布局说明
1. **中间区域（Main Game Area）**: 720 x 1334
   - 核心游戏内容
   - 包含上栏、滚轴区域、下栏
   - 固定宽度，在屏幕居中

2. **左侧区域（Left Side Panel）**: 弹性宽度
   - 存放功能图标和下载按钮
   - 图标可以是：设置、音效、信息等
   - 背景可使用装饰性场景图

3. **右侧区域（Right Side Panel）**: 弹性宽度
   - 存放功能图标和下载按钮（与左侧对称）
   - 图标可以是：设置、音效、信息等
   - 背景可使用装饰性场景图

#### 尺寸规格
| 区域 | 宽度 | 高度 | 说明 |
|------|------|------|------|
| 全屏Canvas | 2400px | 1334px | 设计尺寸，支持自适应 |
| 中间游戏区域 | 720px | 1334px | 固定宽度，居中 |
| 左侧面板 | 840px | 1334px | 固定宽度，Position: (-780, 0) |
| 右侧面板 | 840px | 1334px | 固定宽度，Position: (780, 0) |
| 上栏 (TopBar) | 720px | 100px | 固定高度 |
| 提现文本框 | 200-250px | 50-60px | 居中显示 |
| 滚轴区域 (ReelArea) | 670px | 310px | 固定尺寸，居中 |
| 滚轴背景图 | 690px | 330px | 略大于滚轴区域 |
| 下栏 (BottomBar) | 720px | 120px | 固定高度 |
| Spin按钮 | 120-150px | 120-150px | 圆形按钮，居中 |
| 侧边栏图标 | 60-80px | 60-80px | 左右两侧各一个 |
| 侧边栏下载按钮 | 150-200px | 60-80px | 矩形按钮，左右两侧各一个 |
| Symbol尺寸 | 130px | 100px | 单个symbol显示尺寸 |
| Symbol间距 | 4px | 4px | symbol之间的间距 |

### 2.2 组件层级结构

```
Canvas (场景根节点)
│
├── BackgroundLayer (背景层，装饰性场景图)
│   ├── LeftBackground (左侧背景图)
│   └── RightBackground (右侧背景图)
│
├── LeftSidePanel (左侧面板节点)
│   ├── FunctionIcon (功能图标)
│   │   ├── IconBG (圆形背景)
│   │   └── IconSprite (图标图片)
│   ├── DownloadButton (下载按钮)
│   │   ├── ButtonBG (按钮背景)
│   │   ├── ButtonIcon (下载图标)
│   │   └── ButtonLabel (文本: "Download")
│   └── LeftSidePanelController (脚本)
│
├── MainGameContainer (中间主游戏容器，720x1334)
│   │
│   ├── UIContainer (UI容器，Widget适配)
│   │   │
│   │   ├── TopBar (上栏节点)
│   │   │   ├── Background (背景装饰)
│   │   │   └── CashoutLabel (提现金额文本)
│   │   │       ├── Icon (金币图标)
│   │   │       └── Label (文本: "$1000")
│   │   │
│   │   ├── MiddleContainer (中间容器)
│   │   │   └── ReelContainer (滚轴容器节点)
│   │   │       ├── ReelBackground (滚轴背景图)
│   │   │       ├── ReelMask (遮罩，限制可见区域)
│   │   │       └── ReelsGroup (滚轴组)
│   │   │           ├── Reel_0 (第1列滚轴)
│   │   │           ├── Reel_1 (第2列滚轴)
│   │   │           ├── Reel_2 (第3列滚轴)
│   │   │           ├── Reel_3 (第4列滚轴)
│   │   │           └── Reel_4 (第5列滚轴)
│   │   │
│   │   └── BottomBar (下栏节点)
│   │       ├── Background (背景装饰)
│   │       └── SpinButton (Spin按钮)
│   │           ├── ButtonBG (按钮背景图)
│   │           ├── ButtonIcon (按钮图标)
│   │           └── ButtonLabel (按钮文本: "SPIN")
│   │
│   └── SlotMachine (主控制器脚本)
│       ├── GridManager
│       ├── WinAnimationController
│       └── ResultManager
│
└── RightSidePanel (右侧面板节点)
    ├── FunctionIcon (功能图标)
    │   ├── IconBG (圆形背景)
    │   └── IconSprite (图标图片)
    ├── DownloadButton (下载按钮)
    │   ├── ButtonBG (按钮背景)
    │   ├── ButtonIcon (下载图标)
    │   └── ButtonLabel (文本: "Download")
    └── RightSidePanelController (脚本)
```

### 2.3 核心组件职责

| 组件名称 | 职责描述 |
|---------|---------|
| `SlotMachine` | 主控制器，协调所有子系统，处理spin流程 |
| `ReelController` | 单个滚轴控制器，管理一列symbol的滚动逻辑 |
| `SymbolItem` | Symbol显示组件，负责图片显示和中奖动画播放 |
| `GridManager` | 网格管理器，管理初始布局和结果布局 |
| `WinAnimationController` | 中奖动画控制器，协调多个symbol的中奖动画 |
| `ResultManager` | 结果管理器，提供和验证spin结果数据 |
| `TopBarController` | 上栏控制器，管理提现金额显示 |
| `SpinButtonController` | Spin按钮控制器，处理用户交互 |
| `LeftSidePanelController` | 左侧面板控制器，管理功能图标和下载按钮交互 |
| `RightSidePanelController` | 右侧面板控制器，管理功能图标和下载按钮交互 |
| `WinPopupController` | 中奖弹窗控制器，显示中奖金额和领取按钮 |
| `DownloadPopupController` | 下载弹窗控制器，引导用户下载 |
| `CashFlyAnimController` | 现金飞行动画控制器，实现金币飞向上栏效果 |

### 2.4 侧边栏详细设计

#### LeftSidePanel (左侧面板)
**节点结构**:
```
LeftSidePanel (节点，宽度: 150px, 高度: 1334px)
├── FunctionIcon (功能图标)
│   ├── IconBG (圆形背景，70x70)
│   └── IconSprite (图标图片，40x40)
│
├── DownloadButton (下载按钮)
│   ├── ButtonBG (按钮背景，180x70)
│   ├── ButtonGlow (发光效果层)
│   ├── IconSprite (下载图标，35x35)
│   └── ButtonLabel (文本: "DOWNLOAD")
│
└── LeftSidePanelController (脚本)
```

**布局**:
- 位置: 屏幕左侧，垂直居中
- 功能图标: 垂直居中偏上（例如y=+200）
- 下载按钮: 垂直居中偏下（例如y=-200）

**Widget设置**:
- LeftSidePanel: Left=0, 宽度固定150px（或弹性）
- FunctionIcon: 自定义定位（居中偏上）
- DownloadButton: 自定义定位（居中偏下）

**图标规格**:
- 背景圆形: 70x70px
- 图标图片: 40x40px
- 颜色: 半透明背景 (#FFFFFF30)，白色图标
- 状态: 普通/按下/禁用三态
- 用途: 可以是设置、音效开关、信息等功能图标（根据需要选择）

**下载按钮规格**:
- 尺寸: 180 x 70px（横向矩形）
- 格式: PNG（支持透明通道）
- 颜色: 鲜艳渐变（推荐橙色/红色 #FF6600 → #FF3300）
- 文本: "DOWNLOAD" 或 "FREE", 24-28px, 白色粗体
- 图标: 下载箭头，35x35px
- 动画: 持续缩放脉冲（1.0 ↔ 1.05）

**LeftSidePanelController脚本接口**:
```typescript
class LeftSidePanelController {
  // 播放按钮脉冲动画
  playPulseAnimation(): void;

  // 停止脉冲动画
  stopPulseAnimation(): void;

  // 显示/隐藏面板
  show(animated: boolean): void;
  hide(animated: boolean): void;

  // 设置图标点击回调
  onIconClick: () => void;

  // 设置下载按钮点击回调
  onDownloadClick: () => void;

  // 更改图标样式
  setIconSprite(spriteFrame: cc.SpriteFrame): void;
}
```

#### RightSidePanel (右侧面板)
**节点结构**:
```
RightSidePanel (节点，宽度: 150px, 高度: 1334px)
├── FunctionIcon (功能图标)
│   ├── IconBG (圆形背景，70x70)
│   └── IconSprite (图标图片，40x40)
│
├── DownloadButton (下载按钮)
│   ├── ButtonBG (按钮背景，180x70)
│   ├── ButtonGlow (发光效果层)
│   ├── IconSprite (下载图标，35x35)
│   └── ButtonLabel (文本: "DOWNLOAD")
│
└── RightSidePanelController (脚本)
```

**布局**:
- 位置: 屏幕右侧，垂直居中
- 功能图标: 垂直居中偏上（例如y=+200）
- 下载按钮: 垂直居中偏下（例如y=-200）

**Widget设置**:
- RightSidePanel: Right=0, 宽度固定150px（或弹性）
- FunctionIcon: 自定义定位（居中偏上）
- DownloadButton: 自定义定位（居中偏下）

**图标规格**:
- 背景圆形: 70x70px
- 图标图片: 40x40px
- 颜色: 半透明背景 (#FFFFFF30)，白色图标
- 状态: 普通/按下/禁用三态
- 用途: 可以是设置、音效开关、信息等功能图标（根据需要选择）

**下载按钮规格**:
- 尺寸: 180 x 70px（横向矩形）
- 格式: PNG（支持透明通道）
- 颜色: 鲜艳渐变（推荐橙色/红色 #FF6600 → #FF3300）
- 文本: "DOWNLOAD" 或 "FREE", 24-28px, 白色粗体
- 图标: 下载箭头，35x35px
- 动画: 持续缩放脉冲（1.0 ↔ 1.05）

**RightSidePanelController脚本接口**:
```typescript
class RightSidePanelController {
  // 播放按钮脉冲动画
  playPulseAnimation(): void;

  // 停止脉冲动画
  stopPulseAnimation(): void;

  // 显示/隐藏面板
  show(animated: boolean): void;
  hide(animated: boolean): void;

  // 设置图标点击回调
  onIconClick: () => void;

  // 设置下载按钮点击回调
  onDownloadClick: () => void;

  // 更改图标样式
  setIconSprite(spriteFrame: cc.SpriteFrame): void;
}
```

### 2.5 UI组件详细设计（中间区域）

#### TopBar (上栏)
**节点结构**:
```
TopBar (节点，尺寸: 750 x 100)
├── Background (可选背景装饰)
└── CashoutLabel (提现金额显示)
    ├── Icon (金币图标, 40x40)
    └── AmountLabel (Label组件)
        - 文本: "$1000"
        - 字体: 32-36px, 粗体
        - 颜色: 金色 (#FFD700)
```

**Widget设置**:
- TopBar: 对齐顶部，Top=0, 高度固定100px
- CashoutLabel: 居中对齐

**TopBarController脚本接口**:
```typescript
class TopBarController {
  // 设置显示金额
  setAmount(amount: number): void;

  // 更新金额（带动画）
  updateAmount(newAmount: number, duration: number): void;

  // 播放金额增加动画
  playAddAmountAnimation(addedAmount: number): void;
}
```

#### ReelContainer (滚轴容器)
**节点结构**:
```
ReelContainer (节点，尺寸: 690 x 330)
├── ReelBackground (Sprite, 690 x 330)
│   - 背景图片，装饰性边框
├── ReelMask (Mask组件, 670 x 310)
│   - 限制可见区域
│   - 位置: 居中
└── ReelsGroup (节点)
    ├── Reel_0 (节点, 130 x 310)
    │   ├── ReelController (脚本)
    │   └── SymbolItems (7个symbol节点)
    ├── Reel_1 (节点, 130 x 310)
    ├── Reel_2 (节点, 130 x 310)
    ├── Reel_3 (节点, 130 x 310)
    └── Reel_4 (节点, 130 x 310)
```

**布局**:
- ReelContainer: 居中于中间区域
- ReelsGroup内5个Reel水平排列
- Reel间距: 4px
- 总宽度: 130×5 + 4×4 = 666px

**Mask设置**:
- 类型: RECT
- 尺寸: 670 x 310
- 作用: 隐藏滚动时超出可见区域的symbol

#### BottomBar (下栏)
**节点结构**:
```
BottomBar (节点，尺寸: 750 x 120)
├── Background (可选背景装饰)
└── SpinButton (Button节点, 140 x 140)
    ├── ButtonBG (Sprite, 圆形背景)
    ├── ButtonIcon (Sprite, 旋转图标)
    └── ButtonLabel (Label, "SPIN")
```

**Widget设置**:
- BottomBar: 对齐底部，Bottom=0, 高度固定120px
- SpinButton: 居中对齐

**SpinButton样式**:
- 尺寸: 140 x 140 (圆形)
- 普通状态: 绿色渐变背景 (#00CC00)
- 按下状态: 深绿色 (#009900)
- 禁用状态: 灰色 (#888888)
- 文本: "SPIN", 28-32px, 白色粗体

**SpinButtonController脚本接口**:
```typescript
class SpinButtonController {
  // 启用按钮
  enable(): void;

  // 禁用按钮
  disable(): void;

  // 设置点击回调
  setClickCallback(callback: () => void): void;

  // 播放按下动画（缩放效果）
  playPressAnimation(): void;

  // 显示旋转图标动画（spin过程中）
  showSpinningState(): void;
}
```

### 2.6 弹窗系统设计

#### WinPopup (中奖弹窗)
**节点结构**:
```
WinPopup (节点，尺寸: 500 x 400)
├── PopupMask (遮罩层，全屏半透明黑色)
├── PopupBG (弹窗背景，500 x 400)
│   ├── BGSprite (背景图片)
│   └── BGGlow (发光装饰，可选)
├── WinAmountLabel (中奖金额文本)
│   ├── Icon (金币图标，50x50)
│   └── AmountText (Label, "$500", 大字号)
├── ClaimButton (领取按钮)
│   ├── ButtonBG (按钮背景，200x80)
│   ├── ButtonGlow (发光效果)
│   └── ButtonLabel (Label, "CLAIM" 或 "领取")
└── WinPopupController (脚本)
```

**布局**:
- 位置: 屏幕中央，覆盖在游戏区上方
- 中奖金额: 弹窗上方1/3位置
- 领取按钮: 弹窗下方，居中

**弹窗规格**:
- 弹窗尺寸: 500 x 400px
- 背景: 带圆角，金色边框，渐变填充
- 遮罩: 全屏，rgba(0,0,0,0.7)
- 金额字体: 48-64px，金色，粗体
- 按钮尺寸: 200 x 80px

**WinPopupController脚本接口**:
```typescript
class WinPopupController {
  // 显示中奖弹窗
  show(winAmount: number): void;

  // 隐藏弹窗
  hide(): void;

  // 播放弹出动画（缩放+渐显）
  playShowAnimation(): Promise<void>;

  // 播放关闭动画
  playHideAnimation(): Promise<void>;

  // 设置领取按钮点击回调
  onClaimClick: () => void;

  // 设置显示的金额
  setWinAmount(amount: number): void;
}
```

**弹出动画**:
```typescript
playShowAnimation() {
  // 1. 显示遮罩（渐显）
  cc.tween(popupMask)
    .to(0.3, { opacity: 178 }) // 0.7 * 255
    .start();

  // 2. 弹窗从小到大弹出
  popupBG.scale = 0.3;
  popupBG.opacity = 0;
  cc.tween(popupBG)
    .to(0.4, { scale: 1.0, opacity: 255 }, { easing: 'backOut' })
    .start();
}
```

#### DownloadPopup (下载弹窗)
**节点结构**:
```
DownloadPopup (节点，尺寸: 500 x 400)
├── PopupMask (遮罩层，全屏半透明黑色)
├── PopupBG (弹窗背景，500 x 400)
│   ├── BGSprite (背景图片)
│   └── BGGlow (发光装饰，可选)
├── MessageLabel (提示文本)
│   └── MessageText (Label, "Download to claim your reward!")
├── DownloadButton (下载按钮)
│   ├── ButtonBG (按钮背景，220x90)
│   ├── ButtonGlow (发光效果，持续脉冲)
│   ├── IconSprite (下载图标，40x40)
│   └── ButtonLabel (Label, "DOWNLOAD NOW")
└── DownloadPopupController (脚本)
```

**布局**:
- 位置: 屏幕中央，覆盖在游戏区上方
- 提示文本: 弹窗上方1/3位置
- 下载按钮: 弹窗中央，居中

**弹窗规格**:
- 弹窗尺寸: 500 x 400px
- 背景: 带圆角，渐变填充（蓝色或绿色主题）
- 遮罩: 全屏，rgba(0,0,0,0.7)
- 提示文本: 28-32px，白色
- 按钮尺寸: 220 x 90px
- 按钮颜色: 鲜艳橙红渐变 (#FF6600 → #FF3300)

**DownloadPopupController脚本接口**:
```typescript
class DownloadPopupController {
  // 显示下载弹窗
  show(): void;

  // 隐藏弹窗
  hide(): void;

  // 播放弹出动画
  playShowAnimation(): Promise<void>;

  // 播放按钮脉冲动画
  playButtonPulse(): void;

  // 设置下载按钮点击回调
  onDownloadClick: () => void;

  // 设置提示文本
  setMessage(message: string): void;
}
```

#### CashFlyAnimation (现金飞行动画)
**功能描述**:
从中奖弹窗的领取按钮位置，生成一个金币图片，飞行到上栏的提现金额文本框，同时上栏金额数字从当前值滚动到目标值。

**节点结构**:
```
CashFlyAnimContainer (节点，全屏)
└── CashSprite (Sprite, 金币图片，80x80)
    └── CashFlyAnimController (脚本)
```

**CashFlyAnimController脚本接口**:
```typescript
class CashFlyAnimController {
  // 播放飞行动画
  playFlyAnimation(
    startPos: cc.Vec2,      // 起始位置（领取按钮位置）
    endPos: cc.Vec2,        // 结束位置（上栏金额框位置）
    duration: number        // 飞行时长（秒）
  ): Promise<void>;

  // 创建金币精灵
  createCashSprite(spriteFrame: cc.SpriteFrame): void;

  // 销毁金币精灵
  destroyCashSprite(): void;
}
```

**飞行动画实现**:
```typescript
async playFlyAnimation(startPos: cc.Vec2, endPos: cc.Vec2, duration: number) {
  // 1. 创建金币精灵并设置起始位置
  this.cashSprite.setPosition(startPos);
  this.cashSprite.scale = 1.0;
  this.cashSprite.opacity = 255;
  this.cashSprite.active = true;

  // 2. 计算贝塞尔曲线控制点（抛物线飞行）
  const midX = (startPos.x + endPos.x) / 2;
  const midY = Math.max(startPos.y, endPos.y) + 150; // 向上抛
  const controlPoint = cc.v2(midX, midY);

  // 3. 使用贝塞尔曲线移动
  await new Promise(resolve => {
    cc.tween(this.cashSprite)
      .parallel(
        // 移动轨迹（贝塞尔曲线）
        cc.tween().bezierTo(duration,
          startPos,
          controlPoint,
          endPos
        ),
        // 同时缩放（由大到小）
        cc.tween().to(duration, { scale: 0.3 }),
        // 旋转效果
        cc.tween().to(duration, { angle: 360 })
      )
      .call(() => {
        resolve();
      })
      .start();
  });

  // 4. 到达目标后隐藏
  this.cashSprite.active = false;
}
```

**数字滚动动画**（在TopBarController中实现）:
```typescript
// TopBarController中添加
async animateAmountChange(fromAmount: number, toAmount: number, duration: number) {
  const startTime = Date.now();
  const diff = toAmount - fromAmount;

  return new Promise(resolve => {
    const updateAmount = () => {
      const elapsed = (Date.now() - startTime) / 1000;
      const progress = Math.min(elapsed / duration, 1.0);

      // 使用缓动函数
      const easedProgress = this.easeOutCubic(progress);
      const currentAmount = fromAmount + diff * easedProgress;

      this.amountLabel.string = `$${Math.floor(currentAmount)}`;

      if (progress < 1.0) {
        requestAnimationFrame(updateAmount);
      } else {
        this.amountLabel.string = `$${toAmount}`;
        resolve();
      }
    };

    updateAmount();
  });
}

easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}
```

### 2.7 屏幕适配方案

#### Canvas设置
```
Canvas组件配置:
- Design Resolution: 2400 x 1334 (全屏设计尺寸)
- Fit Height: true
- Fit Width: true
- 适配模式: SHOW_ALL 或 FIXED_HEIGHT
```

#### Widget适配策略
| 节点 | 适配方式 | Widget设置 |
|------|---------|-----------|
| BackgroundLayer | 全屏拉伸 | Left=0, Right=0, Top=0, Bottom=0 |
| LeftSidePanel | 左侧固定 | Position=(-780,0), Width=840px, Height=1334px |
| MainGameContainer | 居中固定 | Align=Center, 固定720x1334 |
| RightSidePanel | 右侧固定 | Position=(780,0), Width=840px, Height=1334px |
| TopBar | 主容器内顶部 | Top=0, Left=0, Right=0, Height=100 |
| MiddleContainer | 主容器内中间 | Top=100, Bottom=120, Left=0, Right=0 |
| ReelContainer | 中间居中 | Align=Center, 固定670x310 |
| BottomBar | 主容器内底部 | Bottom=0, Left=0, Right=0, Height=120 |

#### 不同分辨率适配
| 设备类型 | 分辨率 | 布局表现 |
|---------|--------|---------|
| 设计尺寸 | 2400x1334 | 完整布局：左侧840px + 中间720px + 右侧840px |
| 平板横屏 | 1024x768 | 等比缩放显示，保持2400:1334比例 |
| iPad Pro | 1366x1024 | 等比缩放显示，保持2400:1334比例 |
| 桌面浏览器 | 1920x1080 | 等比缩放显示，保持2400:1334比例 |
| 竖屏手机 | 375x812 | 建议锁定横屏，或等比缩小整体界面 |

**适配策略**:
1. **基准设计尺寸: 2400 x 1334**:
   - 所有UI元素按此尺寸设计
   - 左侧区域: 840px（Position: -780, 0）
   - 中间游戏区: 720px（Position: 0, 0，居中）
   - 右侧区域: 840px（Position: 780, 0）

2. **自适应缩放**:
   - 使用SHOW_ALL或FIXED_HEIGHT模式
   - 整体按比例缩放以适应不同屏幕
   - 保持2400:1334的宽高比

3. **窄屏设备（宽度 < 720px）**:
   - 建议锁定横屏，或提示"请横屏游戏"
   - 或等比缩小整体界面

#### 适配实现代码示例
```typescript
class ScreenAdapter {
  onLoad() {
    this.adaptLayout();
    cc.view.setResizeCallback(() => {
      this.adaptLayout();
    });
  }

  adaptLayout() {
    const visibleSize = cc.view.getVisibleSize();
    const designWidth = 2400;
    const designHeight = 1334;

    // Canvas使用SHOW_ALL或FIXED_HEIGHT模式，会自动等比缩放
    // 所有UI元素按照2400x1334设计尺寸布局
    // 左侧面板: Position(-780, 0), Size(840, 1334)
    // 中间游戏区: Position(0, 0), Size(720, 1334)
    // 右侧面板: Position(780, 0), Size(840, 1334)

    // 无需手动调整布局，Canvas会自动缩放以适配屏幕
    // 如果需要针对特别窄的屏幕做特殊处理：
    if (visibleSize.width < 720) {
      this.showRotateHint(); // 提示用户横屏
    }
  }
}
```

## 三、数据结构设计

### 3.1 配置数据结构

#### SlotConfig - 全局配置
```typescript
interface SlotConfig {
  // 布局配置
  rows: number;                    // 行数，固定为3
  reels: number;                   // 列数，固定为5
  symbolHeight: number;            // symbol高度（像素）
  symbolWidth: number;             // symbol宽度（像素）
  symbolGap: number;               // symbol间距（像素）

  // Symbol配置
  symbolTypes: number;             // symbol种类总数（例如10种）
  symbolsPerReel: number;          // 每列实际创建的symbol节点数（建议6-7个）
  visibleSymbolsPerReel: number;   // 每列可见的symbol数，固定为3

  // 滚动配置
  spinAccelerationTime: number;    // 加速阶段时长（秒）
  spinNormalSpeed: number;         // 匀速滚动速度（像素/秒）
  spinMinDuration: number;         // 最小滚动时长（秒）
  spinDecelerationTime: number;    // 减速阶段时长（秒）
  reelStopDelay: number;           // 每列停止的延迟间隔（秒）

  // 动画配置
  bounceBackDistance: number;      // 停止回弹距离（像素）
  bounceBackDuration: number;      // 回弹动画时长（秒）
  winAnimationDelay: number;       // 停止后到播放中奖动画的延迟（秒）
  winAnimationLoops: number;       // 中奖动画循环次数
}
```

**推荐配置值**:
```typescript
defaultConfig = {
  rows: 3,
  reels: 5,
  symbolHeight: 100,     // 根据310px高度计算：(310 - 4*2) / 3 ≈ 100px
  symbolWidth: 130,      // 根据670px宽度计算：(670 - 4*4) / 5 = 130.8px ≈ 130px
  symbolGap: 4,          // 间距4px
  symbolTypes: 13,       // 实际有13个symbol (L01-L06, H01-H05, W01, S01)
  symbolsPerReel: 7,
  visibleSymbolsPerReel: 3,
  spinAccelerationTime: 0.2,
  spinNormalSpeed: 950,  // 根据中等尺寸调整速度
  spinMinDuration: 1.5,
  spinDecelerationTime: 0.5,
  reelStopDelay: 0.2,
  bounceBackDistance: 11, // 根据中等尺寸调整回弹距离
  bounceBackDuration: 0.15,
  winAnimationDelay: 0.3,
  winAnimationLoops: 3
}
```

**尺寸说明**:
- 滚轮区域总尺寸：670px × 310px
- 单个symbol显示尺寸：130px × 100px
- symbol间距：4px
- 实际占用宽度：130×5 + 4×4 = 666px
- 实际占用高度：100×3 + 4×2 = 308px

### 3.1.1 动态配置和Prefab加载

#### ReelArea动态配置
```typescript
interface ReelAreaConfig {
  // ReelArea节点的Size（从编辑器中获取或配置）
  reelAreaWidth: number;   // 例如: 670
  reelAreaHeight: number;  // 例如: 310

  // 布局配置
  rows: number;            // 行数: 3
  cols: number;            // 列数: 5
  symbolGap: number;       // 间距: 4

  // Prefab资源
  symbolPrefab: cc.Prefab;  // Symbol预制体
  reelPrefab: cc.Prefab;    // Reel预制体（可选）
}
```

#### 动态尺寸计算
```typescript
class ReelAreaCalculator {
  /**
   * 根据ReelArea尺寸动态计算Symbol和Reel的位置
   */
  static calculateLayout(config: ReelAreaConfig) {
    const { reelAreaWidth, reelAreaHeight, rows, cols, symbolGap } = config;

    // 1. 计算Symbol尺寸
    const symbolWidth = (reelAreaWidth - symbolGap * (cols - 1)) / cols;
    const symbolHeight = (reelAreaHeight - symbolGap * (rows - 1)) / rows;

    // 2. 计算单位尺寸（包含间距）
    const unitWidth = symbolWidth + symbolGap;
    const unitHeight = symbolHeight + symbolGap;

    // 3. 计算Reel的X坐标（水平居中）
    const totalWidth = symbolWidth * cols + symbolGap * (cols - 1);
    const startX = -totalWidth / 2 + symbolWidth / 2;
    const reelPositionsX: number[] = [];
    for (let i = 0; i < cols; i++) {
      reelPositionsX[i] = startX + i * unitWidth;
    }

    // 4. 计算Symbol的Y坐标（每个Reel内的7个Symbol）
    const symbolsPerReel = 7;
    const visibleSymbols = 3;
    const totalHeight = symbolHeight * visibleSymbols + symbolGap * (visibleSymbols - 1);
    const centerOffset = totalHeight / 2;

    const symbolPositionsY: number[] = [];
    const centerIndex = Math.floor(symbolsPerReel / 2); // 3
    for (let i = 0; i < symbolsPerReel; i++) {
      const offset = (i - centerIndex) * unitHeight;
      symbolPositionsY[i] = -offset; // 注意Y轴方向
    }

    return {
      symbolWidth,
      symbolHeight,
      unitWidth,
      unitHeight,
      reelPositionsX,
      symbolPositionsY,
      reelSize: { width: symbolWidth, height: reelAreaHeight }
    };
  }
}
```

#### 动态加载Reel和Symbol
```typescript
class SlotMachine {
  private reelAreaNode: cc.Node;
  private reelContainer: cc.Node;
  private config: ReelAreaConfig;
  private layout: ReturnType<typeof ReelAreaCalculator.calculateLayout>;
  private reels: ReelController[] = [];

  /**
   * 初始化ReelArea并动态创建Reel和Symbol
   */
  init() {
    // 1. 获取ReelArea节点
    this.reelAreaNode = this.node.getChildByName('ReelArea');
    const reelAreaSize = this.reelAreaNode.getContentSize();

    // 2. 配置
    this.config = {
      reelAreaWidth: reelAreaSize.width,   // 670
      reelAreaHeight: reelAreaSize.height, // 310
      rows: 3,
      cols: 5,
      symbolGap: 4,
      symbolPrefab: this.symbolPrefab,     // 从编辑器配置
      reelPrefab: this.reelPrefab          // 可选
    };

    // 3. 计算布局
    this.layout = ReelAreaCalculator.calculateLayout(this.config);

    // 4. 动态创建Reel和Symbol
    this.createReels();
  }

  /**
   * 创建所有Reel
   */
  createReels() {
    // 获取或创建ReelContainer
    this.reelContainer = this.reelAreaNode.getChildByName('ReelContainer');
    if (!this.reelContainer) {
      this.reelContainer = new cc.Node('ReelContainer');
      this.reelContainer.parent = this.reelAreaNode;
    }

    const { reelPositionsX, symbolPositionsY, symbolWidth, symbolHeight, reelSize } = this.layout;

    for (let col = 0; col < this.config.cols; col++) {
      // 创建Reel节点
      const reelNode = new cc.Node(`Reel_${col}`);
      reelNode.setContentSize(reelSize.width, reelSize.height);
      reelNode.setPosition(reelPositionsX[col], 0);
      reelNode.parent = this.reelContainer;

      // 创建SymbolContainer
      const symbolContainer = new cc.Node('SymbolContainer');
      symbolContainer.parent = reelNode;

      // 动态创建Symbol节点
      const symbolsPerReel = 7;
      const symbols: cc.Node[] = [];

      for (let i = 0; i < symbolsPerReel; i++) {
        // 方案1: 从Prefab实例化
        const symbolNode = cc.instantiate(this.config.symbolPrefab);
        symbolNode.name = `Symbol_${i}`;
        symbolNode.setContentSize(symbolWidth, symbolHeight);
        symbolNode.setPosition(0, symbolPositionsY[i]);
        symbolNode.parent = symbolContainer;

        // 初始化SymbolItem组件
        const symbolItem = symbolNode.getComponent(SymbolItem);
        if (symbolItem) {
          symbolItem.init(this.symbolSpriteFrames);
          symbolItem.setSymbol(this.getRandomSymbolId());
        }

        symbols.push(symbolNode);
      }

      // 创建ReelController组件
      const reelController = reelNode.addComponent(ReelController);
      reelController.init({
        reelIndex: col,
        symbols: symbols,
        config: this.slotConfig,
        layout: this.layout
      });

      this.reels.push(reelController);
    }
  }

  /**
   * 根据新的ReelArea尺寸重新计算布局（运行时调整）
   */
  updateLayout(newWidth: number, newHeight: number) {
    this.config.reelAreaWidth = newWidth;
    this.config.reelAreaHeight = newHeight;

    // 重新计算布局
    this.layout = ReelAreaCalculator.calculateLayout(this.config);

    // 更新所有Reel和Symbol的位置和尺寸
    this.reels.forEach((reel, col) => {
      const reelNode = reel.node;
      reelNode.setPosition(this.layout.reelPositionsX[col], 0);
      reelNode.setContentSize(this.layout.reelSize.width, this.layout.reelSize.height);

      // 更新Symbol位置和尺寸
      const symbolContainer = reelNode.getChildByName('SymbolContainer');
      symbolContainer.children.forEach((symbol, i) => {
        symbol.setContentSize(this.layout.symbolWidth, this.layout.symbolHeight);
        symbol.setPosition(0, this.layout.symbolPositionsY[i]);
      });
    });
  }
}
```

### 3.2 运行时数据结构

#### SymbolLayout - 牌面布局
```typescript
// 使用二维数组表示，layout[row][col] = symbolId
type SymbolLayout = number[][];

// 示例：3行5列的布局
// [
//   [1, 3, 5, 7, 2],  // 第0行（顶部）
//   [4, 6, 8, 3, 5],  // 第1行（中间）
//   [2, 9, 1, 4, 6]   // 第2行（底部）
// ]
```

#### SpinResult - Spin结果数据
```typescript
interface SpinResult {
  // 最终停止的布局
  finalLayout: SymbolLayout;

  // 中奖位置列表
  winPositions: WinPosition[];

  // 中奖线信息（可选）
  winLines?: WinLine[];
}

interface WinPosition {
  row: number;        // 行索引（0-2）
  col: number;        // 列索引（0-4）
  symbolId: number;   // symbol ID
}

interface WinLine {
  lineId: number;               // 中奖线ID
  positions: [number, number][]; // 位置数组 [[row, col], ...]
  symbolId: number;              // 连线的symbol ID
}

// 示例数据
const exampleResult: SpinResult = {
  finalLayout: [
    [3, 7, 2, 9, 5],
    [7, 7, 7, 7, 7],  // 第2行全是symbol_7，中奖
    [2, 8, 2, 5, 9]
  ],
  winPositions: [
    {row: 1, col: 0, symbolId: 7},
    {row: 1, col: 1, symbolId: 7},
    {row: 1, col: 2, symbolId: 7},
    {row: 1, col: 3, symbolId: 7},
    {row: 1, col: 4, symbolId: 7}
  ],
  winLines: [
    {
      lineId: 2,
      positions: [[1, 0], [1, 1], [1, 2], [1, 3], [1, 4]],
      symbolId: 7
    }
  ]
}
```

#### SymbolAnimConfig - Symbol动画配置
```typescript
interface SymbolAnimConfig {
  symbolId: number;               // symbol ID

  // 帧动画配置（主要动画方式）
  frameAnimation: {
    spriteFrames: cc.SpriteFrame[];  // 帧序列
    frameRate: number;                // 帧率（帧/秒，建议12-24）
    loopCount: number;                // 单次触发播放次数（1=播放一次，2=播放两次）
  };

  // 可选：额外缩放效果
  extraScale?: {
    enabled: boolean;
    scaleTo: number;                  // 目标缩放值（如1.1表示放大10%）
  };
}

// 示例配置
const symbol7AnimConfig: SymbolAnimConfig = {
  symbolId: 7,
  frameAnimation: {
    spriteFrames: [],  // 加载symbol_7_win的帧序列
    frameRate: 15,     // 15帧/秒
    loopCount: 1       // 播放一次完整动画
  },
  extraScale: {
    enabled: true,
    scaleTo: 1.1       // 同时轻微放大
  }
}
```

---

## 四、核心功能模块设计

### 4.1 SlotMachine - 主控制器

#### 职责
- 初始化所有子系统
- 管理整体状态机
- 协调spin流程
- 对外提供主要API

#### 状态机
```typescript
enum SlotState {
  IDLE,           // 空闲，等待spin
  SPINNING,       // 滚动中
  STOPPING,       // 正在逐列停止
  STOPPED,        // 全部停止
  WIN_ANIMATION,  // 播放中奖动画
  DISABLED        // 禁用状态
}
```

#### 主要接口
```typescript
class SlotMachine {
  // 初始化，设置初始布局
  init(initialLayout: SymbolLayout): void;

  // 开始spin，传入结果数据
  spin(result: SpinResult): void;

  // 强制快速停止（可选功能）
  forceStop(): void;

  // 获取当前状态
  getState(): SlotState;

  // 获取当前显示的布局
  getCurrentLayout(): SymbolLayout;

  // 设置symbol图片资源
  setSymbolSprites(sprites: cc.SpriteFrame[]): void;

  // 设置symbol动画配置
  setSymbolAnimConfigs(configs: SymbolAnimConfig[]): void;
}
```

#### 工作流程
```
1. init(initialLayout)
   ├── 创建5个ReelController
   ├── 初始化GridManager
   ├── 设置初始布局
   └── 状态 → IDLE

2. spin(result)
   ├── 状态 → SPINNING
   ├── 禁用SpinButton
   ├── 通知ResultManager存储result
   ├── 依次启动5个Reel的spin动画
   │   ├── Reel_0.startSpin(delay: 0)
   │   ├── Reel_1.startSpin(delay: 0)
   │   ├── Reel_2.startSpin(delay: 0)
   │   ├── Reel_3.startSpin(delay: 0)
   │   └── Reel_4.startSpin(delay: 0)
   └── 启动停止计时器

3. 滚动阶段（各Reel独立执行）
   ├── 加速阶段（0.2s）
   ├── 匀速滚动阶段（>=1.5s）
   └── 等待停止信号

4. 停止阶段（逐列停止）
   ├── t=1.5s: Reel_0.stopSpin(targetSymbols)
   ├── t=1.7s: Reel_1.stopSpin(targetSymbols)
   ├── t=1.9s: Reel_2.stopSpin(targetSymbols)
   ├── t=2.1s: Reel_3.stopSpin(targetSymbols)
   ├── t=2.3s: Reel_4.stopSpin(targetSymbols)
   └── 状态 → STOPPING

5. 全部停止后
   ├── 状态 → STOPPED
   ├── 验证finalLayout是否正确
   ├── 延迟0.3s
   └── 触发中奖动画

6. 播放中奖动画
   ├── 状态 → WIN_ANIMATION
   ├── WinAnimationController.play(winPositions)
   └── 等待动画完成

7. 动画结束
   ├── 状态 → IDLE
   └── 启用SpinButton
```

### 4.2 ReelController - 滚轴控制器

#### 职责
- 管理单列的所有SymbolItem
- 执行滚动动画逻辑
- 实现symbol循环效果
- 精确停止到目标位置

#### 属性
```typescript
class ReelController {
  reelIndex: number;              // 滚轴索引（0-4）
  symbolItems: SymbolItem[];      // symbol节点数组
  currentSpeed: number;           // 当前滚动速度
  isSpinning: boolean;            // 是否正在滚动
  targetSymbols: number[];        // 目标symbol ID数组（3个）
}
```

#### 主要接口
```typescript
class ReelController {
  // 初始化，创建symbol节点
  init(reelIndex: number, initialSymbols: number[]): void;

  // 开始滚动
  startSpin(): void;

  // 停止滚动到指定结果
  stopSpin(targetSymbols: number[]): void;

  // 获取当前可见的3个symbol ID
  getCurrentVisibleSymbols(): number[];

  // 更新（每帧调用）
  update(dt: number): void;
}
```

#### 滚动实现细节

##### Symbol节点布局
```
垂直布局示例（从上到下）：

symbolItems[0]  y = +312   [缓冲区，不可见]
symbolItems[1]  y = +208   [缓冲区，不可见]
symbolItems[2]  y = +104   [可见区，第0行]  ← 顶部可见
symbolItems[3]  y =    0   [可见区，第1行]  ← 中间可见
symbolItems[4]  y = -104   [可见区，第2行]  ← 底部可见
symbolItems[5]  y = -208   [缓冲区，不可见]
symbolItems[6]  y = -312   [缓冲区，不可见]

可见区域：y ∈ [-155, +155]
symbol高度：100px
间距：4px
实际单位高度：104px (100 + 4)
```

##### 循环滚动算法
```typescript
update(dt: number) {
  if (!isSpinning) return;

  // 移动所有symbol
  for (let item of symbolItems) {
    item.node.y -= currentSpeed * dt;

    // 越界检测：symbol滚出底部
    if (item.node.y < -312) {
      // 移到顶部
      item.node.y += symbolItems.length * 104;

      // 在匀速阶段：随机更换symbol
      if (isNormalSpeedPhase) {
        item.setSymbol(getRandomSymbolId());
      }
      // 在减速阶段：设置为目标symbol
      else if (isDecelerationPhase) {
        item.setSymbol(getNextTargetSymbol());
      }
    }
  }
}
```

##### 精确停止算法
```typescript
stopSpin(targetSymbols: number[]) {
  // targetSymbols = [topSymbol, middleSymbol, bottomSymbol]

  // 1. 准备目标symbol队列
  prepareTargetQueue(targetSymbols);

  // 2. 计算停止位置
  // 确保symbol[4]停在y=-104位置（底部可见位置）
  const targetY = -104;
  const currentY = symbolItems[4].node.y;

  // 3. 计算还需滚动的距离
  let remainDistance = 0;
  if (currentY > targetY) {
    remainDistance = currentY - targetY;
  } else {
    // 需要多滚一圈再停
    remainDistance = (symbolItems.length * 104) - (targetY - currentY);
  }

  // 4. 添加额外圈数确保足够的减速空间
  remainDistance += 104 * 3; // 多滚3个symbol的距离

  // 5. 应用减速动画
  applyDecelerationAnimation(remainDistance);
}

applyDecelerationAnimation(distance: number) {
  const decelerationTime = 0.5; // 减速时长
  const easing = cc.easeOut(3.0); // 缓动函数

  // 使用Tween或Action实现减速
  // 在减速过程中，继续循环symbol并设置目标值
}
```

##### 回弹效果
```typescript
onSpinComplete() {
  // 停止后添加轻微回弹
  const bounceDistance = 11; // 向下多滚11px
  const bounceDuration = 0.15;

  // 所有symbol向下移动11px
  cc.tween(reelNode)
    .by(bounceDuration, { y: -bounceDistance }, { easing: 'sineOut' })
    .by(bounceDuration, { y: +bounceDistance }, { easing: 'sineIn' })
    .call(() => {
      // 回弹完成，通知SlotMachine
      this.onReelStopped();
    })
    .start();
}
```

### 4.3 SymbolItem - Symbol组件

#### 职责
- 显示symbol图片
- 播放中奖动画
- 管理symbol状态

#### 状态
```typescript
enum SymbolState {
  NORMAL,        // 正常显示
  SPINNING,      // 滚动中（可能有模糊效果）
  WINNING        // 播放中奖动画
}
```

#### 主要接口
```typescript
class SymbolItem {
  // 设置显示的symbol
  setSymbol(symbolId: number): void;

  // 播放中奖动画
  playWinAnimation(config: SymbolAnimConfig, loops: number): Promise<void>;

  // 停止动画
  stopAnimation(): void;

  // 获取当前symbol ID
  getSymbolId(): number;

  // 设置状态
  setState(state: SymbolState): void;
}
```

#### Symbol节点创建和配置

**节点结构**：
```
Symbol (cc.Node, Size: 130 x 100)
├── cc.Sprite 组件
│   - Type: SIMPLE
│   - SizeMode: CUSTOM
│   - Trim: false
└── SymbolItem 脚本组件
    - symbolId: number
    - spriteFrames: cc.SpriteFrame[]  // 所有symbol的SpriteFrame数组
```

**创建Symbol节点的代码示例**：
```typescript
// 常规Symbol（H, L, W）
createNormalSymbol(): cc.Node {
  const node = new cc.Node('Symbol');
  node.setContentSize(130, 100);

  const sprite = node.addComponent(cc.Sprite);
  sprite.type = cc.Sprite.Type.SIMPLE;
  sprite.sizeMode = cc.Sprite.SizeMode.CUSTOM;
  sprite.trim = false;

  const symbolItem = node.addComponent(SymbolItem);
  symbolItem.init(this.symbolSpriteFrames);

  return node;
}

// Scatter Symbol（特殊处理）
createScatterSymbol(): cc.Node {
  const node = new cc.Node('Symbol_Scatter');
  // 选项A: 使用标准尺寸（会被压扁）
  node.setContentSize(130, 100);

  // 选项B: 使用保持宽高比的尺寸（推荐）
  // node.setContentSize(100, 160);
  // node.setPosition(0, 30); // 向上偏移使其视觉居中

  const sprite = node.addComponent(cc.Sprite);
  sprite.type = cc.Sprite.Type.SIMPLE;
  sprite.sizeMode = cc.Sprite.SizeMode.CUSTOM;
  sprite.trim = false;

  const symbolItem = node.addComponent(SymbolItem);
  symbolItem.init(this.symbolSpriteFrames);

  return node;
}
```

**setSymbol方法实现**：
```typescript
setSymbol(symbolId: number): void {
  this.symbolId = symbolId;

  const sprite = this.node.getComponent(cc.Sprite);
  if (!sprite) return;

  // 根据symbolId获取对应的SpriteFrame
  const spriteFrame = this.symbolSpriteFrames[symbolId];
  if (spriteFrame) {
    sprite.spriteFrame = spriteFrame;

    // 特殊处理：Scatter符号可能需要调整尺寸
    if (symbolId === SymbolType.SCATTER) {
      // 选项A: 保持标准尺寸
      this.node.setContentSize(130, 100);

      // 选项B: 使用特殊尺寸保持宽高比（推荐）
      // this.node.setContentSize(100, 160);
      // this.node.y = this.node.y + 30; // 调整Y位置
    } else {
      // 常规符号使用标准尺寸
      this.node.setContentSize(130, 100);
    }
  }
}
```

**Symbol SpriteFrame数组加载**：
```typescript
// 在SlotMachine或ReelController中预加载所有symbol的SpriteFrame
loadSymbolSpriteFrames(): cc.SpriteFrame[] {
  const frames: cc.SpriteFrame[] = [];

  // 低价值符号 (0-5)
  frames[0] = this.loadSpriteFrame('Symbols/L01');  // 9
  frames[1] = this.loadSpriteFrame('Symbols/L02');  // 10
  frames[2] = this.loadSpriteFrame('Symbols/L03');  // J
  frames[3] = this.loadSpriteFrame('Symbols/L04');  // Q
  frames[4] = this.loadSpriteFrame('Symbols/L05');  // K
  frames[5] = this.loadSpriteFrame('Symbols/L06');  // A

  // 高价值符号 (6-10)
  frames[6] = this.loadSpriteFrame('Symbols/H01');  // 圣诞帽
  frames[7] = this.loadSpriteFrame('Symbols/H02');  // 礼物盒
  frames[8] = this.loadSpriteFrame('Symbols/H03');  // 铃铛
  frames[9] = this.loadSpriteFrame('Symbols/H04');  // 拐杖糖
  frames[10] = this.loadSpriteFrame('Symbols/H05'); // 圣诞树

  // 特殊符号 (11-12)
  frames[11] = this.loadSpriteFrame('Symbols/W01'); // Wild
  frames[12] = this.loadSpriteFrame('Symbols/S01'); // Scatter

  return frames;
}

loadSpriteFrame(path: string): cc.SpriteFrame {
  return cc.loader.getRes(path, cc.SpriteFrame);
}
```

#### 中奖动画实现
```typescript
async playWinAnimation(config: SymbolAnimConfig, loops: number) {
  setState(SymbolState.WINNING);

  const sprite = this.node.getComponent(cc.Sprite);
  const originalFrame = sprite.spriteFrame; // 保存原始帧
  const { frameAnimation, extraScale } = config;

  for (let i = 0; i < loops; i++) {
    // 1. 可选：应用缩放效果
    if (extraScale?.enabled) {
      cc.tween(this.node)
        .to(0.1, { scale: extraScale.scaleTo })
        .start();
    }

    // 2. 播放帧动画
    await playFrameAnimation(frameAnimation);

    // 3. 恢复缩放
    if (extraScale?.enabled) {
      cc.tween(this.node)
        .to(0.1, { scale: 1.0 })
        .start();
    }

    // 循环间隔
    if (i < loops - 1) {
      await delay(0.1);
    }
  }

  // 恢复原始状态
  sprite.spriteFrame = originalFrame;
  this.node.scale = 1.0;
  setState(SymbolState.NORMAL);
}

playFrameAnimation(frameAnim: FrameAnimation) {
  return new Promise(resolve => {
    const sprite = this.node.getComponent(cc.Sprite);
    const { spriteFrames, frameRate, loopCount } = frameAnim;
    const frameDuration = 1.0 / frameRate;

    let currentFrame = 0;
    let currentLoop = 0;

    const playNextFrame = () => {
      if (currentLoop >= loopCount) {
        resolve();
        return;
      }

      sprite.spriteFrame = spriteFrames[currentFrame];
      currentFrame++;

      if (currentFrame >= spriteFrames.length) {
        currentFrame = 0;
        currentLoop++;
      }

      if (currentLoop < loopCount) {
        this.scheduleOnce(playNextFrame, frameDuration);
      } else {
        resolve();
      }
    };

    playNextFrame();
  });
}
```

### 4.4 GridManager - 网格管理器

#### 职责
- 管理当前牌面布局
- 坐标转换（行列索引 ↔ symbol实例）
- 验证布局有效性

#### 主要接口
```typescript
class GridManager {
  // 设置初始布局
  setInitialLayout(layout: SymbolLayout): void;

  // 获取当前布局
  getCurrentLayout(): SymbolLayout;

  // 更新布局（当spin停止后）
  updateLayout(newLayout: SymbolLayout): void;

  // 根据行列获取SymbolItem
  getSymbolAt(row: number, col: number): SymbolItem;

  // 批量获取SymbolItem
  getSymbolsByPositions(positions: WinPosition[]): SymbolItem[];

  // 验证布局是否有效
  validateLayout(layout: SymbolLayout): boolean;
}
```

#### 内部数据结构
```typescript
class GridManager {
  private reelControllers: ReelController[];  // 5个滚轴控制器
  private currentLayout: SymbolLayout;        // 当前布局

  // 坐标映射表
  // symbolMap[row][col] = SymbolItem实例
  private symbolMap: SymbolItem[][];
}
```

### 4.5 WinAnimationController - 中奖动画控制器

#### 职责
- 协调多个symbol的中奖动画
- 支持逐线播放或同时播放
- 管理动画循环和时序

#### 播放模式
```typescript
enum WinPlayMode {
  SIMULTANEOUS,   // 所有中奖symbol同时播放
  BY_LINE,        // 按中奖线逐条播放
  SEQUENTIAL      // 逐个symbol顺序播放
}
```

#### 主要接口
```typescript
class WinAnimationController {
  // 播放中奖动画
  play(result: SpinResult, mode: WinPlayMode): Promise<void>;

  // 停止所有动画
  stopAll(): void;

  // 设置动画配置
  setAnimConfigs(configs: SymbolAnimConfig[]): void;
}
```

#### 播放逻辑

##### 模式1: SIMULTANEOUS（同时播放）
```typescript
async play_SIMULTANEOUS(result: SpinResult) {
  const { winPositions } = result;

  // 1. 获取所有中奖symbol实例
  const winSymbols = gridManager.getSymbolsByPositions(winPositions);

  // 2. 为每个symbol获取对应的动画配置
  const animPromises = [];
  for (let symbol of winSymbols) {
    const config = getAnimConfig(symbol.getSymbolId());
    animPromises.push(
      symbol.playWinAnimation(config, this.loopCount)
    );
  }

  // 3. 等待所有动画完成
  await Promise.all(animPromises);
}
```

##### 模式2: BY_LINE（按线播放）
```typescript
async play_BY_LINE(result: SpinResult) {
  const { winLines } = result;

  // 逐条播放中奖线
  for (let line of winLines) {
    // 高亮当前线的所有symbol
    const lineSymbols = gridManager.getSymbolsByPositions(
      line.positions.map(([row, col]) => ({ row, col, symbolId: line.symbolId }))
    );

    // 同时播放这条线上的所有symbol
    const animPromises = lineSymbols.map(symbol => {
      const config = getAnimConfig(symbol.getSymbolId());
      return symbol.playWinAnimation(config, this.loopCount);
    });

    await Promise.all(animPromises);

    // 延迟后播放下一条线
    await delay(0.2);
  }
}
```

##### 模式3: SEQUENTIAL（顺序播放）
```typescript
async play_SEQUENTIAL(result: SpinResult) {
  const { winPositions } = result;

  // 按位置顺序（从左到右，从上到下）播放
  const sortedPositions = winPositions.sort((a, b) => {
    if (a.col !== b.col) return a.col - b.col;
    return a.row - b.row;
  });

  for (let pos of sortedPositions) {
    const symbol = gridManager.getSymbolAt(pos.row, pos.col);
    const config = getAnimConfig(pos.symbolId);
    await symbol.playWinAnimation(config, 1);
    await delay(0.1); // 间隔0.1秒
  }
}
```

### 4.6 ResultManager - 结果管理器

#### 职责
- 提供和管理spin结果
- 验证结果数据有效性
- 支持随机结果生成（测试用）

#### 主要接口
```typescript
class ResultManager {
  // 设置下一次spin的结果
  setNextResult(result: SpinResult): void;

  // 获取下一次spin的结果
  getNextResult(): SpinResult;

  // 验证结果数据
  validateResult(result: SpinResult): boolean;

  // 生成随机结果（用于测试）
  generateRandomResult(hasWin: boolean): SpinResult;

  // 生成指定symbol的中奖结果
  generateWinResult(symbolId: number, lineType: 'horizontal' | 'diagonal'): SpinResult;
}
```

#### 结果验证
```typescript
validateResult(result: SpinResult): boolean {
  // 1. 验证finalLayout尺寸
  if (result.finalLayout.length !== 3) return false;
  if (result.finalLayout[0].length !== 5) return false;

  // 2. 验证symbolId范围
  for (let row of result.finalLayout) {
    for (let symbolId of row) {
      if (symbolId < 0 || symbolId >= symbolTypes) return false;
    }
  }

  // 3. 验证winPositions坐标
  for (let pos of result.winPositions) {
    if (pos.row < 0 || pos.row >= 3) return false;
    if (pos.col < 0 || pos.col >= 5) return false;
    // 验证位置的symbolId与finalLayout一致
    if (result.finalLayout[pos.row][pos.col] !== pos.symbolId) return false;
  }

  // 4. 验证winLines（如果有）
  if (result.winLines) {
    for (let line of result.winLines) {
      for (let [row, col] of line.positions) {
        if (result.finalLayout[row][col] !== line.symbolId) return false;
      }
    }
  }

  return true;
}
```

### 4.7 SpinButton - 按钮控制器

#### 职责
- 处理用户点击
- 管理按钮状态（可用/禁用）
- 显示按钮动画

#### 主要接口
```typescript
class SpinButton {
  // 启用按钮
  enable(): void;

  // 禁用按钮
  disable(): void;

  // 设置点击回调
  setClickCallback(callback: () => void): void;

  // 播放按钮动画
  playPressAnimation(): void;
}
```

---

## 五、详细流程图

### 5.1 完整Spin流程时序图

```
时间轴 | SpinButton | SlotMachine | Reel_0 | Reel_1 | Reel_2 | Reel_3 | Reel_4 | WinAnimController | WinPopup | CashFlyAnim | DownloadPopup
-------|------------|-------------|--------|--------|--------|--------|--------|-------------------|----------|-------------|---------------
0.0s   | [Click]    |             |        |        |        |        |        |                   |          |             |
       |     ↓      |             |        |        |        |        |        |                   |          |             |
       | [Disable]  | spin()      |        |        |        |        |        |                   |          |             |
       |            |   ↓         |        |        |        |        |        |                   |          |             |
0.0s   |            | State→SPIN  |        |        |        |        |        |                   |          |             |
       |            |   ↓         |        |        |        |        |        |                   |          |             |
       |            | startSpin() | Start  | Start  | Start  | Start  | Start  |                   |          |             |
       |            |             |   ↓    |   ↓    |   ↓    |   ↓    |   ↓    |                   |          |             |
0.0s~  |            |             | [加速] | [加速] | [加速] | [加速] | [加速] |                   |          |             |
0.2s   |            |             |        |        |        |        |        |                   |          |             |
       |            |             |   ↓    |   ↓    |   ↓    |   ↓    |   ↓    |                   |          |             |
0.2s~  |            |             | [匀速] | [匀速] | [匀速] | [匀速] | [匀速] |                   |          |             |
1.5s   |            |             |        |        |        |        |        |                   |          |             |
       |            | stopReel(0) |        |        |        |        |        |                   |          |             |
1.5s   |            |      ↓      |        |        |        |        |        |                   |          |             |
       |            |  State→STOP | [减速] |        |        |        |        |                   |          |             |
       |            |             |   ↓    |        |        |        |        |                   |          |             |
2.0s   |            |             | [停止] |        |        |        |        |                   |          |             |
       |            |             | [回弹] |        |        |        |        |                   |          |             |
       |            | stopReel(1) |        |        |        |        |        |                   |          |             |
1.7s   |            |      ↓      |        |        |        |        |        |                   |          |             |
       |            |             |        | [减速] |        |        |        |                   |          |             |
2.2s   |            |             |        |   ↓    |        |        |        |                   |          |             |
       |            |             |        | [停止] |        |        |        |                   |          |             |
       |            |             |        | [回弹] |        |        |        |                   |          |             |
1.9s   |            | stopReel(2) |        |        | [减速] |        |        |                   |          |             |
2.4s   |            |             |        |        |   ↓    |        |        |                   |          |             |
       |            |             |        |        | [停止] |        |        |                   |          |             |
2.1s   |            | stopReel(3) |        |        |        | [减速] |        |                   |          |             |
2.6s   |            |             |        |        |        |   ↓    |        |                   |          |             |
       |            |             |        |        |        | [停止] |        |                   |          |             |
2.3s   |            | stopReel(4) |        |        |        |        | [减速] |                   |          |             |
2.8s   |            |             |        |        |        |        |   ↓    |                   |          |             |
       |            |             |        |        |        |        | [停止] |                   |          |             |
       |            | onAllStopped|        |        |        |        |        |                   |          |             |
2.8s   |            |      ↓      |        |        |        |        |        |                   |          |             |
       |            | State→STOPPED        |        |        |        |        |                   |          |             |
       |            | delay(0.3s) |        |        |        |        |        |                   |          |             |
3.1s   |            | playWinAnim |        |        |        |        |        | play()            |          |             |
       |            |      ↓      |        |        |        |        |        |   ↓               |          |             |
3.1s~  |            | State→WIN   |        |        |        |        |        | [播放]             |          |             |
4.6s   |            |             |        |        |        |        |        | [动画中]           |          |             |
       |            |             |        |        |        |        |        |   ↓               |          |             |
4.6s   |            | onWinComplete        |        |        |        |        | complete          |          |             |
       |            |      ↓      |        |        |        |        |        |                   |          |             |
       |            | showWinPopup|        |        |        |        |        |                   | show()   |             |
4.6s   |            | State→POPUP |        |        |        |        |        |                   |   ↓      |             |
       |            |             |        |        |        |        |        |                   | [弹出]    |             |
       |            |             |        |        |        |        |        |                   | [显示]    |             |
       |            |             |        |        |        |        |        |                   |   ↓      |             |
用户    |            |             |        |        |        |        |        |                   | [点击    |             |
点击    |            |             |        |        |        |        |        |                   | 领取]    |             |
       |            | onClaimClick|        |        |        |        |        |                   |   ↓      |             |
       |            |      ↓      |        |        |        |        |        |                   | hide()   |             |
       |            | startCashFly|        |        |        |        |        |                   |          | playFly()   |
       |            |             |        |        |        |        |        |                   |          |   ↓         |
~1.2s  |            |             |        |        |        |        |        |                   |          | [飞行中]     |
       |            | animAmount  |        |        |        |        |        |                   |          | [同时]       |
       |            | (TopBar)    |        |        |        |        |        |                   |          | [数字滚动]   |
       |            |             |        |        |        |        |        |                   |          |   ↓         |
完成    |            | onFlyComplete        |        |        |        |        |                   |          | complete    |
       |            |      ↓      |        |        |        |        |        |                   |          |             |
       |            | showDLPopup |        |        |        |        |        |                   |          |             | show()
       |            |             |        |        |        |        |        |                   |          |             |   ↓
       |            |             |        |        |        |        |        |                   |          |             | [弹出]
       |            |             |        |        |        |        |        |                   |          |             | [脉冲]
       |            |             |        |        |        |        |        |                   |          |             |   ↓
用户    |            |             |        |        |        |        |        |                   |          |             | [点击
点击    |            |             |        |        |        |        |        |                   |          |             | 下载]
       |            | onDLClick   |        |        |        |        |        |                   |          |             |   ↓
       |            |      ↓      |        |        |        |        |        |                   |          |             |
       |            | jumpToStore |        |        |        |        |        |                   |          |             |
       |            | State→IDLE  |        |        |        |        |        |                   |          |             |
       | [Enable]   |      ↓      |        |        |        |        |        |                   |          |             |
       |     ↑      | enableBtn() |        |        |        |        |        |                   |          |             |
```

### 5.2 ReelController停止流程

```
stopSpin(targetSymbols)
    ↓
[准备阶段]
├─ 保存targetSymbols数组
├─ 计算当前位置
├─ 计算目标位置
└─ 计算需要滚动的距离
    ↓
[减速滚动阶段]
├─ 应用缓动函数（EaseOut）
├─ 逐帧更新位置
├─ 检测symbol越界并重置
└─ 为重置的symbol设置targetSymbol
    ↓
    ├─ 距离剩余 > 180px → 随机symbol
    ├─ 距离剩余 ≤ 180px → 设置targetSymbols[0]（顶部）
    ├─ 距离剩余 ≤ 120px → 设置targetSymbols[1]（中间）
    └─ 距离剩余 ≤ 60px → 设置targetSymbols[2]（底部）
    ↓
[精确对齐]
├─ 速度归零
├─ 强制对齐到目标位置（消除误差）
└─ 验证finalSymbols是否正确
    ↓
[回弹效果]
├─ 向下移动8px（0.15s，EaseOut）
└─ 向上回到原位（0.15s，EaseIn）
    ↓
[完成]
└─ 触发onReelStopped回调
```

### 5.3 Symbol帧动画播放流程

```
playWinAnimation(config, loops=3)
    ↓
[第1次循环]
├─ 保存原始spriteFrame
├─ 应用缩放（可选）: scale 1.0 → 1.1
├─ 播放帧动画:
│   ├─ 0.00s: 显示frame_00
│   ├─ 0.07s: 显示frame_01 (1/15秒 ≈ 0.067s)
│   ├─ 0.13s: 显示frame_02
│   ├─ 0.20s: 显示frame_03
│   ├─ 0.27s: 显示frame_04
│   ├─ 0.33s: 显示frame_05
│   ├─ 0.40s: 显示frame_06
│   ├─ 0.47s: 显示frame_07
│   └─ 0.53s: 帧动画完成
├─ 恢复缩放: scale 1.1 → 1.0
└─ 延迟0.1s
    ↓
[第2次循环]
├─ 重复帧动画播放
└─ ...
    ↓
[第3次循环]
├─ 重复帧动画播放
└─ 完成后恢复originalFrame
    ↓
[完成]
└─ 状态 → NORMAL
```

### 5.4 弹窗和现金飞行流程

```
中奖动画完成
    ↓
[显示中奖弹窗]
├─ WinPopup.show(winAmount)
├─ 播放遮罩渐显动画（0.3s）
├─ 播放弹窗缩放弹出动画（0.4s, backOut缓动）
├─ 显示中奖金额文本
└─ 显示领取按钮
    ↓
[等待用户交互]
├─ 弹窗显示中
└─ 等待用户点击领取按钮
    ↓
[用户点击领取按钮]
├─ onClaimClick触发
├─ 播放弹窗关闭动画
└─ WinPopup.hide()
    ↓
[现金飞行动画开始]
├─ 获取起始位置（领取按钮中心坐标）
├─ 获取结束位置（TopBar金额框中心坐标）
├─ 创建金币精灵（80x80px）
├─ CashFlyAnimController.playFlyAnimation(startPos, endPos, 1.2s)
│   ├─ 金币从起始位置出现
│   ├─ 沿贝塞尔曲线飞行（抛物线，向上150px后下落）
│   ├─ 同时进行：
│   │   ├─ 位置移动（bezierTo）
│   │   ├─ 缩放变化（1.0 → 0.3）
│   │   └─ 旋转360度
│   └─ 飞行时长：1.2秒
│
└─ [同时] 金额数字滚动动画
    ├─ TopBarController.animateAmountChange(fromAmount, toAmount, 1.2s)
    ├─ 使用requestAnimationFrame逐帧更新
    ├─ 应用easeOutCubic缓动函数
    ├─ 数字从当前值平滑滚动到目标值
    └─ 每帧更新Label显示: "$X"
    ↓
[飞行动画完成]
├─ 金币到达目标位置后隐藏
├─ 金额数字滚动完成
└─ onFlyComplete触发
    ↓
[显示下载弹窗]
├─ DownloadPopup.show()
├─ 播放遮罩渐显动画（0.3s）
├─ 播放弹窗缩放弹出动画（0.4s, backOut缓动）
├─ 显示提示文本: "Download to claim your reward!"
├─ 显示下载按钮
└─ 启动下载按钮脉冲动画（持续缩放 1.0 ↔ 1.05）
    ↓
[等待用户交互]
├─ 弹窗显示中
└─ 等待用户点击下载按钮
    ↓
[用户点击下载按钮]
├─ onDownloadClick触发
├─ 跳转到应用商店: window.open(storeURL)
├─ 关闭下载弹窗
└─ 恢复Spin按钮可用状态
    ↓
[流程结束]
└─ SlotMachine状态 → IDLE，可以开始下一次spin
```

---

## 六、资源规范

### 6.1 Symbol图片资源

#### 命名规范和实际资源
项目使用圣诞主题Symbol，共13个图片：

**高价值符号（High Symbols）**：
```
H01.png - 圣诞帽      (121 x 110 px)
H02.png - 礼物盒      (121 x 110 px)
H03.png - 铃铛        (121 x 110 px)
H04.png - 拐杖糖      (121 x 110 px)
H05.png - 圣诞树      (121 x 110 px)
```

**低价值符号（Low Symbols）**：
```
L01.png - 字母 A      (121 x 110 px)
L02.png - 字母 K      (121 x 110 px)
L03.png - 字母 Q      (121 x 110 px)
L04.png - 字母 J      (121 x 110 px)
L05.png - 字母 10     (121 x 110 px)
L06.png - 字母 9      (121 x 110 px)
```

**特殊符号（Special Symbols）**：
```
W01.png - Wild符号    (150 x 150 px, 正方形，绿色WILD文字)
S01.png - Scatter符号 (138 x 220 px, 竖向，圣诞老人)
```

#### Symbol显示尺寸设计

由于ReelArea槽位为130x100px，需要对不同原始尺寸的图片进行适配：

**方案：统一适配显示**
- **常规符号（H, L, W）**：显示尺寸 **130 x 100 px**
  - H和L（121x110）缩放到130x100，宽高比从1.1:1变为1.3:1
  - W01（150x150）缩放到130x100，从正方形变为略宽矩形
  - 使用Sprite.SizeMode.CUSTOM，Trim: false

- **Scatter符号（S01）**：特殊处理
  - 原始尺寸138x220，宽高比0.63:1（竖长）
  - 选项A：压缩到130x100（会被严重压扁，不推荐）
  - 选项B：保持宽高比，缩放到**100 x 160 px**（推荐）
    - 宽度100px居中显示（左右各留15px）
    - 高度160px会向上下延伸超出槽位
    - Scatter通常有特殊显示和动画效果，可以允许其超出标准槽位

#### 规格要求
- 原始尺寸：**已提供**（121x110, 150x150, 138x220）
- 格式：PNG（支持透明通道）
- 实际显示尺寸：130px × 100px（常规），100px × 160px（Scatter）
- 注意：原始图片已经是小尺寸，直接使用即可，无需使用大尺寸再缩小

#### 资源路径
```
assets/
└── Texture/
    └── Symbols/
        ├── H01.png  (圣诞帽, 121x110)
        ├── H02.png  (礼物盒, 121x110)
        ├── H03.png  (铃铛, 121x110)
        ├── H04.png  (拐杖糖, 121x110)
        ├── H05.png  (圣诞树, 121x110)
        ├── L01.png  (字母A, 121x110)
        ├── L02.png  (字母K, 121x110)
        ├── L03.png  (字母Q, 121x110)
        ├── L04.png  (字母J, 121x110)
        ├── L05.png  (字母10, 121x110)
        ├── L06.png  (字母9, 121x110)
        ├── W01.png  (Wild, 150x150)
        └── S01.png  (Scatter, 138x220)
```

#### Symbol ID映射建议
```typescript
enum SymbolType {
  // 低价值符号 (0-5)
  L01 = 0,  // 9
  L02 = 1,  // 10
  L03 = 2,  // J
  L04 = 3,  // Q
  L05 = 4,  // K
  L06 = 5,  // A

  // 高价值符号 (6-10)
  H01 = 6,  // 圣诞帽
  H02 = 7,  // 礼物盒
  H03 = 8,  // 铃铛
  H04 = 9,  // 拐杖糖
  H05 = 10, // 圣诞树

  // 特殊符号 (11-12)
  WILD = 11,     // W01
  SCATTER = 12   // S01
}
```

### 6.2 中奖动画帧序列资源

#### 资源组织结构
每个symbol的中奖动画需要准备一组帧序列图片：

```
assets/
└── Texture/
    └── Symbols/
        ├── WinAnimations/
        │   ├── symbol_0_win/
        │   │   ├── frame_00.png
        │   │   ├── frame_01.png
        │   │   ├── frame_02.png
        │   │   └── ... (建议8-20帧)
        │   ├── symbol_1_win/
        │   │   ├── frame_00.png
        │   │   ├── frame_01.png
        │   │   └── ...
        │   └── ... (每个symbol一个文件夹)
        │
        └── Normal/
            ├── symbol_0.png  (普通状态图片)
            ├── symbol_1.png
            └── ...
```

#### 帧序列规格要求
- **尺寸**: 与普通symbol相同，建议 **256x256** 或 **512x512**
- **格式**: PNG（支持透明通道）
- **命名**: 按帧顺序命名（frame_00.png, frame_01.png...）
- **帧数**: 建议8-20帧（根据动画复杂度）
- **内容**:
  - 可以是闪烁、发光、爆炸、旋转等效果
  - 建议最后几帧回到接近normal状态，便于循环

#### 帧率建议
| 动画类型 | 推荐帧率 | 推荐帧数 | 动画时长 |
|---------|---------|---------|---------|
| 简单闪烁 | 12 fps | 8-10帧 | 0.67-0.83秒 |
| 发光效果 | 15 fps | 12-15帧 | 0.8-1.0秒 |
| 复杂特效 | 20 fps | 15-20帧 | 0.75-1.0秒 |

#### 示例：Symbol_7的闪烁动画
```
frame_00.png  - normal状态
frame_01.png  - 开始发光（边缘加白光）
frame_02.png  - 光晕扩大
frame_03.png  - 最亮（外发光+内部高光）
frame_04.png  - 光晕扩大
frame_05.png  - 保持最亮
frame_06.png  - 光晕开始收缩
frame_07.png  - 光晕继续收缩
frame_08.png  - 回到接近normal（保留微弱光晕）
```

### 6.3 侧边栏UI资源

#### 背景装饰图
```
assets/
└── Texture/
    └── Background/
        ├── left_background.jpg      (左侧背景，建议512x1334或更大)
        ├── right_background.jpg     (右侧背景，建议512x1334或更大)
        └── main_background.jpg      (中间游戏区背景，可选)
```

**背景图规格**:
- 尺寸: 至少512x1334，推荐1024x1334或更大
- 格式: JPG（文件小）或PNG
- 内容: 参考图中的西部小镇街道场景
- 建议: 使用模糊或暗化处理，不抢主游戏区视觉

#### 左侧图标资源
```
assets/
└── Texture/
    └── Icons/
        ├── icon_function.png        (功能图标，40x40)
        └── icon_bg.png              (图标圆形背景，70x70)
```

**图标规格**:
- 图标尺寸: 40 x 40px
- 背景尺寸: 70 x 70px（圆形）
- 格式: PNG（支持透明通道）
- 颜色: 白色图标，半透明白色背景
- 样式: 扁平化设计，线条清晰
- 说明: 可根据需要选择设置、音效、信息等图标

#### 右侧下载按钮资源
```
assets/
└── Texture/
    └── Buttons/
        ├── btn_download.png         (下载按钮背景，180x70)
        ├── btn_download_pressed.png (按下状态，180x70)
        ├── icon_download.png        (下载图标，35x35)
        └── btn_glow.png            (发光效果，200x90)
```

**下载按钮规格**:
- 按钮尺寸: 180 x 70px
- 图标尺寸: 35 x 35px
- 格式: PNG（支持透明通道）
- 颜色方案:
  - 主色: 鲜艳橙红渐变 (#FF6600 → #FF3300)
  - 按下: 深色 (#CC4400 → #CC2200)
  - 发光: 半透明黄色/橙色
- 文本: "DOWNLOAD"、"FREE"、"INSTALL NOW"等
- 字体: 24-28px，白色，加粗，可能带描边

### 6.4 UI资源（中间区域）

#### 滚轴背景图
```
reel_background.png
- 尺寸: 690 x 330 px
- 格式: PNG（支持透明通道）
- 内容: 装饰性边框，中间670x310区域透明或半透明
- 风格: 金属质感、木框、霓虹灯等（根据主题）
```

#### Spin按钮资源
```
assets/
└── Texture/
    └── UI/
        ├── btn_spin_normal.png    (普通状态，140x140)
        ├── btn_spin_pressed.png   (按下状态，140x140)
        ├── btn_spin_disabled.png  (禁用状态，140x140)
        └── icon_spin.png          (旋转图标，60x60)
```

**按钮规格**:
- 尺寸: 140 x 140 px（圆形）
- 格式: PNG（支持透明通道）
- 建议: 使用渐变背景，带阴影或发光效果
- 颜色: 绿色系（正常）、深绿（按下）、灰色（禁用）

#### 提现金额UI资源
```
assets/
└── Texture/
    └── UI/
        ├── cashout_bg.png         (提现框背景，250x60)
        ├── icon_coin.png          (金币图标，40x40)
        └── font_cash.fnt          (金额字体文件，可选)
```

**提现框规格**:
- 背景尺寸: 250 x 60 px
- 格式: PNG
- 建议: 带圆角矩形，金色边框
- 金币图标: 40x40，放在文本左侧

#### 通用装饰资源
```
assets/
└── Texture/
    └── UI/
        ├── top_bar_bg.png         (上栏背景装饰)
        ├── bottom_bar_bg.png      (下栏背景装饰)
        └── particle_star.png      (星星粒子，可选）
```

### 6.5 弹窗资源

#### 中奖弹窗资源
```
assets/
└── Texture/
    └── Popup/
        ├── win_popup_bg.png          (中奖弹窗背景，500x400)
        ├── win_popup_glow.png        (发光装饰，可选，520x420)
        ├── icon_coin_big.png         (大金币图标，50x50)
        ├── btn_claim.png             (领取按钮背景，200x80)
        ├── btn_claim_pressed.png     (领取按钮按下状态，200x80)
        └── btn_claim_glow.png        (领取按钮发光效果，220x100)
```

**中奖弹窗规格**:
- 弹窗背景尺寸: 500 x 400px
- 格式: PNG（支持透明通道）
- 背景样式: 带圆角（半径20-30px），金色边框（5-8px）
- 背景颜色: 渐变填充（金色渐变 #FFD700 → #FFA500）
- 遮罩层: 全屏，半透明黑色 rgba(0,0,0,0.7)
- 金币图标: 50x50px，放在中奖金额上方
- 金额字体: 48-64px，金色粗体，带黑色描边
- 领取按钮: 200x80px，绿色渐变，文本"CLAIM"或"领取"

#### 下载弹窗资源
```
assets/
└── Texture/
    └── Popup/
        ├── download_popup_bg.png       (下载弹窗背景，500x400)
        ├── download_popup_glow.png     (发光装饰，可选，520x420)
        ├── btn_download_big.png        (大下载按钮背景，220x90)
        ├── btn_download_big_pressed.png (按下状态，220x90)
        ├── btn_download_big_glow.png   (发光效果，240x110)
        └── icon_download_big.png       (大下载图标，40x40)
```

**下载弹窗规格**:
- 弹窗背景尺寸: 500 x 400px
- 格式: PNG（支持透明通道）
- 背景样式: 带圆角（半径20-30px），渐变边框
- 背景颜色: 蓝色或绿色渐变（#4CAF50 → #2196F3）
- 遮罩层: 全屏，半透明黑色 rgba(0,0,0,0.7)
- 提示文本: 28-32px，白色，居中
- 下载按钮: 220x90px，鲜艳橙红渐变 (#FF6600 → #FF3300)
- 按钮文本: "DOWNLOAD NOW"，28-32px，白色粗体
- 脉冲动画: 持续缩放 1.0 ↔ 1.05

#### 现金飞行动画资源
```
assets/
└── Texture/
    └── Animation/
        └── cash_coin.png            (金币图片，128x128)
```

**金币图片规格**:
- 尺寸: 128 x 128px（建议2的幂次方）
- 格式: PNG（支持透明通道）
- 内容: 金币图案，带光泽效果
- 实际显示尺寸: 80x80px（在飞行开始时），缩放到24x24px（到达目标时）
- 建议: 使用清晰的金币图案，带有高光和阴影效果

### 6.6 音效资源（可选）

```
assets/
└── Audio/
    ├── spin_start.mp3       (开始滚动音效)
    ├── reel_stop.mp3        (单列停止音效)
    ├── win_small.mp3        (小奖音效)
    ├── win_big.mp3          (大奖音效)
    ├── popup_show.mp3       (弹窗弹出音效)
    ├── button_click.mp3     (按钮点击音效)
    ├── cash_fly.mp3         (金币飞行音效，whoosh)
    ├── cash_collect.mp3     (金币到达音效，叮当声)
    └── background_loop.mp3  (背景音乐)
```

---

## 七、配置文件设计

### 7.1 SlotConfig配置文件

建议使用JSON或编辑器Inspector配置：

```json
{
  "layoutConfig": {
    "rows": 3,
    "reels": 5,
    "symbolHeight": 56,
    "symbolWidth": 64,
    "symbolGap": 4
  },
  "symbolConfig": {
    "symbolTypes": 10,
    "symbolsPerReel": 7,
    "visibleSymbolsPerReel": 3
  },
  "spinConfig": {
    "accelerationTime": 0.2,
    "normalSpeed": 800,
    "minDuration": 1.5,
    "decelerationTime": 0.5,
    "reelStopDelay": 0.2,
    "bounceBackDistance": 8,
    "bounceBackDuration": 0.15
  },
  "winAnimConfig": {
    "delay": 0.3,
    "loops": 3,
    "mode": "SIMULTANEOUS"
  }
}
```

### 7.2 Symbol动画配置文件

```json
{
  "symbolAnimations": [
    {
      "symbolId": 0,
      "frameAnimation": {
        "frames": [
          "symbol_0_win/frame_00",
          "symbol_0_win/frame_01",
          "symbol_0_win/frame_02",
          "symbol_0_win/frame_03",
          "symbol_0_win/frame_04",
          "symbol_0_win/frame_05",
          "symbol_0_win/frame_06",
          "symbol_0_win/frame_07"
        ],
        "frameRate": 12,
        "loopCount": 1
      },
      "extraScale": {
        "enabled": false
      }
    },
    {
      "symbolId": 7,
      "frameAnimation": {
        "frames": [
          "symbol_7_win/frame_00",
          "symbol_7_win/frame_01",
          "symbol_7_win/frame_02",
          "symbol_7_win/frame_03",
          "symbol_7_win/frame_04",
          "symbol_7_win/frame_05",
          "symbol_7_win/frame_06",
          "symbol_7_win/frame_07",
          "symbol_7_win/frame_08",
          "symbol_7_win/frame_09"
        ],
        "frameRate": 15,
        "loopCount": 1
      },
      "extraScale": {
        "enabled": true,
        "scaleTo": 1.1
      }
    }
  ]
}
```

**配置说明**：
- `frames`: 帧图片路径数组（相对于SpriteAtlas）
- `frameRate`: 播放帧率（帧/秒）
- `loopCount`: 单次触发循环次数（WinAnimationController的loops参数会再次循环整个动画）
- `extraScale`: 可选的缩放效果，与帧动画同时播放

### 7.3 初始布局配置

```json
{
  "initialLayout": [
    [1, 3, 5, 7, 2],
    [4, 6, 8, 3, 5],
    [2, 9, 1, 4, 6]
  ]
}
```

### 7.4 测试结果配置

```json
{
  "testResults": [
    {
      "name": "中间一条线中奖",
      "finalLayout": [
        [3, 2, 5, 9, 1],
        [7, 7, 7, 7, 7],
        [2, 8, 1, 4, 6]
      ],
      "winPositions": [
        {"row": 1, "col": 0, "symbolId": 7},
        {"row": 1, "col": 1, "symbolId": 7},
        {"row": 1, "col": 2, "symbolId": 7},
        {"row": 1, "col": 3, "symbolId": 7},
        {"row": 1, "col": 4, "symbolId": 7}
      ],
      "winLines": [
        {
          "lineId": 2,
          "positions": [[1, 0], [1, 1], [1, 2], [1, 3], [1, 4]],
          "symbolId": 7
        }
      ]
    },
    {
      "name": "多条线中奖",
      "finalLayout": [
        [3, 3, 3, 3, 3],
        [3, 5, 8, 2, 3],
        [3, 3, 3, 3, 3]
      ],
      "winPositions": [
        {"row": 0, "col": 0, "symbolId": 3},
        {"row": 0, "col": 1, "symbolId": 3},
        {"row": 0, "col": 2, "symbolId": 3},
        {"row": 0, "col": 3, "symbolId": 3},
        {"row": 0, "col": 4, "symbolId": 3},
        {"row": 2, "col": 0, "symbolId": 3},
        {"row": 2, "col": 1, "symbolId": 3},
        {"row": 2, "col": 2, "symbolId": 3},
        {"row": 2, "col": 3, "symbolId": 3},
        {"row": 2, "col": 4, "symbolId": 3}
      ],
      "winLines": [
        {
          "lineId": 1,
          "positions": [[0, 0], [0, 1], [0, 2], [0, 3], [0, 4]],
          "symbolId": 3
        },
        {
          "lineId": 3,
          "positions": [[2, 0], [2, 1], [2, 2], [2, 3], [2, 4]],
          "symbolId": 3
        }
      ]
    }
  ]
}
```

---

## 八、使用示例

### 8.1 场景搭建

在Cocos Creator编辑器中搭建场景：

1. **创建Canvas**
   - Design Resolution: 2400 x 1334（全屏布局）
   - Fit Height: true, Fit Width: true

2. **创建背景层**
   ```
   Canvas
   └── BackgroundLayer (Widget: Left=0, Right=0, Top=0, Bottom=0)
       ├── LeftBackground (Sprite: left_background.jpg)
       └── RightBackground (Sprite: right_background.jpg)
   ```

3. **创建LeftSidePanel（左侧面板）**
   ```
   Canvas
   └── LeftSidePanel (Position: (-780, 0), Size: 840x1334)
       ├── FunctionIcon (Button，y=+200)
       │   ├── IconBG (Sprite: icon_bg.png)
       │   └── IconSprite (Sprite: icon_function.png)
       └── DownloadButton (Button, y=-200, 180x70)
           ├── ButtonBG (Sprite: btn_download.png)
           ├── ButtonGlow (Sprite: btn_glow.png)
           ├── IconSprite (Sprite: icon_download.png)
           └── ButtonLabel (Label: "DOWNLOAD")
   ```

4. **创建MainGameContainer（中间主游戏区）**
   ```
   Canvas
   └── MainGameContainer (Widget: Align=Center, 720x1334)
       └── UIContainer
           ├── TopBar (Widget: Top=0, Height=100)
           ├── MiddleContainer (Widget: Top=100, Bottom=120)
           └── BottomBar (Widget: Bottom=0, Height=120)
   ```

5. **创建TopBar（上栏）**
   ```
   MainGameContainer/UIContainer
   └── TopBar (Widget: Top=0, Height=100)
       └── CashoutLabel
           ├── Icon (Sprite: icon_coin.png)
           └── AmountLabel (Label: "$1000")
   ```

6. **创建MiddleContainer（中间区域）**
   ```
   MainGameContainer/UIContainer
   └── MiddleContainer (Widget: Top=100, Bottom=120)
       └── ReelContainer (Widget: Align=Center)
           ├── ReelBackground (Sprite: reel_background.png, 690x330)
           ├── ReelMask (Mask: RECT, 670x310)
           └── ReelsGroup
               ├── Reel_0 (x=-268)
               ├── Reel_1 (x=-134)
               ├── Reel_2 (x=0)
               ├── Reel_3 (x=134)
               └── Reel_4 (x=268)
   ```

   **Reel位置计算**:
   - 间距: 4px, Symbol宽度: 130px
   - 第0列: -((130+4) * 2) = -268
   - 第1列: -(130+4) = -134
   - 第2列: 0 (中心)
   - 第3列: 130+4 = 134
   - 第4列: (130+4) * 2 = 268

7. **创建BottomBar（下栏）**
   ```
   MainGameContainer/UIContainer
   └── BottomBar (Widget: Bottom=0, Height=120)
       └── SpinButton (Button, 140x140)
           ├── ButtonBG (Sprite: btn_spin_normal.png)
           └── ButtonLabel (Label: "SPIN")
   ```

8. **创建RightSidePanel（右侧面板）**
   ```
   Canvas
   └── RightSidePanel (Position: (780, 0), Size: 840x1334)
       ├── FunctionIcon (Button，y=+200)
       │   ├── IconBG (Sprite: icon_bg.png)
       │   └── IconSprite (Sprite: icon_function.png)
       └── DownloadButton (Button, y=-200, 180x70)
           ├── ButtonBG (Sprite: btn_download.png)
           ├── ButtonGlow (Sprite: btn_glow.png)
           ├── IconSprite (Sprite: icon_download.png)
           └── ButtonLabel (Label: "DOWNLOAD")
   ```

**层级顺序（从下到上）**:
1. BackgroundLayer（最底层，背景）
2. LeftSidePanel（左侧面板：图标+下载按钮）
3. MainGameContainer（中间游戏区）
4. RightSidePanel（右侧面板：图标+下载按钮，最顶层）

### 8.2 初始化Slot

```typescript
// 在场景脚本中
onLoad() {
  // 1. 初始化UI控制器
  this.initUIControllers();

  // 2. 获取SlotMachine组件
  const slotMachine = this.node.getComponent(SlotMachine);

  // 3. 设置symbol普通状态图片资源
  const symbolSprites = this.loadSymbolSprites();
  slotMachine.setSymbolSprites(symbolSprites);

  // 4. 加载并设置symbol动画配置
  const animConfigs = this.loadAnimConfigs();
  slotMachine.setSymbolAnimConfigs(animConfigs);

  // 5. 设置初始布局
  const initialLayout = [
    [1, 3, 5, 7, 2],
    [4, 6, 8, 3, 5],
    [2, 9, 1, 4, 6]
  ];
  slotMachine.init(initialLayout);

  // 6. 设置初始提现金额
  this.topBarController.setAmount(1000);
}

// 初始化UI控制器
initUIControllers() {
  // TopBar控制器
  const topBarNode = cc.find("UIContainer/TopBar", this.node);
  this.topBarController = topBarNode.getComponent(TopBarController);

  // SpinButton控制器
  const spinButtonNode = cc.find("UIContainer/BottomBar/SpinButton", this.node);
  this.spinButtonController = spinButtonNode.getComponent(SpinButtonController);

  // 设置按钮点击回调
  this.spinButtonController.setClickCallback(() => {
    this.onSpinButtonClick();
  });
}

// 加载symbol普通图片
loadSymbolSprites(): cc.SpriteFrame[] {
  const sprites: cc.SpriteFrame[] = [];
  for (let i = 0; i < 10; i++) {
    const frame = this.symbolAtlas.getSpriteFrame(`symbol_${i}`);
    sprites.push(frame);
  }
  return sprites;
}

// 加载动画配置
loadAnimConfigs(): SymbolAnimConfig[] {
  const configs: SymbolAnimConfig[] = [];

  for (let i = 0; i < 10; i++) {
    // 加载该symbol的中奖动画帧序列
    const frames = this.loadWinAnimationFrames(i);

    configs.push({
      symbolId: i,
      frameAnimation: {
        spriteFrames: frames,
        frameRate: 15,
        loopCount: 1
      },
      extraScale: {
        enabled: i === 7, // 只有symbol_7启用缩放
        scaleTo: 1.1
      }
    });
  }

  return configs;
}

// 加载单个symbol的中奖动画帧序列
loadWinAnimationFrames(symbolId: number): cc.SpriteFrame[] {
  const frames: cc.SpriteFrame[] = [];
  const frameCount = this.getFrameCount(symbolId); // 根据symbol获取帧数

  for (let i = 0; i < frameCount; i++) {
    const frameName = `symbol_${symbolId}_win/frame_${i.toString().padStart(2, '0')}`;
    const frame = this.winAnimAtlas.getSpriteFrame(frameName);
    if (frame) {
      frames.push(frame);
    }
  }

  return frames;
}
```

### 8.3 触发Spin

```typescript
onSpinButtonClick() {
  // 检查状态
  if (slotMachine.getState() !== SlotState.IDLE) {
    return; // 正在spin中，忽略点击
  }

  // 禁用按钮并显示旋转状态
  this.spinButtonController.disable();
  this.spinButtonController.showSpinningState();

  // 准备结果数据（从服务器获取或本地生成）
  const spinResult: SpinResult = {
    finalLayout: [
      [3, 7, 2, 9, 5],
      [7, 7, 7, 7, 7],
      [2, 8, 2, 5, 9]
    ],
    winPositions: [
      {row: 1, col: 0, symbolId: 7},
      {row: 1, col: 1, symbolId: 7},
      {row: 1, col: 2, symbolId: 7},
      {row: 1, col: 3, symbolId: 7},
      {row: 1, col: 4, symbolId: 7}
    ],
    winLines: [
      {
        lineId: 2,
        positions: [[1, 0], [1, 1], [1, 2], [1, 3], [1, 4]],
        symbolId: 7
      }
    ]
  };

  // 开始spin
  slotMachine.spin(spinResult);
}

// SlotMachine回调
async onSlotSpinComplete() {
  // 中奖动画完成后，显示中奖弹窗
  const winAmount = this.calculateWinAmount();
  if (winAmount > 0) {
    // 1. 显示中奖弹窗
    this.winPopupController.setWinAmount(winAmount);
    await this.winPopupController.show();

    // 2. 等待用户点击领取按钮（通过Promise）
    await this.waitForClaimClick();

    // 3. 隐藏中奖弹窗
    await this.winPopupController.hide();

    // 4. 播放现金飞行动画 + 金额滚动
    const startPos = this.winPopupController.getClaimButtonPosition();
    const endPos = this.topBarController.getCashoutPosition();
    const currentAmount = this.topBarController.getAmount();

    // 同时执行飞行动画和金额滚动
    await Promise.all([
      this.cashFlyAnimController.playFlyAnimation(startPos, endPos, 1.2),
      this.topBarController.animateAmountChange(currentAmount, currentAmount + winAmount, 1.2)
    ]);

    // 5. 显示下载弹窗
    await this.downloadPopupController.show();

    // 6. 等待用户点击下载按钮
    await this.waitForDownloadClick();

    // 7. 跳转到应用商店
    this.jumpToAppStore();

    // 8. 关闭下载弹窗
    await this.downloadPopupController.hide();
  }

  // 9. 恢复Spin按钮可用状态
  this.spinButtonController.enable();
}

// 等待用户点击领取按钮
waitForClaimClick(): Promise<void> {
  return new Promise(resolve => {
    this.winPopupController.onClaimClick = () => {
      resolve();
    };
  });
}

// 等待用户点击下载按钮
waitForDownloadClick(): Promise<void> {
  return new Promise(resolve => {
    this.downloadPopupController.onDownloadClick = () => {
      resolve();
    };
  });
}

// 跳转到应用商店
jumpToAppStore() {
  const storeURL = this.getStoreURL(); // 根据平台获取商店URL
  window.open(storeURL, '_blank');
}
```

### 8.4 测试用：生成随机结果

```typescript
onTestButtonClick() {
  const resultManager = this.node.getComponent(ResultManager);

  // 生成一个有中奖的随机结果
  const randomResult = resultManager.generateWinResult(7, 'horizontal');

  // 执行spin
  slotMachine.spin(randomResult);
}
```

---

## 九、性能优化建议

### 9.1 对象池
- 为SymbolItem节点使用对象池
- 减少运行时的节点创建销毁
- 复用Tween对象优化内存

### 9.2 渲染优化
- 使用SpriteAtlas合批symbol图片和动画帧序列
- 减少DrawCall
- 所有中奖动画帧打包到同一个或少数几个SpriteAtlas
- 滚动时可适当降低帧率（可选）

### 9.3 动画优化
- 使用Tween而非每帧update计算
- 减速阶段计算好路径，避免逐帧判断
- 帧动画使用scheduleOnce精确控制帧间隔
- 预加载所有动画帧SpriteFrame，避免运行时加载
- 限制同时播放帧动画的symbol数量（建议≤5个）

### 9.4 内存优化
- 预加载所有symbol资源
- 动态纹理释放（如果symbol很多）
- 避免闭包导致的内存泄漏

---

## 十、测试要点

### 10.1 功能测试
- [ ] 初始布局显示正确
- [ ] Spin按钮点击有效
- [ ] 滚动动画流畅（加速→匀速→减速）
- [ ] 逐列停止时序正确（每列延迟0.2s）
- [ ] 停止位置精确（与finalLayout一致）
- [ ] 回弹效果自然
- [ ] 中奖动画触发正确
- [ ] 中奖动画播放流畅
- [ ] 动画结束后可再次spin
- [ ] 提现金额显示正确
- [ ] 提现金额更新动画流畅
- [ ] 按钮状态切换正确（启用/禁用）
- [ ] UI布局居中对齐正确
- [ ] 中奖弹窗在中奖后正确弹出
- [ ] 中奖弹窗显示金额正确
- [ ] 中奖弹窗动画流畅（缩放+渐显）
- [ ] 领取按钮可点击
- [ ] 现金飞行动画播放正确
- [ ] 现金飞行轨迹（贝塞尔曲线）流畅
- [ ] 金额数字滚动与飞行动画同步
- [ ] 金额数字滚动到正确的目标值
- [ ] 下载弹窗在飞行完成后弹出
- [ ] 下载弹窗脉冲动画持续播放
- [ ] 下载按钮可点击且跳转正确

### 10.2 UI测试
- [ ] TopBar显示正确，金额可读
- [ ] 滚轴背景图显示正确
- [ ] 滚轴区域Mask正常工作（超出部分不可见）
- [ ] SpinButton状态切换正确（普通/按下/禁用）
- [ ] SpinButton按下动画流畅
- [ ] 各UI元素层级正确（无遮挡问题）
- [ ] 颜色和字体符合设计规范
- [ ] 左侧图标和下载按钮显示正确，可点击
- [ ] 右侧图标和下载按钮显示正确，可点击
- [ ] 左右两侧下载按钮脉冲动画正常
- [ ] 侧边栏背景图显示正确
- [ ] 左右侧边栏与中间游戏区对齐正确
- [ ] 中奖弹窗背景和边框显示正确
- [ ] 中奖弹窗遮罩层半透明效果正确
- [ ] 中奖弹窗金额文本清晰可读
- [ ] 领取按钮样式符合设计（颜色、大小、文本）
- [ ] 下载弹窗背景和样式正确
- [ ] 下载弹窗提示文本显示完整
- [ ] 下载弹窗下载按钮样式正确（橙红渐变）
- [ ] 飞行金币图片清晰可见
- [ ] 弹窗层级高于游戏区（不被遮挡）

### 10.3 响应式布局测试
- [ ] 1024x768分辨率：显示完整布局
- [ ] 1366x1024分辨率：侧边栏正常显示
- [ ] 1920x1080分辨率：背景正常铺满
- [ ] 720px宽度：侧边栏隐藏或缩小
- [ ] 窄屏设备：只显示主游戏区或提示横屏
- [ ] 浏览器窗口resize：布局动态调整正常

### 10.4 边界测试
- [ ] 连续快速点击spin按钮
- [ ] 所有symbol相同的结果
- [ ] 所有symbol不同的结果
- [ ] 无中奖的情况
- [ ] 全屏中奖的情况（15个全中）
- [ ] 多条线同时中奖
- [ ] 快速点击左右侧图标
- [ ] 快速点击左右侧下载按钮
- [ ] 左右侧按钮在spin过程中的行为
- [ ] 弹窗显示时快速点击领取按钮
- [ ] 飞行动画过程中的交互
- [ ] 连续多次中奖的弹窗流程
- [ ] 不同中奖金额的弹窗显示
- [ ] 下载弹窗显示时点击遮罩层（不应关闭）
- [ ] 下载按钮跳转后返回页面的状态

### 10.5 性能测试
- [ ] 连续spin 100次无卡顿
- [ ] 内存无持续增长
- [ ] DrawCall在合理范围（<80，包含背景图）
- [ ] FPS稳定在60

### 10.6 兼容性测试
- [ ] 不同分辨率适配
- [ ] iOS设备测试
- [ ] Android设备测试
- [ ] WebGL测试
- [ ] 不同浏览器测试（Chrome, Safari, Firefox）

---

## 十一、开发排期建议

### Phase 1: 基础框架（2-3天）
- [ ] 创建基础类和数据结构
- [ ] 实现SlotMachine主控制器
- [ ] 实现GridManager
- [ ] 实现ResultManager
- [ ] 初始布局显示

### Phase 2: 滚动逻辑（3-4天）
- [ ] 实现ReelController
- [ ] 实现SymbolItem
- [ ] 实现滚动动画（加速、匀速、减速）
- [ ] 实现symbol循环逻辑
- [ ] 实现精确停止算法
- [ ] 实现回弹效果

### Phase 3: 中奖系统（2-3天）
- [ ] 实现WinAnimationController
- [ ] 为每个symbol配置动画
- [ ] 实现帧动画播放逻辑
- [ ] 加载和管理动画帧序列资源
- [ ] 实现额外缩放效果（可选）
- [ ] 实现多种播放模式（同时/逐线/顺序）

### Phase 4: UI和集成（3-4天）
- [ ] 实现TopBarController（提现金额显示和数字滚动动画）
- [ ] 实现SpinButtonController（按钮交互和动画）
- [ ] 实现LeftSidePanelController（图标+下载按钮交互和脉冲动画）
- [ ] 实现RightSidePanelController（图标+下载按钮交互和脉冲动画）
- [ ] 实现WinPopupController（中奖弹窗和动画）
- [ ] 实现DownloadPopupController（下载弹窗和脉冲动画）
- [ ] 实现CashFlyAnimController（现金飞行动画）
- [ ] 实现屏幕适配逻辑（响应式布局）
- [ ] 场景搭建和UI布局（包括对称的侧边栏和弹窗）
- [ ] Widget适配配置
- [ ] 创建滚轴背景图和装饰
- [ ] 创建侧边栏背景图
- [ ] 创建弹窗背景图和按钮资源
- [ ] 创建飞行金币图片
- [ ] 资源导入和配置（UI资源、symbol资源、侧边栏资源、弹窗资源）
- [ ] 音效集成（可选）

### Phase 5: 测试和优化（2-3天）
- [ ] 功能测试
- [ ] UI测试（包括侧边栏和弹窗）
- [ ] 弹窗流程测试（中奖弹窗→飞行动画→下载弹窗）
- [ ] 响应式布局测试（不同分辨率）
- [ ] 性能优化
- [ ] Bug修复
- [ ] 参数调优

**总计：12-19个工作日**

---

## 十二、扩展功能（可选）

### 12.1 快速停止
点击spin按钮时，如果正在滚动，立即停止所有滚轴到结果位置。

### 12.2 自动旋转
实现Auto Spin功能，连续自动spin N次。

### 12.3 背景音效
添加滚动、停止、中奖等音效。

### 12.4 预期效果（Anticipation）
当即将中奖时（例如前4列已停止且形成趋势），第5列减速前播放特殊动画。

### 12.5 Free Spin
触发特定symbol组合后，进入免费旋转模式。

### 12.6 Wild Symbol
通配符symbol，可以替代任意symbol形成连线。

### 12.7 Scatter Symbol
分散symbol，不需要连线，出现指定数量即中奖。

---

## 十三、注意事项

1. **坐标系统**：Cocos Creator使用笛卡尔坐标系，Y轴向上为正，注意滚动方向的计算。

2. **时间精度**：使用`cc.tween`或`cc.Action`实现动画，避免手动管理定时器。

3. **状态管理**：严格管理SlotMachine的状态，防止重复触发spin。

4. **内存管理**：Symbol节点使用对象池，避免频繁创建销毁。

5. **异步处理**：中奖动画使用`async/await`或`Promise`管理异步流程。

6. **可配置性**：所有参数都应支持编辑器配置或外部JSON配置。

7. **可扩展性**：预留接口以支持未来的新功能（如Free Spin、Wild等）。

8. **调试工具**：建议添加调试面板，可以手动设置结果、查看当前状态等。

---

## 十四、参考资料

### Cocos Creator官方文档
- 动画系统：https://docs.cocos.com/creator/2.4/manual/zh/animation/
- Tween系统：https://docs.cocos.com/creator/2.4/manual/zh/scripting/tween.html
- 对象池：https://docs.cocos.com/creator/2.4/manual/zh/scripting/pooling.html

### 设计参考
- 经典Slot游戏（如Book of Ra、Starburst等）
- Slot游戏数学模型和概率设计

---

## 附录A：快速检查清单

**开发前准备**
- [ ] 确认symbol图片资源（10张PNG，建议128x128或256x256）
- [ ] 确认每个symbol的中奖动画帧序列（每个8-20帧）
- [ ] 确认动画帧率和时长需求
- [ ] 确认初始布局数据
- [ ] 确认测试结果数据（至少3-5组）
- [ ] 确认滚轮区域尺寸（340px × 180px）
- [ ] 确认中间游戏区尺寸（720px × 1334px）
- [ ] 确认UI资源（滚轴背景、按钮、图标等）
- [ ] 确认侧边栏资源（背景图、图标、下载按钮 × 2套）
- [ ] 确认弹窗资源（中奖弹窗背景、下载弹窗背景、领取按钮、下载按钮）
- [ ] 确认飞行动画资源（金币图片，128x128px）
- [ ] 确认设计稿和颜色规范
- [ ] 确认屏幕分辨率适配方案（1024-1920px宽度）
- [ ] 确认下载按钮CTA文案和跳转链接
- [ ] 确认应用商店URL（iOS App Store和Google Play）

**开发中检查**
- [ ] 代码符合TypeScript规范
- [ ] 所有类都有清晰的职责划分
- [ ] 接口设计合理，易于扩展
- [ ] 关键逻辑添加注释
- [ ] 性能敏感代码优化

**测试前检查**
- [ ] 所有TODO已完成
- [ ] 无console.error输出
- [ ] 资源正确加载
- [ ] 配置参数已调优

**发布前检查**
- [ ] 删除测试代码
- [ ] 删除调试日志
- [ ] 资源路径正确
- [ ] 性能达标

---

## 附录B：常见问题FAQ

**Q1: Symbol停止位置不精确怎么办？**
A: 在减速完成后，强制对齐到目标位置：`symbol.node.y = targetY`。

**Q2: 滚动速度看起来不够快？**
A: 增加`spinNormalSpeed`参数，建议范围：800-1200像素/秒（根据小尺寸调整）。

**Q3: 中奖动画不够明显？**
A: 调整以下参数：
   - 增加帧序列的对比度（让最亮的帧更亮）
   - 开启extraScale效果，适当放大（scaleTo: 1.15-1.2）
   - 增加帧率使动画更流畅（frameRate: 18-24）
   - 确保最后几帧与首帧差异明显

**Q4: 帧动画播放不流畅？**
A: 检查以下几点：
   - 确保所有帧图片已打包到SpriteAtlas中
   - 降低帧率到12-15fps
   - 减少同时播放动画的symbol数量
   - 使用scheduleOnce而非setInterval确保帧间隔准确

**Q5: 内存持续增长？**
A: 检查是否正确使用对象池，检查定时器和Tween是否正确清理。确保帧序列SpriteFrame正确释放。

**Q6: 如何实现不同的中奖线？**
A: 在`WinLine`数据中定义positions数组，支持任意形状的连线（横线、斜线、Z字形等）。

**Q7: 如何制作symbol的中奖动画帧序列？**
A: 推荐方法：
   - 使用After Effects制作动画，导出PNG序列
   - 使用Spine或DragonBones制作后导出帧序列
   - 使用TexturePacker打包所有帧到一个SpriteAtlas
   - 确保帧序列命名连续（frame_00, frame_01...）

**Q8: 如何确保滚轴区域Mask正常工作？**
A: 在ReelContainer上添加Mask组件：
   - 类型选择RECT
   - 尺寸设为340x180
   - 确保ReelsGroup是Mask节点的子节点
   - 在编辑器中测试Symbol移出边界是否被裁剪

**Q9: 不同屏幕尺寸如何适配？**
A: 使用Widget组件实现：
   - Canvas设置Fit Height和Fit Width为true
   - TopBar和BottomBar固定高度，使用Widget对齐顶部/底部
   - MiddleContainer使用弹性高度（Top和Bottom约束）
   - ReelContainer居中对齐，固定尺寸
   - 测试不同分辨率（iPhone SE, iPhone 14 Pro Max, iPad等）

**Q10: 侧边栏在窄屏设备如何处理？**
A: 实现响应式布局：
   - 宽屏（≥1024px）：显示完整侧边栏（左右两侧各有图标+下载按钮）
   - 中等宽度（720-1024px）：缩小侧边栏宽度
   - 窄屏（<720px）：隐藏侧边栏，只显示主游戏区
   - 使用代码动态调整：监听resize事件，动态设置节点active和宽度

**Q11: 左右两侧面板为什么是对称设计？**
A: 对称设计的优势：
   - 视觉平衡：左右两侧都有图标和下载按钮，提供更好的视觉平衡
   - 用户引导：两侧都有下载按钮，增加点击转化机会
   - 功能分布：可以在左右两侧放置不同功能的图标（如左侧音效，右侧设置）
   - 灵活布局：根据需要可以隐藏或显示任一侧的元素

**Q12: 如何实现下载按钮的脉冲动画？**
A: 使用Tween实现持续缩放：
```typescript
playPulseAnimation() {
  cc.tween(this.downloadButton)
    .to(0.8, { scale: 1.05 }, { easing: 'sineInOut' })
    .to(0.8, { scale: 1.0 }, { easing: 'sineInOut' })
    .union()
    .repeatForever()
    .start();
}
```

**Q13: 如何优化背景图加载？**
A: 使用以下策略：
   - 背景图使用JPG格式减小文件大小
   - 适当压缩质量（70-80%）
   - 使用适中分辨率（如1024x1334而非4K）
   - 考虑使用渐变色替代复杂背景
   - 预加载关键资源，背景图延迟加载

**Q14: 现金飞行动画不流畅怎么办？**
A: 优化建议：
   - 确保使用贝塞尔曲线（bezierTo）而非线性移动
   - 飞行时长建议1.0-1.5秒之间
   - 使用parallel并行执行位置、缩放、旋转动画
   - 金币图片使用2的幂次方尺寸（128x128）
   - 确保金币精灵在独立的容器节点中，避免受其他节点影响

**Q15: 金额数字滚动不平滑？**
A: 检查以下几点：
   - 使用requestAnimationFrame确保每帧更新
   - 应用缓动函数（如easeOutCubic）使滚动平滑
   - 滚动时长与飞行动画时长一致（1.2秒）
   - 数字更新频率适中（每帧更新，避免跳跃感）
   - 最终值使用Math.floor取整，避免小数显示

**Q16: 弹窗弹出动画效果不理想？**
A: 调整动画参数：
   - 使用backOut缓动函数增加弹性效果
   - 初始缩放设为0.3-0.5，弹出到1.0
   - 弹出时长0.3-0.5秒之间
   - 同时添加透明度渐变（0 → 255）
   - 遮罩层单独渐显（0.3秒到达70%透明度）

**Q17: 如何确保弹窗在所有设备正确居中？**
A: 使用以下方法：
   - 弹窗节点设置为Canvas的直接子节点
   - 使用Widget组件，Align=Center
   - 弹窗尺寸固定（500x400px）
   - 遮罩层全屏拉伸（Widget: Left=0, Right=0, Top=0, Bottom=0）
   - 在不同分辨率测试弹窗位置

---

**文档结束**

如有疑问或需要进一步说明，请联系开发团队。
