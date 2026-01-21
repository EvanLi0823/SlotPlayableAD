/**
 * Safe Area Adapter
 * 安全区域适配器
 * 处理刘海屏、异形屏等设备的安全区域适配
 */

import { SafeAreaInfo } from '../types/AdaptationTypes';

export default class SafeAreaAdapter {

    // 默认安全边距
    private static readonly DEFAULT_PADDING = 20;

    // 调试模式
    private static debugMode: boolean = false;

    /**
     * 启用/禁用调试模式
     * @param enabled 是否启用
     */
    public static setDebugMode(enabled: boolean): void {
        SafeAreaAdapter.debugMode = enabled;
    }

    /**
     * 获取设备安全区域信息
     * @returns 安全区域信息
     */
    public static getSafeAreaInfo(): SafeAreaInfo {
        // Cocos Creator 2.4.x 的安全区域获取方式
        if (cc.sys.platform === cc.sys.IPHONE || cc.sys.platform === cc.sys.ANDROID) {
            const safeArea = cc.sys.getSafeAreaRect();
            const visibleSize = cc.view.getVisibleSize();

            const info: SafeAreaInfo = {
                topInset: visibleSize.height - safeArea.height - safeArea.y,
                bottomInset: safeArea.y,
                leftInset: safeArea.x,
                rightInset: visibleSize.width - safeArea.width - safeArea.x,
                safeRect: safeArea
            };

            if (SafeAreaAdapter.debugMode) {
                console.log('[SafeAreaAdapter] Safe area info:', info);
            }

            return info;
        }

        // PC或其他平台，返回无安全区域
        return {
            topInset: 0,
            bottomInset: 0,
            leftInset: 0,
            rightInset: 0,
            safeRect: cc.rect(0, 0, cc.view.getVisibleSize().width, cc.view.getVisibleSize().height)
        };
    }

    /**
     * 应用安全区域到场景
     * @param rootNode Canvas根节点
     * @param padding 额外边距
     */
    public static applySafeArea(rootNode: cc.Node, padding: number = SafeAreaAdapter.DEFAULT_PADDING): void {
        const safeArea = SafeAreaAdapter.getSafeAreaInfo();

        // 应用到关键UI元素
        SafeAreaAdapter.adjustTopBar(rootNode, safeArea, padding);
        SafeAreaAdapter.adjustBottomBar(rootNode, safeArea, padding);
        SafeAreaAdapter.adjustSidePanels(rootNode, safeArea, padding);
        SafeAreaAdapter.adjustPopupLayer(rootNode, safeArea, padding);

        if (SafeAreaAdapter.debugMode) {
            console.log('[SafeAreaAdapter] Safe area applied to scene');
        }
    }

    /**
     * 调整顶部栏
     * @param root 根节点
     * @param safeArea 安全区域信息
     * @param padding 额外边距
     */
    private static adjustTopBar(root: cc.Node, safeArea: SafeAreaInfo, padding: number): void {
        const topBar = cc.find('CentralArea/TopBar', root);
        if (topBar) {
            const widget = topBar.getComponent(cc.Widget) || topBar.addComponent(cc.Widget);
            widget.isAlignTop = true;
            widget.top = safeArea.topInset + padding;
            widget.updateAlignment();

            if (SafeAreaAdapter.debugMode) {
                console.log(`[SafeAreaAdapter] TopBar adjusted with top inset: ${safeArea.topInset + padding}`);
            }
        }
    }

    /**
     * 调整底部栏
     * @param root 根节点
     * @param safeArea 安全区域信息
     * @param padding 额外边距
     */
    private static adjustBottomBar(root: cc.Node, safeArea: SafeAreaInfo, padding: number): void {
        const bottomBar = cc.find('CentralArea/BottomBar', root);
        if (bottomBar) {
            const widget = bottomBar.getComponent(cc.Widget) || bottomBar.addComponent(cc.Widget);
            widget.isAlignBottom = true;
            widget.bottom = safeArea.bottomInset + padding;
            widget.updateAlignment();

            // 特别调整Spin按钮位置
            const spinButton = bottomBar.getChildByName('SpinButton');
            if (spinButton && safeArea.bottomInset > 0) {
                spinButton.y += safeArea.bottomInset / 2;
            }

            if (SafeAreaAdapter.debugMode) {
                console.log(`[SafeAreaAdapter] BottomBar adjusted with bottom inset: ${safeArea.bottomInset + padding}`);
            }
        }
    }

    /**
     * 调整侧边面板
     * @param root 根节点
     * @param safeArea 安全区域信息
     * @param padding 额外边距
     */
    private static adjustSidePanels(root: cc.Node, safeArea: SafeAreaInfo, padding: number): void {
        // 左侧面板
        const leftSide = root.getChildByName('LeftSide');
        if (leftSide && leftSide.active) {
            const widget = leftSide.getComponent(cc.Widget) || leftSide.addComponent(cc.Widget);
            widget.isAlignLeft = true;
            widget.left = widget.left + safeArea.leftInset + padding;
            widget.updateAlignment();

            if (SafeAreaAdapter.debugMode) {
                console.log(`[SafeAreaAdapter] LeftSide adjusted with left inset: ${safeArea.leftInset + padding}`);
            }
        }

        // 右侧面板
        const rightSide = root.getChildByName('RightSide');
        if (rightSide && rightSide.active) {
            const widget = rightSide.getComponent(cc.Widget) || rightSide.addComponent(cc.Widget);
            widget.isAlignRight = true;
            widget.right = widget.right + safeArea.rightInset + padding;
            widget.updateAlignment();

            if (SafeAreaAdapter.debugMode) {
                console.log(`[SafeAreaAdapter] RightSide adjusted with right inset: ${safeArea.rightInset + padding}`);
            }
        }
    }

    /**
     * 调整弹窗层
     * @param root 根节点
     * @param safeArea 安全区域信息
     * @param padding 额外边距
     */
    private static adjustPopupLayer(root: cc.Node, safeArea: SafeAreaInfo, padding: number): void {
        const popupLayer = root.getChildByName('PopupLayer');
        if (!popupLayer) return;

        // 确保弹窗内容在安全区域内
        const widget = popupLayer.getComponent(cc.Widget) || popupLayer.addComponent(cc.Widget);
        widget.isAlignTop = true;
        widget.isAlignBottom = true;
        widget.isAlignLeft = true;
        widget.isAlignRight = true;
        widget.top = safeArea.topInset + padding;
        widget.bottom = safeArea.bottomInset + padding;
        widget.left = safeArea.leftInset + padding;
        widget.right = safeArea.rightInset + padding;
        widget.updateAlignment();

        if (SafeAreaAdapter.debugMode) {
            console.log('[SafeAreaAdapter] PopupLayer adjusted with safe area');
        }
    }

    /**
     * 创建安全区域可视化调试器
     * @param parent 父节点
     * @returns 调试节点
     */
    public static createSafeAreaDebugger(parent: cc.Node): cc.Node {
        const safeArea = SafeAreaAdapter.getSafeAreaInfo();

        // 创建调试节点
        const debugNode = new cc.Node('SafeAreaDebugger');
        debugNode.parent = parent;

        // 设置大小和位置
        debugNode.width = parent.width;
        debugNode.height = parent.height;
        debugNode.setPosition(0, 0);

        // 添加Graphics组件绘制安全区域边界
        const graphics = debugNode.addComponent(cc.Graphics);
        graphics.strokeColor = cc.Color.GREEN;
        graphics.lineWidth = 2;

        // 绘制安全区域边界
        const visibleSize = cc.view.getVisibleSize();
        const left = -visibleSize.width / 2 + safeArea.leftInset;
        const right = visibleSize.width / 2 - safeArea.rightInset;
        const top = visibleSize.height / 2 - safeArea.topInset;
        const bottom = -visibleSize.height / 2 + safeArea.bottomInset;

        graphics.moveTo(left, bottom);
        graphics.lineTo(left, top);
        graphics.lineTo(right, top);
        graphics.lineTo(right, bottom);
        graphics.close();
        graphics.stroke();

        // 绘制危险区域（半透明红色）
        graphics.fillColor = new cc.Color(255, 0, 0, 50);

        // 顶部危险区域
        if (safeArea.topInset > 0) {
            graphics.rect(-visibleSize.width / 2, top, visibleSize.width, safeArea.topInset);
            graphics.fill();
        }

        // 底部危险区域
        if (safeArea.bottomInset > 0) {
            graphics.rect(-visibleSize.width / 2, -visibleSize.height / 2, visibleSize.width, safeArea.bottomInset);
            graphics.fill();
        }

        // 左侧危险区域
        if (safeArea.leftInset > 0) {
            graphics.rect(-visibleSize.width / 2, bottom, safeArea.leftInset, top - bottom);
            graphics.fill();
        }

        // 右侧危险区域
        if (safeArea.rightInset > 0) {
            graphics.rect(right, bottom, safeArea.rightInset, top - bottom);
            graphics.fill();
        }

        // 添加文字标签
        const label = new cc.Node('SafeAreaLabel');
        label.parent = debugNode;
        label.y = top - 30;

        const labelComp = label.addComponent(cc.Label);
        labelComp.string = `Safe Area: T=${safeArea.topInset.toFixed(0)} B=${safeArea.bottomInset.toFixed(0)} L=${safeArea.leftInset.toFixed(0)} R=${safeArea.rightInset.toFixed(0)}`;
        labelComp.fontSize = 24;
        labelComp.lineHeight = 30;
        labelComp.horizontalAlign = cc.Label.HorizontalAlign.CENTER;

        // 设置层级最高，确保显示在最上层
        debugNode.zIndex = 9999;

        console.log('[SafeAreaAdapter] Debug visualizer created');

        return debugNode;
    }

    /**
     * 判断节点是否在安全区域内
     * @param node 要检查的节点
     * @returns 是否在安全区域内
     */
    public static isInSafeArea(node: cc.Node): boolean {
        const safeArea = SafeAreaAdapter.getSafeAreaInfo();
        const worldPos = node.parent.convertToWorldSpaceAR(node.position);
        const visibleSize = cc.view.getVisibleSize();

        // 转换为屏幕坐标
        const screenX = worldPos.x + visibleSize.width / 2;
        const screenY = worldPos.y + visibleSize.height / 2;

        // 获取节点边界
        const bounds = node.getBoundingBox();
        const halfWidth = bounds.width / 2;
        const halfHeight = bounds.height / 2;

        // 检查是否在安全区域内
        const inSafeArea =
            screenX - halfWidth >= safeArea.leftInset &&
            screenX + halfWidth <= visibleSize.width - safeArea.rightInset &&
            screenY - halfHeight >= safeArea.bottomInset &&
            screenY + halfHeight <= visibleSize.height - safeArea.topInset;

        return inSafeArea;
    }

    /**
     * 自动调整节点到安全区域内
     * @param node 要调整的节点
     */
    public static autoAdjustToSafeArea(node: cc.Node): void {
        if (SafeAreaAdapter.isInSafeArea(node)) {
            return;
        }

        const safeArea = SafeAreaAdapter.getSafeAreaInfo();
        const visibleSize = cc.view.getVisibleSize();
        const worldPos = node.parent.convertToWorldSpaceAR(node.position);

        // 转换为屏幕坐标
        let screenX = worldPos.x + visibleSize.width / 2;
        let screenY = worldPos.y + visibleSize.height / 2;

        // 获取节点边界
        const bounds = node.getBoundingBox();
        const halfWidth = bounds.width / 2;
        const halfHeight = bounds.height / 2;

        // 调整X坐标
        if (screenX - halfWidth < safeArea.leftInset) {
            screenX = safeArea.leftInset + halfWidth;
        } else if (screenX + halfWidth > visibleSize.width - safeArea.rightInset) {
            screenX = visibleSize.width - safeArea.rightInset - halfWidth;
        }

        // 调整Y坐标
        if (screenY - halfHeight < safeArea.bottomInset) {
            screenY = safeArea.bottomInset + halfHeight;
        } else if (screenY + halfHeight > visibleSize.height - safeArea.topInset) {
            screenY = visibleSize.height - safeArea.topInset - halfHeight;
        }

        // 转换回节点坐标
        const newWorldPos = cc.v2(
            screenX - visibleSize.width / 2,
            screenY - visibleSize.height / 2
        );
        node.position = node.parent.convertToNodeSpaceAR(newWorldPos) as any;

        if (SafeAreaAdapter.debugMode) {
            console.log(`[SafeAreaAdapter] Node ${node.name} adjusted to safe area`);
        }
    }
}