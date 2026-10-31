// Compact accessible language selector; the underlying EN/FR/ES/AR system stays in app.js.
(() => {
  const widget = document.querySelector('.language-widget');
  if (!widget) return;
  const trigger = widget.querySelector('.language-toggle');
  const options = widget.querySelector('.language-switcher');
  const label = widget.querySelector('.language-current');
  const translations = {
    en: 'Choose language', fr: 'Choisir la langue',
    es: 'Elegir idioma', ar: 'اختر اللغة'
  };
  function close(returnFocus = false) {
    options.hidden = true;
    trigger.setAttribute('aria-expanded', 'false');
    if (returnFocus) trigger.focus();
  }
  trigger.addEventListener('click', () => {
    options.hidden = !options.hidden;
    trigger.setAttribute('aria-expanded', String(!options.hidden));
    if (!options.hidden) options.querySelector('.is-active')?.focus();
  });
  options.querySelectorAll('[data-language]').forEach(button => {
    button.addEventListener('click', () => close());
  });
  document.addEventListener('click', event => {
    if (!widget.contains(event.target)) close();
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !options.hidden) close(true);
  });
  function updateLanguage(event) {
    const lang = event?.detail?.language || document.documentElement.lang || 'en';
    label.textContent = lang === 'ar' ? 'ع' : lang.toUpperCase();
    trigger.setAttribute('aria-label', translations[lang] || translations.en);
  }
  document.addEventListener('serge:languagechange', updateLanguage);
  updateLanguage();
})();
