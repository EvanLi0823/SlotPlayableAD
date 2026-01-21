/**
 * Portrait Layout Strategy
 * 竖屏布局策略实现
 * 将三栏布局转换为单栏垂直布局
 */

import { AdaptationStrategy, LayoutConfig, DeviceOrientation } from '../types/AdaptationTypes';

export default class PortraitStrategy implements AdaptationStrategy {
    public readonly name = 'PortraitStrategy';

    // 竖屏布局配置
    private readonly config: LayoutConfig = {
        designResolution: cc.size(1334, 2400),
        centralAreaSize: cc.size(750, 1334),
        sideAreaWidth: 0,  // 竖屏不显示侧边
        reelAreaSize: cc.size(1200, 600),  // 放大转轮区域
        fitMode: {
            fitHeight: true,
            fitWidth: false
        },
        symbolScale: 1.8,  // 符号放大
        buttonScale: 2.0,  // 按钮放大
        textScale: 1.2     // 文字放大
    };

    /**
     * 应用竖屏布局策略
     * @param rootNode Canvas根节点
     */
    public apply(rootNode: cc.Node): void {
        console.log('[PortraitStrategy] Applying portrait layout');

        // 设置Canvas适配模式
        this.setupCanvas(rootNode);

        // 设置单栏布局
        this.setupSingleColumnLayout(rootNode);

        // 重新排列中心区域
        this.rearrangeCentralArea(rootNode);

        // 整合侧边内容
        this.integrateSideContent(rootNode);

        // 调整弹窗层
        this.adjustPopupLayer(rootNode);

        console.log('[PortraitStrategy] Portrait layout applied successfully');
    }

    /**
     * 带动画更新布局
     * @param rootNode 根节点
     * @param duration 动画时长
     */
    public updateWithAnimation(rootNode: cc.Node, duration: number): void {
        console.log('[PortraitStrategy] Updating with animation, duration:', duration);

        // 先设置Canvas
        this.setupCanvas(rootNode);

        // 动画更新布局
        this.animateSingleColumnLayout(rootNode, duration);
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
     * 设置单栏布局
     */
    private setupSingleColumnLayout(rootNode: cc.Node): void {
        // 隐藏左右侧边面板
        const leftSide = rootNode.getChildByName('LeftSide');
        if (leftSide) {
            leftSide.active = false;
        }

        const rightSide = rootNode.getChildByName('RightSide');
        if (rightSide) {
            rightSide.active = false;
        }

        // 中心区域全屏
        const centralArea = rootNode.getChildByName('CentralArea');
        if (centralArea) {
            centralArea.x = 0;
            centralArea.y = 0;
            centralArea.width = this.config.centralAreaSize.width;
            centralArea.height = this.config.centralAreaSize.height;

            const widget = centralArea.getComponent(cc.Widget);
            if (widget) {
                widget.isAlignLeft = true;
                widget.isAlignRight = true;
                widget.isAlignTop = true;
                widget.isAlignBottom = true;
                widget.left = 0;
                widget.right = 0;
                widget.top = 0;
                widget.bottom = 0;
                widget.updateAlignment();
            }
        }
    }

    /**
     * 动画更新单栏布局
     */
    private animateSingleColumnLayout(rootNode: cc.Node, duration: number): void {
        // 淡出侧边面板
        const leftSide = rootNode.getChildByName('LeftSide');
        if (leftSide && leftSide.active) {
            cc.tween(leftSide)
                .to(duration * 0.3, { opacity: 0 })
                .call(() => {
                    leftSide.active = false;
                    leftSide.opacity = 255;  // 恢复透明度
                })
                .start();
        }

        const rightSide = rootNode.getChildByName('RightSide');
        if (rightSide && rightSide.active) {
            cc.tween(rightSide)
                .to(duration * 0.3, { opacity: 0 })
                .call(() => {
                    rightSide.active = false;
                    rightSide.opacity = 255;  // 恢复透明度
                })
                .start();
        }

        // 扩展中心区域
        const centralArea = rootNode.getChildByName('CentralArea');
        if (centralArea) {
            cc.tween(centralArea)
                .to(duration, {
                    x: 0,
                    y: 0,
                    width: this.config.centralAreaSize.width,
                    height: this.config.centralAreaSize.height
                }, { easing: 'quadOut' })
                .start();

            // 动画调整内部元素
            this.animateCentralAreaRearrange(centralArea, duration);
        }
    }

    /**
     * 重新排列中心区域
     */
    private rearrangeCentralArea(rootNode: cc.Node): void {
        const centralArea = rootNode.getChildByName('CentralArea');
        if (!centralArea) return;

        // 顶部栏 - 放在最上方
        const topBar = centralArea.getChildByName('TopBar');
        if (topBar) {
            topBar.y = 1100;
            topBar.height = 200;
            topBar.width = 1334;

            const widget = topBar.getComponent(cc.Widget);
            if (widget) {
                widget.isAlignTop = true;
                widget.top = 100;
                widget.isAlignLeft = true;
                widget.isAlignRight = true;
                widget.left = 0;
                widget.right = 0;
                widget.updateAlignment();
            }

            // 放大顶部栏内容
            topBar.scale = 1.5;
        }

        // 转轮区域 - 中心偏上
        const reelArea = centralArea.getChildByName('ReelArea');
        if (reelArea) {
            reelArea.y = 300;
            reelArea.width = this.config.reelAreaSize.width;
            reelArea.height = this.config.reelAreaSize.height;
            reelArea.scale = 1.0;  // 通过调整width/height来放大，而不是scale

            // 调整转轮内容
            const mask = reelArea.getChildByName('Mask');
            if (mask) {
                mask.width = this.config.reelAreaSize.width;
                mask.height = this.config.reelAreaSize.height;

                const reelContainer = mask.getChildByName('ReelContainer');
                if (reelContainer) {
                    reelContainer.scale = this.config.symbolScale;
                }
            }
        }

        // 底部栏 - 包含Spin按钮
        const bottomBar = centralArea.getChildByName('BottomBar');
        if (bottomBar) {
            bottomBar.y = -600;
            bottomBar.height = 600;
            bottomBar.width = 1334;

            const widget = bottomBar.getComponent(cc.Widget);
            if (widget) {
                widget.isAlignBottom = true;
                widget.bottom = 100;
                widget.isAlignLeft = true;
                widget.isAlignRight = true;
                widget.left = 0;
                widget.right = 0;
                widget.updateAlignment();
            }

            // 放大Spin按钮
            const spinButton = bottomBar.getChildByName('SpinButton');
            if (spinButton) {
                spinButton.scale = this.config.buttonScale;
                spinButton.y = 100;
            }

            // 调整手指引导位置
            const handNode = bottomBar.getChildByName('HandNode');
            if (handNode) {
                handNode.scale = 1.5;
                handNode.x = 135;
                handNode.y = -80;
            }

            // 调整提示文字
            const label = bottomBar.getChildByName('New Label');
            if (label) {
                label.scale = 1.2;
                label.y = -200;
            }
        }

        // 中间区域（角色）
        const middleArea = centralArea.getChildByName('MiddleArea');
        if (middleArea) {
            middleArea.y = -100;
            middleArea.scale = 1.5;  // 放大角色
        }
    }

    /**
     * 动画重排中心区域
     */
    private animateCentralAreaRearrange(centralArea: cc.Node, duration: number): void {
        // 顶部栏动画
        const topBar = centralArea.getChildByName('TopBar');
        if (topBar) {
            cc.tween(topBar)
                .to(duration, {
                    y: 1100,
                    scale: 1.5,
                    width: 1334,
                    height: 200
                }, { easing: 'quadOut' })
                .start();
        }

        // 转轮区域动画
        const reelArea = centralArea.getChildByName('ReelArea');
        if (reelArea) {
            cc.tween(reelArea)
                .to(duration * 0.8, {
                    y: 300,
                    width: this.config.reelAreaSize.width,
                    height: this.config.reelAreaSize.height
                }, { easing: 'quadOut' })
                .start();

            // 符号缩放动画
            const mask = reelArea.getChildByName('Mask');
            if (mask) {
                const reelContainer = mask.getChildByName('ReelContainer');
                if (reelContainer) {
                    cc.tween(reelContainer)
                        .to(duration * 0.6, {
                            scale: this.config.symbolScale
                        }, { easing: 'quadOut' })
                        .start();
                }
            }
        }

        // 底部栏动画
        const bottomBar = centralArea.getChildByName('BottomBar');
        if (bottomBar) {
            cc.tween(bottomBar)
                .to(duration, {
                    y: -600,
                    width: 1334,
                    height: 600
                }, { easing: 'quadOut' })
                .start();

            // Spin按钮动画
            const spinButton = bottomBar.getChildByName('SpinButton');
            if (spinButton) {
                cc.tween(spinButton)
                    .to(duration * 0.7, {
                        scale: this.config.buttonScale,
                        y: 100
                    }, { easing: 'backOut' })
                    .start();
            }
        }

        // 角色动画
        const middleArea = centralArea.getChildByName('MiddleArea');
        if (middleArea) {
            cc.tween(middleArea)
                .to(duration * 0.8, {
                    y: -100,
                    scale: 1.5
                }, { easing: 'quadOut' })
                .start();
        }
    }

    /**
     * 整合侧边内容到中心区域
     */
    private integrateSideContent(rootNode: cc.Node): void {
        const centralArea = rootNode.getChildByName('CentralArea');
        if (!centralArea) return;

        // 创建顶部信息容器（整合左侧内容）
        this.createTopInfoContainer(centralArea, rootNode);

        // 创建底部下载区域（整合右侧内容）
        this.createBottomDownloadArea(centralArea, rootNode);
    }

    /**
     * 创建顶部信息容器
     */
    private createTopInfoContainer(centralArea: cc.Node, rootNode: cc.Node): void {
        // 获取左侧面板的内容
        const leftSide = rootNode.getChildByName('LeftSide');
        if (!leftSide) return;

        // 查找或创建顶部信息节点
        let topInfo = centralArea.getChildByName('TopInfo');
        if (!topInfo) {
            topInfo = new cc.Node('TopInfo');
            topInfo.parent = centralArea;
        }

        topInfo.y = 850;
        topInfo.x = 0;
        topInfo.width = 1334;
        topInfo.height = 300;

        // 复制标题和图标（如果需要）
        const title = leftSide.getChildByName('Title');
        const icon = leftSide.getChildByName('Icon');

        if (title) {
            const titleCopy = topInfo.getChildByName('Title') || new cc.Node('Title');
            titleCopy.parent = topInfo;
            titleCopy.y = 50;
            titleCopy.scale = 0.6;

            const sprite = titleCopy.getComponent(cc.Sprite) || titleCopy.addComponent(cc.Sprite);
            const originalSprite = title.getComponent(cc.Sprite);
            if (originalSprite) {
                sprite.spriteFrame = originalSprite.spriteFrame;
            }
        }

        if (icon) {
            const iconCopy = topInfo.getChildByName('Icon') || new cc.Node('Icon');
            iconCopy.parent = topInfo;
            iconCopy.y = -100;
            iconCopy.scale = 0.4;

            const sprite = iconCopy.getComponent(cc.Sprite) || iconCopy.addComponent(cc.Sprite);
            const originalSprite = icon.getComponent(cc.Sprite);
            if (originalSprite) {
                sprite.spriteFrame = originalSprite.spriteFrame;
            }
        }
    }

    /**
     * 创建底部下载区域
     */
    private createBottomDownloadArea(centralArea: cc.Node, rootNode: cc.Node): void {
        const bottomBar = centralArea.getChildByName('BottomBar');
        if (!bottomBar) return;

        // 获取侧边的下载按钮内容
        const leftSide = rootNode.getChildByName('LeftSide');
        const rightSide = rootNode.getChildByName('RightSide');

        // 创建下载按钮容器
        let downloadContainer = bottomBar.getChildByName('DownloadContainer');
        if (!downloadContainer) {
            downloadContainer = new cc.Node('DownloadContainer');
            downloadContainer.parent = bottomBar;
        }

        downloadContainer.y = -250;
        downloadContainer.width = 1200;
        downloadContainer.height = 200;

        // 创建左侧下载按钮
        if (leftSide) {
            const leftDownloadBtn = leftSide.getChildByName('DownLoadBtn');
            if (leftDownloadBtn) {
                const btnCopy = downloadContainer.getChildByName('LeftDownload') || new cc.Node('LeftDownload');
                btnCopy.parent = downloadContainer;
                btnCopy.x = -300;
                btnCopy.y = 0;
                btnCopy.scale = 0.8;

                // 复制按钮组件
                this.copyButtonComponent(leftDownloadBtn, btnCopy);
            }
        }

        // 创建右侧下载按钮
        if (rightSide) {
            const rightDownloadBtn = rightSide.getChildByName('DownLoadBtn');
            if (rightDownloadBtn) {
                const btnCopy = downloadContainer.getChildByName('RightDownload') || new cc.Node('RightDownload');
                btnCopy.parent = downloadContainer;
                btnCopy.x = 300;
                btnCopy.y = 0;
                btnCopy.scale = 0.8;

                // 复制按钮组件
                this.copyButtonComponent(rightDownloadBtn, btnCopy);
            }
        }
    }

    /**
     * 复制按钮组件
     */
    private copyButtonComponent(source: cc.Node, target: cc.Node): void {
        // 复制Sprite
        const sourceSprite = source.getComponent(cc.Sprite);
        if (sourceSprite) {
            const targetSprite = target.getComponent(cc.Sprite) || target.addComponent(cc.Sprite);
            targetSprite.spriteFrame = sourceSprite.spriteFrame;
            targetSprite.type = sourceSprite.type;
            targetSprite.sizeMode = sourceSprite.sizeMode;
        }

        // 复制Button
        const sourceButton = source.getComponent(cc.Button);
        if (sourceButton) {
            const targetButton = target.getComponent(cc.Button) || target.addComponent(cc.Button);
            targetButton.transition = sourceButton.transition;
            targetButton.normalSprite = sourceButton.normalSprite;
            targetButton.pressedSprite = sourceButton.pressedSprite;
            targetButton.hoverSprite = sourceButton.hoverSprite;
            targetButton.disabledSprite = sourceButton.disabledSprite;
        }

        // 复制大小
        target.width = source.width;
        target.height = source.height;
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
                content.scale = 0.85;  // 竖屏缩小一些避免超出

                // 重新排列弹窗内容为垂直布局
                this.rearrangePopupContent(content);
            }
        }
    }

    /**
     * 重排弹窗内容
     */
    private rearrangePopupContent(content: cc.Node): void {
        // 调整大赢文字位置
        const bigWinText = content.getChildByName('big');
        if (bigWinText) {
            bigWinText.y = 800;
            bigWinText.scale = 1.2;
        }

        // 调整奖金显示位置
        const moneyFrame = content.getChildByName('qian-kuang');
        if (moneyFrame) {
            moneyFrame.y = 0;
            moneyFrame.scale = 1.1;
        }

        // 调整领取按钮位置
        const claimButton = content.getChildByName('ClaimButton');
        if (claimButton) {
            claimButton.y = -600;
            claimButton.scale = 1.2;
        }

        // 调整角色位置
        const npc = content.getChildByName('npc_1');
        if (npc) {
            npc.x = 0;
            npc.y = 200;
            npc.scale = 1.3;
        }
    }
}