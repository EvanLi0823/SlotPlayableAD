# 构建文件处理工具使用指南

## 概述

`process-build.js` 是一个简化的构建文件处理工具，用于在手动通过编辑器构建后，自动检测平台和语言设置，并将构建文件重命名和移动到正确的输出目录。

## 使用流程

### 1. 修改游戏配置

在 `assets/Script/GameScene.ts` 中修改以下两处：

#### a) 设置广告平台

找到 `setAdType` 调用，修改为目标平台：

```typescript
// 第71行附近
this.setAdType(PlayableAdType.AppLovin);  // 或 Mtg, UnityAD
```

支持的平台：
- `PlayableAdType.AppLovin` - AppLovin平台
- `PlayableAdType.Mtg` - Mintegral平台
- `PlayableAdType.UnityAD` - Unity Ads平台

#### b) 设置语言

找到 `i18n.initialize` 调用，取消注释目标语言，注释掉其他语言：

```typescript
// 第74-81行附近
i18n.initialize(LanguageCode.EN);     // 英语
// i18n.initialize(LanguageCode.PT);  // 葡萄牙语
// i18n.initialize(LanguageCode.DE);  // 德语
// i18n.initialize(LanguageCode.FR);  // 法语
// i18n.initialize(LanguageCode.ES);  // 西班牙语
// i18n.initialize(LanguageCode.RU);  // 俄语
// i18n.initialize(LanguageCode.ID);  // 印尼语
```

支持的语言代码：
- `LanguageCode.EN` - 英语 (English)
- `LanguageCode.PT` - 葡萄牙语 (Português)
- `LanguageCode.DE` - 德语 (Deutsch)
- `LanguageCode.FR` - 法语 (Français)
- `LanguageCode.ES` - 西班牙语 (Español)
- `LanguageCode.RU` - 俄语 (Русский)
- `LanguageCode.ID` - 印尼语 (Bahasa Indonesia)

### 2. 使用编辑器构建

1. 打开 Cocos Creator 编辑器
2. 点击菜单：`项目 -> 构建发布`
3. 选择平台：`Web Mobile`
4. 点击 `构建` 按钮
5. 等待构建完成
6. **重要**：构建完成后，确保 `playable-ads-adapter` 插件已经运行完成
   - 插件会在 `build` 目录生成对应平台的 HTML 文件
   - 例如：`build/AppLovin.html`, `build/Mintegral.html`, `build/Unity.html`

### 3. 运行处理脚本

在项目根目录执行：

```bash
node process-build.js
```

脚本会自动：
1. 检测当前 `GameScene.ts` 中的平台设置
2. 检测当前 `GameScene.ts` 中的语言设置
3. 找到对应的构建文件（如 `build/AppLovin.html`）
4. 重命名并复制到输出目录

### 4. 获取输出文件

处理完成后，文件会被放置在：

```
build/output/{平台}/{产品名}_{平台}_{语言}.html
```

例如：
```
build/output/AppLovin/WinterChristmasSlots_AppLovin_EN.html
build/output/AppLovin/WinterChristmasSlots_AppLovin_PT.html
build/output/Mtg/WinterChristmasSlots_Mtg_EN.html
```

## 完整示例

### 示例1：构建 AppLovin 英语版本

1. 修改 `GameScene.ts`:
   ```typescript
   this.setAdType(PlayableAdType.AppLovin);
   i18n.initialize(LanguageCode.EN);
   ```

2. 在编辑器中构建项目

3. 运行脚本：
   ```bash
   node process-build.js
   ```

4. 输出文件：
   ```
   build/output/AppLovin/WinterChristmasSlots_AppLovin_EN.html
   ```

### 示例2：构建 Mintegral 葡萄牙语版本

1. 修改 `GameScene.ts`:
   ```typescript
   this.setAdType(PlayableAdType.Mtg);
   i18n.initialize(LanguageCode.PT);
   ```

2. 在编辑器中构建项目

3. 运行脚本：
   ```bash
   node process-build.js
   ```

4. 输出文件：
   ```
   build/output/Mtg/WinterChristmasSlots_Mtg_PT.html
   ```

## 输出信息说明

脚本运行时会显示以下信息：

```
==========================================
构建文件处理工具
==========================================
检测到广告平台: AppLovin
检测到语言代码: EN
==========================================
开始处理构建文件
==========================================
找到源文件: AppLovin.html
复制文件到: /path/to/build/output/AppLovin/WinterChristmasSlots_AppLovin_EN.html
==========================================
✅ 处理完成！
==========================================
平台: AppLovin
语言: EN
源文件: AppLovin.html
输出文件: WinterChristmasSlots_AppLovin_EN.html
文件大小: 4408.25 KB (4.30 MB)
输出路径: /path/to/build/output/AppLovin/WinterChristmasSlots_AppLovin_EN.html
==========================================

所有操作完成！
```

## 常见问题

### Q: 脚本提示"无法检测广告平台"

A: 检查 `GameScene.ts` 中是否有以下代码：
```typescript
this.setAdType(PlayableAdType.XXX);
```
确保这行代码没有被注释掉。

### Q: 脚本提示"无法检测语言代码"

A: 检查 `GameScene.ts` 中是否有**未被注释**的以下代码：
```typescript
i18n.initialize(LanguageCode.XXX);
```
确保只有一行是未注释的。

### Q: 脚本提示"源文件不存在"

A:
1. 确保已经通过编辑器构建了项目
2. 确保 `playable-ads-adapter` 插件已经运行完成
3. 检查 `build` 目录是否存在对应平台的 HTML 文件

### Q: 如何修改输出文件的命名规则？

A: 编辑 `build-config.json` 文件，修改 `productPrefix` 字段：

```json
{
  "productPrefix": "YourProductName"
}
```

## 平台与文件对应关系

| 平台类型 | GameScene.ts 设置 | 构建生成的文件 |
|---------|------------------|---------------|
| AppLovin | `PlayableAdType.AppLovin` | `build/AppLovin.html` |
| Mintegral | `PlayableAdType.Mtg` | `build/Mintegral.html` |
| Unity Ads | `PlayableAdType.UnityAD` | `build/Unity.html` |

## 批量处理建议

如果需要构建多个平台/语言组合：

1. 修改配置 -> 构建 -> 运行脚本 (第一个组合)
2. 修改配置 -> 构建 -> 运行脚本 (第二个组合)
3. 重复上述步骤...

每次运行脚本都会生成对应的输出文件，不会覆盖之前的文件（因为文件名包含平台和语言信息）。

## 技术说明

- 脚本通过正则表达式匹配 `GameScene.ts` 源代码来检测配置
- 不依赖构建过程，只处理已构建的文件
- 输出文件命名格式：`{产品前缀}_{平台}_{语言}.html`
- 所有输出文件都保存在 `build/output/{平台}/` 目录中
