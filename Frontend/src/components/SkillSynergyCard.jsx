import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { synergyCardVariants } from './motionVariants';

/**
 * SkillSynergyCard Component
 * The visual centerpiece of the skill collaboration platform.
 * Features 600ms staged entrance at 1.3s, subtle hover elevation,
 * 24s ultra-slow rotating central star, and realistic internal UI controls.
 */
export default function SkillSynergyCard({ className = '', style = {}, onCardHover }) {
  const [activeTab, setActiveTab] = useState('connect');
  const [isCardHovered, setIsCardHovered] = useState(false);

  const handleMouseEnter = () => {
    setIsCardHovered(true);
    if (onCardHover) onCardHover(true);
  };

  const handleMouseLeave = () => {
    setIsCardHovered(false);
    if (onCardHover) onCardHover(false);
  };

  return (
    <motion.div
      className={`skill-synergy-card ${isCardHovered ? 'hovered' : ''} ${className}`}
      variants={synergyCardVariants}
      initial="hidden"
      animate="visible"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={style}
      role="region"
      aria-label="Skill Synergy Collaboration Hub"
    >
      {/* Card Header */}
      <div className="synergy-header">
        <div className="synergy-header-badge">
          <span className="synergy-pulse-dot" />
          <span className="synergy-header-title">Skill Synergy</span>
        </div>
      </div>

      {/* Interactive Micro Skill Nodes */}
      <div className="synergy-network-visual">
        <div className="synergy-nodes-row">
          <div className="micro-node micro-node-art" title="Art & Design Node">
            <span className="micro-node-dot art-dot" />
            <span className="micro-node-name">Design</span>
          </div>
          <div className="network-bridge-line" />
          <div className="micro-node micro-node-sound" title="Audio & Music Node">
            <span className="micro-node-dot sound-dot" />
            <span className="micro-node-name">Audio</span>
          </div>
        </div>

        {/* Center Sparkle Node with Slow 24s Rotation */}
        <div className="center-sparkle-anchor">
          <div className={`center-sparkle-disc ${isCardHovered ? 'hover-tilt' : ''}`}>
            <Sparkles size={16} className="slow-rotating-star" aria-hidden="true" />
          </div>
        </div>
      </div>

      {/* Internal Controls: Connect & Create Tabs */}
      <div className="synergy-tabs-row" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'connect'}
          className={`synergy-tab-btn ${activeTab === 'connect' ? 'active' : ''}`}
          onClick={() => setActiveTab('connect')}
        >
          Connect
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'create'}
          className={`synergy-tab-btn ${activeTab === 'create' ? 'active' : ''}`}
          onClick={() => setActiveTab('create')}
        >
          Create
        </button>
      </div>

      {/* Grow Together Action Button */}
      <button
        type="button"
        className="synergy-action-btn"
        aria-label="Grow Together on Evolve"
      >
        <span>Grow Together</span>
      </button>

      <style>{`
        .skill-synergy-card {
          width: 142px;
          background: #FFFFFF;
          border: 2px solid var(--border, #09030F);
          border-radius: 18px;
          padding: 10px 10px 12px;
          box-shadow: 4px 5px 0 rgba(9, 3, 15, 0.16);
          display: flex;
          flex-direction: column;
          gap: 9px;
          user-select: none;
          transition: transform 220ms cubic-bezier(0.16, 1, 0.3, 1),
                      box-shadow 220ms cubic-bezier(0.16, 1, 0.3, 1),
                      border-color 220ms cubic-bezier(0.16, 1, 0.3, 1);
        }

        .skill-synergy-card.hovered {
          transform: translateY(-2px);
          box-shadow: 5px 7px 0 rgba(124, 58, 237, 0.28);
          border-color: #7C3AED;
        }

        /* ─── Header ─── */
        .synergy-header {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .synergy-header-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: #F5F0FF;
          padding: 3px 8px;
          border-radius: 20px;
          border: 1px solid #E4D4FF;
        }

        .synergy-pulse-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #9333EA;
        }

        .synergy-header-title {
          font-family: var(--font-body, 'Inter', sans-serif);
          font-size: 0.68rem;
          font-weight: 800;
          color: #581C87;
          letter-spacing: -0.01em;
        }

        /* ─── Network Visual Area ─── */
        .synergy-network-visual {
          position: relative;
          background: #FAF8FF;
          border-radius: 12px;
          padding: 8px 6px 10px;
          border: 1px dashed #DDD6FE;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
        }

        .synergy-nodes-row {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 4px;
        }

        .micro-node {
          display: flex;
          align-items: center;
          gap: 4px;
          background: #FFFFFF;
          padding: 2px 5px;
          border-radius: 6px;
          border: 1px solid #E9D5FF;
          transition: transform 180ms ease;
        }

        .micro-node:hover {
          transform: translateY(-1px);
        }

        .micro-node-dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
        }

        .art-dot { background: #AA45F5; }
        .sound-dot { background: #7C3AED; }

        .micro-node-name {
          font-size: 0.6rem;
          font-weight: 700;
          color: #3B0764;
        }

        .network-bridge-line {
          flex: 1;
          height: 1px;
          background: #DDD6FE;
          margin: 0 4px;
        }

        /* ─── Central Rotating Star ─── */
        .center-sparkle-anchor {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .center-sparkle-disc {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: #7C3AED;
          color: #FFFFFF;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 6px rgba(124, 58, 237, 0.35);
          transition: transform 220ms ease;
        }

        .center-sparkle-disc.hover-tilt {
          transform: rotate(10deg);
        }

        /* Very slow 24s spin (Not a spinner, graceful rotation) */
        .slow-rotating-star {
          animation: slowStarRotation 24s linear infinite;
        }

        @keyframes slowStarRotation {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }

        /* ─── Controls: Connect & Create ─── */
        .synergy-tabs-row {
          display: flex;
          gap: 5px;
        }

        .synergy-tab-btn {
          flex: 1;
          padding: 4px 6px;
          font-size: 0.64rem;
          font-weight: 700;
          border-radius: 6px;
          border: 1px solid #DDD6FE;
          background: #FAF8FF;
          color: #6B21A8;
          cursor: pointer;
          transition: transform 180ms ease, background 180ms ease, color 180ms ease;
        }

        .synergy-tab-btn:hover {
          transform: translateY(-1px);
          background: #EDE9FE;
        }

        .synergy-tab-btn.active {
          background: #EDE9FE;
          color: #581C87;
          border-color: #C4B5FD;
        }

        /* ─── Grow Together Button ─── */
        .synergy-action-btn {
          width: 100%;
          padding: 6px 8px;
          background: #7C3AED;
          color: #FFFFFF;
          font-family: var(--font-body, 'Inter', sans-serif);
          font-size: 0.7rem;
          font-weight: 700;
          border-radius: 8px;
          border: 1.5px solid var(--border, #09030F);
          cursor: pointer;
          box-shadow: 1.5px 2px 0 rgba(9, 3, 15, 0.2);
          transition: transform 180ms ease, background 180ms ease, box-shadow 180ms ease;
          text-align: center;
        }

        .synergy-action-btn:hover {
          transform: translateY(-1px);
          background: #6B21A8;
          box-shadow: 2px 3px 0 rgba(9, 3, 15, 0.25);
        }

        .synergy-action-btn:active {
          transform: scale(0.98);
        }

        @media (prefers-reduced-motion: reduce) {
          .slow-rotating-star {
            animation: none !important;
          }
        }
      `}</style>
    </motion.div>
  );
}
