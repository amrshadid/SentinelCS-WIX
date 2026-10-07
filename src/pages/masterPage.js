import wixLocationFrontend from 'wix-location-frontend';
import { wireSentinel } from 'public/sentinel-nav';

$w.onReady(function () {
  try {
    wireSentinel($w, wixLocationFrontend);
  } catch (error) {
    console.error('SENTINEL: header and footer wiring failed', error);
  }
});
