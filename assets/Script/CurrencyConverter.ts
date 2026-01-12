/**
 * 货币转换器
 * 负责货币金额的转换和格式化，包含货币符号
 */

import { CurrencyCode, ICurrencyFormatOptions, ICurrencyRate } from './LocalizationTypes';
import { LocalizationManager } from './LocalizationManager';

export class CurrencyConverter {
    private static instance: CurrencyConverter;

    // 汇率配置（相对于USD）
    private exchangeRates: ICurrencyRate = {
        USD: 1,
        IDR: 15700,      // 印尼盾
        RUB: 92,         // 俄罗斯卢布
        EUR: 0.92,       // 欧元
        BRL: 4.97        // 巴西雷亚尔
    };

    // 各货币的默认格式化配置
    private currencyFormats: { [key: string]: ICurrencyFormatOptions } = {
        USD: {
            decimals: 2,
            symbolPosition: 'prefix',
            thousandsSeparator: ',',
            decimalSeparator: '.'
        },
        IDR: {
            decimals: 0,
            symbolPosition: 'prefix',
            thousandsSeparator: '.',
            decimalSeparator: ','
        },
        RUB: {
            decimals: 2,
            symbolPosition: 'suffix',
            thousandsSeparator: ' ',
            decimalSeparator: ','
        },
        EUR: {
            decimals: 2,
            symbolPosition: 'suffix',
            thousandsSeparator: '.',
            decimalSeparator: ','
        },
        BRL: {
            decimals: 2,
            symbolPosition: 'prefix',
            thousandsSeparator: '.',
            decimalSeparator: ','
        }
    };

    private constructor() {}

    /**
     * 获取单例实例
     */
    public static getInstance(): CurrencyConverter {
        if (!CurrencyConverter.instance) {
            CurrencyConverter.instance = new CurrencyConverter();
        }
        return CurrencyConverter.instance;
    }

    /**
     * 更新汇率
     */
    public updateExchangeRates(rates: ICurrencyRate): void {
        this.exchangeRates = { ...this.exchangeRates, ...rates };
    }

    /**
     * 获取汇率
     */
    public getExchangeRate(currency: CurrencyCode): number {
        return this.exchangeRates[currency] || 1;
    }

    /**
     * 转换货币金额
     * @param amount 金额
     * @param fromCurrency 源货币
     * @param toCurrency 目标货币
     */
    public convert(amount: number, fromCurrency: CurrencyCode, toCurrency: CurrencyCode): number {
        const fromRate = this.exchangeRates[fromCurrency] || 1;
        const toRate = this.exchangeRates[toCurrency] || 1;

        // 先转换为USD，再转换为目标货币
        const usdAmount = amount / fromRate;
        return usdAmount * toRate;
    }

    /**
     * 将USD金额转换为当前语言对应的货币
     */
    public convertFromUSD(usdAmount: number): number {
        const i18n = LocalizationManager.getInstance();
        const currentCurrency = i18n.getCurrentCurrency() as CurrencyCode;
        return this.convert(usdAmount, CurrencyCode.USD, currentCurrency);
    }

    /**
     * 格式化货币金额（带货币符号）
     * @param amount 金额
     * @param currency 货币代码
     * @param options 格式化选项
     */
    public format(amount: number, currency: CurrencyCode, options?: ICurrencyFormatOptions): string {
        const i18n = LocalizationManager.getInstance();
        const currencySymbol = i18n.getCurrentCurrencySymbol();

        // 合并默认配置和自定义配置
        const defaultFormat = this.currencyFormats[currency] || this.currencyFormats.USD;
        const finalOptions: ICurrencyFormatOptions = {
            ...defaultFormat,
            ...options
        };

        // 处理小数位数
        const decimals = finalOptions.decimals !== undefined ? finalOptions.decimals : 2;
        const roundedAmount = Math.round(amount * Math.pow(10, decimals)) / Math.pow(10, decimals);

        // 分离整数和小数部分
        const parts = roundedAmount.toFixed(decimals).split('.');
        const integerPart = parts[0];
        const decimalPart = parts[1];

        // 添加千位分隔符
        const thousandsSeparator = finalOptions.thousandsSeparator || ',';
        const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, thousandsSeparator);

        // 组合整数和小数部分
        const decimalSeparator = finalOptions.decimalSeparator || '.';
        let formattedAmount = formattedInteger;
        if (decimals > 0 && decimalPart) {
            formattedAmount += decimalSeparator + decimalPart;
        }

        // 添加货币符号
        const symbolPosition = finalOptions.symbolPosition || 'prefix';
        if (symbolPosition === 'prefix') {
            return `${currencySymbol}${formattedAmount}`;
        } else {
            return `${formattedAmount} ${currencySymbol}`;
        }
    }

    /**
     * 格式化当前语言的货币
     */
    public formatCurrent(amount: number, options?: ICurrencyFormatOptions): string {
        const i18n = LocalizationManager.getInstance();
        const currentCurrency = i18n.getCurrentCurrency() as CurrencyCode;
        return this.format(amount, currentCurrency, options);
    }

    /**
     * 转换并格式化货币（从USD转换为当前货币并格式化）
     */
    public convertAndFormat(usdAmount: number, options?: ICurrencyFormatOptions): string {
        const convertedAmount = this.convertFromUSD(usdAmount);
        return this.formatCurrent(convertedAmount, options);
    }
}

// 导出单例实例的快捷访问
export const currency = CurrencyConverter.getInstance();
