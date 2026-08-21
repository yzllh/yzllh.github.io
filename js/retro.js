(function () {
  const clock = document.querySelector('[data-clock]');

  function updateClock() {
    if (!clock) return;
    const now = new Date();
    const pad = value => String(value).padStart(2, '0');
    clock.textContent = `现在时间：${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
  }

  updateClock();
  window.setInterval(updateClock, 1000);
})();

(function () {
  const dataElement = document.querySelector('#search-data');
  const form = document.querySelector('[data-site-search]');
  const input = document.querySelector('#site-search-input');
  const resultElement = document.querySelector('#search-results');

  if (!dataElement || !form || !input || !resultElement) return;

  const posts = JSON.parse(dataElement.textContent || '[]');
  const params = new URLSearchParams(window.location.search);

  function renderResults() {
    const query = input.value.trim().toLocaleLowerCase();
    resultElement.replaceChildren();

    if (!query) {
      resultElement.textContent = '请输入关键词开始搜索。';
      return;
    }

    const terms = query.split(/\s+/).filter(Boolean);
    const matches = posts.filter(post => terms.every(term => post.searchText.includes(term)));

    if (!matches.length) {
      resultElement.textContent = '没有找到相关文章。';
      return;
    }

    const summary = document.createElement('p');
    summary.className = 'search-summary';
    summary.textContent = `找到${matches.length}篇相关文章：`;
    resultElement.appendChild(summary);

    matches.forEach(post => {
      const item = document.createElement('article');
      item.className = 'search-result';

      const title = document.createElement('h2');
      const link = document.createElement('a');
      link.href = post.url;
      link.textContent = post.title;
      title.appendChild(link);

      const date = document.createElement('time');
      date.textContent = post.date;

      const excerpt = document.createElement('p');
      excerpt.textContent = post.excerpt;

      item.append(title, date, excerpt);
      resultElement.appendChild(item);
    });
  }

  input.value = params.get('q') || '';
  form.addEventListener('submit', event => {
    event.preventDefault();
    const query = input.value.trim();
    const target = new URL(window.location.href);
    target.search = query ? `?q=${encodeURIComponent(query)}` : '';
    window.history.replaceState({}, '', target);
    renderResults();
  });

  renderResults();
})();

(function () {
  const languageButtons = document.querySelectorAll('[data-site-language]');
  const translateElement = document.querySelector('#google_translate_element');

  if (!languageButtons.length || !translateElement) return;

  const supportedLanguages = new Set(['zh-CN', 'en', 'ru', 'ja', 'vi', 'he', 'eo']);
  const googleLanguageCodes = { he: 'iw' };

  function normalizeLanguage(value) {
    if (typeof value !== 'string') return null;
    const normalized = value.trim().toLowerCase().replace(/_/g, '-');
    if (!normalized) return null;

    const primaryLanguage = normalized.split('-')[0];
    if (primaryLanguage === 'zh') return 'zh-CN';
    if (primaryLanguage === 'he' || primaryLanguage === 'iw') return 'he';
    return supportedLanguages.has(primaryLanguage) ? primaryLanguage : null;
  }

  function detectBrowserLanguage() {
    const browserLocales = [
      ...(Array.isArray(navigator.languages) ? navigator.languages : []),
      navigator.language
    ].filter(Boolean);

    for (const locale of browserLocales) {
      const language = normalizeLanguage(locale);
      if (language) return language;
    }
    return 'en';
  }

  function readStorage(key) {
    try {
      return window.localStorage.getItem(key);
    } catch (error) {
      return null;
    }
  }

  function writeStorage(key, value) {
    try {
      window.localStorage.setItem(key, value);
    } catch (error) {
      // 隐私模式或禁用存储时仍应允许当前页面切换语言。
    }
  }

  const savedLanguage = normalizeLanguage(readStorage('site-language'));
  const defaultLanguage = savedLanguage || detectBrowserLanguage();
  let googleTranslateLoading = false;
  let pendingLanguage = null;

  function setDocumentLanguage(language) {
    document.documentElement.dir = language === 'he' ? 'rtl' : 'ltr';
    document.documentElement.lang = language === 'zh-CN' ? 'zh-CN' : language;
  }

  function getTranslateCombo() {
    return document.querySelector('.goog-te-combo');
  }

  function applyTranslation(language) {
    setDocumentLanguage(language);
    const translateCombo = getTranslateCombo();
    if (!translateCombo) return false;
    const googleLanguage = googleLanguageCodes[language] || language;
    const targetValue = language === 'zh-CN' ? '' : googleLanguage;
    const hasTargetOption = [...translateCombo.options].some(option => option.value === targetValue);
    if (!hasTargetOption) return false;
    if (translateCombo.value !== targetValue) {
      translateCombo.value = targetValue;
      translateCombo.dispatchEvent(new Event('change'));
    }
    return true;
  }

  function applyPendingTranslation(attempt) {
    if (!pendingLanguage || applyTranslation(pendingLanguage) || attempt > 100) return;
    window.setTimeout(() => applyPendingTranslation(attempt + 1), 150);
  }

  function loadGoogleTranslate(language) {
    pendingLanguage = language;
    if (applyTranslation(language)) return;
    if (googleTranslateLoading) return;
    googleTranslateLoading = true;
    window.googleTranslateElementInit = function () {
      new window.google.translate.TranslateElement({
        pageLanguage: 'zh-CN',
        includedLanguages: 'en,zh-CN,ru,ja,vi,iw,eo',
        autoDisplay: false
      }, 'google_translate_element');
      applyPendingTranslation(0);
    };
    const script = document.createElement('script');
    script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
    script.async = true;
    script.addEventListener('error', () => {
      googleTranslateLoading = false;
    });
    document.head.appendChild(script);
  }

  function clearGoogleTranslation() {
    pendingLanguage = null;
    setDocumentLanguage('zh-CN');
    const cookieNames = ['googtrans', 'googtransopt'];
    const cookieDomains = ['', `domain=${window.location.hostname}`, `domain=.${window.location.hostname}`];
    cookieNames.forEach(cookieName => {
      cookieDomains.forEach(cookieDomain => {
        const domainSuffix = cookieDomain ? `; ${cookieDomain}` : '';
        document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/${domainSuffix}`;
      });
    });
    window.location.reload();
  }

  languageButtons.forEach(button => {
    button.addEventListener('click', () => {
      const language = normalizeLanguage(button.dataset.siteLanguage);
      if (!language) return;
      writeStorage('site-language', language);
      if (language === 'zh-CN') {
        clearGoogleTranslation();
      } else {
        loadGoogleTranslate(language);
      }
    });
  });

  setDocumentLanguage(defaultLanguage);
  if (defaultLanguage !== 'zh-CN') loadGoogleTranslate(defaultLanguage);
})();
