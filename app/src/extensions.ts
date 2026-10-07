import { app } from '@wix/astro/builders';
import sentinelHeader from './extensions/site/widgets/sentinel-header/sentinel-header.extension';
import sentinelFooter from './extensions/site/widgets/sentinel-footer/sentinel-footer.extension';

export default app().use(sentinelHeader).use(sentinelFooter);
