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

  // Track meaningful actions only when optional analytics consent is granted.
  // These are intent signals; link clicks do not confirm Calendly bookings or Amazon purchases.
  function trackEvent(name, parameters = {}) {
    if (!allowed || typeof window.gtag !== 'function') return;
    window.gtag('event', name, {
      ...parameters,
      page_language: document.documentElement.lang || 'en'
    });
  }

  document.addEventListener('click', (event) => {
    const anchor = event.target.closest('a[href]');
    if (!anchor) return;
    let destination;
    try {
      destination = new URL(anchor.href, location.href);
    } catch (_) {
      return;
    }
    const hostname = destination.hostname.toLowerCase();
    if (hostname === 'calendly.com' || hostname === 'www.calendly.com') {
      trackEvent('booking_link_click', { link_destination: 'calendly' });
    } else if (
      (hostname === 'amazon.com' || hostname === 'www.amazon.com' ||
       hostname === 'amazon.fr' || hostname === 'www.amazon.fr') &&
      /^\\/dp\\/B0HQV(?:L6SVS|6Q4ZZ)/.test(destination.pathname)
    ) {
      trackEvent('book_link_click', { link_destination: hostname.endsWith('.fr') ? 'amazon_fr' : 'amazon_com' });
    } else if (hostname === 'wa.me' || hostname === 'api.whatsapp.com') {
      trackEvent('whatsapp_link_click', { link_destination: 'whatsapp' });
    }
  });

  document.addEventListener('serge:audit-submitted', () => {
    trackEvent('generate_lead', { lead_source: 'crossroads_audit' });
  });

  function applyConsent(analytics) {
    if (analytics === true) enableAnalytics();
    else disableAnalytics();
  }
  window.addEventListener('serge:consentchange', (event) => {
    applyConsent(event.detail?.analytics === true);
  });
  applyConsent(window.sergeCookieConsent?.analyticsAllowed() === true);
})();
