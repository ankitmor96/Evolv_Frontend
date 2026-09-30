import React from 'react';
import { motion } from 'framer-motion';
import { personVariants, platformVariants } from './motionVariants';

/**
 * SkillNetwork Component
 * Renders the central podium platform and the 5 diverse young professionals.
 * 
 * Rules:
 * - Entrance: subtle opacity 0 -> 1, translateY 12px -> 0 at 1.0s.
 * - After entrance: 90-95% static! Absolutely no bouncing, no dancing, no body rotation.
 * - Active skill response: Subtle highlighting around the active person's base (no exaggerated motion).
 */
export default function SkillNetwork({ activeSkill = null }) {
  return (
    <g id="skill-network-group">
      <defs>
        {/* Gradients */}
        <radialGradient id="centerGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#AA45F5" stopOpacity="0.16" />
          <stop offset="60%" stopColor="#7C3AED" stopOpacity="0.06" />
          <stop offset="100%" stopColor="#7C3AED" stopOpacity="0" />
        </radialGradient>

        <linearGradient id="podiumGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="50%" stopColor="#F7F2FF" />
          <stop offset="100%" stopColor="#E9DDFD" />
        </linearGradient>

        <linearGradient id="podiumBaseGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#E2D4FB" />
          <stop offset="100%" stopColor="#C4B0F7" />
        </linearGradient>

        <linearGradient id="blazerLavGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#D8B4FE" />
          <stop offset="100%" stopColor="#A855F7" />
        </linearGradient>

        <linearGradient id="blazerPurpleGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#7C3AED" />
          <stop offset="100%" stopColor="#4C1D95" />
        </linearGradient>

        <linearGradient id="darkClothGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2E1065" />
          <stop offset="100%" stopColor="#1E0B38" />
        </linearGradient>

        {/* Diverse Skin Tones */}
        <linearGradient id="skinTone1" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FDE2D2" />
          <stop offset="100%" stopColor="#F4BFA8" />
        </linearGradient>

        <linearGradient id="skinTone2" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#E4A981" />
          <stop offset="100%" stopColor="#CA885E" />
        </linearGradient>

        <linearGradient id="skinTone3" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#F7D0B7" />
          <stop offset="100%" stopColor="#E6A88B" />
        </linearGradient>

        <linearGradient id="skinTone4" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#9E6747" />
          <stop offset="100%" stopColor="#7D4E33" />
        </linearGradient>

        {/* Subtle highlight ring for active person */}
        <filter id="personHighlight" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="0" stdDeviation="6" floodColor="#AA45F5" floodOpacity="0.4" />
        </filter>
      </defs>

      {/* ── BACKGROUND AMBIENT GLOW (0.0s background) ── */}
      <circle cx="510" cy="270" r="320" fill="url(#centerGlow)" />
      <circle cx="280" cy="220" r="160" fill="url(#centerGlow)" opacity="0.6" />
      <circle cx="740" cy="220" r="160" fill="url(#centerGlow)" opacity="0.6" />

      {/* ── 0.70s CENTRAL STAGE / ELEGANT PODIUM PLATFORM ── */}
      <motion.g
        id="central-platform"
        variants={platformVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Floor Shadow */}
        <ellipse cx="510" cy="492" rx="460" ry="24" fill="#0A0214" opacity="0.08" />
        <ellipse cx="510" cy="484" rx="430" ry="18" fill="#581C87" opacity="0.06" />

        {/* Lower Base Ring */}
        <path
          d="M 80 470 C 80 445, 940 445, 940 470 C 940 495, 80 495, 80 470 Z"
          fill="url(#podiumBaseGrad)"
          opacity="0.85"
        />

        {/* Main Top Podium Surface */}
        <ellipse
          cx="510"
          cy="462"
          rx="420"
          ry="30"
          fill="url(#podiumGrad)"
          stroke="#C084FC"
          strokeWidth="1.5"
          strokeOpacity="0.5"
        />

        {/* Inner Elegance Rings */}
        <ellipse
          cx="510"
          cy="461"
          rx="350"
          ry="24"
          fill="none"
          stroke="#A855F7"
          strokeWidth="1"
          strokeDasharray="6 8"
          strokeOpacity="0.35"
        />
        <ellipse
          cx="510"
          cy="460"
          rx="240"
          ry="16"
          fill="none"
          stroke="#7C3AED"
          strokeWidth="1"
          strokeOpacity="0.25"
        />

        {/* Center Easel Stand Legs (supports the central synergy card) */}
        <g id="easel-legs">
          <path d="M 488 360 L 472 455" stroke="#7E22CE" strokeWidth="2.5" strokeLinecap="round" opacity="0.8" />
          <path d="M 532 360 L 548 455" stroke="#7E22CE" strokeWidth="2.5" strokeLinecap="round" opacity="0.8" />
          <path d="M 510 360 L 510 458" stroke="#6B21A8" strokeWidth="2.5" strokeLinecap="round" opacity="0.8" />
        </g>
      </motion.g>

      {/* ── 1.0s PEOPLE (Static after entrance, subtle highlight on active) ── */}

      {/* PERSON 1: ART & DESIGN (Female, Palette & Brush) */}
      <motion.g
        id="person-art"
        custom={0}
        variants={personVariants}
        initial="hidden"
        animate="visible"
        filter={activeSkill === 'art' ? 'url(#personHighlight)' : undefined}
      >
        <ellipse
          cx="190"
          cy="462"
          rx={activeSkill === 'art' ? 38 : 34}
          ry="7"
          fill={activeSkill === 'art' ? '#A855F7' : '#18042B'}
          opacity={activeSkill === 'art' ? 0.35 : 0.1}
          style={{ transition: 'all 300ms ease' }}
        />

        {/* Legs & Shoes */}
        <path d="M 178 360 L 174 445" stroke="#1E0B38" strokeWidth="12" strokeLinecap="round" />
        <path d="M 198 360 L 202 445" stroke="#1E0B38" strokeWidth="12" strokeLinecap="round" />
        <path d="M 166 448 C 166 443 182 443 182 448 L 184 453 L 164 453 Z" fill="#FFFFFF" stroke="#DDD6FE" strokeWidth="1" />
        <path d="M 194 448 C 194 443 210 443 210 448 L 212 453 L 192 453 Z" fill="#FFFFFF" stroke="#DDD6FE" strokeWidth="1" />

        {/* Torso & Chic Lavender Blazer */}
        <path d="M 166 265 C 166 250 214 250 214 265 L 218 365 C 218 370 162 370 162 365 Z" fill="url(#blazerLavGrad)" />
        <path d="M 183 255 L 197 255 L 190 280 Z" fill="#FFFFFF" />
        <path d="M 174 255 L 187 298 L 174 340" stroke="#7E22CE" strokeWidth="1.4" fill="none" />
        <path d="M 206 255 L 193 298 L 206 340" stroke="#7E22CE" strokeWidth="1.4" fill="none" />

        {/* Neck & Head */}
        <rect x="185" y="240" width="10" height="18" rx="4" fill="url(#skinTone1)" />
        <circle cx="190" cy="226" r="18" fill="url(#skinTone1)" />

        {/* Hairstyle */}
        <path d="M 172 226 C 172 208 208 208 208 226 C 208 230 205 233 205 235 C 198 230 182 230 175 235 Z" fill="#1E0B38" />
        <circle cx="190" cy="204" r="11" fill="#1E0B38" />
        <ellipse cx="190" cy="214" rx="8" ry="3" fill="#A855F7" />

        {/* Face */}
        <ellipse cx="196" cy="226" rx="2" ry="2.2" fill="#2E1065" />
        <path d="M 194 233 Q 198 237 202 234" stroke="#2E1065" strokeWidth="1.2" strokeLinecap="round" fill="none" />

        {/* Arm & Palette */}
        <path d="M 166 270 Q 152 300 162 322" stroke="url(#blazerLavGrad)" strokeWidth="10" strokeLinecap="round" fill="none" />
        <circle cx="163" cy="324" r="5" fill="url(#skinTone1)" />
        <g transform="translate(142, 312)">
          <ellipse cx="20" cy="16" rx="22" ry="14" fill="#FFFFFF" stroke="#DDD6FE" strokeWidth="1.5" />
          <circle cx="10" cy="14" r="3" fill="#9333EA" />
          <circle cx="18" cy="10" r="3" fill="#C084FC" />
          <circle cx="26" cy="11" r="3" fill="#7C3AED" />
          <circle cx="30" cy="18" r="3" fill="#F472B6" />
          <ellipse cx="12" cy="22" rx="4" ry="3" fill="#E9D5FF" />
        </g>

        {/* Arm & Brush */}
        <path d="M 210 270 Q 228 290 236 308" stroke="url(#blazerLavGrad)" strokeWidth="10" strokeLinecap="round" fill="none" />
        <circle cx="237" cy="310" r="5" fill="url(#skinTone1)" />
        <line x1="235" y1="312" x2="255" y2="295" stroke="#4C1D95" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M 254 296 L 260 291 L 257 289 Z" fill="#A855F7" />
        <circle cx="264" cy="288" r="3" fill="#C084FC" opacity="0.8" />
      </motion.g>

      {/* PERSON 2: FITNESS & HEALTH (Male, Activewear & Yoga Mat) */}
      <motion.g
        id="person-fitness"
        custom={1}
        variants={personVariants}
        initial="hidden"
        animate="visible"
        filter={activeSkill === 'fitness' ? 'url(#personHighlight)' : undefined}
      >
        <ellipse
          cx="325"
          cy="460"
          rx={activeSkill === 'fitness' ? 40 : 36}
          ry="7"
          fill={activeSkill === 'fitness' ? '#A855F7' : '#18042B'}
          opacity={activeSkill === 'fitness' ? 0.35 : 0.1}
          style={{ transition: 'all 300ms ease' }}
        />

        {/* Pants & Shoes */}
        <path d="M 314 365 L 310 443" stroke="#0F041C" strokeWidth="13" strokeLinecap="round" />
        <path d="M 336 365 L 340 443" stroke="#0F041C" strokeWidth="13" strokeLinecap="round" />
        <path d="M 302 447 C 302 441 319 441 320 447 L 322 452 L 300 452 Z" fill="#FFFFFF" stroke="#A855F7" strokeWidth="1.2" />
        <path d="M 332 447 C 332 441 349 441 350 447 L 352 452 L 330 452 Z" fill="#FFFFFF" stroke="#A855F7" strokeWidth="1.2" />

        {/* Athletic Jacket */}
        <path d="M 300 262 C 300 248 350 248 350 262 L 354 368 C 354 372 296 372 296 368 Z" fill="url(#darkClothGrad)" />
        <line x1="325" y1="262" x2="325" y2="368" stroke="#FFFFFF" strokeWidth="1.5" strokeOpacity="0.8" />
        <path d="M 300 265 Q 325 272 350 265" stroke="#9333EA" strokeWidth="2.5" fill="none" />

        {/* Head & Hair */}
        <rect x="320" y="238" width="10" height="18" rx="4" fill="url(#skinTone2)" />
        <circle cx="325" cy="223" r="18" fill="url(#skinTone2)" />
        <path d="M 310 220 C 310 205 340 205 340 220 C 340 226 338 230 338 230 C 333 223 317 223 312 230 Z" fill="#120424" />
        <path d="M 310 216 Q 325 208 340 216" stroke="#2E1065" strokeWidth="3" fill="none" />

        {/* Face */}
        <ellipse cx="332" cy="223" rx="2" ry="2.2" fill="#0F041C" />
        <path d="M 329 231 Q 334 235 338 232" stroke="#0F041C" strokeWidth="1.3" strokeLinecap="round" fill="none" />

        {/* Arm & Yoga Mat */}
        <path d="M 302 268 Q 288 295 292 328" stroke="url(#darkClothGrad)" strokeWidth="11" strokeLinecap="round" fill="none" />
        <g transform="translate(280, 310) rotate(-15)">
          <rect x="0" y="0" width="16" height="42" rx="7" fill="#C084FC" stroke="#7C3AED" strokeWidth="1.2" />
          <ellipse cx="8" cy="4" rx="7" ry="3.5" fill="#DDD6FE" />
          <ellipse cx="8" cy="38" rx="7" ry="3.5" fill="#A855F7" />
        </g>

        {/* Arm & Smartwatch */}
        <path d="M 348 268 Q 366 290 380 306" stroke="url(#darkClothGrad)" strokeWidth="11" strokeLinecap="round" fill="none" />
        <rect x="376" y="303" width="7" height="6" rx="2" fill="#7C3AED" />
        <circle cx="384" cy="310" r="5" fill="url(#skinTone2)" />
      </motion.g>

      {/* PERSON 3: BUSINESS & MENTORSHIP / PRESENTER (Female, Notebook/Tablet) */}
      <motion.g
        id="person-social"
        custom={2}
        variants={personVariants}
        initial="hidden"
        animate="visible"
        filter={activeSkill === 'social' ? 'url(#personHighlight)' : undefined}
      >
        <ellipse
          cx="425"
          cy="458"
          rx={activeSkill === 'social' ? 38 : 34}
          ry="7"
          fill={activeSkill === 'social' ? '#A855F7' : '#18042B'}
          opacity={activeSkill === 'social' ? 0.35 : 0.12}
          style={{ transition: 'all 300ms ease' }}
        />

        {/* Tailored Pants & Flats */}
        <path d="M 414 360 L 410 442" stroke="#1A072E" strokeWidth="12" strokeLinecap="round" />
        <path d="M 434 360 L 438 442" stroke="#1A072E" strokeWidth="12" strokeLinecap="round" />
        <path d="M 404 445 C 404 440 420 440 420 445 L 422 450 L 402 450 Z" fill="#2E1065" />
        <path d="M 432 445 C 432 440 448 440 448 445 L 450 450 L 430 450 Z" fill="#2E1065" />

        {/* Blazer */}
        <path d="M 402 260 C 402 246 448 246 448 260 L 450 362 C 450 366 400 366 400 362 Z" fill="url(#blazerPurpleGrad)" />
        <path d="M 418 250 L 432 250 L 425 278 Z" fill="#FFFFFF" />
        <path d="M 410 250 L 423 292 L 410 335" stroke="#C084FC" strokeWidth="1.3" fill="none" />
        <path d="M 440 250 L 427 292 L 440 335" stroke="#C084FC" strokeWidth="1.3" fill="none" />

        {/* Head & Hair */}
        <rect x="420" y="235" width="10" height="18" rx="4" fill="url(#skinTone3)" />
        <circle cx="425" cy="220" r="18" fill="url(#skinTone3)" />
        <path d="M 408 222 C 408 202 442 202 442 222 C 442 242 445 256 440 262 C 436 244 434 232 425 232 C 416 232 414 244 410 262 C 405 256 408 242 408 222 Z" fill="#230B38" />

        {/* Face */}
        <ellipse cx="431" cy="220" rx="2" ry="2.2" fill="#0F041C" />
        <path d="M 427 228 Q 432 232 436 229" stroke="#0F041C" strokeWidth="1.3" strokeLinecap="round" fill="none" />

        {/* Arm & Notebook */}
        <path d="M 404 266 Q 390 295 398 322" stroke="url(#blazerPurpleGrad)" strokeWidth="10" strokeLinecap="round" fill="none" />
        <circle cx="399" cy="324" r="5" fill="url(#skinTone3)" />
        <g transform="translate(382, 310) rotate(8)">
          <rect x="0" y="0" width="22" height="30" rx="4" fill="#FFFFFF" stroke="#A855F7" strokeWidth="1.5" />
          <line x1="4" y1="8" x2="18" y2="8" stroke="#9333EA" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="4" y1="14" x2="16" y2="14" stroke="#C084FC" strokeWidth="1.2" strokeLinecap="round" />
          <line x1="4" y1="20" x2="14" y2="20" stroke="#DDD6FE" strokeWidth="1.2" strokeLinecap="round" />
          <path d="M 12 0 L 12 8 L 15 6 L 18 8 L 18 0 Z" fill="#7C3AED" />
        </g>

        {/* Presenting Arm */}
        <path d="M 446 266 Q 462 278 474 274" stroke="url(#blazerPurpleGrad)" strokeWidth="10" strokeLinecap="round" fill="none" />
        <circle cx="478" cy="274" r="5" fill="url(#skinTone3)" />
      </motion.g>

      {/* PERSON 4: AUDIO & MUSIC (Male, Headphones & Mic) */}
      <motion.g
        id="person-audio"
        custom={3}
        variants={personVariants}
        initial="hidden"
        animate="visible"
        filter={activeSkill === 'audio' ? 'url(#personHighlight)' : undefined}
      >
        <ellipse
          cx="690"
          cy="460"
          rx={activeSkill === 'audio' ? 39 : 35}
          ry="7"
          fill={activeSkill === 'audio' ? '#A855F7' : '#18042B'}
          opacity={activeSkill === 'audio' ? 0.35 : 0.1}
          style={{ transition: 'all 300ms ease' }}
        />

        {/* Pants & Shoes */}
        <path d="M 678 365 L 674 443" stroke="#240D3E" strokeWidth="12" strokeLinecap="round" />
        <path d="M 698 365 L 702 443" stroke="#240D3E" strokeWidth="12" strokeLinecap="round" />
        <path d="M 666 447 C 666 442 682 442 682 447 L 684 452 L 664 452 Z" fill="#FFFFFF" stroke="#DDD6FE" strokeWidth="1" />
        <path d="M 694 447 C 694 442 710 442 710 447 L 712 452 L 692 452 Z" fill="#FFFFFF" stroke="#DDD6FE" strokeWidth="1" />

        {/* Knit Sweater */}
        <path d="M 666 262 C 666 248 714 248 714 262 L 716 368 C 716 372 664 372 664 368 Z" fill="url(#blazerLavGrad)" />
        <path d="M 683 254 C 683 258 697 258 697 254 Z" fill="#FFFFFF" />

        {/* Headphones around neck */}
        <path d="M 676 250 C 674 268 706 268 704 250" stroke="#1E0B38" strokeWidth="5" fill="none" strokeLinecap="round" />
        <ellipse cx="675" cy="254" rx="5" ry="8" fill="#7C3AED" stroke="#FFFFFF" strokeWidth="1" />
        <ellipse cx="705" cy="254" rx="5" ry="8" fill="#7C3AED" stroke="#FFFFFF" strokeWidth="1" />

        {/* Head & Hair */}
        <rect x="685" y="238" width="10" height="18" rx="4" fill="url(#skinTone4)" />
        <circle cx="690" cy="223" r="18" fill="url(#skinTone4)" />
        <path d="M 674 220 C 674 204 706 204 706 220 C 706 228 702 230 702 230 C 695 224 685 224 678 230 Z" fill="#120424" />

        {/* Face */}
        <ellipse cx="682" cy="222" rx="2" ry="2.2" fill="#0F041C" />
        <path d="M 680 230 Q 684 234 688 231" stroke="#0F041C" strokeWidth="1.3" strokeLinecap="round" fill="none" />

        {/* Arm & Mic */}
        <path d="M 668 268 Q 652 292 642 308" stroke="url(#blazerLavGrad)" strokeWidth="10" strokeLinecap="round" fill="none" />
        <circle cx="640" cy="310" r="5" fill="url(#skinTone4)" />
        <g transform="translate(630, 292) rotate(-20)">
          <rect x="4" y="12" width="7" height="20" rx="3" fill="#1E0B38" />
          <rect x="2" y="2" width="11" height="12" rx="5" fill="#7C3AED" stroke="#FFFFFF" strokeWidth="1" />
          <line x1="4" y1="6" x2="11" y2="6" stroke="#FFFFFF" strokeWidth="1" />
          <line x1="4" y1="9" x2="11" y2="9" stroke="#FFFFFF" strokeWidth="1" />
        </g>

        {/* Relaxed Arm */}
        <path d="M 712 268 Q 724 298 718 325" stroke="url(#blazerLavGrad)" strokeWidth="10" strokeLinecap="round" fill="none" />
        <circle cx="717" cy="328" r="5" fill="url(#skinTone4)" />
      </motion.g>

      {/* PERSON 5: PHOTOGRAPHY & MEDIA (Female, Modern Camera) */}
      <motion.g
        id="person-photo"
        custom={4}
        variants={personVariants}
        initial="hidden"
        animate="visible"
        filter={activeSkill === 'photo' ? 'url(#personHighlight)' : undefined}
      >
        <ellipse
          cx="835"
          cy="462"
          rx={activeSkill === 'photo' ? 38 : 34}
          ry="7"
          fill={activeSkill === 'photo' ? '#A855F7' : '#18042B'}
          opacity={activeSkill === 'photo' ? 0.35 : 0.1}
          style={{ transition: 'all 300ms ease' }}
        />

        {/* Pants & Ankle Boots */}
        <path d="M 824 362 L 820 445" stroke="#18072B" strokeWidth="12" strokeLinecap="round" />
        <path d="M 844 362 L 848 445" stroke="#18072B" strokeWidth="12" strokeLinecap="round" />
        <path d="M 812 448 C 812 443 828 443 828 448 L 830 453 L 810 453 Z" fill="#2E1065" />
        <path d="M 840 448 C 840 443 856 443 856 448 L 858 453 L 838 453 Z" fill="#2E1065" />

        {/* Utility Jacket */}
        <path d="M 812 265 C 812 250 858 250 858 265 L 860 366 C 860 370 810 370 810 366 Z" fill="url(#blazerLavGrad)" />
        <path d="M 828 255 L 842 255 L 835 275 Z" fill="#FFFFFF" />
        <path d="M 820 255 L 832 295 L 820 345" stroke="#7E22CE" strokeWidth="1.3" fill="none" />
        <path d="M 850 255 L 838 295 L 850 345" stroke="#7E22CE" strokeWidth="1.3" fill="none" />

        {/* Head & Hair */}
        <rect x="830" y="240" width="10" height="18" rx="4" fill="url(#skinTone1)" />
        <circle cx="835" cy="225" r="18" fill="url(#skinTone1)" />
        <path d="M 818 226 C 818 206 852 206 852 226 C 852 245 848 248 844 248 C 840 232 830 230 822 248 C 818 248 818 245 818 226 Z" fill="#1E0B38" />

        {/* Face */}
        <ellipse cx="828" cy="225" rx="2" ry="2.2" fill="#0F041C" />
        <path d="M 825 233 Q 829 237 833 234" stroke="#0F041C" strokeWidth="1.3" strokeLinecap="round" fill="none" />

        {/* Camera Strap & Arms */}
        <path d="M 820 270 Q 835 315 822 345" stroke="#4C1D95" strokeWidth="3" fill="none" />
        <path d="M 816 270 Q 806 295 812 320" stroke="url(#blazerLavGrad)" strokeWidth="9" strokeLinecap="round" fill="none" />
        <path d="M 854 270 Q 842 295 832 320" stroke="url(#blazerLavGrad)" strokeWidth="9" strokeLinecap="round" fill="none" />
        <circle cx="814" cy="322" r="4.5" fill="url(#skinTone1)" />
        <circle cx="832" cy="322" r="4.5" fill="url(#skinTone1)" />

        {/* Camera */}
        <g transform="translate(806, 310)">
          <rect x="0" y="4" width="30" height="20" rx="4" fill="#0F041C" />
          <rect x="8" y="0" width="8" height="4" rx="1.5" fill="#7C3AED" />
          <circle cx="15" cy="14" r="8" fill="#1E0B38" stroke="#A855F7" strokeWidth="1.5" />
          <circle cx="15" cy="14" r="5" fill="#7C3AED" />
          <circle cx="13" cy="12" r="1.5" fill="#FFFFFF" />
        </g>
      </motion.g>
    </g>
  );
}
