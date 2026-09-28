// ESM shim — GSAP UMD loaded via <script> tag in index.html before this module runs.
// This re-exports the global gsap instance so ES modules can import { gsap } from '../vendor/gsap.js'.
const _gsap = (typeof window !== 'undefined' && window.gsap) ? window.gsap : {};
export const gsap = _gsap;
export const Power0 = _gsap.Power0;
export const Power1 = _gsap.Power1;
export const Power2 = _gsap.Power2;
export const Power3 = _gsap.Power3;
export const Power4 = _gsap.Power4;
export const Linear = _gsap.Linear;
export const Quad = _gsap.Quad;
export const Cubic = _gsap.Cubic;
export const Quart = _gsap.Quart;
export const Quint = _gsap.Quint;
export const Strong = _gsap.Strong;
export const Elastic = _gsap.Elastic;
export const Back = _gsap.Back;
export const SteppedEase = _gsap.SteppedEase;
export const Bounce = _gsap.Bounce;
export const Sine = _gsap.Sine;
export const Expo = _gsap.Expo;
export const Circ = _gsap.Circ;
export default _gsap;