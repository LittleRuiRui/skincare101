import React from "react";

const INK = "#474840";
const SAGE = "#7E907B";
const PEACH = "#DDAA7A";
const BLUE = "#8EA2B7";

export function HandDrawnHero() {
  return <div aria-hidden="true" style={{ position: "relative", height: 168, margin: "8px 0 20px", overflow: "hidden" }}>
    <style>{`
      @keyframes sketchDraw { from { stroke-dashoffset: 1; opacity: .15 } to { stroke-dashoffset: 0; opacity: 1 } }
      @keyframes sketchFade { from { opacity: 0; transform: translateY(4px) rotate(-2deg) } to { opacity: 1; transform: translateY(0) rotate(-2deg) } }
      .sketch-line { pathLength: 1; stroke-dasharray: 1; stroke-dashoffset: 1; animation: sketchDraw 1.6s cubic-bezier(.3,.7,.3,1) forwards; }
      .sketch-line.d2 { animation-delay: .18s } .sketch-line.d3 { animation-delay: .34s }
      .sketch-note { opacity: 0; animation: sketchFade .55s ease .75s forwards; }
      @media (prefers-reduced-motion: reduce) { .sketch-line { animation: none; stroke-dashoffset: 0; } .sketch-note { animation: none; opacity: 1; } }
    `}</style>
    <svg viewBox="0 0 520 168" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
      <path d="M34 123 C99 103 155 109 210 79 C268 47 316 60 375 40 C421 25 461 35 493 20" fill="none" stroke={BLUE} strokeWidth="1.5" strokeLinecap="round" className="sketch-line"/>
      <path d="M55 133 C107 112 155 120 206 93 C263 63 305 73 353 55" fill="none" stroke={SAGE} strokeWidth="1.2" strokeLinecap="round" className="sketch-line d2" opacity=".75"/>
      <g className="sketch-line d3" fill="none" stroke={INK} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M334 119 C337 96 341 77 352 57"/><path d="M344 82 C333 76 327 69 328 61 C339 63 347 68 350 77"/><path d="M349 70 C359 63 368 61 375 64 C371 73 361 77 351 77"/>
        <path d="M378 118 C379 98 383 86 391 74"/><path d="M386 87 C376 83 371 78 371 71 C381 72 388 77 390 84"/><path d="M391 78 C400 71 409 70 416 73 C412 81 403 85 393 85"/>
        <circle cx="352" cy="53" r="5"/><circle cx="391" cy="70" r="4"/>
      </g>
      <path d="M21 143 C118 150 254 146 489 145" fill="none" stroke={PEACH} strokeWidth="2" strokeLinecap="round" className="sketch-line d3" opacity=".85"/>
      <g className="sketch-note">
        <rect x="58" y="26" width="151" height="50" rx="5" fill="#F5E9D8" opacity=".86" transform="rotate(-2 58 26)"/>
        <text x="74" y="48" fontSize="12" fill={INK} fontFamily="cursive">skin first, products second</text>
        <text x="74" y="64" fontSize="10" fill="#77786F" fontFamily="cursive">less noise · better choices</text>
      </g>
      <path d="M206 29 l34 7" stroke={PEACH} strokeWidth="8" strokeLinecap="round" opacity=".28"/>
    </svg>
  </div>;
}

export function SketchUnderline({ width = 108 }: { width?: number }) {
  return <svg aria-hidden="true" width={width} height="9" viewBox={`0 0 ${width} 9`} style={{ display: "block", marginTop: 4 }}><path d={`M2 5 C ${Math.round(width*.25)} 2, ${Math.round(width*.68)} 7, ${width-2} 4`} fill="none" stroke={PEACH} strokeWidth="2.2" strokeLinecap="round" className="sketch-line"/></svg>;
}

export function SketchSprig({ size = 34 }: { size?: number }) {
  return <svg aria-hidden="true" width={size} height={size} viewBox="0 0 40 40"><g fill="none" stroke={SAGE} strokeWidth="1.35" strokeLinecap="round" strokeLinejoin="round"><path d="M11 34 C16 26 20 18 27 7"/><path d="M17 24 C11 23 8 19 8 15 C14 15 18 18 19 22"/><path d="M22 16 C27 11 32 11 35 13 C32 18 28 20 23 20"/><circle cx="29" cy="7" r="3.2"/></g></svg>;
}

export function PaperTape() {
  return <span aria-hidden="true" style={{ position: "absolute", width: 44, height: 12, background: "rgba(221,170,122,.25)", transform: "rotate(-5deg)", borderRadius: 2, top: -5, right: 34 }} />;
}
