function convertToInlineStyles(element) {
    if (element.style.backgroundColor && !['code', 'pre', 'blockquote', 'th', 'td'].includes(element.tagName.toLowerCase())) {
        element.style.backgroundColor = '';
    }
    // Rest of the function logic...
}