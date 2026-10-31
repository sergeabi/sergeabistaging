/* Text magnifier: responsive reading sizes, not whole-page scaling. */
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
  const textTargets = [
    'main h1','main h2','main h3','main h4','main h5','main h6',
    'main p','main li','main blockquote','main figcaption',
    'main summary','main label','main small','main a','main button',
    'main th','main td','main .micro','main .section-label',
    'main .section-label span','main .journal-post-meta',
    'main .journal-kicker','main .journal-eyebrow',
    'main .journal-theme-number','main .world-name span',
    'main .world-number','footer a','footer p','footer small'
  ].join(',');
  const storedLevel = () => {
    try {
      const current = localStorage.getItem(key);
      const fallback = localStorage.getItem('serge-zoom-level');
      const n = Number(current === null ? (fallback || 0) : current);
      return Number.isInteger(n) && n >= 0 && n < values.length ? n : 0;
    } catch { return 0; }
  };
  let level = storedLevel();
  let modified = [];
  let scheduled = false;
  function restoreText() {
    for (const { element, value, priority } of modified) {
      if (value) element.style.setProperty('font-size', value, priority);
      else element.style.removeProperty('font-size');
    }
    modified = [];
  }
  function factor(element) {
    // Preserve responsive layout while making body text noticeably larger.
    if (element.matches('h1,h2,h3,h4,h5,h6')) return 1 + .075 * level;
    if (element.matches('a,button,summary,label,small,th,td,.micro,.section-label,.section-label span,.journal-post-meta,.journal-kicker,.journal-eyebrow,.journal-theme-number,.world-number')) return 1 + .06 * level;
    return values[level] / 100;
  }
  function applyReadingSize() {
    document.body.dataset.readingLevel = '0';
    restoreText();
    if (level === 0) return;
    // Collect baseline computed sizes before changing any font; nested text
    // therefore does not compound the scale of its heading or parent.
    const measured = Array.from(document.querySelectorAll(textTargets))
      .filter(element => element.isConnected)
      .map(element => ({
        element,
        base: parseFloat(getComputedStyle(element).fontSize),
        value: element.style.getPropertyValue('font-size'),
        priority: element.style.getPropertyPriority('font-size')
      }));
    document.body.dataset.readingLevel = String(level);
    for (const item of measured) {
      if (!Number.isFinite(item.base) || item.base <= 0) continue;
      item.element.style.setProperty('font-size',
        Math.round(item.base * factor(item.element) * 100) / 100 + 'px', 'important');
      modified.push({ element:item.element, value:item.value, priority:item.priority });
    }
  }
  function render() {
    applyReadingSize();
    const label = (labels[document.documentElement.lang] || labels.en)[level];
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
  function refreshLater() {
    if (scheduled || level === 0) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      applyReadingSize();
    });
  }
  button.addEventListener('click', () => update((level + 1) % values.length));
  document.addEventListener('serge:languagechange', render);
  window.addEventListener('storage', event => {
    if (event.key === key) { level = storedLevel(); render(); }
  });
  window.addEventListener('resize', refreshLater, { passive:true });
  const main = document.querySelector('main');
  if (main && 'MutationObserver' in window) {
    new MutationObserver(refreshLater).observe(main,{ childList:true, subtree:true });
  }
  render();
})();
