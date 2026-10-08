// Who sees what.
//
// Before go-live (LIVE_HOST not set): every address that shows main (sergeabistaging.pages.dev, staging.sergeabi.com,
// and any custom domain added) asks for the login, so a domain attached too early shows a login, not the site.
//
// Go-live is one variable in Cloudflare (Pages → Settings → Variables and Secrets → LIVE_HOST = sergeabi.com) plus the
// custom domain. Then:
//   sergeabi.com                                  the public site, open to everyone and to search engines
//   www.sergeabi.com                              moves permanently to sergeabi.com
//   staging.sergeabi.com, sergeabistaging.pages.dev   move permanently to sergeabi.com (main is the live site now)
//   old WordPress addresses                       move permanently to the matching place on the new page
// Rollback: remove LIVE_HOST (and the custom domain); everything is behind the login again.
//
// Branch previews (<branch>.sergeabistaging.pages.dev) stay behind Cloudflare Access and are never indexed: they are
// the staging copy of every change, approved by Serge in the pull request before it reaches main.
//
// The password lives only in Cloudflare (SITE_PASSWORD), never in this repository. Without it the login stays closed.
const PREVIEW_SUFFIX = '.sergeabistaging.pages.dev';
const USER = 'serge';
const NOINDEX = { 'X-Robots-Tag': 'noindex, nofollow' };

// The WordPress site's public addresses (its sitemaps, 8 Oct 2026) and where each now lives.
const OLD_PATHS = {
  '/coaching-and-collaboration/': '/#coaching',
  '/home-french/': '/',
  '/hello-world/': '/',
  '/category/uncategorized/': '/',
  '/author/admin/': '/',
  '/elementor-hf/2160/': '/',
  '/sitemap_index.xml': '/sitemap.xml',
  '/page-sitemap.xml': '/sitemap.xml',
  '/post-sitemap.xml': '/sitemap.xml',
};

const moved = (to) => new Response(null, { status: 301, headers: { Location: to } });

function oldPath(pathname) {
  const p = pathname.endsWith('/') || pathname.includes('.') ? pathname : pathname + '/';
  return OLD_PATHS[p.toLowerCase()];
}

async function withNoindex(next) {
  const res = await next();
  const out = new Response(res.body, res);
  out.headers.set('X-Robots-Tag', NOINDEX['X-Robots-Tag']);
  return out;
}

export async function onRequest({ request, env, next }) {
  const url = new URL(request.url);
  const host = url.hostname;
  if (host.endsWith(PREVIEW_SUFFIX)) return withNoindex(next);   // a branch preview: Cloudflare Access

  const live = (env.LIVE_HOST || '').trim().toLowerCase();
  if (live) {
    if (host === live) {
      const to = oldPath(url.pathname);
      return to ? moved(`https://${live}${to}`) : next();
    }
    if (host === 'www.' + live || host === 'staging.' + live || host === 'sergeabistaging.pages.dev') {
      const to = oldPath(url.pathname);
      return moved(`https://${live}${to || url.pathname + url.search}`);
    }
  }

  const expected = env.SITE_PASSWORD;
  if (!expected) return new Response('Not available', { status: 503, headers: NOINDEX });

  const [scheme, encoded] = (request.headers.get('Authorization') || '').split(' ');
  if (scheme === 'Basic' && encoded) {
    let user = '', pass = '';
    try { [user, ...pass] = atob(encoded).split(':'); pass = pass.join(':'); } catch (e) { /* malformed header */ }
    if (user === USER && pass === expected) return withNoindex(next);
  }
  return new Response('Login required', {
    status: 401,
    headers: { 'WWW-Authenticate': 'Basic realm="Staging", charset="UTF-8"', ...NOINDEX },
  });
}
