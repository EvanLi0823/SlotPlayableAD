/**
 * GameScene - 主场景控制器
 * 集成所有子系统，协调完整的游戏流程
 */

import { SlotState, SpinResult, SymbolLayout, SymbolType } from "./DataTypes";
import SlotMachine from "./SlotMachine";
import TopBarController from "./TopBarController";
import SpinButtonController from "./SpinButtonController";
import LeftSidePanelController from "./LeftSidePanelController";
import RightSidePanelController from "./RightSidePanelController";
import WinPopupController from "./WinPopupController";
import DownloadPopupController from "./DownloadPopupController";
import CashFlyAnimController from "./CashFlyAnimController";
import LogManager from "./LogManager";
import { i18n } from "./LocalizationManager";
import { LanguageCode } from "./LocalizationTypes";

const { ccclass, property } = cc._decorator;

/**
 * 广告平台类型枚举
 */
export enum PlayableAdType {
   AppLovin = "AppLovin",
   Mtg = "Mtg",
   UnityAD = "UnityAD",
}

@ccclass
export default class GameScene extends cc.Component {
    // 核心系统
    @property(SlotMachine)
    slotMachine: SlotMachine = null;

    // UI控制器
    @property(TopBarController)
    topBar: TopBarController = null;

    @property(SpinButtonController)
    spinButton: SpinButtonController = null;

    @property(LeftSidePanelController)
    leftSidePanel: LeftSidePanelController = null;

    @property(RightSidePanelController)
    rightSidePanel: RightSidePanelController = null;

    // 弹窗系统
    @property(WinPopupController)
    winPopup: WinPopupController = null;

    @property(DownloadPopupController)
    downloadPopup: DownloadPopupController = null;

    @property(CashFlyAnimController)
    cashFlyAnim: CashFlyAnimController = null;

    // 游戏状态
    private isProcessing: boolean = false;
    private spinCount: number = 0;
    private currentResult: SpinResult | null = null;
    private logManager: LogManager = null;
    private currentAdType: PlayableAdType = PlayableAdType.AppLovin; // 当前广告平台

    onLoad() {
        // 初始化日志管理器（必须在所有日志之前）
        this.initLogManager();

        // 设置广告平台类型
        this.setAdType(PlayableAdType.UnityAD);

        // 初始化本地化管理器
        // i18n.initialize(LanguageCode.DE);
        i18n.initialize(LanguageCode.PT);
        // i18n.initialize(LanguageCode.XX);
        // i18n.initialize(LanguageCode.XX);
        // i18n.initialize(LanguageCode.XX);
        // i18n.initialize(LanguageCode.XX);
        // i18n.initialize(LanguageCode.XX);


        cc.log("[GameScene] ========================================");
        cc.log("[GameScene] Initializing game scene...");
        cc.log(`[GameScene] Current Ad Platform: ${this.currentAdType}`);
        cc.log(`[GameScene] Current Language: ${i18n.getCurrentLanguage()}`);
        cc.log("[GameScene] Checking component references:");
        cc.log(`[GameScene]   slotMachine: ${this.slotMachine ? 'exists' : 'NULL'}`);
        cc.log(`[GameScene]   topBar: ${this.topBar ? 'exists' : 'NULL'}`);
        cc.log(`[GameScene]   spinButton: ${this.spinButton ? 'exists' : 'NULL'}`);
        cc.log(`[GameScene]   leftSidePanel: ${this.leftSidePanel ? 'exists' : 'NULL'}`);
        cc.log(`[GameScene]   rightSidePanel: ${this.rightSidePanel ? 'exists' : 'NULL'}`);
        cc.log(`[GameScene]   winPopup: ${this.winPopup ? 'exists' : 'NULL'}`);
        cc.log(`[GameScene]   downloadPopup: ${this.downloadPopup ? 'exists' : 'NULL'}`);
        cc.log(`[GameScene]   cashFlyAnim: ${this.cashFlyAnim ? 'exists' : 'NULL'}`);

        // 初始化SlotMachine
        this.initSlotMachine();

        // 设置UI回调
        this.setupUICallbacks();

        // 设置日志下载按钮
        // this.setupLogDownloadButtons();

        // 检测Mtg平台并调用gameReady
        this.checkMtgGameReady();

        cc.log("[GameScene] Game scene initialized successfully");
        cc.log("[GameScene] ========================================");
    }

    /**
     * 初始化日志管理器
     */
    private initLogManager(): void {
        this.logManager = LogManager.getInstance();
        console.log("[GameScene] LogManager initialized");

        // 暴露到window对象，方便浏览器控制台调试
        (window as any).logManager = this.logManager;
        console.log("[GameScene] LogManager exposed to window.logManager");
    }

    /**
     * 获取当前广告平台类型
     */
    public getCurrentAdType(): PlayableAdType {
        return this.currentAdType;
    }

    /**
     * 设置广告平台类型
     */
    public setAdType(adType: PlayableAdType): void {
        this.currentAdType = adType;
        cc.log(`[GameScene] Ad platform set to: ${this.currentAdType}`);
    }

    /**
     * 检测Mtg平台并调用gameReady
     */
    private checkMtgGameReady(): void {
        if (this.currentAdType === PlayableAdType.Mtg) {
            cc.log('[GameScene] Mtg platform detected, calling gameReady');
            (window as any).gameReady && (window as any).gameReady();
        }
    }

    /**
     * 设置日志下载按钮事件
     */
    private setupLogDownloadButtons(): void {
        const downloadTxtBtn = document.getElementById('download-txt-btn');
        const downloadJsonBtn = document.getElementById('download-json-btn');
        const clearLogsBtn = document.getElementById('clear-logs-btn');
        const logStatsBtn = document.getElementById('log-stats-btn');
        const logCountElement = document.getElementById('log-count');

        if (downloadTxtBtn) {
            downloadTxtBtn.addEventListener('click', () => {
                cc.log("[GameScene] Downloading logs as TXT...");
                this.logManager.downloadLogsAsText();
            });
        }

        if (downloadJsonBtn) {
            downloadJsonBtn.addEventListener('click', () => {
                cc.log("[GameScene] Downloading logs as JSON...");
                this.logManager.downloadLogsAsJSON();
            });
        }

        if (clearLogsBtn) {
            clearLogsBtn.addEventListener('click', () => {
                cc.log("[GameScene] Clearing logs...");
                this.logManager.clearLogs();
                this.updateLogCount();
            });
        }

        if (logStatsBtn) {
            logStatsBtn.addEventListener('click', () => {
                cc.log("[GameScene] Showing log statistics...");
                this.logManager.printLogStats();
            });
        }

        // 定期更新日志计数
        if (logCountElement) {
            this.schedule(() => {
                this.updateLogCount();
            }, 1.0); // 每秒更新一次
        }

        cc.log("[GameScene] Log download buttons setup complete");
    }

    /**
     * 更新日志计数显示
     */
    private updateLogCount(): void {
        const logCountElement = document.getElementById('log-count');
        if (logCountElement && this.logManager) {
            const count = this.logManager.getLogCount();
            logCountElement.textContent = `Logs: ${count}`;
        }
    }

    /**
     * 初始化SlotMachine
     */
    private initSlotMachine(): void {
        if (!this.slotMachine) {
            cc.error("[GameScene] SlotMachine not assigned!");
            return;
        }

        // 定义初始布局（3行5列）
        // 方式1: 使用symbolId数字（0-12）
        // const initialLayout: SymbolLayout = [
        //     [0, 1, 2, 3, 4],
        //     [5, 6, 7, 0, 1],
        //     [2, 3, 4, 5, 6]
        // ];

        // 方式2: 使用SymbolType枚举（推荐，更直观）
        const initialLayout: SymbolLayout = [
            [SymbolType.L01, SymbolType.L02, SymbolType.H01, SymbolType.H02, SymbolType.L03],
            [SymbolType.L04, SymbolType.H03, SymbolType.H04, SymbolType.L05, SymbolType.L06],
            [SymbolType.H05, SymbolType.WILD, SymbolType.SCATTER, SymbolType.H01, SymbolType.L01]
        ];

        // 初始化
        this.slotMachine.init(initialLayout);

        // 设置回调
        this.slotMachine.onSpinComplete = this.handleSpinComplete.bind(this);
        this.slotMachine.onStateChange = this.handleStateChange.bind(this);
        this.slotMachine.onWinAnimComplete = this.handleWinAnimComplete.bind(this);
    }

    /**
     * 设置UI回调
     */
    private setupUICallbacks(): void {
        // Spin按钮
        if (this.spinButton) {
            this.spinButton.onSpinClicked = this.handleSpinButtonClick.bind(this);
        }

        // 左侧面板下载按钮
        if (this.leftSidePanel) {
            this.leftSidePanel.onDownloadClicked = this.handleDownloadClick.bind(this);
        }

        // 右侧面板下载按钮
        if (this.rightSidePanel) {
            this.rightSidePanel.onDownloadClicked = this.handleDownloadClick.bind(this);
        }

        // 中奖弹窗领取按钮
        if (this.winPopup) {
            this.winPopup.onClaimClicked = this.handleClaimClick.bind(this);
        }

        // 下载弹窗下载按钮
        if (this.downloadPopup) {
            this.downloadPopup.onDownloadClicked = this.handleDownloadClick.bind(this);
        }
    }

    /**
     * 处理Spin按钮点击
     */
    private handleSpinButtonClick(): void {
        if (this.isProcessing) {
            cc.log("[GameScene] Already processing, ignoring click");
            return;
        }

        cc.log("[GameScene] Spin button clicked, starting spin...");

        this.startSpin();
    }

    /**
     * 开始Spin
     */
    private startSpin(): void {
        this.isProcessing = true;
        this.spinCount++;

        // 禁用Spin按钮
        if (this.spinButton) {
            this.spinButton.setEnabled(false);
        }

        // 生成或获取结果
        const result = this.generateSpinResult();

        // 保存当前结果
        this.currentResult = result;

        // 启动spin
        this.slotMachine.spin(result);
    }

    /**
     * 生成Spin结果
     */
    private generateSpinResult(): SpinResult {
        const resultManager = this.slotMachine.getResultManager();

        // 根据spin次数决定是否中奖
        const shouldWin = this.spinCount % 2 === 1; // 奇数次中奖

        if (shouldWin) {
            // 测试：生成包含H01多条winline的结果
            return this.generateMultipleH01WinLines();
        } else {
            // 生成无中奖结果
            return resultManager.generateNoWinResult();
        }
    }

    /**
     * 生成包含H01(Symbol 6)多条winline的测试结果
     *
     * 布局设计：
     * Row 0: [6, 6, 6, 6, 6]  - 第0行全是H01
     * Row 1: [6, 6, 6, 7, 8]  - 第1行前3个是H01
     * Row 2: [7, 8, 9, 9, 10] - 第2行无H01
     *
     * 预期结果：
     * Symbol 6 (H01) 会形成5连，路径数 = 2×2×2×1×1 = 8条路径
     * - 轴0: 2个H01 (row 0, 1)
     * - 轴1: 2个H01 (row 0, 1)
     * - 轴2: 2个H01 (row 0, 1)
     * - 轴3: 1个H01 (row 0)
     * - 轴4: 1个H01 (row 0)
     */
    private generateMultipleH01WinLines(): SpinResult {
        const finalLayout: SymbolLayout = [
            [6, 4, 2, 6, 6],   // Row 0: 全是H01
            [7, 6, 6, 7, 8],   // Row 1: 前3个H01
            [7, 8, 9, 6, 10]   // Row 2: 无H01
        ];

        // winPositions 会在 SlotMachine.onAllReelsStopped() 中自动从 winLines 提取
        return {
            finalLayout,
            winPositions: [],
            winAmount: 300  // 假设奖金
        };
    }

    /**
     * 处理Spin完成
     */
    private async handleSpinComplete(result: SpinResult): Promise<void> {
        cc.log("[GameScene] Spin complete, result:", result);

        // 检查是否中奖 - 不在这里显示弹窗，改为在动画完成后显示
        if (result.winAmount && result.winAmount > 0) {
            cc.log("[GameScene] Win detected, waiting for animation to complete...");
            // 中奖动画会在 SlotMachine 内部播放
            // 动画完成后会触发 handleWinAnimComplete
        } else {
            // 无中奖，直接恢复Spin按钮
            if (this.spinButton) {
                this.spinButton.setEnabled(true);
            }
            this.isProcessing = false;
        }

        cc.log("[GameScene] Spin sequence complete");
    }

    /**
     * 处理中奖动画完成
     */
    private async handleWinAnimComplete(): Promise<void> {
        cc.log("[GameScene] Win animation complete, showing win popup...");

        if (!this.currentResult || !this.currentResult.winAmount) {
            cc.warn("[GameScene] No current result or win amount");
            this.isProcessing = false;
            return;
        }

        const winAmount = this.currentResult.winAmount;

        // 显示中奖弹窗（不等待关闭）
        await this.showWinPopup(winAmount);

        // 播放现金飞行动画（如果需要）
        // await this.playCashFlyAndUpdateAmount(winAmount);

        // 恢复Spin按钮 - 弹窗不关闭，用户可以继续游戏
        if (this.spinButton) {
            this.spinButton.setEnabled(true);
        }

        this.isProcessing = false;

        cc.log("[GameScene] Win popup shown, spin button enabled");
    }

    /**
     * 显示中奖弹窗（不等待关闭）
     */
    private async showWinPopup(winAmount: number): Promise<void> {
        cc.log("[GameScene] showWinPopup called with amount:", winAmount);
        cc.log("[GameScene] winPopup reference:", this.winPopup ? "exists" : "NULL");

        if (!this.winPopup) {
            cc.error("[GameScene] winPopup is NULL! Cannot show popup.");
            return;
        }

        cc.log("[GameScene] Calling winPopup.show()...");

        // 显示弹窗
        await this.winPopup.show(winAmount);

        cc.log("[GameScene] winPopup.show() completed");
        cc.log("[GameScene] Popup will stay open, user can continue spinning");
    }

    /**
     * 显示中奖弹窗并等待领取（已废弃，保留以备将来使用）
     */
    private async showWinPopupAndWait(winAmount: number): Promise<void> {
        return new Promise(async (resolve) => {
            cc.log("[GameScene] showWinPopupAndWait called with amount:", winAmount);
            cc.log("[GameScene] winPopup reference:", this.winPopup ? "exists" : "NULL");

            if (!this.winPopup) {
                cc.error("[GameScene] winPopup is NULL! Cannot show popup.");
                resolve();
                return;
            }

            cc.log("[GameScene] Calling winPopup.show()...");

            // 显示弹窗
            await this.winPopup.show(winAmount);

            cc.log("[GameScene] winPopup.show() completed, waiting for claim...");

            // 等待用户点击领取按钮
            const originalCallback = this.winPopup.onClaimClicked;
            this.winPopup.onClaimClicked = async () => {
                cc.log("[GameScene] Claim button clicked in callback");

                // 直接跳转到应用商店
                this.jumpToStore();

                // 隐藏弹窗
                await this.winPopup.hide();

                // 恢复原回调
                this.winPopup.onClaimClicked = originalCallback;

                resolve();
            };
        });
    }

    /**
     * 播放现金飞行动画并更新金额
     */
    private async playCashFlyAndUpdateAmount(winAmount: number): Promise<void> {
        if (!this.cashFlyAnim || !this.topBar) {
            return;
        }

        // 获取起始和目标位置
        const startPos = this.getWinPopupCenterPosition();
        const endPos = this.topBar.getCashoutPosition();

        // 获取当前金额
        const currentAmount = this.topBar.getAmount();
        const targetAmount = currentAmount + winAmount;

        // 同时播放：现金飞行 + 数字滚动
        await Promise.all([
            this.cashFlyAnim.playSimpleCashFly(startPos, endPos),
            this.topBar.animateAmountChange(currentAmount, targetAmount, 1.2)
        ]);

        cc.log(`[GameScene] Amount updated: ${currentAmount} -> ${targetAmount}`);
    }

    /**
     * 显示下载弹窗
     */
    private async showDownloadPopup(): Promise<void> {
        if (!this.downloadPopup) {
            return;
        }

        await this.downloadPopup.show("Congratulations! Download now to claim your rewards!");

        // 注意：下载弹窗不会自动关闭，需要用户点击下载按钮
    }

    /**
     * 处理领取按钮点击
     */
    private handleClaimClick(): void {
        cc.log("[GameScene] Claim button clicked, jumping to store...");
        // 直接跳转到应用商店，不再显示下载弹窗
        this.jumpToStore();
    }

    /**
     * 处理下载按钮点击
     */
    private handleDownloadClick(): void {
        cc.log("[GameScene] Download button clicked");

        // 跳转到应用商店
        this.jumpToStore();
    }

    /**
     * 跳转到应用商店
     */
    private jumpToStore(): void {
        cc.log("[GameScene] Jumping to app store...");
        cc.log(`[GameScene] Current ad platform: ${this.currentAdType}`);

        // 根据广告平台调用对应的方法
        if (this.currentAdType === PlayableAdType.UnityAD) {
            cc.log('[GameScene] UnityAD: calling window.openStore');
            (window as any).openStore && (window as any).openStore();
        }
        // mtg打开下方这行
        else if (this.currentAdType === PlayableAdType.Mtg) {
            cc.log('[GameScene] Mtg: calling window.install');
            (window as any).install && (window as any).install();
        }
        else if (this.currentAdType === PlayableAdType.AppLovin) {
            // applovin打开下方这行
            cc.log('[GameScene] AppLovin: calling window.mraid.open');
            (window as any).mraid && (window as any).mraid.open('https://play.google.com/store/apps/details?id=com.newyear.jackpot.spin.qodfd');
        }
        // else {
        //     cc.warn('[GameScene] Unknown ad platform, using fallback method');
        //     // 降级方案：使用Cocos的openURL
        //     if (cc.sys.os === cc.sys.OS_IOS) {
        //         const appStoreUrl = "https://apps.apple.com/app/id123456789";
        //         cc.sys.openURL(appStoreUrl);
        //     } else if (cc.sys.os === cc.sys.OS_ANDROID) {
        //         const playStoreUrl = "https://play.google.com/store/apps/details?id=com.newyear.jackpot.spin.qodfd";
        //         cc.sys.openURL(playStoreUrl);
        //     }
        // }
    }

    /**
     * 处理状态变化
     */
    private handleStateChange(state: SlotState): void {
        cc.log(`[GameScene] Slot state changed: ${state}`);

        // 根据状态更新UI（如果需要的话）
    }

    /**
     * 获取中奖弹窗中心位置（世界坐标）
     */
    private getWinPopupCenterPosition(): cc.Vec2 {
        if (this.winPopup && this.winPopup.node) {
            return this.winPopup.node.convertToWorldSpaceAR(cc.Vec2.ZERO);
        }
        return cc.v2(cc.winSize.width / 2, cc.winSize.height / 2);
    }

    /**
     * 测试功能：手动触发中奖
     */
    public testWin(symbolId: number = 7): void {
        if (this.isProcessing) {
            cc.warn("[GameScene] Already processing");
            return;
        }

        cc.log(`[GameScene] Testing win with symbol ${symbolId}`);

        this.isProcessing = true;

        const resultManager = this.slotMachine.getResultManager();
        const result = resultManager.generateWinResult(symbolId, "horizontal");

        this.slotMachine.spin(result);
    }

    /**
     * 测试功能：手动触发不中奖
     */
    public testNoWin(): void {
        if (this.isProcessing) {
            cc.warn("[GameScene] Already processing");
            return;
        }

        cc.log("[GameScene] Testing no win");

        this.isProcessing = true;

        const resultManager = this.slotMachine.getResultManager();
        const result = resultManager.generateNoWinResult();

        this.slotMachine.spin(result);
    }
}
