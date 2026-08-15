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
