# Field Notes — publishing workflow

**Status:** The English-first journal landing page is prepared, but no essays are published in Step 2.

## URLs
- Archive: `/journal/`
- Articles: `/journal/descriptive-article-slug/`, using `site/journal/<slug>/index.html`
- Additional language routes (future): `/fr/journal/`, `/es/journal/`, `/ar/journal/` — only create `hreflang` when the real pages exist.

## Editorial themes
- **Life Transitions:** purpose, decisions, identity and life resets.
- **Consciousness:** meditation, awareness, breathwork and practical presence.
- **Freedom & Entrepreneurship:** meaningful work, independent thinking, autonomy.
- **Journeys & Reflections:** first-hand travel, retreat experiences and lessons.

Categories remain thematic sections, not thin standalone taxonomy pages. Add category archive URLs only after sufficient substantial posts exist.

## Repeat for each post
1. Research reader intent and confirm a helpful, specific topic.
2. Write an original essay based on real experience or carefully fact-checked knowledge; distinguish personal belief from scientific evidence.
3. Copy `docs/journal-article-template.html` into `site/journal/<slug>/index.html`; replace **every** `{{PLACEHOLDER}}`. Never deploy the incomplete template.
4. Fill canonical, title, description, real date, preview image, alt text, byline, `BlogPosting` JSON-LD, and related content links accurately.
5. Optimize image assets, preferably WebP/AVIF with original or properly licensed media.
6. Update `site/journal/index.html` with a **real** article card, category, date, excerpt and a live link.
7. Link naturally to `/#audit`, `/#coaching` or other published pieces when relevant.
8. **Shoaib coordinates** sitemap updates, indexing policy and any redirects according to `docs/EDITING_RULES.md`. Preserve staging noindex.
9. Review desktop, mobile, accessibility, links and content in a private branch preview; merge only after Serge approves.

## Initial article angles — not yet published
1. *7 Signs You May Need a Life Reset — and Where to Begin* (life transitions → Crossroads Audit).
2. *Finding Direction When You Feel Lost: A Practical Starting Point* (purpose → coaching).
3. *Leaving Corporate Life: What My Search for Freedom Taught Me* (experience → freedom/entrepreneurship).

Validate search intent before final titles. Start with one reviewed article per week. Keep the first articles English-first; other languages should receive native editorial review rather than automatic bulk translation.

## Technical scope
Static HTML pages are directly crawlable and can be maintained through GitHub PRs; no CMS or database is required yet. The landing page does not invent sample posts. Sitemap and go-live infrastructure remain separate approval tasks.
