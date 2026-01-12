# 场景配置检查清单 ✅

使用此清单验证场景是否正确配置。

---

## 📋 节点结构检查

### 基础结构
- [ ] Canvas 节点存在
- [ ] Background 节点已创建
- [ ] LeftSide 和 RightSide 节点已创建
- [ ] CentralArea 节点已创建（720×1334）
- [ ] PopupLayer 节点已创建
- [ ] AnimationLayer 节点已创建
- [ ] GameSceneController 节点已创建

### CentralArea 内容
- [ ] TopBar 节点已创建
- [ ] TopBar/AmountLabel (Label组件) 已创建
- [ ] ReelArea 节点已创建（340×180）
- [ ] ReelArea/Mask (Mask组件) 已创建
- [ ] ReelArea/Mask/ReelContainer 已创建
- [ ] 5个Reel节点 (Reel_0 ~ Reel_4) 已创建
- [ ] 每个Reel下有SymbolContainer节点
- [ ] 每个SymbolContainer下有7个Symbol节点
- [ ] BottomBar/SpinButton 已创建

### 侧边面板
- [ ] LeftSide/LeftPanel 节点已创建
- [ ] LeftPanel/Icon 已创建
- [ ] LeftPanel/DownloadBtn (Button组件) 已创建
- [ ] RightSide/RightPanel 节点已创建
- [ ] RightPanel/Icon 已创建
- [ ] RightPanel/DownloadBtn (Button组件) 已创建

### 弹窗层
- [ ] PopupLayer/WinPopup 节点已创建
- [ ] WinPopup/Mask 节点已创建
- [ ] WinPopup/Content 节点已创建
- [ ] WinPopup/Content/AmountLabel (Label) 已创建
- [ ] WinPopup/Content/ClaimButton (Button) 已创建
- [ ] PopupLayer/DownloadPopup 节点已创建
- [ ] DownloadPopup/Mask 节点已创建
- [ ] DownloadPopup/Content 节点已创建
- [ ] DownloadPopup/Content/MessageLabel (Label) 已创建
- [ ] DownloadPopup/Content/DownloadButton (Button) 已创建

### 动画层
- [ ] AnimationLayer/CashFlyContainer 节点已创建

---

## 🔧 脚本组件检查

### 核心游戏组件
- [ ] CentralArea/SlotMachine 挂载了 **SlotMachine.ts**
- [ ] CentralArea/SlotMachine 挂载了 **SlotConfig.ts**
- [ ] Reel_0 挂载了 **ReelController.ts**
- [ ] Reel_1 挂载了 **ReelController.ts**
- [ ] Reel_2 挂载了 **ReelController.ts**
- [ ] Reel_3 挂载了 **ReelController.ts**
- [ ] Reel_4 挂载了 **ReelController.ts**

### Symbol组件 (每个Reel下)
- [ ] Reel_0 的所有Symbol (0-6) 挂载了 **SymbolItem.ts**
- [ ] Reel_1 的所有Symbol (0-6) 挂载了 **SymbolItem.ts**
- [ ] Reel_2 的所有Symbol (0-6) 挂载了 **SymbolItem.ts**
- [ ] Reel_3 的所有Symbol (0-6) 挂载了 **SymbolItem.ts**
- [ ] Reel_4 的所有Symbol (0-6) 挂载了 **SymbolItem.ts**

### UI控制器组件
- [ ] CentralArea/TopBar 挂载了 **TopBarController.ts**
- [ ] BottomBar/SpinButton 挂载了 **SpinButtonController.ts**
- [ ] LeftSide/LeftPanel 挂载了 **LeftSidePanelController.ts**
- [ ] RightSide/RightPanel 挂载了 **RightSidePanelController.ts**

### 弹窗系统组件
- [ ] PopupLayer/WinPopup 挂载了 **WinPopupController.ts**
- [ ] PopupLayer/DownloadPopup 挂载了 **DownloadPopupController.ts**
- [ ] AnimationLayer/CashFlyContainer 挂载了 **CashFlyAnimController.ts**

### 主控制器
- [ ] GameSceneController 挂载了 **GameScene.ts**

---

## ⚙️ 组件属性配置检查

### SlotConfig 配置
- [ ] rows = 3
- [ ] reels = 5
- [ ] symbolHeight = 56
- [ ] symbolWidth = 64
- [ ] symbolSpacing = 4
- [ ] symbolTypes = 8
- [ ] spinMinDuration = 2.0
- [ ] reelStopDelay = 0.2
- [ ] spinSpeed = 800
- [ ] acceleration = 2000
- [ ] deceleration = 1500
- [ ] winAnimationDelay = 0.3
- [ ] winAnimationLoops = 3
- [ ] cashFlyDuration = 1.2
- [ ] symbolAtlas 已拖入 ✅
- [ ] winAnimAtlas 已拖入 ✅
- [ ] cashCoinSprite 已拖入 ✅

### SlotMachine 配置
- [ ] config 引用已拖入（同节点的SlotConfig组件）
- [ ] reelNodes 数组长度 = 5
- [ ] reelNodes[0] = Reel_0
- [ ] reelNodes[1] = Reel_1
- [ ] reelNodes[2] = Reel_2
- [ ] reelNodes[3] = Reel_3
- [ ] reelNodes[4] = Reel_4

### TopBarController 配置
- [ ] amountLabel 已拖入（TopBar/AmountLabel的Label组件）
- [ ] iconNode 已拖入（可选）

### SpinButtonController 配置
- [ ] spinButton 已拖入（Button组件）
- [ ] buttonNode 已拖入（SpinButton节点）
- [ ] buttonLabel 已拖入（Label组件）

### LeftSidePanelController 配置
- [ ] iconNode 已拖入
- [ ] downloadButton 已拖入（Button组件）
- [ ] iconSprite 已拖入（Sprite组件，可选）
- [ ] backgroundSprite 已拖入（Sprite组件，可选）

### RightSidePanelController 配置
- [ ] iconNode 已拖入
- [ ] downloadButton 已拖入（Button组件）
- [ ] iconSprite 已拖入（Sprite组件，可选）
- [ ] backgroundSprite 已拖入（Sprite组件，可选）

### WinPopupController 配置
- [ ] popupNode 已拖入（WinPopup节点）
- [ ] amountLabel 已拖入（Label组件）
- [ ] claimButton 已拖入（Button组件）
- [ ] maskNode 已拖入（Mask节点）
- [ ] contentNode 已拖入（Content节点）

### DownloadPopupController 配置
- [ ] popupNode 已拖入（DownloadPopup节点）
- [ ] messageLabel 已拖入（Label组件）
- [ ] downloadButton 已拖入（Button组件）
- [ ] maskNode 已拖入（Mask节点）
- [ ] contentNode 已拖入（Content节点）

### CashFlyAnimController 配置
- [ ] animationContainer 已拖入（CashFlyContainer节点）
- [ ] cashCoinSprite 已拖入（SpriteFrame）
- [ ] flyDuration = 1.2
- [ ] rotationCount = 2
- [ ] cashCoinPrefab 已拖入（可选）

### GameScene 配置（最重要！）
- [ ] slotMachine 已拖入（SlotMachine组件）
- [ ] topBar 已拖入（TopBarController组件）
- [ ] spinButton 已拖入（SpinButtonController组件）
- [ ] leftSidePanel 已拖入（LeftSidePanelController组件）
- [ ] rightSidePanel 已拖入（RightSidePanelController组件）
- [ ] winPopup 已拖入（WinPopupController组件）
- [ ] downloadPopup 已拖入（DownloadPopupController组件）
- [ ] cashFlyAnim 已拖入（CashFlyAnimController组件）

---

## 🎨 资源检查

### Symbol 图集 (SymbolAtlas)
- [ ] 包含 symbol_0 SpriteFrame
- [ ] 包含 symbol_1 SpriteFrame
- [ ] 包含 symbol_2 SpriteFrame
- [ ] 包含 symbol_3 SpriteFrame
- [ ] 包含 symbol_4 SpriteFrame
- [ ] 包含 symbol_5 SpriteFrame
- [ ] 包含 symbol_6 SpriteFrame
- [ ] 包含 symbol_7 SpriteFrame

### 中奖动画图集 (WinAnimAtlas)
- [ ] 包含 symbol_0_win/frame_00 ~ frame_09
- [ ] 包含 symbol_1_win/frame_00 ~ frame_09
- [ ] 包含 symbol_2_win/frame_00 ~ frame_09
- [ ] 包含 symbol_3_win/frame_00 ~ frame_09
- [ ] 包含 symbol_4_win/frame_00 ~ frame_09
- [ ] 包含 symbol_5_win/frame_00 ~ frame_09
- [ ] 包含 symbol_6_win/frame_00 ~ frame_09
- [ ] 包含 symbol_7_win/frame_00 ~ frame_09

### 其他资源
- [ ] 现金图标 (cash_coin) 已准备
- [ ] 背景图片已准备
- [ ] UI按钮素材已准备
- [ ] 弹窗背景素材已准备

---

## 🎮 功能测试检查

### 基础功能
- [ ] 点击运行按钮，场景无报错
- [ ] 初始牌面正确显示（3行5列）
- [ ] TopBar显示初始金额 "$1000"
- [ ] SpinButton显示 "SPIN" 文字

### Spin功能
- [ ] 点击Spin按钮，5个滚轴开始转动
- [ ] 滚轴按顺序停止（左到右）
- [ ] 停止时显示正确的symbol
- [ ] Spin期间按钮禁用

### 中奖流程
- [ ] 中奖时播放symbol闪烁动画
- [ ] 动画完成后弹出WinPopup
- [ ] WinPopup显示正确的中奖金额
- [ ] 点击Claim按钮，弹窗关闭
- [ ] 现金图标飞向TopBar（贝塞尔曲线）
- [ ] TopBar金额数字滚动增加
- [ ] DownloadPopup自动弹出

### 下载功能
- [ ] DownloadPopup正确显示
- [ ] Download按钮有脉冲动画
- [ ] 点击Download按钮触发跳转（查看控制台日志）

### 侧边面板
- [ ] 左侧Icon有摇摆动画
- [ ] 右侧Icon有摇摆动画
- [ ] 左侧Download按钮可点击
- [ ] 右侧Download按钮可点击

---

## 🐛 常见错误排查

### 错误：Cannot read property 'xxx' of null
**原因**: 组件引用未正确配置
**解决**: 检查对应组件的属性是否正确拖入

### 错误：Symbol atlas not set
**原因**: SlotConfig中的symbolAtlas未配置
**解决**: 在SlotConfig组件中拖入SymbolAtlas图集

### 错误：getSpriteFrame(...) is null
**原因**: 图集中缺少对应的SpriteFrame
**解决**: 检查图集中的sprite命名是否正确

### 错误：Reel stopped event not fired
**原因**: Reel节点未正确配置
**解决**: 检查Reel节点是否挂载了ReelController组件

### 错误：Animation not playing
**原因**: WinAnimAtlas未配置或帧命名错误
**解决**: 检查图集和帧命名格式

---

## 📊 性能检查

### 运行性能
- [ ] FPS稳定在60（查看左上角）
- [ ] DrawCall数量 < 50
- [ ] 内存使用正常（无持续增长）

### 资源优化
- [ ] 使用图集减少DrawCall
- [ ] 图片尺寸合理（不超过实际显示尺寸）
- [ ] 压缩纹理格式（PNG8/WebP）

---

## ✅ 最终验证

完成以上所有检查后：

1. **完整测试流程**:
   - 运行场景 → 点击Spin → 观察转动 → 等待停止 → 查看中奖动画 → 点击领取 → 观察现金飞行 → 查看金额更新 → 查看下载弹窗 → 点击下载

2. **测试多次Spin**:
   - 连续点击Spin 3-5次
   - 验证中奖和不中奖的情况
   - 检查是否有内存泄漏

3. **查看控制台日志**:
   - 无报错信息
   - 有详细的流程日志（[ComponentName] 格式）

4. **保存场景**:
   - Ctrl+S / Cmd+S
   - 关闭并重新打开，验证配置保存成功

---

## 🎉 完成！

如果所有检查项都已完成且测试通过，恭喜你！场景配置完成！

现在可以：
- 🎨 替换测试资源为正式美术资源
- 🎵 添加音效和背景音乐
- ⚙️ 调整动画参数优化体验
- 📦 构建发布为Playable AD

**祝你的Slot游戏大获成功！** 🎰✨
