// ============================================
// 简单日志收集器 - 复制到浏览器控制台运行
// ============================================

(function() {
    'use strict';

    // 防止重复初始化
    if (window.logCollector) {
        alert('日志收集器已在运行！');
        return;
    }

    // 日志存储列表
    const logs = [];
    const maxLogs = 5000;

    // 保存原始console方法
    const originalConsole = {
        log: console.log.bind(console),
        warn: console.warn.bind(console),
        error: console.error.bind(console),
        info: console.info.bind(console)
    };

    // 获取时间戳
    function getTimestamp() {
        const now = new Date();
        return now.toISOString().replace('T', ' ').substring(0, 23);
    }

    // 格式化消息
    function formatMessage(args) {
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

    // 添加日志到列表
    function addLog(level, args) {
        const log = {
            timestamp: getTimestamp(),
            level: level,
            message: formatMessage(args)
        };

        logs.push(log);

        // 限制日志数量
        if (logs.length > maxLogs) {
            logs.shift();
        }
    }

    // 拦截console.log
    console.log = function(...args) {
        addLog('LOG', args);
        originalConsole.log(...args);
    };

    // 拦截console.warn
    console.warn = function(...args) {
        addLog('WARN', args);
        originalConsole.warn(...args);
    };

    // 拦截console.error
    console.error = function(...args) {
        addLog('ERROR', args);
        originalConsole.error(...args);
    };

    // 拦截console.info
    console.info = function(...args) {
        addLog('INFO', args);
        originalConsole.info(...args);
    };

    // 拦截cc.log (Cocos Creator)
    setTimeout(() => {
        if (typeof cc !== 'undefined') {
            const originalCcLog = cc.log;
            const originalCcWarn = cc.warn;
            const originalCcError = cc.error;

            cc.log = function(...args) {
                addLog('LOG', args);
                originalCcLog.apply(cc, args);
            };

            cc.warn = function(...args) {
                addLog('WARN', args);
                originalCcWarn.apply(cc, args);
            };

            cc.error = function(...args) {
                addLog('ERROR', args);
                originalCcError.apply(cc, args);
            };
        }
    }, 1000);

    // 生成TXT格式内容
    function generateTextFile() {
        let text = '=== 日志导出 ===\n';
        text += '导出时间: ' + getTimestamp() + '\n';
        text += '页面地址: ' + window.location.href + '\n';
        text += '日志总数: ' + logs.length + '\n';
        text += '='.repeat(80) + '\n\n';

        logs.forEach((log, index) => {
            text += `[${index + 1}] [${log.timestamp}] [${log.level}]\n`;
            text += `${log.message}\n`;
            text += '-'.repeat(80) + '\n';
        });

        return text;
    }

    // 生成JSON格式内容
    function generateJsonFile() {
        return JSON.stringify({
            exportTime: getTimestamp(),
            pageUrl: window.location.href,
            totalLogs: logs.length,
            logs: logs
        }, null, 2);
    }

    // 下载文件
    function downloadFile(content, filename, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    // 下载TXT
    function downloadTxt() {
        const content = generateTextFile();
        const now = new Date();
        const filename = `logs-${now.toISOString().replace(/[:.]/g, '-').substring(0, 19)}.txt`;
        downloadFile(content, filename, 'text/plain');
        console.log('✅ 日志已下载: ' + filename);
    }

    // 下载JSON
    function downloadJson() {
        const content = generateJsonFile();
        const now = new Date();
        const filename = `logs-${now.toISOString().replace(/[:.]/g, '-').substring(0, 19)}.json`;
        downloadFile(content, filename, 'application/json');
        console.log('✅ 日志已下载: ' + filename);
    }

    // 清空日志
    function clearLogs() {
        logs.length = 0;
        console.log('✅ 日志已清空');
    }

    // 获取统计信息
    function getStats() {
        return {
            total: logs.length,
            log: logs.filter(l => l.level === 'LOG').length,
            warn: logs.filter(l => l.level === 'WARN').length,
            error: logs.filter(l => l.level === 'ERROR').length,
            info: logs.filter(l => l.level === 'INFO').length
        };
    }

    // 创建UI面板
    const panel = document.createElement('div');
    panel.innerHTML = `
        <style>
            #log-panel {
                position: fixed;
                top: 10px;
                right: 10px;
                z-index: 999999;
                background: rgba(0, 0, 0, 0.9);
                padding: 15px;
                border-radius: 10px;
                box-shadow: 0 5px 20px rgba(0, 0, 0, 0.5);
                font-family: Arial, sans-serif;
            }
            #log-panel.minimized .panel-content { display: none; }
            .panel-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 10px;
                cursor: move;
                user-select: none;
            }
            .panel-title {
                color: white;
                font-size: 13px;
                font-weight: bold;
            }
            .panel-btn-small {
                background: rgba(255, 255, 255, 0.2);
                border: none;
                color: white;
                width: 22px;
                height: 22px;
                border-radius: 4px;
                cursor: pointer;
                margin-left: 5px;
            }
            .panel-btn-small:hover {
                background: rgba(255, 255, 255, 0.3);
            }
            .log-btn {
                padding: 8px 12px;
                border: none;
                border-radius: 6px;
                font-size: 12px;
                font-weight: bold;
                cursor: pointer;
                color: white;
                width: 100%;
                margin-bottom: 5px;
                transition: transform 0.2s;
            }
            .log-btn:hover {
                transform: translateY(-1px);
            }
            #btn-txt { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
            #btn-json { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); }
            #btn-clear { background: linear-gradient(135deg, #fa709a 0%, #fee140 100%); }
            #btn-stats { background: linear-gradient(135deg, #30cfd0 0%, #330867 100%); }
            #log-count {
                color: white;
                font-size: 11px;
                text-align: center;
                margin-top: 5px;
                padding: 6px;
                background: rgba(255, 255, 255, 0.1);
                border-radius: 4px;
                font-family: monospace;
            }
        </style>
        <div id="log-panel">
            <div class="panel-header">
                <div class="panel-title">🎮 日志收集</div>
                <div>
                    <button class="panel-btn-small" id="btn-minimize">−</button>
                    <button class="panel-btn-small" id="btn-close">×</button>
                </div>
            </div>
            <div class="panel-content">
                <button id="btn-txt" class="log-btn">📄 下载TXT</button>
                <button id="btn-json" class="log-btn">📋 下载JSON</button>
                <button id="btn-clear" class="log-btn">🗑️ 清空日志</button>
                <button id="btn-stats" class="log-btn">📊 查看统计</button>
                <div id="log-count">日志: 0</div>
            </div>
        </div>
    `;

    document.body.appendChild(panel);

    // 绑定按钮事件
    document.getElementById('btn-txt').onclick = downloadTxt;
    document.getElementById('btn-json').onclick = downloadJson;
    document.getElementById('btn-clear').onclick = () => {
        clearLogs();
        updateCount();
    };
    document.getElementById('btn-stats').onclick = () => {
        const stats = getStats();
        console.log('=== 日志统计 ===');
        console.log('总计:', stats.total);
        console.log('LOG:', stats.log);
        console.log('INFO:', stats.info);
        console.log('WARN:', stats.warn);
        console.log('ERROR:', stats.error);
    };

    document.getElementById('btn-minimize').onclick = () => {
        const p = document.getElementById('log-panel');
        p.classList.toggle('minimized');
        document.getElementById('btn-minimize').textContent = p.classList.contains('minimized') ? '+' : '−';
    };

    document.getElementById('btn-close').onclick = () => {
        if (confirm('关闭日志收集器？已收集的日志可通过 window.logCollector 访问')) {
            document.getElementById('log-panel').remove();
        }
    };

    // 更新日志计数
    function updateCount() {
        const el = document.getElementById('log-count');
        if (el) el.textContent = '日志: ' + logs.length;
    }
    setInterval(updateCount, 1000);

    // 拖拽功能
    let isDragging = false, startX, startY, initialX, initialY;
    const panelEl = document.getElementById('log-panel');
    const header = panelEl.querySelector('.panel-header');

    header.addEventListener('mousedown', e => {
        if (e.target.classList.contains('panel-btn-small')) return;
        isDragging = true;
        startX = e.clientX - panelEl.offsetLeft;
        startY = e.clientY - panelEl.offsetTop;
    });

    document.addEventListener('mousemove', e => {
        if (!isDragging) return;
        e.preventDefault();
        panelEl.style.left = (e.clientX - startX) + 'px';
        panelEl.style.top = (e.clientY - startY) + 'px';
        panelEl.style.right = 'auto';
    });

    document.addEventListener('mouseup', () => {
        isDragging = false;
    });

    // 暴露到全局
    window.logCollector = {
        logs: logs,
        downloadTxt: downloadTxt,
        downloadJson: downloadJson,
        clearLogs: clearLogs,
        getStats: getStats
    };

    console.log('');
    console.log('✅ 日志收集器已启动！');
    console.log('📍 面板位置：右上角（可拖拽）');
    console.log('💾 所有console日志已开始保存到内存');
    console.log('🎯 点击按钮下载日志文件');
    console.log('');
    console.log('可用命令：');
    console.log('  window.logCollector.downloadTxt()  - 下载TXT');
    console.log('  window.logCollector.downloadJson() - 下载JSON');
    console.log('  window.logCollector.clearLogs()    - 清空日志');
    console.log('  window.logCollector.getStats()     - 查看统计');
    console.log('  window.logCollector.logs           - 查看日志列表');
    console.log('');

})();
