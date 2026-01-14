# 产品名称和商店链接配置指南

## 概述

v2.1 版本新增了两个重要的配置选项,使构建工具更加灵活和可配置:

1. **产品名称配置** (`productName`) - 统一管理所有输出文件的产品名前缀
2. **商店链接配置** (`storeUrl`) - 针对 UnityAD 平台配置应用商店链接

---

## 产品名称配置

### 基本用法

在 `build-config.json` 顶层添加 `productName` 字段:

```json
{
  "productName": "WinterChristmasSlots",
  "platforms": {
    ...
  }
}
```

### 功能说明

- **统一前缀**: 所有平台的输出文件将自动使用该产品名作为前缀
- **变量替换**: 在输出文件名中使用 `${PRODUCT_NAME}` 变量
- **ZIP 文件名**: 打包的 ZIP 文件也会使用产品名

### 输出示例

配置:
```json
{
  "productName": "WinterChristmasSlots",
  "platforms": {
    "AppLovin": {
      "outputFilePattern": "${PRODUCT_NAME}_AppLovin_${LANGUAGE}.html",
      "zipPattern": "${PRODUCT_NAME}_AppLovin_${LANGUAGE}.zip"
    }
  }
}
```

生成的文件:
```
build/output/AppLovin/
├── WinterChristmasSlots_AppLovin_EN.html
├── WinterChristmasSlots_AppLovin_EN.zip
├── WinterChristmasSlots_AppLovin_DE.html
├── WinterChristmasSlots_AppLovin_DE.zip
...
```

### 使用场景

1. **多产品管理**: 在同一个项目中切换不同产品
2. **版本标识**: 在产品名中包含版本信息
3. **品牌统一**: 确保所有输出文件使用统一的品牌名称

### 快速切换产品

只需修改一个配置项即可切换产品:

```json
// 产品 A
{
  "productName": "WinterChristmasSlots"
}

// 产品 B
{
  "productName": "SummerBeachSlots"
}

// 产品 C
{
  "productName": "HalloweenSpookySlots"
}
```

---

## 商店链接配置

### 基本用法

在 UnityAD 平台配置中添加 `storeUrl` 字段:

```json
{
  "platforms": {
    "UnityAD": {
      "storeUrl": "https://play.google.com/store/apps/details?id=com.winter.slots.snow.scser",
      "htmlModifications": [
        {
          "description": "在文件末尾添加 UnityAD MRAID 脚本",
          "pattern": "</html>",
          "replacement": "<script>\n    function openStore(){\n      console.log(\"openStore\")\n      mraid.open(\"${STORE_URL}\")\n    }\n...\n</script>\n</html>"
        }
      ]
    }
  }
}
```

### 功能说明

- **动态替换**: 在 HTML 修改中使用 `${STORE_URL}` 变量
- **平台专属**: 每个平台可以有自己的 `storeUrl` 配置
- **自动注入**: 构建时自动将链接注入到 MRAID 脚本中

### 工作原理

1. **配置阶段**: 在平台配置中定义 `storeUrl`
2. **构建阶段**: modify-html.js 读取 `storeUrl` 配置
3. **替换阶段**: 将 HTML 修改中的 `${STORE_URL}` 替换为实际链接
4. **输出阶段**: 生成包含正确商店链接的 HTML 文件

### 使用场景

1. **多产品构建**: 不同产品有不同的应用商店 ID
2. **平台差异**: iOS 和 Android 可能有不同的商店链接
3. **区域差异**: 不同地区可能使用不同的应用商店

### 完整示例

```json
{
  "productName": "WinterChristmasSlots",
  "platforms": {
    "UnityAD": {
      "name": "UnityAD",
      "adType": "PlayableAdType.UnityAD",
      "languages": ["EN", "DE", "FR", "ES", "PT", "RU", "ID"],
      "buildOutputDir": "build",
      "sourceHtmlFile": "build/Unity.html",
      "storeUrl": "https://play.google.com/store/apps/details?id=com.winter.slots.snow.scser",
      "codeModifications": {
        "sourceFile": "assets/Script/GameScene.ts",
        "modifications": [
          {
            "description": "设置广告平台为 UnityAD",
            "pattern": "this\\.setAdType\\(PlayableAdType\\.\\w+\\);",
            "replacement": "this.setAdType(PlayableAdType.UnityAD);"
          }
        ]
      },
      "htmlModifications": [
        {
          "description": "在文件末尾添加 UnityAD MRAID 脚本",
          "pattern": "</html>",
          "replacement": "<script>\n    function openStore(){\n      console.log(\"openStore\")\n      mraid.open(\"${STORE_URL}\")\n    }\n  \n  \n  function Start() {\n      if (mraid.getState()==='loading') {\n          mraid.addEventListener('ready', onSdkReady);\n      } else {\n          onSdkReady(); \n      }\n  }\n  \n  function onSdkReady() {\n      mraid.addEventListener('viewableChange',viewableChangeHandler);\n      if (mraid.isViewable()) {\n          showMyAd(); \n      }\n  }\n  \n  function showMyAd() {\n      // Insert code for showing your playable ad. \n  }\n  \n  function viewableChangeHandler(viewable) {\n      if(viewable) {\n          showMyAd(); \n      } else {\n          // Pause the ad.\n      }\n  }\n  \n  </script>\n</html>",
          "enabled": true
        }
      ],
      "outputFilePattern": "${PRODUCT_NAME}_Unity_${LANGUAGE}.html",
      "zipOutput": true,
      "zipPattern": "${PRODUCT_NAME}_Unity_${LANGUAGE}.zip"
    }
  }
}
```

生成的 HTML 文件中会包含:

```javascript
function openStore(){
  console.log("openStore")
  mraid.open("https://play.google.com/store/apps/details?id=com.winter.slots.snow.scser")
}
```

---

## 支持的变量

所有配置中可以使用以下变量:

| 变量 | 说明 | 示例 | 用途 |
|------|------|------|------|
| `${LANGUAGE}` | 当前构建的语言代码 | `EN`, `DE`, `FR` | 文件命名、内容替换 |
| `${PRODUCT_NAME}` | 产品名称 | `WinterChristmasSlots` | 文件命名、内容替换 |
| `${STORE_URL}` | 商店链接 | `https://play.google.com/...` | HTML 内容替换 |

---

## 最佳实践

### 1. 产品名称规范

```json
// ✅ 好的命名
"productName": "WinterChristmasSlots"
"productName": "SummerBeach2024"
"productName": "HalloweenSpooky_v2"

// ❌ 避免的命名
"productName": "my-app"           // 太通用
"productName": "Test123"          // 不专业
"productName": "Winter Christmas" // 包含空格
```

### 2. 商店链接格式

```json
// ✅ Google Play Store
"storeUrl": "https://play.google.com/store/apps/details?id=com.company.app"

// ✅ iOS App Store
"storeUrl": "https://apps.apple.com/app/id123456789"

// ❌ 避免
"storeUrl": "play.google.com/..."  // 缺少协议
"storeUrl": ""                      // 空字符串
```

### 3. 配置管理

```bash
# 为不同产品创建不同的配置文件
build-config-winter.json
build-config-summer.json
build-config-halloween.json

# 使用时指定配置文件
node modify-html.js UnityAD EN build-config-winter.json
```

---

## 验证配置

### 检查配置文件

```bash
# 验证 JSON 格式
jq . build-config.json

# 查看产品名
jq '.productName' build-config.json

# 查看 UnityAD 的商店链接
jq '.platforms.UnityAD.storeUrl' build-config.json

# 查看输出文件名模式
jq '.platforms.UnityAD.outputFilePattern' build-config.json
```

### 测试构建

```bash
# 测试单个平台
node modify-html.js UnityAD EN

# 检查生成的文件名
ls -lh build/output/UnityAD/

# 验证商店链接是否正确注入
grep "mraid.open" build/output/UnityAD/WinterChristmasSlots_Unity_EN.html
```

预期输出:
```
mraid.open("https://play.google.com/store/apps/details?id=com.winter.slots.snow.scser")
```

---

## 常见问题

### Q: 如何为同一项目构建多个产品?

A: 创建多个配置文件,每个文件包含不同的 `productName` 和 `storeUrl`:

```bash
node modify-html.js UnityAD EN build-config-winter.json
node modify-html.js UnityAD EN build-config-summer.json
```

### Q: ${STORE_URL} 变量没有被替换怎么办?

A: 检查以下几点:
1. 平台配置中是否定义了 `storeUrl` 字段
2. HTML 修改规则中是否使用了 `${STORE_URL}` 变量
3. modify-html.js 是否是最新版本

### Q: 产品名称可以包含中文吗?

A: 技术上可以,但不推荐。建议使用英文和数字,避免特殊字符和空格。

### Q: 如何在 HTML 修改中使用多个变量?

A: 所有变量都支持同时使用:

```json
{
  "replacement": "<meta name=\"product\" content=\"${PRODUCT_NAME}\">\n<meta name=\"language\" content=\"${LANGUAGE}\">\n<script>var storeUrl=\"${STORE_URL}\";</script>"
}
```

---

## 相关文档

- `build-config.json` - 配置文件
- `modify-html.js` - HTML 修改工具
- `PLATFORM_HTML_MODIFICATIONS.md` - HTML 修改规则详解
- `BUILD_TOOL_README.md` - 主要使用文档
- `CHANGELOG.md` - 版本更新历史

---

**最后更新**: 2025-01-13
**版本**: v2.1.0
