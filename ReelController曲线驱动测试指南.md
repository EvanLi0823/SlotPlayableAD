# ReelController曲线驱动测试指南

## 测试目的

验证ReelController的曲线驱动功能是否正常工作，包括：
- 曲线生成和参数验证
- 曲线驱动的转动效果
- 关键时间点回调（减速、回弹）
- 符号精确对齐

---

## 方法1：快速测试（推荐）

直接运行现有的游戏场景，观察曲线驱动效果。

### 步骤：

1. **打开游戏场景**
   - 场景路径：`assets/scenes/game.fire`

2. **运行游戏**
   - 点击Cocos Creator的"运行"按钮
   - 点击"SPIN"按钮开始转动

3. **观察日志输出**
   查看Console中的日志，应该看到：
   ```
   [SlotMachine] Starting spin (curve-driven)...
   [CurvePresets] Creating standard reel curves...
   [ReelController] Reel 0 开始转动（曲线驱动）
     总时长: 1.85s
     总距离: 1080px
     Anticipation: false
     目标symbols: [...]
   [ReelController] Reel 0: 减速开始
   [ReelController] Reel 0: 回弹
   [ReelController] Reel 0: 转动完成
   [SlotMachine] Reel 0 bounce
   [SlotMachine] Reel 0 stopped
   ```

4. **验证效果**
   - ✅ 转动应该流畅（60fps）
   - ✅ 5列应该依次停止（间隔0.2秒）
   - ✅ 停止位置应该精确对齐
   - ✅ 应该看到轻微的回弹效果（曲线内嵌）

---

## 方法2：单元测试（详细测试）

使用独立的测试场景进行详细测试。

### 步骤：

### 1. 创建测试场景

1. 在Cocos Creator中创建新场景：`assets/scenes/ReelControllerTest.fire`

2. 场景结构：
   ```
   Canvas
   ├── TestReel (Reel节点)
   │   └── SymbolContainer (用于放置Symbol)
   └── ResultLabel (显示测试结果)
   ```

### 2. 配置节点

#### Canvas节点：
- 添加组件：`ReelControllerTest`
- 配置属性：
  - `Config`: 拖入你的 SlotConfig 资源
  - `Test Reel`: 拖入 TestReel 节点
  - `Result Label`: 拖入 ResultLabel 节点
  - `Auto Run`: 勾选

#### TestReel节点：
- 添加组件：`ReelController`
- 配置属性：
  - `Symbol Container`: 拖入 SymbolContainer 节点

#### SymbolContainer节点：
- 无需额外配置

#### ResultLabel节点：
- 添加组件：`cc.Label`
- 设置字体大小：24
- 设置对齐方式：居中

### 3. 配置SlotConfig

确保你的SlotConfig资源已正确配置：
- `Symbol Prefab`: Symbol预制体
- `Symbol Atlas`: Symbol图集
- `Symbol Types`: Symbol类型数量（例如：10）
- `Symbols Per Reel`: 每列Symbol数量（例如：7）
- `Visible Symbols Per Reel`: 可见Symbol数量（例如：3）

### 4. 运行测试

1. 打开测试场景：`assets/scenes/ReelControllerTest.fire`
2. 点击"运行"按钮
3. 等待1秒后自动开始测试
4. 观察Console输出和ResultLabel显示

### 5. 预期输出

Console中应该看到：
```
=== 开始ReelController曲线驱动测试 ===

【前置准备：初始化测试Reel】
  ✓ 加载了10/10个Symbol图片
  ✓ 测试Reel初始化成功

【测试1: 创建标准曲线】
  ✓ 1.1 曲线数量: 生成5条曲线（期望5条）
  ✓ 1.2 曲线关键帧数量: 关键帧数量: 5（期望5个）
  ✓ 1.3 依次停止验证: 时长依次递增

【测试2: 曲线参数验证】
  ✓ 2.1 时间范围: 时间范围: 0.00s ~ 1.85s
  ✓ 2.2 距离范围: 距离范围: 0.000m ~ 1.080m
  ✓ 2.3 关键帧时间递增: 关键帧时间单调递增
  曲线关键帧详情:
    帧0: t=0.00s, v=0px, in=0.00, out=0.40
    帧1: t=0.20s, v=80px, in=0.80, out=0.80
    帧2: t=1.20s, v=880px, in=0.80, out=0.40
    帧3: t=1.70s, v=1088px, in=0.16, out=-0.80
    帧4: t=1.85s, v=1080px, in=-0.40, out=0.00

【测试3: 启动曲线驱动转动】
  启动转动...
  [ReelController] Reel 0 开始转动（曲线驱动）
  等待转动完成（1.85s）...
  ✓ 回弹事件触发
  ✓ 停止事件触发
  ✓ 3.1 转动启动: Reel已开始转动
  ✓ 3.2 转动停止: Reel已停止转动
  ✓ 3.3 回弹事件: 回弹事件已触发
  ✓ 3.4 停止事件: 停止事件已触发
  ✓ 3.5 符号对齐: 最终符号: [0,1,2] ✓

==================================================
测试总结: 11/11 通过 (100.0%)
==================================================

=== 测试完成 ===
```

ResultLabel显示：
```
测试完成
11/11 通过
100.0%
```

---

## 常见问题排查

### 1. 错误：`Cannot read properties of null (reading 'getSymbolUnitHeight')`

**原因**：ReelController没有正确初始化

**解决方案**：
- 确保在Inspector中配置了 `Config` 和 `Test Reel`
- 确保 `Test Reel` 节点上有 `ReelController` 组件
- 确保 SlotConfig 资源已正确配置

### 2. 错误：`Symbol atlas未设置`

**原因**：SlotConfig中没有配置Symbol图集

**解决方案**：
- 打开 SlotConfig 资源
- 将Symbol图集拖入 `Symbol Atlas` 字段

### 3. 测试结果显示失败

**可能原因**：
- 曲线参数配置不正确
- Symbol数量配置不匹配
- 时间精度问题（不同设备帧率差异）

**排查步骤**：
1. 查看Console中具体的失败日志
2. 检查SlotConfig中的参数配置
3. 调整测试用例的阈值（如果是精度问题）

### 4. 转动没有停止

**可能原因**：
- 曲线总时长计算错误
- update循环没有触发

**排查步骤**：
1. 查看日志中的 "总时长" 是否合理
2. 检查 ReelController 的 update 方法是否被调用
3. 确认 `isSpinning` 状态变化

---

## 测试参数调整

如果需要调整测试参数，修改 `ReelControllerTest.ts` 中的以下部分：

```typescript
// 测试1中的曲线参数
const curves = CurvePresets.createStandardReelCurves({
    symbolHeight: 172,        // Symbol高度
    accelerationTime: 0.2,    // 加速时长
    normalSpeed: 800,         // 匀速速度
    decelerationTime: 0.5,    // 减速时长
    bounceDistance: 8,        // 回弹距离
    bounceDuration: 0.15,     // 回弹时长
    reelCount: 5,             // 列数
    stopDelay: 0.2            // 列间延迟
});

// 测试3中的目标符号
const targetSymbols = [0, 1, 2];  // 修改为你需要的符号序列
```

---

## 性能基准

预期性能指标：
- **帧率**: 稳定60fps
- **单次evaluate耗时**: < 0.1ms
- **内存增加**: < 5MB（100条曲线）
- **CPU占用**: +3% ~ +5%（相比速度驱动）

使用性能监控工具（Chrome DevTools / Cocos Creator Profiler）验证。

---

## 下一步

测试通过后，可以：
1. **调整曲线参数**：优化加速、减速、回弹的手感
2. **测试不同设备**：确保多平台一致性
3. **实现Anticipation**：进入阶段3（Anticipation机制）
4. **性能优化**：如果发现性能问题，进行针对性优化

---

**文档版本**: v1.0
**创建日期**: 2025-12-31
**作者**: Claude Code
