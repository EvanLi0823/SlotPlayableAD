/**
 * 本地化管理器
 * 负责管理多语言切换和文本获取
 */

import { LanguageCode, ILanguageData, ITextConfig } from './LocalizationTypes';
import { LANGUAGE_CONFIGS } from './LanguageConfigs';

export class LocalizationManager {
    private static instance: LocalizationManager;
    private currentLanguage: LanguageCode = LanguageCode.EN;
    private currentLanguageData: ILanguageData;

    private constructor() {
        this.currentLanguageData = LANGUAGE_CONFIGS[this.currentLanguage];
    }

    /**
     * 获取单例实例
     */
    public static getInstance(): LocalizationManager {
        if (!LocalizationManager.instance) {
            LocalizationManager.instance = new LocalizationManager();
        }
        return LocalizationManager.instance;
    }

    /**
     * 初始化本地化管理器
     * @param language 指定的语言代码，默认为英语
     */
    public initialize(language: LanguageCode = LanguageCode.EN): void {
        this.setLanguage(language);
        console.log(`[LocalizationManager] Initialized with language: ${this.currentLanguage}`);
    }

    /**
     * 设置当前语言
     */
    public setLanguage(langCode: LanguageCode): void {
        if (LANGUAGE_CONFIGS[langCode]) {
            this.currentLanguage = langCode;
            this.currentLanguageData = LANGUAGE_CONFIGS[langCode];
            console.log(`[LocalizationManager] Language changed to: ${langCode}`);
        } else {
            console.warn(`[LocalizationManager] Language not supported: ${langCode}`);
        }
    }

    /**
     * 获取当前语言代码
     */
    public getCurrentLanguage(): LanguageCode {
        return this.currentLanguage;
    }

    /**
     * 获取当前语言数据
     */
    public getCurrentLanguageData(): ILanguageData {
        return this.currentLanguageData;
    }

    /**
     * 获取指定的文本配置
     */
    public getTextConfig(key: 'guide'): ITextConfig {
        return this.currentLanguageData.texts[key];
    }

    /**
     * 获取指定的文本
     */
    public getText(key: 'download' | 'tipLbl'): string {
        return this.currentLanguageData.texts[key];
    }

    /**
     * 获取当前语言的货币代码
     */
    public getCurrentCurrency(): string {
        return this.currentLanguageData.currency;
    }

    /**
     * 获取当前语言的货币符号
     */
    public getCurrentCurrencySymbol(): string {
        return this.currentLanguageData.currencySymbol;
    }

    /**
     * 获取所有支持的语言列表
     */
    public getSupportedLanguages(): ILanguageData[] {
        return Object.values(LANGUAGE_CONFIGS);
    }

    /**
     * 检查是否支持某个语言
     */
    public isLanguageSupported(langCode: string): boolean {
        return LANGUAGE_CONFIGS.hasOwnProperty(langCode);
    }
}

// 导出单例实例的快捷访问
export const i18n = LocalizationManager.getInstance();
