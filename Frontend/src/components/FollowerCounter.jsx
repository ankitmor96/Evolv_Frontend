import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Users } from 'lucide-react';
import { socialReactionVariants } from './motionVariants';

/**
 * FollowerCounter Component
 * Displays "+520 followers" with a subtle count-up animation (0 -> 120 -> 240 -> 380 -> 520)
 * over ~1000ms upon initial appearance.
 * Runs strictly ONCE and does NOT count continuously.
 */
export default function FollowerCounter({ className = '', style = {} }) {
  const [count, setCount] = useState(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 520 : 0;
    }
    return 0;
  });
  const hasAnimatedRef = useRef(false);

  useEffect(() => {
    if (hasAnimatedRef.current) return;
    hasAnimatedRef.current = true;

    const prefersReducedMotion =
      window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    // Start count-up after initial entrance delay (~1.5s)
    const startTimeout = setTimeout(() => {
      const target = 520;
      const duration = 1000;
      const startTime = performance.now();

      const updateCount = (now) => {
        const elapsed = now - startTime;
        const progress = Math.min(1, elapsed / duration);
        // Smooth ease-out quad curve
        const easeOut = 1 - Math.pow(1 - progress, 2);
        const currentVal = Math.round(easeOut * target);

        setCount(currentVal);

        if (progress < 1) {
          requestAnimationFrame(updateCount);
        } else {
          setCount(target);
        }
      };

      requestAnimationFrame(updateCount);
    }, 1500);

    return () => clearTimeout(startTimeout);
  }, []);

  return (
    <motion.div
      className={`follower-counter-pill ${className}`}
      variants={socialReactionVariants}
      custom={0.1}
      initial="hidden"
      animate="visible"
      style={style}
      aria-label={`+${count} followers`}
    >
      <div className="follower-icon-box" aria-hidden="true">
        <Users size={14} color="#AA45F5" />
      </div>
      <span className="follower-text">
        +{count} Connections
      </span>

      <style>{`
        .follower-counter-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: var(--dark, #09030F);
          border: 2px solid var(--border, #09030F);
          border-radius: 20px;
          padding: 6px 12px;
          box-shadow: 3px 3px 0 rgba(9, 3, 15, 0.2);
          user-select: none;
          pointer-events: auto;
          transition: transform 180ms ease, box-shadow 180ms ease;
        }

        .follower-counter-pill:hover {
          transform: translateY(-2px);
          box-shadow: 4px 5px 0 rgba(9, 3, 15, 0.3);
        }

        .follower-icon-box {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .follower-text {
          font-family: var(--font-body, 'Inter', sans-serif);
          font-size: 0.78rem;
          font-weight: 700;
          color: var(--white, #FFFFFF);
          white-space: nowrap;
        }
      `}</style>
    </motion.div>
  );
}
