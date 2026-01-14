/**
 * Slot游戏配置
 * 包含所有可调整的参数
 */

const { ccclass, property } = cc._decorator;

@ccclass
export default class SlotConfig extends cc.Component {
    // ========== 布局配置 ==========
    @property({ tooltip: "行数" })
    rows: number = 3;

    @property({ tooltip: "列数（滚轴数）" })
    reels: number = 5;

    @property({ tooltip: "ReelArea区域宽度（像素）" })
    reelAreaWidth: number = 670;

    @property({ tooltip: "ReelArea区域高度（像素）" })
    reelAreaHeight: number = 330;

    @property({ tooltip: "Symbol高度（像素，固定值）" })
    symbolHeight: number = 110;

    @property({ tooltip: "Symbol宽度（像素，固定值）" })
    symbolWidth: number = 130;

    // ========== Symbol配置 ==========
    @property({ tooltip: "Symbol种类总数" })
    symbolTypes: number = 13;

    @property({ tooltip: "每列实际创建的symbol节点数" })
    symbolsPerReel: number = 6;

    @property({ tooltip: "每列可见的symbol数" })
    visibleSymbolsPerReel: number = 3;

    @property({
        type: [cc.String],
        tooltip: "Symbol图片名称映射表\n将symbolId映射到实际图片名称\nindex=symbolId, value=图片名称\n例如: ['L01', 'L02', 'L03', 'L04', 'L05', 'L06', 'H01', 'H02', 'H03', 'H04', 'H05', 'W01', 'S01']"
    })
    symbolNameMap: string[] = [
        "L01",  // 0: 字母9
        "L02",  // 1: 字母10
        "L03",  // 2: 字母J
        "L04",  // 3: 字母Q
        "L05",  // 4: 字母K
        "L06",  // 5: 字母A
        "H01",  // 6: 圣诞帽
        "H02",  // 7: 礼物盒
        "H03",  // 8: 铃铛
        "H04",  // 9: 拐杖糖
        "H05",  // 10: 圣诞树
        "W01",  // 11: Wild
        "S01"   // 12: Scatter
    ];

    // ========== 滚动配置（不暴露到编辑器）==========
    // 速度 2000 px/s，优化后的参数配置
    readonly spinAccelerationTime: number = 0.3;    // 加速时间加长，让加速更平滑
    readonly spinNormalSpeed: number = 2000;        // 目标速度
    readonly spinNormalDuration: number = 1.5;      // 匀速时间适当缩短
    readonly spinDecelerationTime: number = 1.2;    // 减速时间加长，确保精确停止
    readonly reelStopDelay: number = 0.15;          // 每列延迟缩短，加快整体节奏

    // ========== 动画配置（不暴露到编辑器）==========
    readonly bounceBackDistance: number = 0;        // 去掉回弹
    readonly bounceBackDuration: number = 0;        // 去掉回弹
    readonly winAnimationDelay: number = 0.3;
    readonly winAnimationLoops: number = 2;

    // ========== 弹窗配置 ==========
    @property({ tooltip: "现金飞行动画时长（秒）" })
    cashFlyDuration: number = 1.2;

    @property({ tooltip: "现金飞行抛物线高度（像素）" })
    cashFlyHeight: number = 150;

    @property({ tooltip: "弹窗弹出动画时长（秒）" })
    popupShowDuration: number = 0.4;

    @property({ tooltip: "弹窗隐藏动画时长（秒）" })
    popupHideDuration: number = 0.3;

    // ========== 资源引用 ==========
    @property({ type: cc.Prefab, tooltip: "Reel预制体" })
    reelPrefab: cc.Prefab = null;

    @property({ type: cc.Prefab, tooltip: "Symbol预制体" })
    symbolPrefab: cc.Prefab = null;

    @property({ type: [cc.SpriteFrame], tooltip: "Symbol普通状态图片数组\n按照symbolId顺序排列（0-12）" })
    symbolFrames: cc.SpriteFrame[] = [];

    // ========== Symbol 中奖动画序列帧（每个symbol独立配置）==========
    @property({ type: [cc.SpriteFrame], tooltip: "L01 (Symbol 0) 中奖动画序列帧" })
    L01_WinFrames: cc.SpriteFrame[] = [];

    @property({ type: [cc.SpriteFrame], tooltip: "L02 (Symbol 1) 中奖动画序列帧" })
    L02_WinFrames: cc.SpriteFrame[] = [];

    @property({ type: [cc.SpriteFrame], tooltip: "L03 (Symbol 2) 中奖动画序列帧" })
    L03_WinFrames: cc.SpriteFrame[] = [];

    @property({ type: [cc.SpriteFrame], tooltip: "L04 (Symbol 3) 中奖动画序列帧" })
    L04_WinFrames: cc.SpriteFrame[] = [];

    @property({ type: [cc.SpriteFrame], tooltip: "L05 (Symbol 4) 中奖动画序列帧" })
    L05_WinFrames: cc.SpriteFrame[] = [];

    @property({ type: [cc.SpriteFrame], tooltip: "L06 (Symbol 5) 中奖动画序列帧" })
    L06_WinFrames: cc.SpriteFrame[] = [];

    @property({ type: [cc.SpriteFrame], tooltip: "H01 (Symbol 6) 中奖动画序列帧" })
    H01_WinFrames: cc.SpriteFrame[] = [];

    @property({ type: [cc.SpriteFrame], tooltip: "H02 (Symbol 7) 中奖动画序列帧" })
    H02_WinFrames: cc.SpriteFrame[] = [];

    @property({ type: [cc.SpriteFrame], tooltip: "H03 (Symbol 8) 中奖动画序列帧" })
    H03_WinFrames: cc.SpriteFrame[] = [];

    @property({ type: [cc.SpriteFrame], tooltip: "H04 (Symbol 9) 中奖动画序列帧" })
    H04_WinFrames: cc.SpriteFrame[] = [];

    @property({ type: [cc.SpriteFrame], tooltip: "H05 (Symbol 10) 中奖动画序列帧" })
    H05_WinFrames: cc.SpriteFrame[] = [];

    @property({ type: [cc.SpriteFrame], tooltip: "W01 (Symbol 11 - Wild) 中奖动画序列帧" })
    W01_WinFrames: cc.SpriteFrame[] = [];

    @property({ type: [cc.SpriteFrame], tooltip: "S01 (Symbol 12 - Scatter) 中奖动画序列帧" })
    S01_WinFrames: cc.SpriteFrame[] = [];

    @property({ type: cc.SpriteFrame, tooltip: "现金飞行金币图片" })
    cashCoinSprite: cc.SpriteFrame = null;

    // ========== 应用商店URL ==========
    @property({ tooltip: "iOS App Store URL" })
    iosStoreURL: string = "https://apps.apple.com/app/id123456789";

    @property({ tooltip: "Google Play Store URL" })
    androidStoreURL: string = "https://play.google.com/store/apps/details?id=com.crazy.roil.jackpot.oqed.slots";

    /**
     * 获取当前平台的应用商店URL
     */
    getStoreURL(): string {
        if (cc.sys.os === cc.sys.OS_IOS) {
            return this.iosStoreURL;
        } else if (cc.sys.os === cc.sys.OS_ANDROID) {
            return this.androidStoreURL;
        } else {
            // 默认返回iOS链接
            return this.iosStoreURL;
        }
    }

    /**
     * 获取单个symbol的单位高度（无间距）
     */
    getSymbolUnitHeight(): number {
        return this.symbolHeight;
    }

    /**
     * 获取单个symbol的单位宽度（无间距）
     */
    getSymbolUnitWidth(): number {
        return this.symbolWidth;
    }

    /**
     * 获取Reel的X坐标数组（水平居中排列）
     * 根据ReelArea宽度和Symbol宽度动态计算位置（无间距）
     */
    getReelPositionsX(): number[] {
        const positions: number[] = [];
        const unitWidth = this.symbolWidth;
        const totalWidth = this.symbolWidth * this.reels;
        const startX = -totalWidth / 2 + this.symbolWidth / 2;

        for (let i = 0; i < this.reels; i++) {
            positions[i] = startX + i * unitWidth;
        }

        return positions;
    }

    /**
     * 获取Symbol的Y坐标数组（每个Reel内的位置）
     * 根据Symbol高度动态计算位置（无间距）
     *
     * 布局策略：让前visibleSymbolsPerReel个symbols位于可见区域
     * 可见区域Y范围：[-110, 110] (3个symbols高度)
     */
    getSymbolPositionsY(): number[] {
        const positions: number[] = [];
        const unitHeight = this.symbolHeight;  // 110
        const symbolsPerReel = this.symbolsPerReel;  // 6

        // 恢复原来的布局，但从可见区域中心开始计算
        // 让前3个symbols (index 0,1,2) 正好在可见区域
        // 可见区域中心偏移：第一个symbol在 Y=110 (可见区域顶部)

        for (let i = 0; i < symbolsPerReel; i++) {
            positions[i] = 110 - i * unitHeight;
        }

        // 结果布局 (symbolsPerReel=6, unitHeight=110):
        // index 0: Y = 110  (可见区域第一行，positionY=0)
        // index 1: Y = 0    (可见区域第二行，positionY=1)
        // index 2: Y = -110 (可见区域第三行，positionY=2)
        // index 3: Y = -220 (不可见，在可见区域下方)
        // index 4: Y = -330 (不可见，在可见区域下方)
        // index 5: Y = -440 (不可见，在可见区域下方)
        //
        // stopIndexInRenders = 0，表示 index=0 对应 positionY=0

        return positions;
    }

    /**
     * 验证布局配置是否合理（无间距版本）
     */
    validateLayout(): boolean {
        // 检查Symbol是否能放入ReelArea
        const requiredWidth = this.symbolWidth * this.reels;
        const requiredHeight = this.symbolHeight * this.rows;

        if (requiredWidth > this.reelAreaWidth) {
            cc.error(`[SlotConfig] Symbol宽度超出ReelArea: 需要${requiredWidth}px, 实际${this.reelAreaWidth}px`);
            return false;
        }

        if (requiredHeight > this.reelAreaHeight) {
            cc.error(`[SlotConfig] Symbol高度超出ReelArea: 需要${requiredHeight}px, 实际${this.reelAreaHeight}px`);
            return false;
        }

        cc.log(`[SlotConfig] 布局验证通过:`);
        cc.log(`[SlotConfig]   ReelArea: ${this.reelAreaWidth}x${this.reelAreaHeight}px`);
        cc.log(`[SlotConfig]   Symbol: ${this.symbolWidth}x${this.symbolHeight}px (无间距)`);
        cc.log(`[SlotConfig]   Grid: ${this.rows}行 x ${this.reels}列`);
        cc.log(`[SlotConfig]   实际占用: ${requiredWidth}x${requiredHeight}px`);

        return true;
    }

    /**
     * 根据symbolId获取对应的图片名称
     * @param symbolId Symbol ID (0-12)
     * @returns 图片名称，如果映射表未配置或索引越界则返回默认命名 "symbol_{id}"
     */
    getSymbolImageName(symbolId: number): string {
        // 检查映射表是否已配置
        if (!this.symbolNameMap || this.symbolNameMap.length === 0) {
            cc.warn(`[SlotConfig] symbolNameMap not configured, using default naming: symbol_${symbolId}`);
            return `symbol_${symbolId}`;
        }

        // 检查索引是否有效
        if (symbolId < 0 || symbolId >= this.symbolNameMap.length) {
            cc.warn(`[SlotConfig] symbolId ${symbolId} out of range, using default naming`);
            return `symbol_${symbolId}`;
        }

        return this.symbolNameMap[symbolId];
    }

    /**
     * 根据symbolId获取对应的中奖动画帧数组
     * @param symbolId Symbol ID (0-12)
     * @returns 中奖动画帧数组，如果未配置则返回空数组
     */
    getWinAnimationFrames(symbolId: number): cc.SpriteFrame[] {
        switch (symbolId) {
            case 0: return this.L01_WinFrames || [];
            case 1: return this.L02_WinFrames || [];
            case 2: return this.L03_WinFrames || [];
            case 3: return this.L04_WinFrames || [];
            case 4: return this.L05_WinFrames || [];
            case 5: return this.L06_WinFrames || [];
            case 6: return this.H01_WinFrames || [];
            case 7: return this.H02_WinFrames || [];
            case 8: return this.H03_WinFrames || [];
            case 9: return this.H04_WinFrames || [];
            case 10: return this.H05_WinFrames || [];
            case 11: return this.W01_WinFrames || [];
            case 12: return this.S01_WinFrames || [];
            default:
                cc.warn(`[SlotConfig] Invalid symbolId: ${symbolId}`);
                return [];
        }
    }

    /**
     * 验证Symbol配置是否正确
     * @returns 是否配置正确
     */
    validateSymbolConfig(): boolean {
        if (!this.symbolNameMap || this.symbolNameMap.length === 0) {
            cc.error("[SlotConfig] symbolNameMap is not configured!");
            return false;
        }

        if (this.symbolNameMap.length !== this.symbolTypes) {
            cc.error(`[SlotConfig] symbolNameMap length (${this.symbolNameMap.length}) does not match symbolTypes (${this.symbolTypes})`);
            return false;
        }

        return true;
    }
}
