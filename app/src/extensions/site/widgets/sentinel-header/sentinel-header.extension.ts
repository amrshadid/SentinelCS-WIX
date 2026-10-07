import { extensions } from '@wix/astro/builders';

export default extensions.customElement({
  id: 'ae29f1f4-d313-462c-8e10-0f60d0961dcd',
  name: 'Sentinel Header',
  tagName: 'sentinel-header',
  width: { defaultWidth: 1280, stretchByDefault: true, allowStretch: true },
  height: { defaultHeight: 108 },
  element: './extensions/site/widgets/sentinel-header/sentinel-header.tsx',
  settings: './extensions/site/widgets/sentinel-header/sentinel-header.panel.tsx',
  presets: [
    {
      id: '06beb610-0eb5-4a48-81a6-34386bcc8c9f',
      name: 'Sentinel Header',
      thumbnailUrl: '{{BASE_URL}}/public/thumb-header.png',
    },
  ],
});
