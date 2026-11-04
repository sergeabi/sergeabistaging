/* Google Analytics 4 — strictly opt-in for visitors in all regions.
 * GA4 is never requested until the visitor accepts optional analytics.
 */
(() => {
  'use strict';
  const MEASUREMENT_ID = 'G-6FHQQ39V45';
  let loaded = false;
  let allowed = false;

  function disableAnalytics() {
    allowed = false;
    window['ga-disable-' + MEASUREMENT_ID] = true;
    if (typeof window.gtag === 'function') {
      window.gtag('consent', 'update', {
        analytics_storage: 'denied',
        ad_storage: 'denied',
        ad_user_data: 'denied',
        ad_personalization: 'denied'
      });
    }
    // Remove cookies set by this site's GA4 tag when consent is withdrawn.
    // Site-only cookies; no effect on other websites.
    const cookieNames = document.cookie.split(';').map(c => c.trim().split('=')[0])
      .filter(name => name === '_ga' || name.startsWith('_ga_'));
    for (const name of cookieNames) {
      for (const path of ['/', location.pathname]) {
        document.cookie = name + '=; Max-Age=0; path=' + path + '; SameSite=Lax';
        document.cookie = name + '=; Max-Age=0; path=' + path + '; domain=.' + location.hostname + '; SameSite=Lax';
      }
    }
  }

  function enableAnalytics() {
    if (allowed) return;
    allowed = true;
    window['ga-disable-' + MEASUREMENT_ID] = false;
    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
    window.gtag('consent', 'default', {
      analytics_storage: 'granted',
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied'
    });
    if (loaded) {
      window.gtag('consent', 'update', { analytics_storage: 'granted' });
      window.gtag('config', MEASUREMENT_ID);
      return;
    }
    loaded = true;
    window.gtag('js', new Date());
    window.gtag('config', MEASUREMENT_ID, { allow_google_signals: false, allow_ad_personalization_signals: false });
    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(MEASUREMENT_ID);
    document.head.appendChild(script);
  }

  function applyConsent(analytics) {
    if (analytics === true) enableAnalytics();
    else disableAnalytics();
  }
  window.addEventListener('serge:consentchange', (event) => {
    applyConsent(event.detail?.analytics === true);
  });
  applyConsent(window.sergeCookieConsent?.analyticsAllowed() === true);
})();
