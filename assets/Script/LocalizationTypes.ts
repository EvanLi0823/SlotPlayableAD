/**
 * 本地化模块类型定义
 */

/**
 * 支持的语言代码
 */
export enum LanguageCode {
    EN = 'en',
    ID = 'id',
    RU = 'ru',
    ES = 'es',
    DE = 'de',
    FR = 'fr',
    PT = 'pt'
}

/**
 * 支持的货币代码
 */
export enum CurrencyCode {
    USD = 'USD',
    IDR = 'IDR',
    RUB = 'RUB',
    EUR = 'EUR',
    BRL = 'BRL'
}

/**
 * 文本配置
 */
export interface ITextConfig {
    string: string;
    fontSize?: number;
}

/**
 * 语言文本内容
 */
export interface ILanguageTexts {
    guide: ITextConfig;
    download: string;
    tipLbl: string;
    cashout: string;
}

/**
 * 语言配置
 */
export interface ILanguageData {
    code: LanguageCode;
    name: string;
    nativeName: string;
    currency: CurrencyCode;
    currencySymbol: string;
    texts: ILanguageTexts;
}

/**
 * 货币格式化选项
 */
export interface ICurrencyFormatOptions {
    decimals?: number;
    symbolPosition?: 'prefix' | 'suffix';
    thousandsSeparator?: string;
    decimalSeparator?: string;
}

/**
 * 汇率配置（相对于USD）
 */
export interface ICurrencyRate {
    [key: string]: number;
}
