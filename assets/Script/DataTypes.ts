/**
 * 数据类型定义
 * 定义Slot游戏中使用的所有数据结构
 */

const { ccclass } = cc._decorator;

/**
 * Symbol类型枚举（推荐使用，提高代码可读性）
 *
 * 使用示例：
 * const layout = [
 *   [SymbolType.L01, SymbolType.H01, SymbolType.WILD],
 *   [SymbolType.L02, SymbolType.H02, SymbolType.SCATTER],
 *   ...
 * ];
 */
export enum SymbolType {
    // Low value symbols (0-5)
    L01 = 0,  // 字母9
    L02 = 1,  // 字母10
    L03 = 2,  // 字母J
    L04 = 3,  // 字母Q
    L05 = 4,  // 字母K
    L06 = 5,  // 字母A

    // High value symbols (6-10)
    H01 = 6,  // 圣诞帽
    H02 = 7,  // 礼物盒
    H03 = 8,  // 铃铛
    H04 = 9,  // 拐杖糖
    H05 = 10, // 圣诞树

    // Special symbols (11-12)
    WILD = 11,     // W01 - Wild符号
    SCATTER = 12   // S01 - Scatter符号
}

/**
 * Symbol布局 - 二维数组表示，layout[row][col] = symbolId
 */
export type SymbolLayout = number[][];

/**
 * 中奖位置
 */
export interface WinPosition {
    row: number;        // 行索引（0-2）
    col: number;        // 列索引（0-4）
    symbolId: number;   // symbol ID
}

/**
 * 中奖线（243 Ways机制）
 *
 * 规则说明：
 * - 从第1轴开始，后续轴连续匹配相同Symbol或Wild
 * - 至少前3个轴匹配才算中奖
 * - Wild(W01)可以替代任何Symbol，但第1轴结果不会出现Wild
 * - 路径数 = 轴1匹配数 × 轴2匹配数 × 轴3匹配数 × ...
 *
 * 示例：
 * 轴1有2个A，轴2有2个A，轴3有1个A
 * → pathCount = 2×2×1 = 4条中奖线
 */
export interface WinLine {
    /** 中奖的Symbol ID */
    symbol: number;

    /** 连续轴数 (3/4/5) */
    consecutiveReels: number;

    /** 路径数量（用于计算奖金倍数） */
    pathCount: number;

    /** 所有参与中奖的位置 [row, reel][] */
    participatingPositions: [number, number][];
}

/**
 * Spin结果数据
 */
export interface SpinResult {
    finalLayout: SymbolLayout;      // 最终停止的布局
    winPositions: WinPosition[];    // 中奖位置列表
    winLines?: WinLine[];           // 中奖线信息（可选）
    winAmount?: number;             // 中奖金额（可选）
}

/**
 * Symbol动画配置
 */
export interface SymbolAnimConfig {
    symbolId: number;               // symbol ID

    // 帧动画配置
    frameAnimation: {
        spriteFrames: cc.SpriteFrame[];  // 帧序列
        frameRate: number;                // 帧率（帧/秒）
        loopCount: number;                // 单次触发播放次数
    };

    // 可选：额外缩放效果
    extraScale?: {
        enabled: boolean;
        scaleTo: number;              // 目标缩放值
    };
}

/**
 * Slot状态枚举
 */
export enum SlotState {
    IDLE = "IDLE",                  // 空闲，等待spin
    SPINNING = "SPINNING",          // 滚动中
    STOPPING = "STOPPING",          // 正在逐列停止
    STOPPED = "STOPPED",            // 全部停止
    WIN_ANIMATION = "WIN_ANIMATION", // 播放中奖动画
    POPUP = "POPUP",                // 显示弹窗
    DISABLED = "DISABLED"           // 禁用状态
}

/**
 * Symbol状态枚举
 */
export enum SymbolState {
    NORMAL = "NORMAL",              // 正常显示
    SPINNING = "SPINNING",          // 滚动中
    WINNING = "WINNING"             // 播放中奖动画
}

/**
 * 中奖动画播放模式
 */
export enum WinPlayMode {
    SIMULTANEOUS = "SIMULTANEOUS",  // 所有中奖symbol同时播放
    BY_LINE = "BY_LINE",            // 按中奖线逐条播放
    SEQUENTIAL = "SEQUENTIAL"       // 逐个symbol顺序播放
}
