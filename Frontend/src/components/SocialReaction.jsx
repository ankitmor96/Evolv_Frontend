import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';
import { socialReactionVariants, EASE_FAST } from './motionVariants';

/**
 * SocialReaction Component
 * Realistic social interaction badge (Heart + "+128" count).
 * No continuous bouncing!
 * Enters at 1.5s, then occasionally (every 9-12s) pulses gently (1 -> 1.12 -> 1, 250ms)
 * with a subtle count transition (+128 -> +129).
 */
export default function SocialReaction({ className = '', style = {} }) {
  const [count, setCount] = useState(128);
  const [isReacting, setIsReacting] = useState(false);

  useEffect(() => {
    const prefersReducedMotion =
      window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    // Trigger an occasional subtle social reaction (every 10 seconds)
    const interval = setInterval(() => {
      setIsReacting(true);
      setCount((prev) => (prev === 128 ? 129 : 128));

      const timer = setTimeout(() => {
        setIsReacting(false);
      }, 300);

      return () => clearTimeout(timer);
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      className={`social-reaction-pill ${className}`}
      variants={socialReactionVariants}
      initial="hidden"
      animate="visible"
      style={style}
      aria-label={`${count} likes reaction`}
    >
      <motion.div
        className="heart-icon-box"
        animate={isReacting ? { scale: [1, 1.14, 1] } : { scale: 1 }}
        transition={{ duration: 0.25, ease: EASE_FAST }}
      >
        <Heart size={14} fill="#FF4E6A" color="#FF4E6A" aria-hidden="true" />
      </motion.div>

      <span className="reaction-count">
        +{count}
      </span>

      <style>{`
        .social-reaction-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: #FFFFFF;
          border: 2px solid var(--border, #09030F);
          border-radius: 20px;
          padding: 6px 12px;
          box-shadow: 3px 3px 0 rgba(9, 3, 15, 0.16);
          user-select: none;
          pointer-events: auto;
          transition: transform 180ms ease, box-shadow 180ms ease;
        }

        .social-reaction-pill:hover {
          transform: translateY(-2px);
          box-shadow: 4px 5px 0 rgba(9, 3, 15, 0.22);
        }

        .heart-icon-box {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .reaction-count {
          font-family: var(--font-body, 'Inter', sans-serif);
          font-size: 0.78rem;
          font-weight: 700;
          color: var(--dark, #09030F);
          min-width: 32px;
        }
      `}</style>
    </motion.div>
  );
}
