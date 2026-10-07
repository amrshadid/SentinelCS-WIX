import { Permissions, webMethod } from 'wix-web-module';
import wixData from 'wix-data';
import { DEFAULT_CONFIG } from 'backend/sentinel-defaults';

// CMS collections (create them in the Wix CMS; both are optional):
//   SentinelSettings  one row. Optional fields: brandName, homeUrl, signInLabel, signInUrl, ctaLabel,
//                     ctaShortLabel, ctaUrl, accountLabel, accountUrl, tag, headline, headlineEmphasis,
//                     invitation, footerCtaLabel, caption, brandCopy, productLabel, productSub,
//                     productUrl, legal
//   SentinelLinks     one row per link. Fields: area ("header" or "footer"), column (footer column title),
//                     columnText (optional paragraph under a footer column), label, url, newTab (boolean),
//                     demo (boolean), order (number), visible (boolean, default true)

const read = (collection, build) =>
  build(wixData.query(collection)).find({ suppressAuth: true }).then((r) => r.items).catch(() => []);

const pick = (value, fallback) => (typeof value === 'string' && value.trim() ? value.trim() : fallback);

export const getChromeConfig = webMethod(Permissions.Anyone, async () => {
  const cfg = JSON.parse(JSON.stringify(DEFAULT_CONFIG));
  const [settings] = await read('SentinelSettings', (q) => q.limit(1));
  const links = (await read('SentinelLinks', (q) => q.ascending('order').limit(100))).filter((l) => l.visible !== false);

  if (settings) {
    cfg.brand.name = pick(settings.brandName, cfg.brand.name);
    cfg.brand.homeUrl = pick(settings.homeUrl, cfg.brand.homeUrl);
    cfg.header.signIn.label = pick(settings.signInLabel, cfg.header.signIn.label);
    cfg.header.signIn.url = pick(settings.signInUrl, cfg.header.signIn.url);
    cfg.header.cta.label = pick(settings.ctaLabel, cfg.header.cta.label);
    cfg.header.cta.shortLabel = pick(settings.ctaShortLabel, cfg.header.cta.shortLabel);
    cfg.header.cta.url = pick(settings.ctaUrl, cfg.header.cta.url);
    if (settings.accountUrl) cfg.header.account = { label: pick(settings.accountLabel, 'My account'), url: settings.accountUrl };
    const f = cfg.footer;
    f.tag = pick(settings.tag, f.tag);
    f.headline = pick(settings.headline, f.headline);
    f.headlineEmphasis = pick(settings.headlineEmphasis, f.headlineEmphasis);
    f.invitation = pick(settings.invitation, f.invitation);
    f.cta.label = pick(settings.footerCtaLabel, f.cta.label);
    f.cta.url = pick(settings.ctaUrl, f.cta.url);
    f.caption = pick(settings.caption, f.caption);
    f.brandCopy = pick(settings.brandCopy, f.brandCopy);
    f.product.label = pick(settings.productLabel, f.product.label);
    f.product.sub = pick(settings.productSub, f.product.sub);
    f.product.url = pick(settings.productUrl, f.product.url);
    f.legal = pick(settings.legal, f.legal);
  }

  const toLink = (l) => ({ label: l.label, url: l.url, newTab: !!l.newTab, demo: !!l.demo });
  const header = links.filter((l) => l.area === 'header' && l.label && l.url);
  if (header.length) cfg.header.nav = header.map(toLink);

  const footer = links.filter((l) => l.area === 'footer' && l.label && l.url);
  if (footer.length) {
    const columns = [];
    footer.forEach((l) => {
      const title = l.column || '';
      let col = columns.find((c) => c.title === title);
      if (!col) columns.push((col = { title, links: [] }));
      if (l.columnText && !col.text) col.text = l.columnText;
      col.links.push(toLink(l));
    });
    cfg.footer.columns = columns;
  }
  return cfg;
});
