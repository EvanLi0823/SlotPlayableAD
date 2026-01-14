# MySlotPlayableAD 构建工具

## 🎯 构建工具（手动构建 + 自动处理）

适合日常开发，简单快捷。

### 工作流程

1. **修改配置**：编辑 `GameScene.ts` 设置平台和语言
2. **编辑器构建**：使用 Cocos Creator 编辑器构建项目
3. **运行脚本**：执行 `node process-build.js` 处理文件

### 快速开始

```bash
# 运行处理脚本
node process-build.js
```

📖 **详细使用说明**：查看 [PROCESS_BUILD_GUIDE.md](./PROCESS_BUILD_GUIDE.md)

---

## 📁 项目结构

```
MySlotPlayableAD/
├── assets/Script/          # 游戏源代码
│   ├── GameScene.ts       # 主场景（包含平台和语言设置）
│   └── LanguageConfigs.ts # 语言配置
├── build/                 # 构建输出目录
│   ├── AppLovin.html     # 平台构建文件
│   ├── Mintegral.html    # 平台构建文件
│   ├── Unity.html        # 平台构建文件
│   └── output/           # 最终输出目录
│       ├── AppLovin/     # AppLovin 平台文件
│       ├── Mtg/          # Mintegral 平台文件
│       └── UnityAD/      # Unity Ads 平台文件
├── process-build.js       # 构建处理脚本
└── build-config.json      # 构建配置文件
```

---

## 🚀 支持的平台和语言

### 支持的广告平台

- **AppLovin** - `PlayableAdType.AppLovin`
- **Mintegral** - `PlayableAdType.Mtg`
- **Unity Ads** - `PlayableAdType.UnityAD`

### 支持的语言

| 语言 | 代码 | 货币 |
|------|------|------|
| 英语 | EN | USD ($) |
| 葡萄牙语 | PT | BRL (R$) |
| 德语 | DE | EUR (€) |
| 法语 | FR | EUR (€) |
| 西班牙语 | ES | EUR (€) |
| 俄语 | RU | RUB (₽) |
| 印尼语 | ID | IDR (Rp) |

---

## 📝 配置文件说明

### GameScene.ts 配置

在 `assets/Script/GameScene.ts` 中设置：

```typescript
// 第71行：设置广告平台
this.setAdType(PlayableAdType.AppLovin);

// 第74行：设置语言（只保留一行未注释）
i18n.initialize(LanguageCode.EN);
// i18n.initialize(LanguageCode.PT);
// i18n.initialize(LanguageCode.DE);
// ...
```

### build-config.json 配置

```json
{
  "productPrefix": "WinterChristmasSlots"
}
```

---

## ❓ 常见问题

### 输出文件在哪里？

输出文件在：
```
build/output/{平台}/{产品名}_{平台}_{语言}.html
```

### 如何修改产品名称？

编辑 `build-config.json`，修改 `productPrefix` 字段。

### 构建失败怎么办？

1. 检查 Cocos Creator 是否正确安装
2. 检查 `GameScene.ts` 配置是否正确
3. 查看错误日志：`build-logs/` 目录
4. 确保 `playable-ads-adapter` 插件已安装

---

## 📚 相关文档

- [PROCESS_BUILD_GUIDE.md](./PROCESS_BUILD_GUIDE.md) - 构建工具使用指南
- [PRODUCT_CONFIG_GUIDE.md](./PRODUCT_CONFIG_GUIDE.md) - 产品配置指南

---

## 📞 技术支持

如有问题，请查看相关文档或联系开发团队。
