(function () {
  const html = document.documentElement;
  const toggle = document.getElementById('theme-toggle');
  let saved = null;
  try { saved = localStorage.getItem('theme'); } catch (e) {}
  saved = saved || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  html.setAttribute('data-theme', saved);
  if (!toggle) return;
  toggle.innerText = saved === 'dark' ? '[light]' : '[dark]';
  toggle.onclick = () => {
    const next = html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    html.setAttribute('data-theme', next);
    try { localStorage.setItem('theme', next); } catch (e) {}
    toggle.innerText = next === 'dark' ? '[light]' : '[dark]';
  };
})();
