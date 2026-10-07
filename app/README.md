# Sentinel Wix app: native header and footer widgets

Two **site widgets** (Wix custom elements) with their own **Settings** panels, installed on the site as a Wix app.
They appear in the editor's **Add Elements** panel, can be dragged, stretched and edited like any Wix component,
and every text, link and button is a setting. No Server URL and no code in the page.

| Widget | Tag | Settings panel |
| --- | --- | --- |
| Sentinel Header | `sentinel-header` | brand, menu links, sign-in and demo buttons, shrink distance, floating on or off, theme |
| Sentinel Footer | `sentinel-footer` | invitation text and button, brand and product, link columns, legal line, theme |

The widget code is **generated** from `../design/` and `../tools/sentinel-element.class.js` by `npm run build` in the
repository root. Do not edit `sentinel-*.tsx`; edit the design files or the class and rebuild.

## First-time setup (you run these; they need your Wix login)

1. Create the app skeleton with Wix's own tool in a scratch folder, so its root files match the current CLI:
   `npm create @wix/app@latest sentinel-scratch` (choose an empty app, no sample extensions).
2. Copy its root files (`package.json`, `tsconfig.json`, `wix.config.json`, `astro.config.*`, `.gitignore` and any
   other file in the root, **not** `src/` or `public/`) into this `app/` folder. If `app/` already has a
   `package.json` from us, keep Wix's and add `@wix/design-system`, `@wix/editor` if they are missing.
3. In `app/`: `npm install`, then `npx wix login`.
4. `npx wix dev` and choose the test site (Site 1). The CLI links or creates the app and opens the editor.
5. In the editor open **Add (+) → Embed or Apps → Sentinel Header**, drop it in the header strip, and open **Settings**.
   Do the same with **Sentinel Footer** in the footer strip. They show in the Preview.

If the widgets show a placeholder in the Preview, Wix documents a workaround: restart `npx wix dev`, or run
`npx wix build` then `npx wix release` and preview again.

## Release to the live site

`npx wix build`, then `npx wix release` and follow the prompts to create an app version, then install that version
on the site with the direct install link. Nothing reaches visitors until you publish the site in the editor.

## What is native here, and what is not

* Native: Add panel entry, drag and resize, a Settings panel built with Wix's design system, properties stored with the
  component, Wix-hosted code, versions and releases.
* Not automatic: Wix can only auto-place a widget on the home page, not in the header or footer strips, so place each
  widget once in its strip (it then appears on every page).
