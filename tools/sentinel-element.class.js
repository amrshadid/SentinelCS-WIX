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
// (fixed position, floating compact bar, animated width/top/radius); here we only reserve its space.
const SHADOW_STYLE = `
:host{display:block;width:100%;font-family:'IBM Plex Sans',sans-serif;color:var(--ink)}
.shell{font:15px 'IBM Plex Sans',sans-serif}
.shell.is-header{min-height:108px}
.shell.dark{--paper:#0e1112;--surface:#161a1c;--ink:#edeae2;--teal:#5c9a93;--soft:#1e2e2c;--line:#262a2c}
.navigation a[aria-current="page"]:after{transform:scaleX(1)}
@media(max-width:900px){.shell.is-header{min-height:92px}}
.footer{min-height:100%}`;

const THEME_KEY = 'sentinel-theme';
const THEME_SYNC_EVENT = 'sentinel-theme-sync';
const COMPACT_ENTER_PX = 88; // the header shrinks past this scroll position
const COMPACT_LEAVE_PX = 40; // and expands again below this one, so it does not flicker
const MOBILE_QUERY = '(max-width: 900px)';

const prefersReducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

// "a\nb" becomes [ "a", <br>, "b" ] so line breaks survive without ever parsing HTML.
const withLineBreaks = (text) =>
  text.split('\n').flatMap((line, index) => (index ? [document.createElement('br'), line] : [line]));

class SentinelElement extends HTMLElement {
  static get observedAttributes() {
    return ['theme', 'compact', 'current-path', 'config'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    if (this.controller) return;
    this.controller = new AbortController();
    loadFont();
    this.isHeader = TAG === 'sentinel-header';
    this.shadowRoot.innerHTML =
      `<style>${STYLE}${SHADOW_STYLE}</style><div class="shell">${TEMPLATE}</div>`;
    this.shell = this.shadowRoot.querySelector('.shell');
    this.shell.classList.toggle('is-header', this.isHeader);
    this.arrowIcon = this.shadowRoot.querySelector('.login svg, .column a svg')?.cloneNode(true) || null;

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
  }

  attributeChangedCallback(name) {
    if (name === 'config') this.applyConfig();
    this.apply();
  }

  showYear() {
    this.shadowRoot.querySelector('.year')?.replaceChildren(String(new Date().getFullYear()));
  }

  // ---- events ----------------------------------------------------------------------------

  bindEvents(signal) {
    this.shadowRoot.addEventListener('click', (event) => this.onClick(event), { signal });
    this.shadowRoot.addEventListener('keydown', (event) => this.onKeydown(event), { signal });
    document.addEventListener('click', (event) => {
      if (!event.composedPath().includes(this)) this.setMenu(false);
    }, { signal });
    matchMedia(MOBILE_QUERY).addEventListener('change', () => this.setMenu(false), { signal });
    window.addEventListener(THEME_SYNC_EVENT, (event) => this.onThemeSync(event.detail), { signal });

    this.resizeObserver = new ResizeObserver(() => this.reportSize());
    this.resizeObserver.observe(this.shell);

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
    this.shadowRoot.querySelector('.mobile-toggle')?.focus();
  }

  watchScroll(signal) {
    let compact = false;
    let queued = false;
    let nested = 0; // scroll position of a scroll container other than the window
    const position = () => Math.max(window.scrollY, document.scrollingElement?.scrollTop || 0, nested);
    const update = () => {
      queued = false;
      const y = position();
      const next = compact ? y > COMPACT_LEAVE_PX : y > COMPACT_ENTER_PX;
      if (next === compact) return;
      compact = next;
      this.setAttribute('compact', String(compact));
    };
    const onScroll = (event) => {
      const target = event.target;
      nested = target instanceof Element ? target.scrollTop : 0;
      if (queued) return;
      queued = true;
      requestAnimationFrame(update);
    };
    // Capture phase: scroll events from containers do not bubble, so this also sees Wix's own scroller.
    document.addEventListener('scroll', onScroll, { passive: true, capture: true, signal });
    window.addEventListener('scroll', onScroll, { passive: true, signal });
    update();
  }

  // Tells the page what the visitor chose; the page decides where it leads (see public/sentinel-nav.js).
  navigate(key) {
    this.setMenu(false);
    const url = key === 'demo' ? this.demoUrl : undefined;
    this.dispatchEvent(new CustomEvent('sentinel-navigate', { detail: { key, url } }));
  }

  backToTop() {
    window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
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
    this.shadowRoot.querySelector('.header')?.classList.toggle('is-compact', this.getAttribute('compact') === 'true');

    const toggle = this.shadowRoot.querySelector('.theme-toggle');
    toggle?.setAttribute('aria-pressed', String(dark));
    toggle?.setAttribute('aria-label', dark ? 'Switch to light theme' : 'Switch to dark theme');

    const currentPath = this.getAttribute('current-path');
    this.shadowRoot.querySelectorAll('a').forEach((link) => {
      if (currentPath && link.getAttribute('href') === currentPath) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });
  }

  isMenuOpen() {
    return this.shadowRoot.querySelector('.header')?.classList.contains('menu-open') ?? false;
  }

  setMenu(open) {
    const header = this.shadowRoot.querySelector('.header');
    const toggle = this.shadowRoot.querySelector('.mobile-toggle');
    if (!header || !toggle) return;
    header.classList.toggle('menu-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
    this.reportSize();
  }

  // The host element is sized to its content so Wix reserves the right amount of room.
  reportSize() {
    const height = Math.ceil(this.shell.getBoundingClientRect().height);
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
    if (!config) return;

    this.renderBrand(config.brand || {});
    this.demoUrl = config.header?.cta?.url || config.footer?.cta?.url || this.demoUrl;
    if (config.header) this.renderHeader(config.header);
    if (config.footer) this.renderFooter(config.footer);
    this.apply();
  }

  setText(selector, value) {
    const element = this.shadowRoot.querySelector(selector);
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
    const links = this.shadowRoot.querySelectorAll('.brand, .footer-logo');
    if (name) {
      links.forEach((link) => link.setAttribute('aria-label', `${name} home`));
      this.shadowRoot.querySelectorAll('.wordmark, .footer-logo img').forEach((image) => { image.alt = name; });
    }
    if (homeUrl) links.forEach((link) => { link.href = homeUrl; });
  }

  renderHeader({ nav, signIn, cta }) {
    const navigation = this.shadowRoot.querySelector('.navigation');
    if (navigation && Array.isArray(nav)) {
      navigation.replaceChildren(...nav.map((item) => this.makeLink(item)));
      if (signIn) navigation.append(this.makeLink(signIn, 'mobile-extra'));
    }
    const login = this.shadowRoot.querySelector('.login');
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
    const root = this.shadowRoot;
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
    const grid = this.shadowRoot.querySelector('.grid');
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
