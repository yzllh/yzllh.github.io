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

  const allowedChineseRegions = ['cn', 'tw', 'sg', 'hk', 'mo'];
  const browserLocales = [...new Set([...(navigator.languages || []), navigator.language].filter(Boolean))];
  const hasAllowedChineseLocale = browserLocales.some(locale => {
    const localeParts = locale.toLowerCase().replace('_', '-').split('-');
    return localeParts[0] === 'zh' && localeParts.slice(1).some(part => allowedChineseRegions.includes(part));
  });
  const savedLanguage = window.localStorage.getItem('site-language');
  const defaultLanguage = savedLanguage || (hasAllowedChineseLocale ? 'zh-CN' : 'en');
  let googleTranslateLoading = false;
  let pendingLanguage = null;

  function getTranslateCombo() {
    return document.querySelector('.goog-te-combo');
  }

  function applyTranslation(language) {
    const translateCombo = getTranslateCombo();
    if (!translateCombo) return false;
    translateCombo.value = language === 'zh-CN' ? '' : language;
    translateCombo.dispatchEvent(new Event('change'));
    return true;
  }

  function applyPendingTranslation(attempt) {
    if (!pendingLanguage || applyTranslation(pendingLanguage) || attempt > 20) return;
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
        includedLanguages: 'en,zh-CN,ru,ja',
        autoDisplay: false
      }, 'google_translate_element');
      applyPendingTranslation(0);
    };
    const script = document.createElement('script');
    script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
    script.async = true;
    document.head.appendChild(script);
  }

  function clearGoogleTranslation() {
    document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
    document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=${window.location.hostname}`;
    window.location.reload();
  }

  languageButtons.forEach(button => {
    button.addEventListener('click', () => {
      const language = button.dataset.siteLanguage;
      window.localStorage.setItem('site-language', language);
      if (language === 'zh-CN') {
        clearGoogleTranslation();
      } else {
        loadGoogleTranslate(language);
      }
    });
  });

  if (defaultLanguage === 'en') loadGoogleTranslate('en');
})();
