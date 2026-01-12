/**
 * 语言配置文件
 * 包含所有支持的语言及其文本翻译和货币信息
 */

import { LanguageCode, CurrencyCode, ILanguageData } from './LocalizationTypes';

export const LANGUAGE_CONFIGS: { [key: string]: ILanguageData } = {
    // 英语
    [LanguageCode.EN]: {
        code: LanguageCode.EN,
        name: 'English',
        nativeName: 'English',
        currency: CurrencyCode.USD,
        currencySymbol: '$',
        texts: {
            guide: {
                string: `<color=#FFFFFF>Tap to Start</color>`,
                fontSize: 40,
            },
            download: 'Download',
            tipLbl: 'The final result is not guaranteed, the amount you can obtain is subject to the rules published in the APP or web page.',
        }
    },

    // 印尼语
    [LanguageCode.ID]: {
        code: LanguageCode.ID,
        name: 'Indonesian',
        nativeName: 'Bahasa Indonesia',
        currency: CurrencyCode.IDR,
        currencySymbol: 'Rp',
        texts: {
            guide: {
                string: `<color=#FFFFFF>Ketuk untuk Mulai</color>`,
                fontSize: 40,
            },
            download: 'Unduh',
            tipLbl: 'Hasil akhir tidak dijamin, jumlah yang dapat Anda peroleh tunduk pada aturan yang dipublikasikan di APP atau halaman web.',
        }
    },

    // 俄语
    [LanguageCode.RU]: {
        code: LanguageCode.RU,
        name: 'Russian',
        nativeName: 'Русский',
        currency: CurrencyCode.RUB,
        currencySymbol: '₽',
        texts: {
            guide: {
                string: `<color=#FFFFFF>Нажмите для начала</color>`,
                fontSize: 40,
            },
            download: 'Скачать',
            tipLbl: 'Окончательный результат не гарантируется, сумма, которую вы можете получить, зависит от правил, опубликованных в приложении или на веб-странице.',
        }
    },

    // 西班牙语
    [LanguageCode.ES]: {
        code: LanguageCode.ES,
        name: 'Spanish',
        nativeName: 'Español',
        currency: CurrencyCode.EUR,
        currencySymbol: '€',
        texts: {
            guide: {
                string: `<color=#FFFFFF>Toca para Comenzar</color>`,
                fontSize: 40,
            },
            download: 'Descargar',
            tipLbl: 'El resultado final no está garantizado, la cantidad que puedes obtener está sujeta a las reglas publicadas en la APP o página web.',
        }
    },

    // 德语
    [LanguageCode.DE]: {
        code: LanguageCode.DE,
        name: 'German',
        nativeName: 'Deutsch',
        currency: CurrencyCode.EUR,
        currencySymbol: '€',
        texts: {
            guide: {
                string: `<color=#FFFFFF>Tippen zum Starten</color>`,
                fontSize: 40,
            },
            download: 'Herunterladen',
            tipLbl: 'Das Endergebnis ist nicht garantiert, der Betrag, den Sie erhalten können, unterliegt den in der APP oder Webseite veröffentlichten Regeln.',
        }
    },

    // 法语
    [LanguageCode.FR]: {
        code: LanguageCode.FR,
        name: 'French',
        nativeName: 'Français',
        currency: CurrencyCode.EUR,
        currencySymbol: '€',
        texts: {
            guide: {
                string: `<color=#FFFFFF>Touchez pour Commencer</color>`,
                fontSize: 40,
            },
            download: 'Télécharger',
            tipLbl: 'Le résultat final n\'est pas garanti, le montant que vous pouvez obtenir est soumis aux règles publiées dans l\'APP ou la page web.',
        }
    },

    // 葡萄牙语
    [LanguageCode.PT]: {
        code: LanguageCode.PT,
        name: 'Portuguese',
        nativeName: 'Português',
        currency: CurrencyCode.BRL,
        currencySymbol: 'R$',
        texts: {
            guide: {
                string: `<color=#FFFFFF>Toque para Começar</color>`,
                fontSize: 40,
            },
            download: 'Baixar',
            tipLbl: 'O resultado final não é garantido, o valor que você pode obter está sujeito às regras publicadas no APP ou página da web.',
        }
    }
};
