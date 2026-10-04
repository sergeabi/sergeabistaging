# sergeabi.com: website source

`main` is the approved staging baseline. What is on `main` is what runs on **staging.sergeabi.com**.

## How a change reaches the site

1. Every change is made on its own branch (never on `main`).
2. The branch gets its own private preview link, behind a login. Staging does not change.
3. Serge reviews the preview and approves the pull request.
4. The branch is merged into `main`. `main` is protected: only a reviewed pull request can change it.
5. Staging updates automatically from `main`. A version tag and a backup are made before every update, so rollback is one step.
6. The live site (sergeabi.com) changes only after Serge approves the switch.

## Layout

| Path | What it is |
|---|---|
| `site/index.html` | The homepage: structure and text |
| `site/styles.css` | All styling, desktop and mobile |
| `site/app.js` | Menu, reading progress, effects, and the EN / FR / ES / AR language system (Arabic is right-to-left) |
| `site/assets/` | Images (WebP) and the Manrope font |
| `site/favicon.svg` | Browser tab icon |
| `docs/EDITING_RULES.md` | What ChatGPT or Aya may change, and what stays with Shoaib |

## Notes

- The page carries `noindex, nofollow` on purpose while it is staging. It is replaced only for the live switch.
- No password, key or customer data is ever committed to this repository.
- Baseline: Serge's migration package of 3 Oct 2026, all 11 files checked against his checksums; asset links made local. Tag `baseline-2026-10-04`.
