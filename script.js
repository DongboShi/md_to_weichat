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
const typographySelector = document.getElementById('typographySelector');
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

/**
 * Convert styled HTML to inline styles for WeChat compatibility
 * WeChat strips CSS classes, so we need to apply all styles inline
 */
function convertToInlineStyles(html) {
    const NORMAL_FONT_WEIGHT = '400';
    // Elements that should preserve their background colors when copied
    const ELEMENTS_WITH_BACKGROUND = ['code', 'pre', 'blockquote', 'th', 'tr', 'td'];
    
    // Create a temporary container with the same classes as preview
    const tempContainer = document.createElement('div');
    tempContainer.className = preview.className;
    tempContainer.innerHTML = html;
    tempContainer.style.position = 'absolute';
    tempContainer.style.left = '-9999px';
    tempContainer.style.visibility = 'hidden';
    document.body.appendChild(tempContainer);
    
    try {
        // Helper function to check if a value is meaningful
        function isValidValue(value) {
            return value && 
                   value !== 'none' && 
                   value !== 'normal' && 
                   value !== 'auto' && 
                   value !== '0px' &&
                   value !== 'rgba(0, 0, 0, 0)' &&
                   value !== 'transparent';
        }
        
        // Helper function to check if background color is white or near-white
        // These should be excluded to avoid gray/white backgrounds in WeChat
        function isWhiteOrNearWhite(bgColor) {
            if (!bgColor) return false;  // Allow checking of actual background values
            
            // Common exact white values (pre-normalized for efficiency)
            const whiteValues = [
                'rgb(255,255,255)',
                'rgba(255,255,255,1)',
                '#ffffff',
                '#fff',
                'white'
            ];
            const normalized = bgColor.toLowerCase().replace(/\s/g, '');
            
            // Check for exact white match first (faster)
            if (whiteValues.includes(normalized)) {
                return true;
            }
            
            // Check for near-white RGB values (250-255 for all channels)
            const rgbMatch = normalized.match(/^rgba?\((\d+),(\d+),(\d+)(?:,[\d.]+)?\)$/);
            if (rgbMatch) {
                const r = parseInt(rgbMatch[1], 10);
                const g = parseInt(rgbMatch[2], 10);
                const b = parseInt(rgbMatch[3], 10);
                // Consider values >= 250 in all RGB channels as "near-white"
                return r >= 250 && g >= 250 && b >= 250;
            }
            
            return false;
        }
        
        // Process all elements and apply computed styles inline
        const allElements = tempContainer.querySelectorAll('*');
        allElements.forEach(element => {
            const computed = window.getComputedStyle(element);
            const tagName = element.tagName.toLowerCase();
            
            // Build inline style string
            const styles = [];
            
            // Font and text properties
            if (isValidValue(computed.color)) {
                styles.push(`color: ${computed.color}`);
            }
            if (isValidValue(computed.fontSize)) {
                styles.push(`font-size: ${computed.fontSize}`);
            }
            if (isValidValue(computed.fontWeight) && computed.fontWeight !== NORMAL_FONT_WEIGHT) {
                styles.push(`font-weight: ${computed.fontWeight}`);
            }
            if (isValidValue(computed.fontStyle) && computed.fontStyle !== 'normal') {
                styles.push(`font-style: ${computed.fontStyle}`);
            }
            if (isValidValue(computed.lineHeight)) {
                styles.push(`line-height: ${computed.lineHeight}`);
            }
            if (isValidValue(computed.textDecoration) && !computed.textDecoration.startsWith('none')) {
                styles.push(`text-decoration: ${computed.textDecoration}`);
            }
            if (isValidValue(computed.textAlign) && computed.textAlign !== 'start') {
                styles.push(`text-align: ${computed.textAlign}`);
            }
            
            // Background - only apply to elements that should have backgrounds
            // Don't apply background to most elements to avoid gray background in WeChat
            // Also exclude white and near-white backgrounds
            const shouldHaveBackground = ELEMENTS_WITH_BACKGROUND.includes(tagName);
            if (shouldHaveBackground && isValidValue(computed.backgroundColor) && !isWhiteOrNearWhite(computed.backgroundColor)) {
                styles.push(`background-color: ${computed.backgroundColor}`);
            }
            
            // Spacing
            if (isValidValue(computed.marginTop)) {
                styles.push(`margin-top: ${computed.marginTop}`);
            }
            if (isValidValue(computed.marginBottom)) {
                styles.push(`margin-bottom: ${computed.marginBottom}`);
            }
            if (isValidValue(computed.marginLeft)) {
                styles.push(`margin-left: ${computed.marginLeft}`);
            }
            if (isValidValue(computed.marginRight)) {
                styles.push(`margin-right: ${computed.marginRight}`);
            }
            if (isValidValue(computed.paddingTop)) {
                styles.push(`padding-top: ${computed.paddingTop}`);
            }
            if (isValidValue(computed.paddingBottom)) {
                styles.push(`padding-bottom: ${computed.paddingBottom}`);
            }
            if (isValidValue(computed.paddingLeft)) {
                styles.push(`padding-left: ${computed.paddingLeft}`);
            }
            if (isValidValue(computed.paddingRight)) {
                styles.push(`padding-right: ${computed.paddingRight}`);
            }
            
            // Borders
            if (isValidValue(computed.borderLeft) && !computed.borderLeft.startsWith('0px none')) {
                styles.push(`border-left: ${computed.borderLeft}`);
            }
            if (isValidValue(computed.borderBottom) && !computed.borderBottom.startsWith('0px none')) {
                styles.push(`border-bottom: ${computed.borderBottom}`);
            }
            if (isValidValue(computed.borderTop) && !computed.borderTop.startsWith('0px none')) {
                styles.push(`border-top: ${computed.borderTop}`);
            }
            if (isValidValue(computed.borderRight) && !computed.borderRight.startsWith('0px none')) {
                styles.push(`border-right: ${computed.borderRight}`);
            }
            if (isValidValue(computed.border) && !computed.border.startsWith('0px none')) {
                styles.push(`border: ${computed.border}`);
            }
            
            // Visual effects
            if (isValidValue(computed.borderRadius)) {
                styles.push(`border-radius: ${computed.borderRadius}`);
            }
            if (isValidValue(computed.boxShadow)) {
                styles.push(`box-shadow: ${computed.boxShadow}`);
            }
            
            // Display and layout (for specific elements)
            if (tagName === 'img' || tagName === 'table') {
                if (isValidValue(computed.display)) {
                    styles.push(`display: ${computed.display}`);
                }
                if (isValidValue(computed.maxWidth)) {
                    styles.push(`max-width: ${computed.maxWidth}`);
                }
                if (isValidValue(computed.width) && computed.width !== 'auto') {
                    styles.push(`width: ${computed.width}`);
                }
                if (isValidValue(computed.height) && computed.height !== 'auto') {
                    styles.push(`height: ${computed.height}`);
                }
            }
            
            // Code blocks need special handling
            if (tagName === 'pre' || tagName === 'code') {
                if (isValidValue(computed.fontFamily)) {
                    styles.push(`font-family: ${computed.fontFamily}`);
                }
                if (isValidValue(computed.whiteSpace)) {
                    styles.push(`white-space: ${computed.whiteSpace}`);
                }
            }
            
            // Table specific
            if (tagName === 'table') {
                if (isValidValue(computed.borderCollapse)) {
                    styles.push(`border-collapse: ${computed.borderCollapse}`);
                }
            }
            
            // Apply all collected styles
            if (styles.length > 0) {
                element.setAttribute('style', styles.join('; '));
            }
        });
        
        return tempContainer.innerHTML;
    } finally {
        // Ensure cleanup even if an error occurs
        document.body.removeChild(tempContainer);
    }
}

copyBtn.addEventListener('click', async () => {
    try {
        // Convert to inline styles for WeChat compatibility
        const styledHtml = convertToInlineStyles(preview.innerHTML);
        
        // Try modern Clipboard API first
        if (navigator.clipboard && navigator.clipboard.write) {
            try {
                // Create clipboard item with both HTML and plain text
                const textContent = preview.textContent || preview.innerText || '';
                const clipboardItem = new ClipboardItem({
                    'text/html': new Blob([styledHtml], { type: 'text/html' }),
                    'text/plain': new Blob([textContent], { type: 'text/plain' })
                });
                await navigator.clipboard.write([clipboardItem]);
                showToast('✅ 复制成功！可以直接粘贴到微信公众号啦');
                return;
            } catch (clipboardErr) {
                console.warn('Clipboard API failed, trying fallback:', clipboardErr);
                // Continue to fallback method
            }
        }
        
        // Fallback: Use selection + execCommand method
        const container = document.createElement('div');
        container.innerHTML = styledHtml;
        container.style.position = 'absolute';
        container.style.left = '-9999px';
        container.style.top = '-9999px';
        document.body.appendChild(container);
        
        try {
            // Select the content
            const range = document.createRange();
            range.selectNodeContents(container);
            const selection = window.getSelection();
            selection.removeAllRanges();
            selection.addRange(range);
            
            // Try to copy
            const successful = document.execCommand('copy');
            
            // Clean up selection
            selection.removeAllRanges();
            
            if (successful) {
                showToast('✅ 复制成功！可以直接粘贴到微信公众号啦');
            } else {
                throw new Error('execCommand returned false');
            }
        } finally {
            // Always remove the container
            document.body.removeChild(container);
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
    
    // Load content theme (color)
    const contentTheme = localStorage.getItem('contentTheme') || 'wechat';
    themeSelector.value = contentTheme;
    
    // Load typography style
    const typography = localStorage.getItem('typography') || 'standard';
    typographySelector.value = typography;
    
    // Apply both
    applyStyles(typography, contentTheme);
}

// Content theme switching (color)
themeSelector.addEventListener('change', (e) => {
    const selectedTheme = e.target.value;
    const typography = typographySelector.value;
    applyStyles(typography, selectedTheme);
    localStorage.setItem('contentTheme', selectedTheme);
    showToast(`🎨 已切换到 ${e.target.selectedOptions[0].text} 颜色主题`);
});

// Typography switching
typographySelector.addEventListener('change', (e) => {
    const selectedTypography = e.target.value;
    const colorTheme = themeSelector.value;
    applyStyles(selectedTypography, colorTheme);
    localStorage.setItem('typography', selectedTypography);
    showToast(`📐 已切换到 ${e.target.selectedOptions[0].text}`);
});

function applyStyles(typography, colorTheme) {
    // Remove all existing classes except 'preview'
    preview.className = 'preview';
    
    // Apply typography class
    preview.classList.add(`typography-${typography}`);
    
    // Apply color theme class
    preview.classList.add(`theme-${colorTheme}`);
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