// 语言切换功能
const translations = {
    'en': {
        // 导航菜单
        'menu': 'MENU',
        'home': 'Home',
        'generic': 'Generic',
        'element': 'Element',
        'language': 'Language',
        'switchLang': 'Switch to Chinese',
        
        // 首页内容
        'buyNow': 'BUY WOW NOW',
        'copyright': 'Copy right 2016 by wow technology',
        'madeWith': 'Made with',
        'by': 'by',
        
        // 页面标题
        'genericTitle': 'Generic',
        'elementTitle': 'Element',
        
        // Element页面内容
        'heading1': 'Heading 1 With Paragraph',
        'heading2': 'Heading 2 With Paragraph',
        'headingPara': 'Lorem Ipsum available, but the majority have suffered This alteration in some form, by injected is a humour, or randomised words which don`t look even sligh is made  believable. If  to use and yammi passage of Lorem Ipsum, you need to be sure there isn`t by pioneer designer anything embarrassing hidden in the middle of text.'
    },
    'zh': {
        // 导航菜单
        'menu': '菜单',
        'home': '首页',
        'generic': '通用',
        'element': '元素',
        'language': '语言',
        'switchLang': '切换到英文',
        
        // 首页内容
        'buyNow': '立即购买 WOW',
        'copyright': '2016 wow技术版权所有',
        'madeWith': '由',
        'by': '制作，充满',
        
        // 页面标题
        'genericTitle': '通用页面',
        'elementTitle': '元素页面',
        
        // Element页面内容
        'heading1': '标题1与段落',
        'heading2': '标题2与段落',
        'headingPara': '虽然Lorem Ipsum已经可用，但大多数已经以某种形式遭受了改变，通过注入的幽默，或随机的单词，看起来甚至不太可信。如果要使用Lorem Ipsum的段落，你需要确保在文本中间没有隐藏任何令人尴尬的内容。'
    }
};

// 当前语言，默认为英文
let currentLang = localStorage.getItem('language') || 'en';

// 初始化语言
function initLanguage() {
    // 设置当前语言
    document.documentElement.setAttribute('lang', currentLang);
    
    // 更新页面上的所有带有data-i18n属性的元素
    updatePageLanguage();
}

// 切换语言
function toggleLanguage() {
    // 切换语言
    currentLang = currentLang === 'en' ? 'zh' : 'en';
    
    // 保存语言设置到本地存储
    localStorage.setItem('language', currentLang);
    
    // 更新页面语言
    updatePageLanguage();
}

// 更新页面上的所有文本
function updatePageLanguage() {
    // 更新所有带有data-i18n属性的元素
    const elements = document.querySelectorAll('[data-i18n]');
    elements.forEach(element => {
        const key = element.getAttribute('data-i18n');
        if (translations[currentLang][key]) {
            element.textContent = translations[currentLang][key];
        }
    });
    
    // 更新语言切换按钮文本
    const langToggle = document.getElementById('langToggle');
    if (langToggle) {
        langToggle.textContent = translations[currentLang]['switchLang'];
    }
}

// 页面加载完成后初始化语言
document.addEventListener('DOMContentLoaded', initLanguage);