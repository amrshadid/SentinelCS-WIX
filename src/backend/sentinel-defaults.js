// Shown when the CMS collections below are empty or unreachable.
// Edit the content in the CMS (SentinelSettings, SentinelLinks), not here.

export const PORTAL_URL = 'https://portal.laminate.nyuad.nyu.edu';

export const DEFAULT_CONFIG = {
  brand: { name: 'Sentinel Cloud Service', homeUrl: '/' },
  header: {
    nav: [
      { label: 'Product', url: '/#product' },
      { label: 'Workflow', url: '/#workflow' },
      { label: 'Deployment', url: '/#deployment' },
      { label: 'Questions', url: '/#questions' },
    ],
    signIn: { label: 'Sign in', url: PORTAL_URL, newTab: true },
    cta: { label: 'Book a demo', shortLabel: 'Demo', url: '/get-started' },
  },
  footer: {
    tag: 'LAMINATE, by Sentinel',
    headline: 'Discover lesions.',
    headlineEmphasis: 'Follow their story.',
    invitation: 'Take a closer look at LAMINATE, together.\nBring your team and your questions.',
    cta: { label: 'Let’s explore your workflow', url: '/get-started' },
    caption: 'A conversation shaped around your team.',
    brandCopy: 'Sentinel Cloud Service.\nThe company behind LAMINATE.',
    product: { label: 'LAMINATE', sub: 'Our MRI analysis product', url: '/#product' },
    columns: [
      {
        title: 'Explore LAMINATE',
        links: [
          { label: 'Single timepoint analysis', url: '/#single' },
          { label: 'Longitudinal analysis', url: '/#longitudinal' },
          { label: 'Interactive review', url: '/#review' },
          { label: 'PACS workflow', url: '/#workflow' },
        ],
      },
      {
        title: 'Get connected',
        links: [
          { label: 'Book a demo', url: '/get-started', demo: true },
          { label: 'Talk about pricing', url: '/get-started', demo: true },
          { label: 'Questions & answers', url: '/#questions' },
          { label: 'Open the portal', url: PORTAL_URL, newTab: true },
        ],
      },
      {
        title: 'Built around your workflow',
        links: [{ label: 'Cloud & enterprise options', url: '/#deployment' }],
        text: 'Cloud hosting with an on-site PACS gateway, or custom deployment using your own infrastructure and GPUs.',
      },
    ],
    legal: 'Sentinel Cloud Service.\nFor clinicians, hospitals and researchers worldwide.',
  },
};
