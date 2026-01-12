/**
 * 本地化模块使用示例
 */

import { LanguageCode } from './LocalizationTypes';
import { i18n } from './LocalizationManager';
import { currency } from './CurrencyConverter';

/**
 * 示例1：初始化本地化系统
 */
export function example1_Initialize() {
    // 初始化为英语
    i18n.initialize(LanguageCode.EN);

    // 或者初始化为其他语言
    // i18n.initialize(LanguageCode.ID); // 印尼语
    // i18n.initialize(LanguageCode.RU); // 俄语
    // i18n.initialize(LanguageCode.ES); // 西班牙语
}

/**
 * 示例2：获取文本
 */
export function example2_GetText() {
    // 获取普通文本
    const downloadText = i18n.getText('download');
    console.log('Download button text:', downloadText);

    const tipText = i18n.getText('tipLbl');
    console.log('Tip text:', tipText);

    // 获取带格式的文本配置
    const guideConfig = i18n.getTextConfig('guide');
    console.log('Guide text:', guideConfig.string);
    console.log('Guide font size:', guideConfig.fontSize);
}

/**
 * 示例3：切换语言
 */
export function example3_SwitchLanguage() {
    // 切换到印尼语
    i18n.setLanguage(LanguageCode.ID);
    console.log('Download in Indonesian:', i18n.getText('download'));

    // 切换到俄语
    i18n.setLanguage(LanguageCode.RU);
    console.log('Download in Russian:', i18n.getText('download'));

    // 切换回英语
    i18n.setLanguage(LanguageCode.EN);
}

/**
 * 示例4：获取货币信息
 */
export function example4_GetCurrency() {
    // 设置为不同语言查看对应货币
    i18n.setLanguage(LanguageCode.EN);
    console.log('Currency:', i18n.getCurrentCurrency()); // USD
    console.log('Currency Symbol:', i18n.getCurrentCurrencySymbol()); // $

    i18n.setLanguage(LanguageCode.ID);
    console.log('Currency:', i18n.getCurrentCurrency()); // IDR
    console.log('Currency Symbol:', i18n.getCurrentCurrencySymbol()); // Rp
}

/**
 * 示例5：货币转换
 */
export function example5_ConvertCurrency() {
    // 从USD转换为其他货币
    const usdAmount = 100;

    i18n.setLanguage(LanguageCode.ID);
    const idrAmount = currency.convertFromUSD(usdAmount);
    console.log(`$${usdAmount} USD = ${idrAmount} IDR`);

    i18n.setLanguage(LanguageCode.RU);
    const rubAmount = currency.convertFromUSD(usdAmount);
    console.log(`$${usdAmount} USD = ${rubAmount} RUB`);
}

/**
 * 示例6：格式化货币显示
 */
export function example6_FormatCurrency() {
    // 格式化当前语言的货币
    i18n.setLanguage(LanguageCode.EN);
    console.log(currency.formatCurrent(1234.56)); // $1,234.56

    i18n.setLanguage(LanguageCode.ID);
    console.log(currency.formatCurrent(1570000)); // Rp1.570.000

    i18n.setLanguage(LanguageCode.RU);
    console.log(currency.formatCurrent(9200)); // 9 200,00 ₽

    i18n.setLanguage(LanguageCode.ES);
    console.log(currency.formatCurrent(92.50)); // 92,50 €
}

/**
 * 示例7：转换并格式化（最常用）
 */
export function example7_ConvertAndFormat() {
    // 假设游戏内所有金额都是USD，需要根据当前语言转换并显示
    const gameAmount = 50; // 游戏内金额（USD）

    i18n.setLanguage(LanguageCode.EN);
    console.log('English:', currency.convertAndFormat(gameAmount)); // $50.00

    i18n.setLanguage(LanguageCode.ID);
    console.log('Indonesian:', currency.convertAndFormat(gameAmount)); // Rp785.000

    i18n.setLanguage(LanguageCode.RU);
    console.log('Russian:', currency.convertAndFormat(gameAmount)); // 4 600,00 ₽

    i18n.setLanguage(LanguageCode.PT);
    console.log('Portuguese:', currency.convertAndFormat(gameAmount)); // R$248,50
}

/**
 * 示例8：在游戏中的实际应用
 */
export function example8_GameIntegration() {
    // 1. 游戏启动时初始化
    const userLanguage = LanguageCode.EN; // 从配置或用户设置获取
    i18n.initialize(userLanguage);

    // 2. 更新UI文本
    const guideConfig = i18n.getTextConfig('guide');
    // 在Cocos Creator中：
    // this.guideLabel.string = guideConfig.string;
    // this.guideLabel.fontSize = guideConfig.fontSize;

    const downloadBtnText = i18n.getText('download');
    // this.downloadBtn.getComponentInChildren(cc.Label).string = downloadBtnText;

    // 3. 显示货币金额
    const winAmount = 1000; // USD
    const formattedAmount = currency.convertAndFormat(winAmount);
    console.log('Win Amount:', formattedAmount);
    // this.winLabel.string = formattedAmount;
}

/**
 * 示例9：更新汇率（可选）
 */
export function example9_UpdateExchangeRates() {
    // 如果需要动态更新汇率
    currency.updateExchangeRates({
        IDR: 15800,
        RUB: 95,
        EUR: 0.93,
        BRL: 5.0
    });
}

/**
 * 示例10：自定义货币格式
 */
export function example10_CustomFormat() {
    i18n.setLanguage(LanguageCode.EN);

    // 不显示小数
    console.log(currency.formatCurrent(1234.56, { decimals: 0 })); // $1,235

    // 使用不同的分隔符
    console.log(currency.formatCurrent(1234.56, {
        thousandsSeparator: ' ',
        decimalSeparator: '.'
    })); // $1 234.56
}
