(() => {
  const STORAGE_KEY = 'serge-cookie-choice-v1';
  const SIX_MONTHS = 180 * 24 * 60 * 60 * 1000;
  const copy = {
    en: {
      title: 'Your privacy matters', intro: 'We use necessary browser storage for language and accessibility settings. Optional analytics are currently inactive. You can choose what to allow.',
      accept: 'Accept optional', reject: 'Reject optional', customize: 'Customize', essential: 'Necessary storage', essentialNote: 'Always on — saves your essential preferences.',
      analytics: 'Optional analytics', analyticsNote: 'Not currently active. If enabled later, it must respect this choice.',
      save: 'Save preferences', back: 'Back', policy: 'Privacy Policy', manage: 'Cookie preferences'
    },
    fr: {
      title: 'Votre vie privée compte', intro: 'Nous utilisons un stockage nécessaire pour la langue et l’accessibilité. Les statistiques facultatives sont actuellement inactives. Vous pouvez choisir.',
      accept: 'Tout accepter', reject: 'Tout refuser', customize: 'Personnaliser', essential: 'Stockage nécessaire', essentialNote: 'Toujours actif — mémorise vos préférences essentielles.',
      analytics: 'Statistiques facultatives', analyticsNote: 'Actuellement inactives. Toute activation future devra respecter ce choix.',
      save: 'Enregistrer mes choix', back: 'Retour', policy: 'Confidentialité', manage: 'Préférences cookies'
    },
    es: {
      title: 'Tu privacidad importa', intro: 'Utilizamos almacenamiento necesario para el idioma y la accesibilidad. Las estadísticas opcionales están inactivas por ahora. Tú decides.',
      accept: 'Aceptar opcionales', reject: 'Rechazar opcionales', customize: 'Personalizar', essential: 'Almacenamiento necesario', essentialNote: 'Siempre activo: guarda las preferencias esenciales.',
      analytics: 'Estadísticas opcionales', analyticsNote: 'Actualmente inactivas. Cualquier activación futura deberá respetar tu elección.',
      save: 'Guardar preferencias', back: 'Volver', policy: 'Política de privacidad', manage: 'Preferencias de cookies'
    },
    ar: {
      title: 'خصوصيتك مهمة', intro: 'نستخدم التخزين الضروري لحفظ اللغة وإعدادات سهولة الوصول. التحليلات الاختيارية غير مفعلة حالياً. يمكنك اختيار ما تسمح به.',
      accept: 'قبول الاختياري', reject: 'رفض الاختياري', customize: 'تخصيص', essential: 'التخزين الضروري', essentialNote: 'نشط دائماً لحفظ تفضيلاتك الأساسية.',
      analytics: 'تحليلات اختيارية', analyticsNote: 'غير مفعلة حالياً. أي تفعيل لاحق يجب أن يحترم اختيارك.',
      save: 'حفظ التفضيلات', back: 'رجوع', policy: 'سياسة الخصوصية', manage: 'تفضيلات ملفات الارتباط'
    }
  };
  const valid = data => data && data.version === 1 && typeof data.analytics === 'boolean'
    && typeof data.at === 'number' && Date.now() - data.at < SIX_MONTHS && Date.now() >= data.at;
  function read() {
    try { const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null'); return valid(data) ? data : null; }
    catch { return null; }
  }
  let decision = read();
  let visible = !decision;
  let detailed = false;
  let draftAnalytics = decision?.analytics || false;
  const root = document.createElement('div');
  root.id = 'cookie-consent-root';
  document.body.append(root);
  const language = () => copy[document.documentElement.lang] || copy.en;
  function addPreferencesLink() {
    if (document.querySelector('[data-cookie-open]')) return;
    const footer = document.querySelector('footer');
    if (!footer) return;
    const control = document.createElement('button');
    control.type = 'button';
    control.className = 'cookie-preferences-link';
    control.setAttribute('data-cookie-open', '');
    footer.insertBefore(control, footer.querySelector('.back-top'));
  }
  function notify() {
    window.dispatchEvent(new CustomEvent('serge:consentchange', { detail: {
      analytics: decision?.analytics === true,
      necessary: true,
      decided: Boolean(decision)
    }}));
  }
  function save(analytics) {
    decision = { version: 1, analytics: Boolean(analytics), at: Date.now() };
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(decision)); } catch {}
    visible = false;
    detailed = false;
    notify();
    render();
  }
  function render() {
    addPreferencesLink();
    const t = language();
    document.querySelectorAll('[data-cookie-open]').forEach(el => {
      el.textContent = t.manage; el.setAttribute('aria-label', t.manage);
    });
    root.setAttribute('dir', document.documentElement.dir || 'ltr');
    if (!visible) { root.innerHTML = ''; return; }
    root.innerHTML = `<section class="cookie-banner" aria-label="${t.title}">
      <h2>${t.title}</h2>
      <p>${t.intro} <a href="privacy.html">${t.policy}</a></p>
      ${detailed ? `<div class="cookie-options">
        <div><strong>${t.essential}</strong><small>${t.essentialNote}</small></div><span aria-label="${t.essential}">✓</span>
        <label for="cookie-analytics"><strong>${t.analytics}</strong><small>${t.analyticsNote}</small></label>
        <input type="checkbox" id="cookie-analytics" ${draftAnalytics ? 'checked' : ''}>
      </div>` : ''}
      <div class="cookie-actions">
        <button type="button" data-cookie-action="reject">${t.reject}</button>
        <button type="button" data-cookie-action="accept">${t.accept}</button>
        ${detailed
          ? `<button type="button" data-cookie-action="save" class="cookie-quiet">${t.save}</button><button type="button" data-cookie-action="back" class="cookie-quiet">${t.back}</button>`
          : `<button type="button" data-cookie-action="customize" class="cookie-quiet">${t.customize}</button>`}
      </div>
    </section>`;
  }
  document.addEventListener('click', event => {
    if (!event.target.closest('[data-cookie-open]')) return;
    visible = true;
    detailed = true;
    draftAnalytics = decision?.analytics || false;
    render();
    root.querySelector('#cookie-analytics')?.focus();
  });
  root.addEventListener('change', event => {
    if (event.target.id === 'cookie-analytics') draftAnalytics = event.target.checked;
  });
  root.addEventListener('click', event => {
    const action = event.target.closest('[data-cookie-action]')?.dataset.cookieAction;
    if (!action) return;
    if (action === 'accept') return save(true);
    if (action === 'reject') return save(false);
    if (action === 'save') return save(draftAnalytics);
    if (action === 'customize') { detailed = true; return render(); }
    if (action === 'back') { detailed = false; return render(); }
  });
  document.addEventListener('serge:languagechange', render);
  window.sergeCookieConsent = Object.freeze({
    get: () => ({ necessary: true, analytics: decision?.analytics === true, decided: Boolean(decision) }),
    analyticsAllowed: () => decision?.analytics === true
  });
  render();
})();
