"use client";

import { motion } from "motion/react";

export function AnimatedLine() {
  return (
    <svg
      className="absolute top-1/2 left-0 w-full h-full -translate-y-1/2 pointer-events-none hidden md:block z-20"
      viewBox="0 0 1000 400"
      preserveAspectRatio="none"
    >
      <defs>
        <filter id="lineGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="6" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <motion.path
        d="M 0 240 C 200 240, 350 60, 500 60 C 650 60, 800 100, 1000 100"
        stroke="#10B981"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        filter="url(#lineGlow)"
        fill="none"
        initial={{ pathLength: 0, opacity: 0 }}
        whileInView={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 2, ease: "easeInOut", delay: 0.2 }}
        viewport={{ once: true, margin: "-100px" }}
      />
    </svg>
  );
}
