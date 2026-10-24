# Follow-up: localized documentation

Out of scope for the Doqs adoption (Doqs 0.11.0 has one content tree, English chrome and one Pagefind index; see Doqs
`docs/adoption/consumer-parity.md`). Nothing here implements localization or invents Doqs APIs. What the site already
does so a later localized release is a small change:

- **Identities are language-neutral.** Example ids (`enter`, `signals`, …) and demo slugs live in
  `src/app/motion-examples/registry.ts` and `demo-links.ts`; labels are the only text. Guides, demos and the API reference link
  by path, not by title.
- **Site constants are in one place:** `src/app/shared/site.ts` (origin, GitHub, npm, default description). UI strings in
  home sections are still inline in their components — the part that has to move to a catalog first.
- **Route assumptions are explicit:** `src/doq.paths.ts` (`contentDirectory`, `basePath`) feeds both the app and the prerender
  list; `src/site-routes.ts` derives host routes from the pages folder; the sitemap is generated from the HTML the build
  actually produced (`scripts/finalize-site.mjs`), so locale-prefixed pages will be listed automatically — but it needs
  `hreflang` alternates added then.
- **Content is separate from presentation:** Markdown in `src/authoring/docs`; playground wrappers are presentation-free.

## Remaining work when Doqs ships a locale-aware tree

1. A content tree per locale (authoring + generated) and a `doq.content.json` target per locale; `doq-api` output is
   English-only and can be shared.
2. One Pagefind index per locale (or a locale filter) and translated chrome labels.
3. Host: language switch in the navbar, `hreflang` + localized canonical in `SeoService`, localized `description` for the home page
   and `index.html` fallbacks, translated demo gallery labels (`DEMO_GROUPS`, `DEMO_LINKS` labels).
4. Do **not** ship `/es` or `/uk` docs routes before step 1: Analog would serve the raw Markdown without Doqs chrome (observed
   by the Volt UI proof).
