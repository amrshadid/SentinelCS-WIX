// Pipeline check: shows which version of this file Wix is running. Remove once the header is confirmed.
const VERSION = 'check-2026-10-08-a';
console.info(`SENTINEL CHECK: wix-default-custom-element file loaded, ${VERSION}`);

class SentinelSmokeTest extends HTMLElement {
  connectedCallback() {
    console.info(`SENTINEL CHECK: element connected, ${VERSION}`);
    this.innerHTML = `<div style="padding:32px;background:#3d6b66;color:white;font:20px sans-serif">Sentinel custom element is running (${VERSION})</div>`;
  }
}
if (!customElements.get('wix-default-custom-element')) customElements.define('wix-default-custom-element', SentinelSmokeTest);
