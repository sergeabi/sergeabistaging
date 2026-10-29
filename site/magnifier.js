(() => {
  const button = document.querySelector('.text-magnifier');
  if (!button) return;
  const badge = button.querySelector('.zoom-level');
  const key = 'serge-reading-level-v2';
  const values = [100, 115, 130];
  const labels = {
    en: ['Text size 100%. Activate for 115%.', 'Text size 115%. Activate for 130%.', 'Text size 130%. Activate to reset to 100%.'],
    fr: ['Taille du texte 100 %. Activer pour 115 %.', 'Taille du texte 115 %. Activer pour 130 %.', 'Taille du texte 130 %. Activer pour revenir à 100 %.'],
    es: ['Tamaño del texto 100 %. Activar para 115 %.', 'Tamaño del texto 115 %. Activar para 130 %.', 'Tamaño del texto 130 %. Activar para volver al 100 %.'],
    ar: ['حجم النص ١٠٠٪. اضغط للوصول إلى ١١٥٪.', 'حجم النص ١١٥٪. اضغط للوصول إلى ١٣٠٪.', 'حجم النص ١٣٠٪. اضغط للعودة إلى ١٠٠٪.']
  };
  function storedLevel() {
    try {
      const updated = localStorage.getItem(key);
      const old = localStorage.getItem('serge-zoom-level');
      const n = Number(updated === null ? (old || 0) : updated);
      return Number.isInteger(n) && n >= 0 && n < values.length ? n : 0;
    } catch { return 0; }
  }
  let level = storedLevel();
  function render() {
    // Only reading typography changes; never zoom or constrain the entire page.
    document.body.dataset.readingLevel = String(level);
    const lang = document.documentElement.lang;
    const label = (labels[lang] || labels.en)[level];
    if (badge) badge.textContent = values[level] + '%';
    button.setAttribute('aria-label', label);
    button.setAttribute('title', label);
    button.setAttribute('aria-pressed', String(level !== 0));
  }
  function update(next) {
    level = next;
    try { localStorage.setItem(key, String(level)); } catch {}
    render();
  }
  button.addEventListener('click', () => update((level + 1) % values.length));
  document.addEventListener('serge:languagechange', render);
  window.addEventListener('storage', event => { if (event.key === key) { level = storedLevel(); render(); } });
  render();
})();
