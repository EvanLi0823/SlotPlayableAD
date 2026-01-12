/**
 * CurveLoader - 曲线加载器
 *
 * 从JSON配置文件加载动画曲线，支持热更新
 *
 * 功能：
 * - 从JSON加载曲线配置
 * - 从资源文件加载
 * - 批量加载预设库
 * - 配置验证和错误处理
 *
 * @author Claude Code
 * @date 2025-12-30
 * @version 1.0
 */

import AnimationCurveTS, { Keyframe, CurveInterpolationMode } from "./AnimationCurveTS";

/**
 * JSON曲线配置格式
 */
export interface CurveConfigJSON {
    /** 曲线名称 */
    name: string;

    /** 曲线描述（可选） */
    description?: string;

    /** 插值模式（可选，默认hermite） */
    interpolationMode?: string;

    /** 关键帧数组 */
    keyframes: KeyframeJSON[];

    /** 元数据（可选） */
    metadata?: {
        author?: string;
        version?: string;
        tags?: string[];
        [key: string]: any;
    };
}

/**
 * JSON关键帧格式
 */
export interface KeyframeJSON {
    time: number;
    value: number;
    inTangent?: number;
    outTangent?: number;
}

/**
 * 曲线预设库JSON格式
 */
export interface CurvePresetLibraryJSON {
    /** 库名称 */
    name: string;

    /** 库版本 */
    version: string;

    /** 曲线列表 */
    curves: CurveConfigJSON[];
}

/**
 * 加载结果
 */
export interface LoadResult {
    /** 是否成功 */
    success: boolean;

    /** 加载的曲线（成功时） */
    curve?: AnimationCurveTS;

    /** 错误信息（失败时） */
    error?: string;
}

/**
 * 曲线加载器类
 */
export default class CurveLoader {

    /** 曲线缓存（name → curve） */
    private static curveCache: Map<string, AnimationCurveTS> = new Map();

    /** 预设库缓存 */
    private static presetLibraries: Map<string, CurvePresetLibraryJSON> = new Map();

    // ========== 从JSON加载 ==========

    /**
     * 从JSON对象加载单条曲线
     *
     * @param json JSON配置
     * @returns 加载结果
     */
    static loadFromJSON(json: CurveConfigJSON): LoadResult {
        try {
            // 验证JSON格式
            const validation = this.validateJSON(json);
            if (!validation.valid) {
                return {
                    success: false,
                    error: `Invalid JSON: ${validation.errors.join(', ')}`
                };
            }

            // 创建曲线
            const curve = new AnimationCurveTS();

            // 设置插值模式
            if (json.interpolationMode) {
                const mode = this.parseInterpolationMode(json.interpolationMode);
                curve.setInterpolationMode(mode);
            }

            // 添加关键帧
            for (const kf of json.keyframes) {
                curve.addKey(
                    kf.time,
                    kf.value,
                    kf.inTangent || 0,
                    kf.outTangent || 0
                );
            }

            // 缓存
            if (json.name) {
                this.curveCache.set(json.name, curve);
            }

            cc.log(`[CurveLoader] Loaded curve: ${json.name}`);

            return {
                success: true,
                curve: curve
            };

        } catch (error) {
            return {
                success: false,
                error: `Failed to load curve: ${error.message}`
            };
        }
    }

    /**
     * 从JSON字符串加载曲线
     *
     * @param jsonString JSON字符串
     * @returns 加载结果
     */
    static loadFromJSONString(jsonString: string): LoadResult {
        try {
            const json = JSON.parse(jsonString);
            return this.loadFromJSON(json);
        } catch (error) {
            return {
                success: false,
                error: `JSON parse error: ${error.message}`
            };
        }
    }

    // ========== 从资源文件加载 ==========

    /**
     * 从资源文件加载曲线（异步）
     *
     * @param path 资源路径（不含扩展名）
     * @returns Promise<加载结果>
     */
    static async loadFromResource(path: string): Promise<LoadResult> {
        return new Promise((resolve) => {
            cc.resources.load(path, cc.JsonAsset, (error, asset: cc.JsonAsset) => {
                if (error) {
                    resolve({
                        success: false,
                        error: `Failed to load resource: ${error.message}`
                    });
                    return;
                }

                const json = asset.json as CurveConfigJSON;
                const result = this.loadFromJSON(json);
                resolve(result);
            });
        });
    }

    /**
     * 从资源文件加载曲线（同步，需要预加载）
     *
     * @param path 资源路径
     * @returns 加载结果
     */
    static loadFromResourceSync(path: string): LoadResult {
        const asset = cc.resources.get(path, cc.JsonAsset);

        if (!asset) {
            return {
                success: false,
                error: `Resource not found or not preloaded: ${path}`
            };
        }

        const json = asset.json as CurveConfigJSON;
        return this.loadFromJSON(json);
    }

    // ========== 预设库加载 ==========

    /**
     * 加载曲线预设库（多条曲线）
     *
     * @param json 预设库JSON
     * @returns 成功加载的曲线Map（name → curve）
     */
    static loadPresetLibrary(json: CurvePresetLibraryJSON): Map<string, AnimationCurveTS> {
        const curves = new Map<string, AnimationCurveTS>();

        cc.log(`[CurveLoader] Loading preset library: ${json.name} v${json.version}`);

        for (const curveConfig of json.curves) {
            const result = this.loadFromJSON(curveConfig);

            if (result.success && result.curve) {
                curves.set(curveConfig.name, result.curve);
                cc.log(`  ✓ Loaded: ${curveConfig.name}`);
            } else {
                cc.warn(`  ✗ Failed: ${curveConfig.name} - ${result.error}`);
            }
        }

        // 缓存预设库
        this.presetLibraries.set(json.name, json);

        cc.log(`[CurveLoader] Loaded ${curves.size}/${json.curves.length} curves`);

        return curves;
    }

    /**
     * 从资源文件加载预设库（异步）
     *
     * @param path 资源路径
     * @returns Promise<曲线Map>
     */
    static async loadPresetLibraryFromResource(path: string): Promise<Map<string, AnimationCurveTS>> {
        return new Promise((resolve, reject) => {
            cc.resources.load(path, cc.JsonAsset, (error, asset: cc.JsonAsset) => {
                if (error) {
                    cc.error(`[CurveLoader] Failed to load library: ${error.message}`);
                    reject(error);
                    return;
                }

                const json = asset.json as CurvePresetLibraryJSON;
                const curves = this.loadPresetLibrary(json);
                resolve(curves);
            });
        });
    }

    // ========== 缓存管理 ==========

    /**
     * 获取缓存的曲线
     *
     * @param name 曲线名称
     * @returns 曲线（如果存在）
     */
    static getCachedCurve(name: string): AnimationCurveTS | null {
        return this.curveCache.get(name) || null;
    }

    /**
     * 缓存曲线
     *
     * @param name 曲线名称
     * @param curve 曲线对象
     */
    static cacheCurve(name: string, curve: AnimationCurveTS): void {
        this.curveCache.set(name, curve);
    }

    /**
     * 清空缓存
     */
    static clearCache(): void {
        this.curveCache.clear();
        cc.log("[CurveLoader] Cache cleared");
    }

    /**
     * 获取缓存统计
     */
    static getCacheStats(): { count: number; names: string[] } {
        return {
            count: this.curveCache.size,
            names: Array.from(this.curveCache.keys())
        };
    }

    // ========== 导出为JSON ==========

    /**
     * 将曲线导出为JSON配置
     *
     * @param curve 曲线对象
     * @param name 曲线名称
     * @param description 描述（可选）
     * @returns JSON配置
     */
    static exportToJSON(curve: AnimationCurveTS, name: string, description?: string): CurveConfigJSON {
        const keys = curve.getKeys();

        const keyframesJSON: KeyframeJSON[] = keys.map(k => ({
            time: k.time,
            value: k.value,
            inTangent: k.inTangent,
            outTangent: k.outTangent
        }));

        return {
            name: name,
            description: description,
            interpolationMode: curve.getInterpolationMode(),
            keyframes: keyframesJSON,
            metadata: {
                author: "CurveLoader",
                version: "1.0",
                exportDate: new Date().toISOString()
            }
        };
    }

    /**
     * 将曲线导出为JSON字符串（格式化）
     *
     * @param curve 曲线对象
     * @param name 曲线名称
     * @param description 描述（可选）
     * @returns JSON字符串
     */
    static exportToJSONString(curve: AnimationCurveTS, name: string, description?: string): string {
        const json = this.exportToJSON(curve, name, description);
        return JSON.stringify(json, null, 2);
    }

    /**
     * 导出预设库
     *
     * @param curves 曲线Map（name → curve）
     * @param libraryName 库名称
     * @param version 版本号
     * @returns 预设库JSON
     */
    static exportPresetLibrary(
        curves: Map<string, AnimationCurveTS>,
        libraryName: string,
        version: string = "1.0"
    ): CurvePresetLibraryJSON {

        const curveConfigs: CurveConfigJSON[] = [];

        for (const [name, curve] of curves) {
            curveConfigs.push(this.exportToJSON(curve, name));
        }

        return {
            name: libraryName,
            version: version,
            curves: curveConfigs
        };
    }

    // ========== 验证和工具方法 ==========

    /**
     * 验证JSON配置格式
     *
     * @param json JSON配置
     * @returns 验证结果
     */
    private static validateJSON(json: CurveConfigJSON): { valid: boolean; errors: string[] } {
        const errors: string[] = [];

        // 检查必填字段
        if (!json.name) {
            errors.push("Missing required field: name");
        }

        if (!json.keyframes || !Array.isArray(json.keyframes)) {
            errors.push("Missing or invalid field: keyframes");
        } else if (json.keyframes.length < 2) {
            errors.push("At least 2 keyframes required");
        }

        // 检查关键帧格式
        if (json.keyframes) {
            json.keyframes.forEach((kf, index) => {
                if (typeof kf.time !== 'number') {
                    errors.push(`Keyframe ${index}: invalid time`);
                }
                if (typeof kf.value !== 'number') {
                    errors.push(`Keyframe ${index}: invalid value`);
                }
            });
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }

    /**
     * 解析插值模式字符串
     *
     * @param mode 模式字符串
     * @returns 插值模式枚举
     */
    private static parseInterpolationMode(mode: string): CurveInterpolationMode {
        switch (mode.toLowerCase()) {
            case 'hermite':
                return CurveInterpolationMode.HERMITE;
            case 'linear':
                return CurveInterpolationMode.LINEAR;
            case 'constant':
                return CurveInterpolationMode.CONSTANT;
            default:
                cc.warn(`[CurveLoader] Unknown interpolation mode: ${mode}, using HERMITE`);
                return CurveInterpolationMode.HERMITE;
        }
    }

    /**
     * 创建默认曲线配置（示例）
     *
     * @returns 默认配置JSON
     */
    static createDefaultConfig(): CurveConfigJSON {
        return {
            name: "default_curve",
            description: "Default linear curve",
            interpolationMode: "linear",
            keyframes: [
                { time: 0.0, value: 0.0, inTangent: 1.0, outTangent: 1.0 },
                { time: 1.0, value: 1.0, inTangent: 1.0, outTangent: 1.0 }
            ],
            metadata: {
                author: "System",
                version: "1.0"
            }
        };
    }

    /**
     * 打印缓存信息（调试用）
     */
    static logCacheInfo(): void {
        cc.log("[CurveLoader] Cache Info:");
        cc.log(`  Cached curves: ${this.curveCache.size}`);

        for (const [name, curve] of this.curveCache) {
            const keyCount = curve.getKeyCount();
            const timeRange = curve.getTimeRange();
            cc.log(`    - ${name}: ${keyCount} keys, ${timeRange.min}s ~ ${timeRange.max}s`);
        }

        cc.log(`  Preset libraries: ${this.presetLibraries.size}`);
        for (const [name, lib] of this.presetLibraries) {
            cc.log(`    - ${name} v${lib.version}: ${lib.curves.length} curves`);
        }
    }
}
