// Every address that shows main (sergeabistaging.pages.dev, staging.sergeabi.com since 7 Oct, and any custom domain
// added later) asks for the login. Branch previews (<branch>.sergeabistaging.pages.dev) are behind Cloudflare Access,
// so they are left to it.
// The password lives only in Cloudflare (Pages → Settings → Variables and Secrets → SITE_PASSWORD), never in this
// repository. Without it the address stays closed.
const PREVIEW_SUFFIX = '.sergeabistaging.pages.dev';
const USER = 'serge';
const NOINDEX = { 'X-Robots-Tag': 'noindex, nofollow' };

export async function onRequest({ request, env, next }) {
  if (new URL(request.url).hostname.endsWith(PREVIEW_SUFFIX)) return next();   // a branch preview: Cloudflare Access

  const expected = env.SITE_PASSWORD;
  if (!expected) return new Response('Not available', { status: 503, headers: NOINDEX });

  const [scheme, encoded] = (request.headers.get('Authorization') || '').split(' ');
  if (scheme === 'Basic' && encoded) {
    let user = '', pass = '';
    try { [user, ...pass] = atob(encoded).split(':'); pass = pass.join(':'); } catch (e) { /* malformed header */ }
    if (user === USER && pass === expected) {
      const res = await next();
      const out = new Response(res.body, res);
      out.headers.set('X-Robots-Tag', NOINDEX['X-Robots-Tag']);
      return out;
    }
  }
  return new Response('Login required', {
    status: 401,
    headers: { 'WWW-Authenticate': 'Basic realm="Staging", charset="UTF-8"', ...NOINDEX },
  });
}
