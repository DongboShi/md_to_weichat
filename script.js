// ========================================
// DOM 元素获取
// ========================================

const editor = document.getElementById('editor');
const preview = document.getElementById('preview');
const copyBtn = document.getElementById('copyBtn');
const clearBtn = document.getElementById('clearBtn');
const downloadBtn = document.getElementById('downloadBtn');
const themeToggle = document.getElementById('themeToggle');
const themeSelector = document.getElementById('themeSelector');
const wordCount = document.getElementById('wordCount');
const toast = document.getElementById('toast');

// ========================================
// Marked.js 配置
// ========================================

marked.setOptions({
    highlight: function(code, lang) {
        if (lang && hljs.getLanguage(lang)) {
            try {
                return hljs.highlight(code, { language: lang }).value;
            } catch (err) {
                console.error(err);
            }
        }
        return hljs.highlightAuto(code).value;
    },
    breaks: true,
    gfm: true
});

// ========================================
// 初始化
// ========================================

window.addEventListener('DOMContentLoaded', () => {
    // 加载保存的内容
    loadFromLocalStorage();
    
    // 初始渲染
    updatePreview();
    
    // 加载主题设置
    loadTheme();
});

// ========================================
// 实时预览
// ========================================

editor.addEventListener('input', () => {
    updatePreview();
    saveToLocalStorage();
    updateWordCount();
});

function updatePreview() {
    const markdown = editor.value;
    const html = marked.parse(markdown);
    preview.innerHTML = html;
}

// ========================================
// 字数统计
// ========================================

function updateWordCount() {
    const text = editor.value;
    const count = text.length;
    wordCount.textContent = `${count} 字`;
}

// ========================================
// 复制富文本
// ========================================

copyBtn.addEventListener('click', async () => {
    try {
        // 创建一个临时容器
        const container = document.createElement('div');
        container.innerHTML = preview.innerHTML;
        container.style.position = 'absolute';
        container.style.left = '-9999px';
        document.body.appendChild(container);
        
        // 选择内容
        const range = document.createRange();
        range.selectNodeContents(container);
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
        
        // 复制
        const successful = document.execCommand('copy');
        
        // 清理
        selection.removeAllRanges();
        document.body.removeChild(container);
        
        if (successful) {
            showToast('✅ 复制成功！可以直接粘贴到微信公众号啦');
        } else {
            // 降级方案：使用 Clipboard API
            const html = preview.innerHTML;
            const blob = new Blob([html], { type: 'text/html' });
            const clipboardItem = new ClipboardItem({ 'text/html': blob });
            await navigator.clipboard.write([clipboardItem]);
            showToast('✅ 复制成功！可以直接粘贴到微信公众号啦');
        }
    } catch (err) {
        console.error('复制失败:', err);
        showToast('❌ 复制失败，请手动选择内容复制', 'error');
    }
});

// ========================================
// 清空内容
// ========================================

clearBtn.addEventListener('click', () => {
    if (confirm('确定要清空所有内容吗？')) {
        editor.value = '';
        updatePreview();
        updateWordCount();
        localStorage.removeItem('markdown_content');
        showToast('🗑️ 内容已清空');
    }
});

// ========================================
// 下载 Markdown
// ========================================

downloadBtn.addEventListener('click', () => {
    const content = editor.value;
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `markdown_${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('💾 文件已下载');
});

// ========================================
// 主题切换
// ========================================

themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    themeToggle.textContent = isDark ? '☀️ 浅色模式' : '🌙 深色模式';
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
});

function loadTheme() {
    const theme = localStorage.getItem('theme');
    if (theme === 'dark') {
        document.body.classList.add('dark-mode');
        themeToggle.textContent = '☀️ 浅色模式';
    }
    
    // Load content theme
    const contentTheme = localStorage.getItem('contentTheme') || 'wechat';
    themeSelector.value = contentTheme;
    applyContentTheme(contentTheme);
}

// Content theme switching
themeSelector.addEventListener('change', (e) => {
    const selectedTheme = e.target.value;
    applyContentTheme(selectedTheme);
    localStorage.setItem('contentTheme', selectedTheme);
    showToast(`🎨 已切换到 ${e.target.selectedOptions[0].text} 主题`);
});

function applyContentTheme(theme) {
    // Remove all theme classes
    preview.className = 'preview';
    
    // Apply selected theme class
    preview.classList.add(`${theme}-style`);
}

// ========================================
// 本地存储
// ========================================

function saveToLocalStorage() {
    const content = editor.value;
    localStorage.setItem('markdown_content', content);
}

function loadFromLocalStorage() {
    const content = localStorage.getItem('markdown_content');
    if (content) {
        editor.value = content;
        updateWordCount();
    }
}

// ========================================
// Toast 通知
// ========================================

function showToast(message, type = 'success') {
    toast.textContent = message;
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// ========================================
// 快捷键支持
// ========================================

editor.addEventListener('keydown', (e) => {
    // Tab 键插入缩进
    if (e.key === 'Tab') {
        e.preventDefault();
        const start = editor.selectionStart;
        const end = editor.selectionEnd;
        const value = editor.value;
        editor.value = value.substring(0, start) + '    ' + value.substring(end);
        editor.selectionStart = editor.selectionEnd = start + 4;
        updatePreview();
        saveToLocalStorage();
    }
    
    // Ctrl/Cmd + S 保存
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        saveToLocalStorage();
        showToast('💾 内容已保存');
    }
});

// ========================================
// 窗口关闭前提示
// ========================================

window.addEventListener('beforeunload', (e) => {
    if (editor.value.trim() !== '') {
        e.preventDefault();
        e.returnValue = '';
    }
});