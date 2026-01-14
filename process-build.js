#!/usr/bin/env node

/**
 * 处理已构建的文件
 *
 * 功能：
 * 1. 自动检测当前的广告平台类型（从 GameScene.ts）
 * 2. 自动检测当前的语言代码（从 GameScene.ts）
 * 3. 将构建好的文件重命名并移动到输出目录
 *
 * 使用方法：
 * 1. 在编辑器中修改 GameScene.ts 的平台和语言设置
 * 2. 使用编辑器的 playable-adapter 插件构建
 * 3. 运行此脚本：node process-build.js
 */

const fs = require('fs');
const path = require('path');

// ==================== 配置 ====================

const PROJECT_ROOT = __dirname;
const GAME_SCENE_FILE = path.join(PROJECT_ROOT, 'assets/Script/GameScene.ts');
const BUILD_CONFIG_FILE = path.join(PROJECT_ROOT, 'build-config.json');
const BUILD_DIR = path.join(PROJECT_ROOT, 'build');
const OUTPUT_DIR = path.join(PROJECT_ROOT, 'build/output');

// ==================== 工具函数 ====================

/**
 * 日志输出
 */
function log(message, color = '\x1b[32m') {
    const timestamp = new Date().toLocaleString('zh-CN', { hour12: false });
    console.log(`${color}[${timestamp}]\x1b[0m ${message}`);
}

function logInfo(message) {
    log(message, '\x1b[34m');
}

function logError(message) {
    log(message, '\x1b[31m');
}

function logSuccess(message) {
    log(message, '\x1b[32m');
}

/**
 * 从 GameScene.ts 检测当前的广告平台
 */
function detectAdPlatform() {
    logInfo('检测当前广告平台...');

    const content = fs.readFileSync(GAME_SCENE_FILE, 'utf8');

    // 匹配 this.setAdType(PlayableAdType.XXX);
    const platformMatch = content.match(/this\.setAdType\(PlayableAdType\.(\w+)\)/);

    if (!platformMatch) {
        logError('无法检测广告平台，请检查 GameScene.ts 中的 setAdType 调用');
        return null;
    }

    const platform = platformMatch[1];
    logSuccess(`检测到广告平台: ${platform}`);

    return platform;
}

/**
 * 从 GameScene.ts 检测当前的语言代码
 */
function detectLanguageCode() {
    logInfo('检测当前语言代码...');

    const content = fs.readFileSync(GAME_SCENE_FILE, 'utf8');

    // 匹配未被注释的 i18n.initialize(LanguageCode.XXX);
    const languageMatch = content.match(/^\s*i18n\.initialize\(LanguageCode\.(\w+)\);/m);

    if (!languageMatch) {
        logError('无法检测语言代码，请检查 GameScene.ts 中的 i18n.initialize 调用');
        logError('确保有一行未被注释的 i18n.initialize(LanguageCode.XX);');
        return null;
    }

    const language = languageMatch[1];
    logSuccess(`检测到语言代码: ${language}`);

    return language;
}

/**
 * 获取平台对应的源文件名
 */
function getPlatformSourceFile(platform) {
    // 根据平台类型返回对应的源文件名
    const platformFileMap = {
        'AppLovin': 'AppLovin.html',
        'Mtg': 'Mintegral.html',
        'UnityAD': 'Unity.html'
    };

    return platformFileMap[platform] || `${platform}.html`;
}

/**
 * 获取输出文件名
 */
function getOutputFileName(platform, language) {
    // 读取配置文件
    const config = JSON.parse(fs.readFileSync(BUILD_CONFIG_FILE, 'utf8'));

    // 获取产品名称前缀
    const productPrefix = config.productPrefix || 'WinterChristmasSlots';

    return `${productPrefix}_${platform}_${language}.html`;
}

/**
 * 确保目录存在
 */
function ensureDir(dirPath) {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
}

/**
 * 处理构建文件
 */
function processBuildFile(platform, language) {
    log('==========================================');
    log('开始处理构建文件');
    log('==========================================');

    // 1. 获取源文件路径
    const sourceFileName = getPlatformSourceFile(platform);
    const sourceFilePath = path.join(BUILD_DIR, sourceFileName);

    if (!fs.existsSync(sourceFilePath)) {
        logError(`源文件不存在: ${sourceFilePath}`);
        logError('请先使用编辑器的 playable-adapter 插件构建项目');
        return false;
    }

    logInfo(`找到源文件: ${sourceFileName}`);

    // 2. 创建输出目录
    const outputPlatformDir = path.join(OUTPUT_DIR, platform);
    ensureDir(outputPlatformDir);

    // 3. 生成输出文件名
    const outputFileName = getOutputFileName(platform, language);
    const outputFilePath = path.join(outputPlatformDir, outputFileName);

    // 4. 复制文件
    logInfo(`复制文件到: ${outputFilePath}`);
    fs.copyFileSync(sourceFilePath, outputFilePath);

    // 5. 获取文件大小
    const stats = fs.statSync(outputFilePath);
    const fileSizeKB = (stats.size / 1024).toFixed(2);
    const fileSizeMB = (stats.size / 1024 / 1024).toFixed(2);

    log('==========================================');
    logSuccess(`✅ 处理完成！`);
    log('==========================================');
    logInfo(`平台: ${platform}`);
    logInfo(`语言: ${language}`);
    logInfo(`源文件: ${sourceFileName}`);
    logInfo(`输出文件: ${outputFileName}`);
    logInfo(`文件大小: ${fileSizeKB} KB (${fileSizeMB} MB)`);
    logInfo(`输出路径: ${outputFilePath}`);
    log('==========================================');

    return true;
}

/**
 * 主函数
 */
function main() {
    log('==========================================');
    log('构建文件处理工具');
    log('==========================================');

    try {
        // 1. 检测广告平台
        const platform = detectAdPlatform();
        if (!platform) {
            process.exit(1);
        }

        // 2. 检测语言代码
        const language = detectLanguageCode();
        if (!language) {
            process.exit(1);
        }

        // 3. 处理构建文件
        const success = processBuildFile(platform, language);

        if (!success) {
            process.exit(1);
        }

        log('');
        logSuccess('所有操作完成！');

    } catch (error) {
        logError(`发生错误: ${error.message}`);
        console.error(error);
        process.exit(1);
    }
}

// 运行主函数
main();
