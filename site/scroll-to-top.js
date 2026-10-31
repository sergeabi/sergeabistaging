// Show the shortcut after scrolling beyond the hero; keep it hidden at the top.
(() => {
  const control = document.querySelector('.scroll-to-top');
  const hero = document.querySelector('.hero');
  if (!control || !hero) return;
  let pending = false;
  const update = () => {
    pending = false;
    const isMobile = matchMedia('(max-width: 760px)').matches;
    // On mobile show soon after scrolling, rather than waiting for most of a tall hero.
    const threshold = isMobile ? 160 : Math.max(300, Math.min(hero.offsetHeight * .65, 700));
    const visible = (window.scrollY || document.documentElement.scrollTop || 0) > threshold;
    control.classList.toggle('is-visible', visible);
    control.setAttribute('aria-hidden', String(!visible));
    control.tabIndex = visible ? 0 : -1;
  };
  const schedule = () => {
    if (pending) return;
    pending = true;
    requestAnimationFrame(update);
  };
  addEventListener('scroll', schedule, { passive: true });
  addEventListener('resize', schedule);
  control.addEventListener('click', (event) => {
    event.preventDefault();
    window.scrollTo({ top: 0, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
  });
  update();
})();
