// Navigation for the <sentinel-header> and <sentinel-footer> custom elements.
// The elements only announce a destination key; this file decides where it goes.

// key -> page path or in-page anchor. Edit here when a page URL changes.
export const ROUTES = {
  home: '/',
  demo: '/get-started',
  Product: '/#product',
  Workflow: '/#workflow',
  Deployment: '/#deployment',
  Questions: '/#questions',
  'Single Timepoint Analysis': '/#single',
  'Longitudinal Analysis': '/#longitudinal',
  'Interactive Review': '/#review',
  'PACS Workflow': '/#workflow',
};

export function routeFor(key) {
  return ROUTES[key] || ROUTES.home;
}

export function wireSentinel($w, wixLocation) {
  const elements = $w('CustomElement');
  const currentPath = '/' + wixLocation.path.join('/');

  elements.forEach((element) => {
    element.on('sentinel-navigate', (event) => {
      const key = event && event.detail ? event.detail.key : 'home';
      wixLocation.to(routeFor(key));
    });
    try {
      element.setAttribute('current-path', currentPath);
    } catch (error) {
      // Not a Sentinel element, or the attribute is not supported: nothing to do.
    }
  });
}
