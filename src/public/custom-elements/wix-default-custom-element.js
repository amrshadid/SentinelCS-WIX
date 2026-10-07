class SentinelSmokeTest extends HTMLElement {
  connectedCallback() {
    this.innerHTML = '<div style="padding:32px;background:#3d6b66;color:white;font:20px sans-serif">Sentinel custom element is running</div>';
  }
}
customElements.define("wix-default-custom-element", SentinelSmokeTest);