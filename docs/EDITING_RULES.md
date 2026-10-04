# Editing rules: who changes what

Every change, by anyone, goes through a branch, a private preview and Serge's approval. Nothing is pushed to `main` directly.

## ChatGPT or Aya may change (on a branch, through a pull request)

- Text: headings, paragraphs, button labels, in any of the four languages.
- Images: replacing or adding images in `site/assets/` (WebP preferred, keep file sizes small).
- Styling: colours, spacing, fonts sizes and layout in `site/styles.css`.
- Page sections: adding, removing or reordering sections in `site/index.html`.
- Translations: the EN / FR / ES / AR strings in `site/app.js`, without changing how the language switch works.
- Links: Calendly, social and partner links.

## Stays with Shoaib

- The language system and Arabic right-to-left logic in `site/app.js`.
- Forms, and anything that sends or stores visitor data.
- The WordPress theme, plugins and database (once the site moves into WordPress).
- Server, DNS, Cloudflare, SSL and security settings.
- The deployment itself: previews, the staging update, backups, tags and rollback.
- Search-engine settings: `noindex`, redirects, sitemaps.
- Repository settings and access.

## Always

- One topic per branch, with a short, clear name (for example `update-hero-text`).
- Describe the change in the pull request in one or two sentences.
- Never commit a password, key, token or customer data.
- If a change touches anything in "Stays with Shoaib", ask Shoaib first.
