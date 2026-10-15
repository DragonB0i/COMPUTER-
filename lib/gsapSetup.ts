import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

let registered = false;

/** Registers GSAP plugins once (client only). */
export const setupGsap = (): typeof gsap => {
  if (!registered && typeof window !== "undefined") {
    gsap.registerPlugin(ScrollTrigger);
    ScrollTrigger.config({ ignoreMobileResize: true });
    registered = true;
  }
  return gsap;
};

export { gsap, ScrollTrigger };
