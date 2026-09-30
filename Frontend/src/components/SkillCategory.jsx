import React from 'react';
import { motion } from 'framer-motion';
import { skillLabelVariants } from './motionVariants';

/**
 * SkillCategory Component
 * Represents intelligent skill badges around the network.
 * Features directional entrance, 180-220ms hover response, and active discovery highlights.
 */
export default function SkillCategory({
  id,
  title,
  subtitle,
  icon,
  isActive = false,
  onHoverStart,
  onHoverEnd,
  className = '',
  style = {},
}) {
  const variant = skillLabelVariants[id] || skillLabelVariants.art;

  return (
    <motion.div
      className={`skill-category-badge skill-category-${id} ${isActive ? 'is-active' : ''} ${className}`}
      variants={variant}
      initial="hidden"
      animate="visible"
      onMouseEnter={onHoverStart}
      onMouseLeave={onHoverEnd}
      style={style}
      role="button"
      tabIndex={0}
      aria-pressed={isActive}
      onFocus={onHoverStart}
      onBlur={onHoverEnd}
    >
      <div className="skill-badge-inner">
        <div className="skill-icon-wrapper" aria-hidden="true">
          {icon}
        </div>
        <div className="skill-text-content">
          <span className="skill-badge-title">{title}</span>
          {subtitle && <span className="skill-badge-subtitle">{subtitle}</span>}
        </div>
      </div>

      <style>{`
        .skill-category-badge {
          display: inline-flex;
          align-items: center;
          background: #FFFFFF;
          border: 2px solid var(--border, #09030F);
          border-radius: 20px;
          padding: 8px 14px 8px 10px;
          box-shadow: 3px 3px 0 rgba(9, 3, 15, 0.14);
          cursor: pointer;
          user-select: none;
          transition: transform 200ms cubic-bezier(0.16, 1, 0.3, 1),
                      box-shadow 200ms cubic-bezier(0.16, 1, 0.3, 1),
                      border-color 200ms cubic-bezier(0.16, 1, 0.3, 1),
                      background-color 200ms cubic-bezier(0.16, 1, 0.3, 1);
          outline: none;
        }

        .skill-badge-inner {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .skill-icon-wrapper {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: #F3E8FF;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--purple-dark, #8B2FD8);
          flex-shrink: 0;
          transition: transform 200ms cubic-bezier(0.16, 1, 0.3, 1),
                      background-color 200ms cubic-bezier(0.16, 1, 0.3, 1),
                      color 200ms cubic-bezier(0.16, 1, 0.3, 1);
        }

        .skill-text-content {
          display: flex;
          flex-direction: column;
          line-height: 1.25;
        }

        .skill-badge-title {
          font-family: var(--font-body, 'Inter', sans-serif);
          font-size: 0.82rem;
          font-weight: 700;
          color: var(--dark, #09030F);
          white-space: nowrap;
          transition: color 200ms ease;
        }

        .skill-badge-subtitle {
          font-family: var(--font-body, 'Inter', sans-serif);
          font-size: 0.7rem;
          font-weight: 600;
          color: #7C3AED;
          white-space: nowrap;
          transition: color 200ms ease;
        }

        /* Hover & Active States */
        .skill-category-badge:hover,
        .skill-category-badge.is-active {
          transform: translateY(-2px);
          box-shadow: 4px 5px 0 rgba(147, 51, 234, 0.3);
          border-color: #8B2FD8;
          background-color: #FAF7FF;
        }

        .skill-category-badge:hover .skill-icon-wrapper,
        .skill-category-badge.is-active .skill-icon-wrapper {
          transform: scale(1.05);
          background-color: var(--purple, #AA45F5);
          color: #FFFFFF;
        }

        .skill-category-badge:hover .skill-badge-title,
        .skill-category-badge.is-active .skill-badge-title {
          color: #581C87;
        }

        .skill-category-badge:hover .skill-badge-subtitle,
        .skill-category-badge.is-active .skill-badge-subtitle {
          color: #9333EA;
        }

        @media (max-width: 768px) {
          .skill-category-badge {
            padding: 6px 10px 6px 8px;
            border-radius: 16px;
          }
          .skill-icon-wrapper {
            width: 26px;
            height: 26px;
          }
          .skill-badge-title {
            font-size: 0.74rem;
          }
          .skill-badge-subtitle {
            font-size: 0.64rem;
          }
        }

        @media (max-width: 390px) {
          .skill-category-badge {
            padding: 5px 8px;
          }
          .skill-badge-title {
            font-size: 0.7rem;
          }
          .skill-badge-subtitle {
            display: none;
          }
        }
      `}</style>
    </motion.div>
  );
}
