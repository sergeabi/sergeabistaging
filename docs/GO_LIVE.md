# Putting sergeabi.com live

This site replaces the WordPress site at sergeabi.com. The WordPress site keeps running on the server, untouched,
so it stays available as the rollback.

## How it works after go-live

- `main` is the live site. Every change still goes through a branch, a private preview and your approval in a pull
  request. That approval is the decision to publish.
- Branch previews (`<branch>.sergeabistaging.pages.dev`) stay behind Cloudflare Access and are never indexed. They
  are the staging copy of each change.
- `staging.sergeabi.com`, `www.sergeabi.com` and `sergeabistaging.pages.dev` move permanently to `sergeabi.com`.
- The old WordPress addresses move permanently to the matching place on the new page:
  - `/coaching-and-collaboration/` goes to the Coaching section.
  - `/home-french/` and the rest go to the home page.
- Search engines can index `sergeabi.com`. There is a sitemap, `robots.txt` points to it, and an unknown address gets
  a proper "not found" page.
- Email is not affected: the Zoho MX, SPF and verification records stay exactly as they are.

## The switch (about 10 minutes, in Cloudflare)

1. Merge the go-live pull request. Nothing changes yet: every address still asks for the login.
2. Take a screenshot of the DNS records of sergeabi.com (Cloudflare → sergeabi.com → DNS). This is the rollback
   reference.
3. Pages → sergeabistaging → Custom domains: add `sergeabi.com`, then `www.sergeabi.com`. Cloudflare replaces the
   two A records of sergeabi.com with the Pages record. MX and TXT records stay as they are. For a minute or two
   sergeabi.com shows the login: that is expected.
4. Pages → sergeabistaging → Settings → Variables and Secrets: add `LIVE_HOST` = `sergeabi.com` (Production), then
   redeploy the latest deployment. The site is live.
5. Check:
   - `https://sergeabi.com` opens without a login.
   - `https://www.sergeabi.com` and `https://staging.sergeabi.com` land on it.
   - `https://sergeabi.com/coaching-and-collaboration/` lands on the Coaching section.
   - Send a test email to an @sergeabi.com address.

## Rollback (about 5 minutes)

1. Pages → Custom domains: remove `sergeabi.com` and `www.sergeabi.com`.
2. DNS: put back the two A records from the screenshot (proxied). WordPress answers again.
3. Pages → Variables: remove `LIVE_HOST` and redeploy. Every Pages address asks for the login again.

## Before the switch

- The audit form ("Send me the Audit") does not send or store anything yet. On the live site a visitor would agree to
  receive the audit and get nothing. Choose one:
  - connect it first: the email tool sends the audit, and the contact is saved in Aya's CRM with the consent;
  - or show a "coming soon" note with the free-call link until it is connected.
- Analytics: the page has no GA4 or Google Tag Manager tag yet. Add the tag before the switch, so visits are counted
  from day one.
