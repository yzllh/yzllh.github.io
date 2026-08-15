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
