// ESM shim — ScrollTrigger UMD loaded via <script> tag in index.html before this module runs.
// This re-exports the global ScrollTrigger instance so ES modules can import { ScrollTrigger }.
const _st = (typeof window !== 'undefined' && window.ScrollTrigger) ? window.ScrollTrigger : {};
export const ScrollTrigger = _st;
export default _st;