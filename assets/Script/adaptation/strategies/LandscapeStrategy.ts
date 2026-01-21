/**
 * Landscape Layout Strategy
 * 横屏布局策略实现
 * 保持原始的三栏布局设计
 */

import { AdaptationStrategy, LayoutConfig, DeviceOrientation } from '../types/AdaptationTypes';

export default class LandscapeStrategy implements AdaptationStrategy {
    public readonly name = 'LandscapeStrategy';

    // 横屏布局配置
    private readonly config: LayoutConfig = {
        designResolution: cc.size(2400, 1334),
        centralAreaSize: cc.size(720, 1334),
        sideAreaWidth: 840,
        reelAreaSize: cc.size(670, 330),
        fitMode: {
            fitHeight: false,
            fitWidth: true
        },
        symbolScale: 1.0,
        buttonScale: 1.0,
        textScale: 1.0
    };

    /**
     * 应用横屏布局策略
     * @param rootNode Canvas根节点
     */
    public apply(rootNode: cc.Node): void {
        console.log('[LandscapeStrategy] Applying landscape layout');

        // 设置Canvas适配模式
        this.setupCanvas(rootNode);

        // 设置三栏布局
        this.setupThreeColumnLayout(rootNode);

        // 调整各个区域
        this.adjustCentralArea(rootNode);
        this.adjustSideAreas(rootNode);
        this.adjustPopupLayer(rootNode);

        console.log('[LandscapeStrategy] Landscape layout applied successfully');
    }

    /**
     * 带动画更新布局
     * @param rootNode 根节点
     * @param duration 动画时长
     */
    public updateWithAnimation(rootNode: cc.Node, duration: number): void {
        console.log('[LandscapeStrategy] Updating with animation, duration:', duration);

        // 先设置Canvas
        this.setupCanvas(rootNode);

        // 动画更新各个区域
        this.animateThreeColumnLayout(rootNode, duration);
    }

    /**
     * 获取布局配置
     */
    public getConfig(): LayoutConfig {
        return this.config;
    }

    // ==================== 私有方法 ====================

    /**
     * 设置Canvas适配模式
     */
    private setupCanvas(rootNode: cc.Node): void {
        const canvas = rootNode.getComponent(cc.Canvas);
        if (canvas) {
            canvas.designResolution = this.config.designResolution;
            canvas.fitHeight = this.config.fitMode.fitHeight;
            canvas.fitWidth = this.config.fitMode.fitWidth;
        }
    }

    /**
     * 设置三栏布局
     */
    private setupThreeColumnLayout(rootNode: cc.Node): void {
        // 左侧面板
        const leftSide = rootNode.getChildByName('LeftSide');
        if (leftSide) {
            leftSide.active = true;
            leftSide.x = -786;

            const widget = leftSide.getComponent(cc.Widget);
            if (widget) {
                widget.isAlignLeft = true;
                widget.left = 414;
                widget.isAlignTop = false;
                widget.isAlignBottom = false;
                widget.updateAlignment();
            }

            // 恢复原始缩放
            leftSide.scale = 1.0;
        }

        // 右侧面板
        const rightSide = rootNode.getChildByName('RightSide');
        if (rightSide) {
            rightSide.active = true;
            rightSide.x = 786;

            const widget = rightSide.getComponent(cc.Widget);
            if (widget) {
                widget.isAlignRight = true;
                widget.right = 414;
                widget.isAlignTop = false;
                widget.isAlignBottom = false;
                widget.updateAlignment();
            }

            // 恢复原始缩放
            rightSide.scale = 1.0;
        }

        // 中心区域
        const centralArea = rootNode.getChildByName('CentralArea');
        if (centralArea) {
            centralArea.x = 0;
            centralArea.width = this.config.centralAreaSize.width;
            centralArea.height = this.config.centralAreaSize.height;

            const widget = centralArea.getComponent(cc.Widget);
            if (widget) {
                widget.isAlignLeft = true;
                widget.isAlignRight = true;
                widget.left = 840;
                widget.right = 840;
                widget.updateAlignment();
            }
        }
    }

    /**
     * 动画更新三栏布局
     */
    private animateThreeColumnLayout(rootNode: cc.Node, duration: number): void {
        // 左侧面板动画
        const leftSide = rootNode.getChildByName('LeftSide');
        if (leftSide) {
            leftSide.active = true;

            cc.tween(leftSide)
                .to(duration, {
                    x: -786,
                    scale: 1.0,
                    opacity: 255
                }, { easing: 'quadOut' })
                .call(() => {
                    const widget = leftSide.getComponent(cc.Widget);
                    if (widget) {
                        widget.isAlignLeft = true;
                        widget.left = 414;
                        widget.updateAlignment();
                    }
                })
                .start();
        }

        // 右侧面板动画
        const rightSide = rootNode.getChildByName('RightSide');
        if (rightSide) {
            rightSide.active = true;

            cc.tween(rightSide)
                .to(duration, {
                    x: 786,
                    scale: 1.0,
                    opacity: 255
                }, { easing: 'quadOut' })
                .call(() => {
                    const widget = rightSide.getComponent(cc.Widget);
                    if (widget) {
                        widget.isAlignRight = true;
                        widget.right = 414;
                        widget.updateAlignment();
                    }
                })
                .start();
        }

        // 中心区域动画
        const centralArea = rootNode.getChildByName('CentralArea');
        if (centralArea) {
            cc.tween(centralArea)
                .to(duration, {
                    x: 0,
                    width: this.config.centralAreaSize.width,
                    scale: 1.0
                }, { easing: 'quadOut' })
                .start();

            // 调整内部元素
            this.animateCentralAreaChildren(centralArea, duration);
        }
    }

    /**
     * 调整中心区域
     */
    private adjustCentralArea(rootNode: cc.Node): void {
        const centralArea = rootNode.getChildByName('CentralArea');
        if (!centralArea) return;

        // 顶部栏
        const topBar = centralArea.getChildByName('TopBar');
        if (topBar) {
            topBar.y = 627;
            topBar.height = 80;
            topBar.width = 720;

            const widget = topBar.getComponent(cc.Widget);
            if (widget) {
                widget.isAlignTop = true;
                widget.top = 0;
                widget.isAlignLeft = true;
                widget.isAlignRight = true;
                widget.left = 0;
                widget.right = 0;
                widget.updateAlignment();
            }
        }

        // 转轮区域
        const reelArea = centralArea.getChildByName('ReelArea');
        if (reelArea) {
            reelArea.y = -128.701;
            reelArea.width = this.config.reelAreaSize.width;
            reelArea.height = this.config.reelAreaSize.height;
            reelArea.scale = 1.0;

            // 调整转轮内容缩放
            const mask = reelArea.getChildByName('Mask');
            if (mask) {
                mask.width = this.config.reelAreaSize.width;
                mask.height = this.config.reelAreaSize.height;
            }
        }

        // 底部栏
        const bottomBar = centralArea.getChildByName('BottomBar');
        if (bottomBar) {
            bottomBar.y = -517;
            bottomBar.height = 300;
            bottomBar.width = 720;

            const widget = bottomBar.getComponent(cc.Widget);
            if (widget) {
                widget.isAlignBottom = true;
                widget.bottom = 0;
                widget.isAlignLeft = true;
                widget.isAlignRight = true;
                widget.left = 0;
                widget.right = 0;
                widget.updateAlignment();
            }

            // 调整Spin按钮
            const spinButton = bottomBar.getChildByName('SpinButton');
            if (spinButton) {
                spinButton.scale = 1.5;  // 横屏保持原始大小
                spinButton.y = 34.206;
            }

            // 调整手指引导
            const handNode = bottomBar.getChildByName('HandNode');
            if (handNode) {
                handNode.scale = 1.0;
                handNode.x = 90.323;
                handNode.y = -54.427;
            }
        }

        // 中间区域（角色等）
        const middleArea = centralArea.getChildByName('MiddleArea');
        if (middleArea) {
            middleArea.scale = 1.0;
        }
    }

    /**
     * 动画调整中心区域子元素
     */
    private animateCentralAreaChildren(centralArea: cc.Node, duration: number): void {
        // 转轮区域动画
        const reelArea = centralArea.getChildByName('ReelArea');
        if (reelArea) {
            cc.tween(reelArea)
                .to(duration * 0.8, {
                    width: this.config.reelAreaSize.width,
                    height: this.config.reelAreaSize.height,
                    scale: 1.0
                }, { easing: 'quadOut' })
                .start();
        }

        // Spin按钮动画
        const bottomBar = centralArea.getChildByName('BottomBar');
        if (bottomBar) {
            const spinButton = bottomBar.getChildByName('SpinButton');
            if (spinButton) {
                cc.tween(spinButton)
                    .to(duration * 0.6, {
                        scale: 1.5
                    }, { easing: 'backOut' })
                    .start();
            }
        }
    }

    /**
     * 调整侧边区域
     */
    private adjustSideAreas(rootNode: cc.Node): void {
        // 左侧面板内容调整
        const leftSide = rootNode.getChildByName('LeftSide');
        if (leftSide) {
            // 标题
            const title = leftSide.getChildByName('Title');
            if (title) {
                title.y = 470.437;
                title.scale = 0.8;
            }

            // 图标
            const icon = leftSide.getChildByName('Icon');
            if (icon) {
                icon.scale = 1.0;
                icon.y = 0;
            }

            // 下载按钮
            const downloadBtn = leftSide.getChildByName('DownLoadBtn');
            if (downloadBtn) {
                downloadBtn.y = -473.029;
                downloadBtn.scale = 1.0;
            }
        }

        // 右侧面板内容调整（与左侧类似）
        const rightSide = rootNode.getChildByName('RightSide');
        if (rightSide) {
            // 标题
            const title = rightSide.getChildByName('Title');
            if (title) {
                title.y = 470.437;
                title.scale = 0.8;
            }

            // 图标
            const icon = rightSide.getChildByName('Icon');
            if (icon) {
                icon.scale = 1.0;
                icon.y = 0;
            }

            // 下载按钮
            const downloadBtn = rightSide.getChildByName('DownLoadBtn');
            if (downloadBtn) {
                downloadBtn.y = -473.029;
                downloadBtn.scale = 1.0;
            }
        }
    }

    /**
     * 调整弹窗层
     */
    private adjustPopupLayer(rootNode: cc.Node): void {
        const popupLayer = rootNode.getChildByName('PopupLayer');
        if (!popupLayer) return;

        // 设置弹窗层大小
        popupLayer.width = this.config.designResolution.width;
        popupLayer.height = this.config.designResolution.height;

        // 调整Win弹窗
        const winPopup = popupLayer.getChildByName('WinPopup');
        if (winPopup) {
            const content = winPopup.getChildByName('Content');
            if (content) {
                content.scale = 0.68;  // 横屏使用原始缩放
            }
        }
    }
}