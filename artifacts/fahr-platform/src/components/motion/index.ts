// Shared motion kit for the admin and leadership consoles.
//
// Use these rather than hand-rolling animation on a new screen: page enter,
// staggered card and row reveal, animated counters, chart draw-in and panel
// transitions, all honouring the reduced-motion preference.
//
// Layering rule: GSAP animates section wrappers (`ScrollReveal`, `ChartReveal`),
// framer-motion animates the elements inside. Never both on one node.

export { MOTION, prefersReducedMotion } from "./motionTokens";
export { PageEnter } from "./PageEnter";
export { Stagger, StaggerItem } from "./Stagger";
export { ChartReveal } from "./ChartReveal";
export { PanelEnter } from "./PanelEnter";

// The counter and the scroll reveal already exist and are used by the learner
// journey — re-exported here so admin screens have one import site.
export { CountUp } from "@/components/CountUp";
export { ScrollReveal } from "@/components/ScrollReveal";
