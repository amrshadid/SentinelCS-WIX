import { extensions } from '@wix/astro/builders';

export default extensions.customElement({
  id: '3bf01593-22b3-4885-a6ae-26d56004ddcd',
  name: 'Sentinel Footer',
  tagName: 'sentinel-footer',
  width: { defaultWidth: 1280, stretchByDefault: true, allowStretch: true },
  height: { defaultHeight: 640 },
  element: './extensions/site/widgets/sentinel-footer/sentinel-footer.tsx',
  settings: './extensions/site/widgets/sentinel-footer/sentinel-footer.panel.tsx',
  presets: [
    {
      id: 'f8787cdf-a196-4b0d-81f9-09f10762ca1c',
      name: 'Sentinel Footer',
      thumbnailUrl: '{{BASE_URL}}/public/thumb-footer.png',
    },
  ],
});
