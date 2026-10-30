# SergeAbi.com — production cutover and WordPress recovery

**Status: preparation only.** A PR merge updates the Cloudflare Pages `main` staging deployment; it does not switch the official domain until the domain and `LIVE_HOST` settings are explicitly changed. Owner must separately authorize the live cutover.

## Architecture and expected launch behavior

- Public hostname: `https://sergeabi.com`, served by Cloudflare Pages (`sergeabistaging`, approved `main` branch).
- `www.sergeabi.com`, `staging.sergeabi.com`, and `sergeabistaging.pages.dev` redirect to the apex after launch (existing `functions/_middleware.js`).
- Git branch previews remain under Cloudflare Access and send `X-Robots-Tag: noindex, nofollow`.
- The existing WordPress site remains installed on its **original server**, with all files and database preserved as rollback. Do not cancel that hosting during the initial validation period.
- Zoho Mail delivery must continue: do not intentionally alter MX, SPF, DKIM, DMARC, domain verification or other mail-related DNS records.
- Analytics is currently inactive by design. The existing cookie banner must not be interpreted as permission to install GA4 without honoring users' choices.
- Crossroads Audit email delivery and Aya contact creation were observed on 30 October 2026, but the very-fast/stale anti-bot submission can return an erroneous success message; this is tracked for Shoaib and is a known pre-launch limitation. Do not suggest all Audit paths have passed.

## Completed source-code checks (2026-10-30)

- 7 HTML pages reviewed; 145 local links inspected, zero missing file destinations or anchor targets. This does **not** verify external services or visually click-test browsers.
- 10 simulated middleware requests passed for public apex, legacy WordPress routes, www/staging redirects, access protection and preview noindex.
- 8 cookie-script behavior checks passed (initial prompt, reject, accept, persistence, settings reopen, French label and consent notification).
- Canonical URLs verified in homepage, privacy, Journal index and three articles.
- `site/sitemap.xml` contains all six canonical public pages; `site/robots.txt` points to it.
- **Still required after cutover:** live HTTP checks, external links (WhatsApp, Calendly, stock images), real browser cookie testing, HTTPS/cert validation, SEO sitemap fetch, and actual mailbox send/receive.

## Gate 1 — preserve and verify the old WordPress installation

Do not switch DNS before these steps have been confirmed with evidence:

1. Identify the actual provider and server running the old `sergeabi.com` WordPress. WordPress.com account access is **not** proof of access to this self-hosted site.
2. Create a fresh backup of **both files and database** (including `wp-content/`, WordPress configuration, plugins and uploads); record timestamp, source server, filenames, checksums, and the matching database identity. Save an additional off-server copy.
3. If hosted at Hostinger, see their hPanel **Websites → Manage site → Backups**. Use **Create Backup** if available, then **Restore and download** to download file and database archives. Some plans do not offer on-demand backups; in that case use available automatic backups and a separate manual file/database export.
4. Test the restoration **on an isolated temporary host or local instance**. Confirm WordPress loads, administrator login works, core pages/media render and the expected database content exists. Do not test restoration by overwriting the current public WordPress installation.
5. Keep existing hosting and WordPress backups intact during launch, and record the original web origin IP(s), SSL and site backup owner.
6. Cloudflare → **DNS → Records → Advanced Actions → Export**: save the zone file and a screenshot of **all** current A/AAAA/CNAME, MX and TXT records, including existing proxy settings, before changing the web destination. Keep this backup in a secure location, not the public repository.

**Backup verification status: PENDING.** No provider dashboard access or files/database backup has yet been independently verified by ChatGPT.

## Gate 2 — owner-approved Cloudflare Pages cutover

**No switch until the owner explicitly approves this step after the backup gate.** Shoaib or an authorized Cloudflare account administrator performs and records the change:

1. Confirm that the final approved commit on `main` is deployed on `staging.sergeabi.com`, Cloudflare Pages `sergeabistaging` build output is `site/`, and the required production secrets (including `SITE_PASSWORD` and Audit integration keys) are present without exposing them.
2. Review the Cloudflare zone, CAA rules, any existing Access/WAF/Workers/Redirect rules, and the original website DNS records. Confirm the site's nameservers already use Cloudflare for the apex.
3. In **Workers & Pages → sergeabistaging → Custom domains → Set up a domain**, add `sergeabi.com`, then `www.sergeabi.com`. Let Cloudflare manage the necessary web CNAME/flattened apex records. Check for potential conflicts before confirming. **Preserve existing mail records and verify them afterward.**
4. In **Pages → Settings → Variables and Secrets**, set the **Production** variable `LIVE_HOST=sergeabi.com`. Redeploy the approved production build so the middleware publicly serves the apex. Do **not** add `LIVE_HOST` to private Preview.
5. Confirm the Pages custom domain is **Active** with valid HTTPS before announcing the switch. Inspect WAF/access rules if certificate validation is blocked.
6. Perform the live tests below immediately. Record exact deployment SHA, DNS changes, certificate state, URLs and testing timestamps.

References:
- https://developers.cloudflare.com/pages/configuration/custom-domains/
- https://developers.cloudflare.com/pages/functions/bindings/
- https://developers.cloudflare.com/dns/manage-dns-records/how-to/import-and-export/
- https://www.hostinger.com/support/5981435-how-to-download-backups-at-hostinger/
- https://www.hostinger.com/support/3989447-how-to-restore-a-wordpress-website-from-backups-in-hostinger/

## Gate 3 — public acceptance smoke test

Check from a new private browser window, not only a session that has staging credentials:

- `https://sergeabi.com/` returns 200, HTTPS, **no login**, and the newest design.
- `https://sergeabi.com/journal/` and all three articles return 200; article covers load.
- `https://www.sergeabi.com/journal/` redirects once to apex (301).
- `https://staging.sergeabi.com/` redirects to apex; private branch preview remains locked/noindex.
- `https://sergeabi.com/coaching-and-collaboration/` redirects to `/#coaching`.
- `https://sergeabi.com/sitemap_index.xml` redirects to `/sitemap.xml`.
- `https://sergeabi.com/robots.txt` and `https://sergeabi.com/sitemap.xml` are available; sitemap has six valid public URLs.
- Navigation, language switching, mobile layout, privacy, WhatsApp and Calendly work.
- Fresh browser shows cookie choices; declining is respected, accepting and reopening settings work, and no unconsented analytics loads.
- Verify inbound and outbound Zoho email at the domain, including SPF/DKIM/DMARC alignment; do not modify MX/TXT casually.
- Test one real Audit report delivery and Aya lead record with a consenting test inbox, and track the known timing false-success issue separately.
- Confirm unknown URL displays a genuine not-found response/page.

## Rollback if any cutover check fails

1. Use the saved DNS zone export/screenshot to identify and restore the original web-only A/AAAA/CNAME records and proxy settings **without touching mail DNS**. Follow Cloudflare's custom-domain detachment steps if necessary: remove the Pages custom domain and the Pages DNS CNAME appropriately.
2. Remove `LIVE_HOST` from Cloudflare Pages Production (or reset the former prelaunch configuration) and redeploy to restore the private main deployment.
3. Confirm the original WordPress website responds on the public domain (200, correct content/HTTPS). Check WP admin and Zoho email, then verify old SEO routes.
4. Confirm Cloudflare Pages' public URL no longer accidentally exposes a duplicate indexable site.
5. Record incident and deployment state; keep the new GitHub work intact for a later cutover.

**Do not actually restore the WordPress backup onto its original hosting unless those files/database are missing or damaged.** DNS rollback alone should be sufficient while the original installation is preserved.
