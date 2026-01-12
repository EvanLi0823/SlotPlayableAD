/**
 * LogManager - 日志收集和管理系统
 * 功能：
 * 1. 拦截并记录所有console日志（log, warn, error）
 * 2. 记录时间戳和日志级别
 * 3. 提供日志下载功能
 * 4. 限制日志缓存大小，防止内存溢出
 */

export enum LogLevel {
    LOG = "LOG",
    WARN = "WARN",
    ERROR = "ERROR",
    INFO = "INFO"
}

export interface LogEntry {
    timestamp: string;
    level: LogLevel;
    message: string;
}

export default class LogManager {
    private static instance: LogManager = null;
    private logs: LogEntry[] = [];
    private maxLogs: number = 5000; // 最大保存5000条日志
    private originalConsole = {
        log: console.log,
        warn: console.warn,
        error: console.error,
        info: console.info
    };

    private constructor() {
        this.interceptConsoleLogs();
    }

    /**
     * 获取单例实例
     */
    public static getInstance(): LogManager {
        if (!LogManager.instance) {
            LogManager.instance = new LogManager();
        }
        return LogManager.instance;
    }

    /**
     * 拦截console日志
     */
    private interceptConsoleLogs(): void {
        const self = this;

        // 拦截console.log
        console.log = function(...args: any[]) {
            self.addLog(LogLevel.LOG, args);
            self.originalConsole.log.apply(console, args);
        };

        // 拦截console.warn
        console.warn = function(...args: any[]) {
            self.addLog(LogLevel.WARN, args);
            self.originalConsole.warn.apply(console, args);
        };

        // 拦截console.error
        console.error = function(...args: any[]) {
            self.addLog(LogLevel.ERROR, args);
            self.originalConsole.error.apply(console, args);
        };

        // 拦截console.info
        console.info = function(...args: any[]) {
            self.addLog(LogLevel.INFO, args);
            self.originalConsole.info.apply(console, args);
        };

        // 拦截cc.log（Cocos Creator的日志）
        if (typeof cc !== 'undefined') {
            const originalCcLog = cc.log;
            const originalCcWarn = cc.warn;
            const originalCcError = cc.error;

            cc.log = function(...args: any[]) {
                self.addLog(LogLevel.LOG, args);
                originalCcLog.apply(cc, args);
            };

            cc.warn = function(...args: any[]) {
                self.addLog(LogLevel.WARN, args);
                originalCcWarn.apply(cc, args);
            };

            cc.error = function(...args: any[]) {
                self.addLog(LogLevel.ERROR, args);
                originalCcError.apply(cc, args);
            };
        }

        console.log("[LogManager] Console log interception initialized");
    }

    /**
     * 添加日志条目
     */
    private addLog(level: LogLevel, args: any[]): void {
        const timestamp = this.getTimestamp();
        const message = this.formatMessage(args);

        const logEntry: LogEntry = {
            timestamp,
            level,
            message
        };

        this.logs.push(logEntry);

        // 限制日志数量，防止内存溢出
        if (this.logs.length > this.maxLogs) {
            this.logs.shift(); // 移除最早的日志
        }
    }

    /**
     * 格式化消息
     */
    private formatMessage(args: any[]): string {
        return args.map(arg => {
            if (typeof arg === 'object') {
                try {
                    return JSON.stringify(arg, null, 2);
                } catch (e) {
                    return String(arg);
                }
            }
            return String(arg);
        }).join(' ');
    }

    /**
     * 获取时间戳
     */
    private getTimestamp(): string {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        const milliseconds = String(now.getMilliseconds()).padStart(3, '0');

        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}.${milliseconds}`;
    }

    /**
     * 获取所有日志
     */
    public getAllLogs(): LogEntry[] {
        return [...this.logs];
    }

    /**
     * 清空日志
     */
    public clearLogs(): void {
        this.logs = [];
        console.log("[LogManager] All logs cleared");
    }

    /**
     * 获取日志数量
     */
    public getLogCount(): number {
        return this.logs.length;
    }

    /**
     * 导出日志为文本格式
     */
    public exportLogsAsText(): string {
        let text = `=== Game Logs Export ===\n`;
        text += `Export Time: ${this.getTimestamp()}\n`;
        text += `Total Logs: ${this.logs.length}\n`;
        text += `${"=".repeat(80)}\n\n`;

        this.logs.forEach((log, index) => {
            text += `[${index + 1}] [${log.timestamp}] [${log.level}]\n`;
            text += `${log.message}\n`;
            text += `${"-".repeat(80)}\n`;
        });

        return text;
    }

    /**
     * 导出日志为JSON格式
     */
    public exportLogsAsJSON(): string {
        const exportData = {
            exportTime: this.getTimestamp(),
            totalLogs: this.logs.length,
            logs: this.logs
        };

        return JSON.stringify(exportData, null, 2);
    }

    /**
     * 下载日志文件（文本格式）
     */
    public downloadLogsAsText(): void {
        const content = this.exportLogsAsText();
        const filename = `game-logs-${this.getFilenameTimestamp()}.txt`;
        this.downloadFile(content, filename, 'text/plain');
        console.log(`[LogManager] Logs downloaded as text: ${filename}`);
    }

    /**
     * 下载日志文件（JSON格式）
     */
    public downloadLogsAsJSON(): void {
        const content = this.exportLogsAsJSON();
        const filename = `game-logs-${this.getFilenameTimestamp()}.json`;
        this.downloadFile(content, filename, 'application/json');
        console.log(`[LogManager] Logs downloaded as JSON: ${filename}`);
    }

    /**
     * 获取文件名时间戳
     */
    private getFilenameTimestamp(): string {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');

        return `${year}${month}${day}-${hours}${minutes}${seconds}`;
    }

    /**
     * 下载文件通用方法
     */
    private downloadFile(content: string, filename: string, mimeType: string): void {
        // 创建Blob对象
        const blob = new Blob([content], { type: mimeType });

        // 创建下载链接
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;

        // 触发下载
        document.body.appendChild(link);
        link.click();

        // 清理
        setTimeout(() => {
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        }, 100);
    }

    /**
     * 根据日志级别过滤日志
     */
    public getLogsByLevel(level: LogLevel): LogEntry[] {
        return this.logs.filter(log => log.level === level);
    }

    /**
     * 根据关键字搜索日志
     */
    public searchLogs(keyword: string): LogEntry[] {
        const lowerKeyword = keyword.toLowerCase();
        return this.logs.filter(log =>
            log.message.toLowerCase().includes(lowerKeyword)
        );
    }

    /**
     * 获取最近N条日志
     */
    public getRecentLogs(count: number): LogEntry[] {
        return this.logs.slice(-count);
    }

    /**
     * 获取日志统计信息
     */
    public getLogStats(): {
        total: number;
        logCount: number;
        warnCount: number;
        errorCount: number;
        infoCount: number;
    } {
        return {
            total: this.logs.length,
            logCount: this.getLogsByLevel(LogLevel.LOG).length,
            warnCount: this.getLogsByLevel(LogLevel.WARN).length,
            errorCount: this.getLogsByLevel(LogLevel.ERROR).length,
            infoCount: this.getLogsByLevel(LogLevel.INFO).length
        };
    }

    /**
     * 打印日志统计信息
     */
    public printLogStats(): void {
        const stats = this.getLogStats();
        console.log("=== Log Statistics ===");
        console.log(`Total: ${stats.total}`);
        console.log(`LOG: ${stats.logCount}`);
        console.log(`WARN: ${stats.warnCount}`);
        console.log(`ERROR: ${stats.errorCount}`);
        console.log(`INFO: ${stats.infoCount}`);
        console.log("=====================");
    }
}
