// Connects the <sentinel-header> and <sentinel-footer> custom elements to Wix:
// content from the CMS, the visitor's sign-in state, the current page, and navigation.

import { authentication } from 'wix-members-frontend';
import { session } from 'wix-storage-frontend';
import { getChromeConfig } from 'backend/sentinel-config.web';

const CACHE_KEY = 'sentinel-chrome-config';
const CACHE_MS = 5 * 60 * 1000;

// Used when an element announces a key without a URL.
export const ROUTES = { home: '/', demo: '/get-started' };
export const routeFor = (key) => ROUTES[key] || ROUTES.home;

async function loadConfig() {
  try {
    const cached = JSON.parse(session.getItem(CACHE_KEY) || 'null');
    if (cached && Date.now() - cached.at < CACHE_MS) return cached.config;
  } catch (error) {
    // No usable cache: fetch fresh.
  }
  const config = await getChromeConfig();
  try {
    session.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), config }));
  } catch (error) {
    // Storage unavailable: the config is simply not cached.
  }
  return config;
}

// A signed-in member sees the account link instead of "Sign in" when the CMS defines one.
function forVisitor(config, loggedIn) {
  const account = config.header && config.header.account;
  if (!loggedIn || !account) return config;
  return { ...config, header: { ...config.header, signIn: { label: account.label, url: account.url, newTab: false } } };
}

export async function wireSentinel($w, wixLocation) {
  const elements = $w('CustomElement');
  const currentPath = '/' + wixLocation.path.join('/');
  const config = await loadConfig();

  const render = () => {
    const payload = JSON.stringify(forVisitor(config, authentication.loggedIn()));
    elements.forEach((element) => {
      try {
        element.setAttribute('config', payload);
        element.setAttribute('current-path', currentPath);
      } catch (error) {
        // Not a Sentinel element: ignore.
      }
    });
  };

  elements.forEach((element) => {
    element.on('sentinel-navigate', (event) => {
      const detail = (event && event.detail) || {};
      wixLocation.to(detail.url || routeFor(detail.key));
    });
  });

  render();
  authentication.onLogin(render);
  authentication.onLogout(render);
}
