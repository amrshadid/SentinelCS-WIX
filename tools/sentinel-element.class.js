// Behaviour of <sentinel-header> and <sentinel-footer>.
// STYLE, TEMPLATE and TAG are generated from design/ by tools/build-sentinel-elements.mjs and are
// declared above this code in each file of src/public/custom-elements/ (one element per file).

const FONT_URL = 'https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&display=swap';

// Browsers ignore @font-face inside a shadow root, so the font is loaded once on the page itself.
function loadFont() {
  if (document.getElementById('sentinel-font')) return;
  const link = document.createElement('link');
  link.id = 'sentinel-font';
  link.rel = 'stylesheet';
  link.href = FONT_URL;
  document.head.append(link);
}

// Rules that only exist inside the shadow DOM. The header keeps the reference design's own CSS
// (fixed position, floating compact bar, animated width/top/radius); here we only reserve its space
// and let clicks through everywhere except on the bar itself.
const SHADOW_STYLE = `
.shell.is-layer{pointer-events:none;min-height:0}
.shell.is-layer .header{pointer-events:auto}
:host{display:block;width:100%;font-family:'IBM Plex Sans',sans-serif;color:var(--ink)}
.shell{font:15px 'IBM Plex Sans',sans-serif}
.shell.is-header:not(.is-layer){min-height:108px}
.shell.dark{--paper:#0e1112;--surface:#161a1c;--ink:#edeae2;--teal:#5c9a93;--soft:#1e2e2c;--line:#262a2c}
.navigation a[aria-current="page"]:after{transform:scaleX(1)}
@media(max-width:900px){.shell.is-header:not(.is-layer){min-height:92px}}
.footer{min-height:100%}`;

const THEME_KEY = 'sentinel-theme';
const THEME_SYNC_EVENT = 'sentinel-theme-sync';
const COMPACT_ENTER_PX = 88; // default scroll position where the header shrinks (attribute: compact-at)
const COMPACT_HYSTERESIS_PX = 48; // it expands again this much higher up, so it does not flicker
const HEADER_HEIGHT = { desktop: 108, mobile: 92 };
const MOBILE_QUERY = '(max-width: 900px)';

// Wix pages can scroll inside a container instead of the window; these are checked as well as the
// element that last reported a scroll.
const KNOWN_SCROLLERS = ['#SITE_CONTAINER', '#site-root', '#PAGES_CONTAINER'];
let lastScroller = null;

const prefersReducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

// "a\nb" becomes [ "a", <br>, "b" ] so line breaks survive without ever parsing HTML.
const withLineBreaks = (text) =>
  text.split('\n').flatMap((line, index) => (index ? [document.createElement('br'), line] : [line]));

// Attributes that only change how the element looks; every other attribute carries content.
const STATE_ATTRIBUTES = ['theme', 'compact', 'current-path'];

class SentinelElement extends HTMLElement {
  static get observedAttributes() {
    return [
      'theme', 'compact', 'current-path', 'config',
      // Editor settings (Custom Element -> Settings -> Attributes). They win over the CMS content.
      'brand-name', 'home-url', 'sign-in-label', 'sign-in-url', 'cta-label', 'cta-short-label', 'cta-url',
    ];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    if (this.controller) return;
    this.controller = new AbortController();
    loadFont();
    console.info(`SENTINEL: <${TAG}> connected, build ${BUILD}`);
    this.isHeader = TAG === 'sentinel-header';
    this.root = this.createRoot();
    this.root.innerHTML =
      `<style>${STYLE}${SHADOW_STYLE}</style><div class="shell">${TEMPLATE}</div>`;
    this.shell = this.root.querySelector('.shell');
    this.shell.classList.toggle('is-header', this.isHeader);
    this.shell.classList.toggle('is-layer', Boolean(this.layer));
    this.arrowIcon = this.root.querySelector('.login svg, .column a svg')?.cloneNode(true) || null;

    this.showYear();
    this.restoreTheme();
    this.bindEvents(this.controller.signal);
    this.applyConfig();
    this.apply();
    this.dispatchEvent(new CustomEvent('sentinel-ready'));
    console.info(`SENTINEL: <${this.tagName.toLowerCase()}> connected (${this.isHeader ? 'header' : 'footer'})`);
  }

  disconnectedCallback() {
    this.controller?.abort();
    this.controller = null;
    this.resizeObserver?.disconnect();
    this.layer?.remove();
    this.layer = null;
  }

  // Wix wraps every element in positioned containers, which stops `position: fixed` from following
  // the screen. So the header draws itself in a layer attached to <body>, always fixed to the
  // viewport as in the reference design; the Wix box only reserves its space. mode="inline" keeps
  // it inside the Wix box instead. The footer always stays inside its box.
  createRoot() {
    if (!this.isHeader || this.getAttribute('mode') === 'inline') return this.shadowRoot;
    this.layer = document.createElement('div');
    this.layer.className = 'sentinel-header-layer';
    this.layer.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:2147483000;pointer-events:none';
    document.body.append(this.layer);
    return this.layer.attachShadow({ mode: 'open' });
  }

  attributeChangedCallback(name) {
    if (!STATE_ATTRIBUTES.includes(name)) this.applyConfig();
    this.apply();
  }

  showYear() {
    this.root.querySelector('.year')?.replaceChildren(String(new Date().getFullYear()));
  }

  // ---- events ----------------------------------------------------------------------------

  bindEvents(signal) {
    this.root.addEventListener('click', (event) => this.onClick(event), { signal });
    this.root.addEventListener('keydown', (event) => this.onKeydown(event), { signal });
    document.addEventListener('click', (event) => {
      const path = event.composedPath();
      if (!path.includes(this) && !(this.layer && path.includes(this.layer))) this.setMenu(false);
    }, { signal });
    matchMedia(MOBILE_QUERY).addEventListener('change', () => this.setMenu(false), { signal });
    window.addEventListener(THEME_SYNC_EVENT, (event) => this.onThemeSync(event.detail), { signal });

    this.resizeObserver = new ResizeObserver(() => this.reportSize());
    this.resizeObserver.observe(this.shell);

    document.addEventListener('scroll', (event) => {
      if (event.target instanceof Element && event.target.scrollTop > 0) lastScroller = event.target;
    }, { passive: true, capture: true, signal });

    if (this.isHeader && this.getAttribute('auto-compact') !== 'false') this.watchScroll(signal);
  }

  onClick(event) {
    const link = event.target.closest('a');
    const button = event.target.closest('button');

    if (button?.matches('.theme-toggle')) this.toggleTheme();
    else if (button?.matches('.mobile-toggle')) this.setMenu(!this.isMenuOpen());
    else if (button?.matches('.back')) this.backToTop();
    else if (button?.matches('[data-demo]') || link?.matches('[data-demo]')) {
      event.preventDefault();
      this.navigate('demo');
    }
    if (link) this.setMenu(false);
  }

  onKeydown(event) {
    if (event.key !== 'Escape' || !this.isMenuOpen()) return;
    this.setMenu(false);
    this.root.querySelector('.mobile-toggle')?.focus();
  }

  watchScroll(signal) {
    let compact = false;
    let nested = 0; // scroll position of a scroll container other than the window
    let reported = false;
    const position = () => Math.max(window.scrollY, document.scrollingElement?.scrollTop || 0, nested);
    const update = () => {
      const enter = Number(this.getAttribute('compact-at')) || COMPACT_ENTER_PX;
      const y = position();
      const next = compact ? y > Math.max(0, enter - COMPACT_HYSTERESIS_PX) : y > enter;
      if (next === compact) return;
      compact = next;
      this.setAttribute('compact', String(compact));
      console.info(`SENTINEL: header ${compact ? 'compact' : 'expanded'} at scroll ${Math.round(y)}px`);
    };
    const onScroll = (event) => {
      const target = event.target;
      nested = target instanceof Element ? target.scrollTop : 0;
      if (!reported) {
        reported = true;
        const name = target instanceof Element ? `#${target.id || target.tagName.toLowerCase()}` : 'the window';
        console.info(`SENTINEL: first scroll seen from ${name} (window ${Math.round(window.scrollY)}px, container ${Math.round(nested)}px)`);
      }
      update();
    };
    // Capture phase: scroll events from containers do not bubble, so this also sees Wix's own scroller.
    document.addEventListener('scroll', onScroll, { passive: true, capture: true, signal });
    window.addEventListener('scroll', onScroll, { passive: true, signal });
    // Safety net in case the page scrolls without delivering events to us.
    const timer = setInterval(update, 150);
    signal.addEventListener('abort', () => clearInterval(timer));
    update();
  }

  // Tells the page what the visitor chose; the page decides where it leads (see public/sentinel-nav.js).
  navigate(key) {
    this.setMenu(false);
    const url = key === 'demo' ? this.demoUrl : undefined;
    this.dispatchEvent(new CustomEvent('sentinel-navigate', { detail: { key, url } }));
  }

  // Scrolls every candidate to the top: the window, the document, the container that last scrolled
  // and Wix's usual page containers. Only the one that actually scrolls moves.
  backToTop() {
    const smooth = this.getAttribute('smooth-scroll') !== 'false' && !prefersReducedMotion();
    const behavior = smooth ? 'smooth' : 'auto';
    const targets = [
      window, document.scrollingElement, document.body, lastScroller,
      ...KNOWN_SCROLLERS.map((selector) => document.querySelector(selector)),
    ];
    targets.filter(Boolean).forEach((target) => target.scrollTo?.({ top: 0, behavior }));
    this.dispatchEvent(new CustomEvent('sentinel-top'));
  }

  // ---- theme -----------------------------------------------------------------------------

  restoreTheme() {
    try {
      const saved = localStorage.getItem(THEME_KEY);
      if (saved === 'dark' || saved === 'light') this.setAttribute('theme', saved);
    } catch (error) {
      // Storage is blocked (private mode): the theme simply is not remembered.
    }
  }

  toggleTheme() {
    const theme = this.getAttribute('theme') === 'dark' ? 'light' : 'dark';
    this.setAttribute('theme', theme);
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch (error) {
      // Not remembered; the elements on this page still stay in sync below.
    }
    window.dispatchEvent(new CustomEvent(THEME_SYNC_EVENT, { detail: { theme, source: this } }));
    this.dispatchEvent(new CustomEvent('sentinel-theme', { detail: { theme } }));
  }

  onThemeSync({ theme, source }) {
    if (source !== this && this.getAttribute('theme') !== theme) this.setAttribute('theme', theme);
  }

  // ---- state shown on screen ---------------------------------------------------------------

  apply() {
    if (!this.shell) return;
    const dark = this.getAttribute('theme') === 'dark';
    this.shell.classList.toggle('dark', dark);
    this.root.querySelector('.header')?.classList.toggle('is-compact', this.getAttribute('compact') === 'true');

    const toggle = this.root.querySelector('.theme-toggle');
    toggle?.setAttribute('aria-pressed', String(dark));
    toggle?.setAttribute('aria-label', dark ? 'Switch to light theme' : 'Switch to dark theme');

    const currentPath = this.getAttribute('current-path');
    this.root.querySelectorAll('a').forEach((link) => {
      if (currentPath && link.getAttribute('href') === currentPath) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });
  }

  isMenuOpen() {
    return this.root.querySelector('.header')?.classList.contains('menu-open') ?? false;
  }

  setMenu(open) {
    const header = this.root.querySelector('.header');
    const toggle = this.root.querySelector('.mobile-toggle');
    if (!header || !toggle) return;
    header.classList.toggle('menu-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
    this.reportSize();
  }

  // The host element is sized to its content so Wix reserves the right amount of room.
  reportSize() {
    const reserved = matchMedia(MOBILE_QUERY).matches ? HEADER_HEIGHT.mobile : HEADER_HEIGHT.desktop;
    const height = this.layer ? reserved : Math.ceil(this.shell.getBoundingClientRect().height);
    if (height === this.lastHeight) return;
    this.lastHeight = height;
    this.style.height = `${height}px`;
    this.dispatchEvent(new CustomEvent('sentinel-size', { detail: { height } }));
  }

  // ---- content from the `config` attribute (JSON built in backend/sentinel-config.web.js) -----
  // Text is always assigned as text, never parsed as HTML, so CMS content cannot inject markup.

  applyConfig() {
    if (!this.shell) return;
    let config = null;
    try {
      config = JSON.parse(this.getAttribute('config') || 'null');
    } catch (error) {
      return;
    }
    config = this.withEditorSettings(config);
    if (!config) return;

    this.renderBrand(config.brand || {});
    this.demoUrl = config.header?.cta?.url || config.footer?.cta?.url || this.demoUrl;
    if (config.header) this.renderHeader(config.header);
    if (config.footer) this.renderFooter(config.footer);
    this.apply();
  }

  // Values typed into the element's Settings -> Attributes panel in the Wix editor.
  withEditorSettings(config) {
    const attr = (name) => this.getAttribute(name) || undefined;
    const brand = { name: attr('brand-name'), homeUrl: attr('home-url') };
    const signIn = { label: attr('sign-in-label'), url: attr('sign-in-url') };
    const cta = { label: attr('cta-label'), shortLabel: attr('cta-short-label'), url: attr('cta-url') };
    const set = (target, values) => Object.entries(values).forEach(([key, value]) => {
      if (value !== undefined) target[key] = value;
    });
    if (![brand, signIn, cta].some((values) => Object.values(values).some((value) => value !== undefined))) return config;

    const merged = { ...(config || {}) };
    merged.brand = { ...merged.brand };
    merged.header = { ...merged.header, signIn: { newTab: true, ...merged.header?.signIn }, cta: { ...merged.header?.cta } };
    set(merged.brand, brand);
    set(merged.header.signIn, signIn);
    set(merged.header.cta, cta);
    return merged;
  }

  setText(selector, value) {
    const element = this.root.querySelector(selector);
    if (element && typeof value === 'string') element.textContent = value;
  }

  // Replaces the first text of an element but keeps its icons and nested spans.
  setLabel(element, value) {
    if (!element || typeof value !== 'string') return;
    const text = [...element.childNodes].find((node) => node.nodeType === Node.TEXT_NODE && node.textContent.trim());
    if (text) text.textContent = `${value} `;
    else element.prepend(document.createTextNode(`${value} `));
  }

  makeLink({ label, url, newTab, demo }, className) {
    const link = document.createElement('a');
    link.textContent = label || '';
    link.href = url || '#';
    if (className) link.className = className;
    if (demo) link.setAttribute('data-demo', '');
    if (newTab) {
      link.target = '_blank';
      link.rel = 'noopener';
      if (this.arrowIcon) link.append(' ', this.arrowIcon.cloneNode(true));
    }
    return link;
  }

  renderBrand({ name, homeUrl }) {
    const links = this.root.querySelectorAll('.brand, .footer-logo');
    if (name) {
      links.forEach((link) => link.setAttribute('aria-label', `${name} home`));
      this.root.querySelectorAll('.wordmark, .footer-logo img').forEach((image) => { image.alt = name; });
    }
    if (homeUrl) links.forEach((link) => { link.href = homeUrl; });
  }

  renderHeader({ nav, signIn, cta }) {
    const navigation = this.root.querySelector('.navigation');
    if (navigation && Array.isArray(nav)) {
      navigation.replaceChildren(...nav.map((item) => this.makeLink(item)));
      if (signIn) navigation.append(this.makeLink(signIn, 'mobile-extra'));
    }
    const login = this.root.querySelector('.login');
    if (login && signIn) {
      login.href = signIn.url || '#';
      login.target = signIn.newTab === false ? '' : '_blank';
      this.setLabel(login, signIn.label);
    }
    if (cta) {
      this.setText('.cta .long-label', cta.label);
      this.setText('.cta .short-label', cta.shortLabel || cta.label);
    }
  }

  renderFooter(footer) {
    const root = this.root;
    this.setText('.tag', footer.tag);
    this.setText('.demo-caption', footer.caption);

    const headline = root.querySelector('.topline h2');
    if (headline && typeof footer.headline === 'string') {
      const emphasis = document.createElement('em');
      emphasis.textContent = footer.headlineEmphasis || '';
      headline.replaceChildren(footer.headline, document.createElement('br'), emphasis);
    }
    const invitation = root.querySelector('.invitation');
    if (invitation && typeof footer.invitation === 'string') invitation.replaceChildren(...withLineBreaks(footer.invitation));
    const brandCopy = root.querySelector('.brand-copy');
    if (brandCopy && typeof footer.brandCopy === 'string') brandCopy.replaceChildren(...withLineBreaks(footer.brandCopy));
    if (footer.cta) this.setLabel(root.querySelector('.demo-block .cta'), footer.cta.label);

    const badge = root.querySelector('.product-badge');
    if (badge && footer.product) {
      badge.href = footer.product.url || '#';
      this.setLabel(badge, footer.product.label);
      this.setLabel(badge.querySelector('span'), footer.product.sub);
    }
    if (Array.isArray(footer.columns)) this.renderColumns(footer.columns);

    const legal = root.querySelector('.bottom > span');
    if (legal && typeof footer.legal === 'string') {
      const year = document.createElement('span');
      year.className = 'year';
      legal.replaceChildren('© ', year, ' ', ...withLineBreaks(footer.legal));
      this.showYear();
    }
  }

  renderColumns(columns) {
    const grid = this.root.querySelector('.grid');
    if (!grid) return;
    grid.querySelectorAll('.column').forEach((column) => column.remove());
    columns.forEach(({ title, links = [], text }) => {
      const column = document.createElement('div');
      column.className = text ? 'column deployment' : 'column';
      const heading = document.createElement('h3');
      heading.textContent = title || '';
      column.append(heading, ...links.map((item) => this.makeLink(item)));
      if (text) {
        const paragraph = document.createElement('p');
        paragraph.textContent = text;
        column.append(paragraph);
      }
      grid.append(column);
    });
  }
}
