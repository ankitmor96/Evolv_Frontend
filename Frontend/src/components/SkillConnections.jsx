import React, { useId } from 'react';
import { motion } from 'framer-motion';
import { connectionLineVariants } from './motionVariants';

/**
 * SkillConnections Component
 * Smoothly drawn SVG paths linking people, skills, and the central synergy hub.
 * Establishes the network during initial entrance (1.15s, 1-1.5s duration).
 * Remains mostly static, with subtle response when corresponding skill is active.
 */
export default function SkillConnections({ activeSkill = null }) {
  const filterId = useId();

  const lines = [
    {
      id: 'art',
      d: 'M 190 300 Q 325 240 455 275',
      delay: 0,
    },
    {
      id: 'fitness',
      d: 'M 330 310 Q 395 280 465 290',
      delay: 0.1,
    },
    {
      id: 'social',
      d: 'M 430 275 Q 450 265 470 275',
      delay: 0.05,
    },
    {
      id: 'audio',
      d: 'M 685 305 Q 620 270 555 285',
      delay: 0.15,
    },
    {
      id: 'photo',
      d: 'M 835 300 Q 700 240 560 275',
      delay: 0.2,
    },
    // Person-to-person collaborative arcs
    {
      id: 'art-fitness',
      d: 'M 195 320 Q 260 345 320 320',
      delay: 0.25,
      secondary: true,
    },
    {
      id: 'audio-photo',
      d: 'M 700 320 Q 765 345 830 320',
      delay: 0.3,
      secondary: true,
    },
  ];

  return (
    <g id="skill-connections-network" aria-hidden="true">
      <defs>
        <linearGradient id={`activeLineGrad-${filterId}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#AA45F5" />
          <stop offset="50%" stopColor="#D8B4FE" />
          <stop offset="100%" stopColor="#9333EA" />
        </linearGradient>
      </defs>

      {lines.map((line) => {
        const isActive = activeSkill && (activeSkill === line.id || line.id.includes(activeSkill));

        return (
          <g key={line.id} className={`connection-group ${isActive ? 'is-active' : ''}`}>
            {/* Base drawn connection line */}
            <motion.path
              d={line.d}
              fill="none"
              stroke={isActive ? `url(#activeLineGrad-${filterId})` : '#C084FC'}
              strokeWidth={isActive ? 2.5 : line.secondary ? 1.4 : 1.8}
              strokeDasharray={isActive ? 'none' : '5 6'}
              strokeOpacity={isActive ? 0.95 : line.secondary ? 0.35 : 0.55}
              strokeLinecap="round"
              variants={connectionLineVariants}
              custom={line.delay}
              initial="hidden"
              animate="visible"
              style={{
                transition: 'stroke 300ms ease, stroke-width 300ms ease, stroke-opacity 300ms ease',
              }}
            />

            {/* Subtle moving highlight for the active skill connection */}
            {isActive && (
              <motion.circle
                r="3.5"
                fill="#AA45F5"
                initial={{ offsetDistance: '0%', opacity: 0 }}
                animate={{
                  offsetDistance: ['0%', '100%'],
                  opacity: [0, 1, 1, 0],
                }}
                transition={{
                  duration: 2.2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
                style={{
                  offsetPath: `path('${line.d}')`,
                  filter: 'drop-shadow(0 0 4px #AA45F5)',
                }}
              />
            )}
          </g>
        );
      })}
    </g>
  );
}
