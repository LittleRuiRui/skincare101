import React from "react";

export type KnowledgeArtKind = "steps" | "barrier" | "oily" | "niacinamide";

const DEEP = "#31533B";
const SAGE = "#78967B";
const LEAF = "#A9BE9B";
const CREAM = "#FBF5E9";
const PAPER = "#F7F0E4";
const ROSE = "#D7A28F";
const PEACH = "#F0C7B4";
const BLUE = "#9AB8C5";
const GOLD = "#D7B862";
const INK = "#4C4A43";

function Defs({ id }: { id: string }) {
  return <defs>
    <filter id={`${id}-paper`} x="-10%" y="-10%" width="120%" height="120%">
      <feTurbulence type="fractalNoise" baseFrequency=".018" numOctaves="3" seed="13" result="noise" />
      <feDisplacementMap in="SourceGraphic" in2="noise" scale="1.8" />
      <feGaussianBlur stdDeviation=".16" />
    </filter>
    <filter id={`${id}-soft`} x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="7" />
    </filter>
    <linearGradient id={`${id}-wash`} x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stopColor="#FAF5EA" />
      <stop offset="1" stopColor="#EEF3E9" />
    </linearGradient>
  </defs>;
}

function BotanicalCorners({ id }: { id: string }) {
  return <g opacity=".9" filter={`url(#${id}-paper)`}>
    <path d="M18 170C52 132 54 81 38 31" fill="none" stroke={SAGE} strokeWidth="2" />
    <path d="M42 58c-20 2-27 15-27 25 19 0 30-11 27-25zM39 88c19-3 31 7 35 17-18 6-31-1-35-17zM30 117c-16 0-25 10-27 20 16 4 27-3 27-20z" fill={LEAF} opacity=".72" />
    <path d="M305 42c-29 19-38 49-36 90" fill="none" stroke={SAGE} strokeWidth="2" />
    <path d="M290 55c-15-2-25 6-29 16 15 5 26 0 29-16zM274 84c17 0 27 10 29 20-16 3-27-4-29-20z" fill={LEAF} opacity=".66" />
    <circle cx="25" cy="151" r="4" fill={GOLD} opacity=".7" />
    <circle cx="295" cy="115" r="3" fill={ROSE} opacity=".8" />
  </g>;
}

function StepsArt() {
  const id = "steps-art";
  return <svg viewBox="0 0 340 220" width="100%" role="img" aria-label="hand-painted skincare routine vanity illustration">
    <Defs id={id} />
    <rect width="340" height="220" rx="18" fill={`url(#${id}-wash)`} />
    <ellipse cx="168" cy="120" rx="126" ry="72" fill="#DDE8D8" opacity=".38" filter={`url(#${id}-soft)`} />
    <BotanicalCorners id={id} />
    <g filter={`url(#${id}-paper)`}>
      <path d="M94 176h164" stroke="#A89578" strokeWidth="2" strokeLinecap="round" />
      <rect x="108" y="101" width="36" height="70" rx="10" fill="#F7E9D6" stroke="#7E866F" />
      <path d="M118 92h16v12h-16z" fill="#6B7865" />
      <path d="M124 89v-9h20" fill="none" stroke="#6B7865" strokeWidth="3" strokeLinecap="round" />
      <rect x="154" y="116" width="34" height="55" rx="8" fill="#DDE8E3" stroke="#70847A" />
      <path d="M164 101h14v16h-14z" fill="#526A5B" />
      <circle cx="171" cy="143" r="10" fill={BLUE} opacity=".3" />
      <rect x="199" y="126" width="44" height="45" rx="9" fill="#EFE4C9" stroke="#8A806A" />
      <ellipse cx="221" cy="126" rx="21" ry="6" fill="#D6C39B" stroke="#8A806A" />
      <path d="M213 145h17" stroke={GOLD} strokeWidth="2.5" strokeLinecap="round" />
      <path d="M267 163c15-31 15-57-4-74 0 34-13 49-28 63" fill="#C9D9B8" stroke="#7E986F" />
      <path d="M74 164c-3-34 6-57 32-69-4 31-18 48-32 69z" fill="#D8E2C4" stroke="#7E986F" />
      <path d="M84 78c10-26 29-38 52-31-11 25-27 35-52 31z" fill="#E9D7B2" opacity=".65" />
    </g>
    <g fontFamily="Georgia, serif" fill={DEEP}>
      <text x="170" y="38" textAnchor="middle" fontSize="18">less, but better</text>
      <text x="170" y="58" textAnchor="middle" fontSize="11" opacity=".75">cleanse · moisturise · protect</text>
    </g>
  </svg>;
}

function BarrierArt() {
  const id = "barrier-art";
  return <svg viewBox="0 0 340 220" width="100%" role="img" aria-label="hand-painted skin barrier garden wall illustration">
    <Defs id={id} />
    <rect width="340" height="220" rx="18" fill={`url(#${id}-wash)`} />
    <ellipse cx="171" cy="130" rx="134" ry="73" fill="#F2D8CD" opacity=".36" filter={`url(#${id}-soft)`} />
    <BotanicalCorners id={id} />
    <g filter={`url(#${id}-paper)`}>
      {[0,1,2,3,4].map(i => <rect key={`a${i}`} x={50+i*49} y="118" width="43" height="27" rx="7" fill={i%2?"#EAB8A8":"#F0C3B3"} stroke="#B98578" />)}
      {[0,1,2,3].map(i => <rect key={`b${i}`} x={74+i*49} y="149" width="43" height="27" rx="7" fill={i%2?"#EFC7B8":"#E9B4A5"} stroke="#B98578" />)}
      <path d="M48 186h242" stroke="#B98578" strokeWidth="2" strokeLinecap="round" />
      <path d="M73 115c7-21 18-31 33-40M123 115c8-19 16-32 31-45M175 115c8-19 17-31 33-42M226 115c7-18 13-31 29-43" stroke={BLUE} strokeWidth="1.7" strokeDasharray="4 5" opacity=".8" />
      {[82,132,184,235].map((x,i)=><g key={x}><path d={`M${x} 72c7 10 10 16 10 22a10 10 0 1 1-20 0c0-6 3-12 10-22z`} fill={BLUE} opacity={.45+i*.05}/><circle cx={x+19} cy={78+i*5} r="4" fill={GOLD} opacity=".7" /></g>)}
      <path d="M58 98c20 1 31-8 37-25M278 101c-19 1-29-8-34-24" fill="none" stroke={SAGE} strokeWidth="2" />
      <path d="M77 79c-13 2-20 9-21 18 13 1 21-5 21-18zM263 82c12 1 19 8 21 17-13 2-21-4-21-17z" fill={LEAF} />
    </g>
    <text x="170" y="40" textAnchor="middle" fill={DEEP} fontFamily="Georgia, serif" fontSize="18">brick + mortar</text>
    <text x="170" y="60" textAnchor="middle" fill={INK} opacity=".68" fontSize="11">cells hold the wall · lipids seal the gaps</text>
  </svg>;
}

function OilyArt() {
  const id = "oily-art";
  return <svg viewBox="0 0 340 220" width="100%" role="img" aria-label="watercolor portrait showing oily but dehydrated skin">
    <Defs id={id} />
    <rect width="340" height="220" rx="18" fill={`url(#${id}-wash)`} />
    <ellipse cx="172" cy="119" rx="128" ry="78" fill="#DCE8DE" opacity=".42" filter={`url(#${id}-soft)`} />
    <BotanicalCorners id={id} />
    <g filter={`url(#${id}-paper)`}>
      <path d="M136 79c5-33 29-48 57-42 25 5 42 25 40 54-10-15-24-23-39-25-21-3-39 4-58 13z" fill="#6D5D4F" opacity=".9" />
      <ellipse cx="179" cy="116" rx="48" ry="59" fill={PEACH} stroke="#C78F7D" />
      <path d="M139 91c7-20 23-33 43-34 23-1 40 11 50 30-16-12-33-18-49-17-16 0-30 7-44 21z" fill="#6D5D4F" />
      <path d="M143 80c17-14 42-20 69-10" fill="none" stroke="#BFD1B8" strokeWidth="12" strokeLinecap="round" />
      <path d="M153 111c7-4 14-4 20 0M190 111c7-4 14-4 20 0" fill="none" stroke="#5D4B43" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="164" cy="113" r="2.2" fill="#493D38" /><circle cx="201" cy="113" r="2.2" fill="#493D38" />
      <path d="M174 137c7 5 15 5 22 0" fill="none" stroke="#B56E6C" strokeWidth="2" strokeLinecap="round" />
      <path d="M179 117c-2 9-3 16-1 20" fill="none" stroke="#C58D7B" strokeWidth="1.3" />
      <ellipse cx="161" cy="126" rx="13" ry="8" fill="#E6B197" opacity=".28" /><ellipse cx="203" cy="125" rx="13" ry="8" fill="#E6B197" opacity=".28" />
      {[150,159,169,195,205,214].map((x,i)=><circle key={x} cx={x} cy={i<3?128:126} r={i%2?2.2:3} fill={GOLD} opacity=".7" />)}
      {[151,169,204,219].map((x,i)=><path key={x} d={`M${x} ${72+i*4}c5 8 7 12 7 17a7 7 0 1 1-14 0c0-5 2-9 7-17z`} fill={BLUE} opacity=".42" />)}
      <path d="M237 112c25 6 37 28 30 48-7 20-29 31-50 23" fill="none" stroke="#718B80" strokeWidth="5" /><path d="M258 169l26 24" stroke="#718B80" strokeWidth="6" strokeLinecap="round" />
    </g>
    <text x="71" y="52" fill={DEEP} fontFamily="Georgia, serif" fontSize="15">oil ≠ water</text>
    <text x="69" y="69" fill={INK} opacity=".68" fontSize="10.5">you can have both</text>
  </svg>;
}

function NiacinamideArt() {
  const id = "nia-art";
  return <svg viewBox="0 0 340 220" width="100%" role="img" aria-label="watercolor niacinamide serum bottle with botanical notes">
    <Defs id={id} />
    <rect width="340" height="220" rx="18" fill={`url(#${id}-wash)`} />
    <ellipse cx="174" cy="121" rx="126" ry="73" fill="#E8E5CB" opacity=".48" filter={`url(#${id}-soft)`} />
    <BotanicalCorners id={id} />
    <g filter={`url(#${id}-paper)`}>
      <ellipse cx="166" cy="185" rx="52" ry="9" fill="#B9B09D" opacity=".22" />
      <rect x="130" y="78" width="73" height="100" rx="12" fill="#F7F3E8" stroke="#6F756B" />
      <rect x="149" y="55" width="35" height="25" rx="5" fill="#ECE8DF" stroke="#6F756B" />
      <path d="M157 55V37h19v18" fill="#50544D" /><path d="M166 37V24h31" stroke="#50544D" strokeWidth="4" strokeLinecap="round" />
      <circle cx="166" cy="125" r="23" fill="#DDE8E4" opacity=".7" />
      <text x="166" y="120" textAnchor="middle" fill={DEEP} fontSize="12" fontWeight="600">B3</text>
      <text x="166" y="136" textAnchor="middle" fill={INK} fontSize="9.5">NIACINAMIDE</text>
      <path d="M105 174c-28-46-21-81 10-101 12 42 6 72-10 101z" fill="#C9D9B8" stroke="#77906D" />
      <path d="M230 176c30-47 24-80-7-103-13 41-8 72 7 103z" fill="#D6E0C6" stroke="#77906D" />
      <path d="M103 160c22-12 33-34 33-62M232 162c-20-13-31-35-29-64" fill="none" stroke="#78906E" strokeWidth="2" />
      <circle cx="93" cy="66" r="16" fill={ROSE} opacity=".28" /><circle cx="246" cy="73" r="18" fill={BLUE} opacity=".25" />
    </g>
    <g fill={DEEP} fontSize="10.5">
      <text x="38" y="57">tone</text><text x="38" y="72">barrier</text><text x="256" y="57">oil</text><text x="256" y="72">support</text>
    </g>
    <path d="M72 59h18M72 74h25M249 59h-15M249 74h-23" stroke={GOLD} strokeWidth="1.5" strokeLinecap="round" opacity=".8" />
  </svg>;
}

export default function KnowledgeWatercolorArt({ kind }: { kind: KnowledgeArtKind }) {
  if (kind === "barrier") return <BarrierArt />;
  if (kind === "oily") return <OilyArt />;
  if (kind === "niacinamide") return <NiacinamideArt />;
  return <StepsArt />;
}
