#!/bin/bash

# 横竖屏适配测试脚本
# 用于快速检查修改的文件是否正确

echo "=============================================
横竖屏适配系统 - 快速检查
=============================================
"

echo "1. 检查修改的文件..."
echo ""

# 检查核心文件是否存在
files_to_check=(
    "assets/Script/adaptation/OrientationAdaptationManager.ts"
    "assets/Script/adaptation/strategies/LandscapeStrategy.ts"
    "assets/Script/adaptation/strategies/PortraitStrategy.ts"
    "assets/Script/GameScene.ts"
)

for file in "${files_to_check[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file"
    else
        echo "❌ $file - 文件不存在！"
    fi
done

echo ""
echo "2. 检查关键修改..."
echo ""

# 检查是否使用了正确的API
echo "检查 getVisibleSize 使用情况："
grep -n "getVisibleSize" assets/Script/adaptation/OrientationAdaptationManager.ts | head -3
echo ""

# 检查是否添加了原生事件监听
echo "检查 orientationchange 事件监听："
grep -n "orientationchange" assets/Script/adaptation/OrientationAdaptationManager.ts | head -2
echo ""

# 检查检测频率
echo "检查检测频率（应该是200ms）："
grep -n "200" assets/Script/adaptation/OrientationAdaptationManager.ts | head -1
echo ""

# 检查Canvas适配改进
echo "检查移动设备适配优化："
grep -n "cc.sys.isMobile" assets/Script/adaptation/strategies/LandscapeStrategy.ts | head -1
echo ""

echo "3. 检查TypeScript编译..."
echo ""

# 尝试编译TypeScript（如果tsc可用）
if command -v tsc &> /dev/null; then
    echo "运行TypeScript编译检查..."
    tsc --noEmit assets/Script/adaptation/OrientationAdaptationManager.ts 2>&1 | head -5
else
    echo "⚠️  tsc命令不可用，跳过编译检查"
fi

echo ""
echo "=============================================
检查完成！
=============================================

下一步建议：
1. 在Cocos Creator中打开项目
2. 检查是否有编译错误
3. 构建playable进行实际测试
4. 在不同设备和浏览器上测试旋转功能

测试重点：
- 初始方向检测是否正确
- 旋转响应是否快速（应在200ms内）
- UI布局是否正确适配
- 是否有内存泄漏或性能问题
"