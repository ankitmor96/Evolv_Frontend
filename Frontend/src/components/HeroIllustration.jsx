import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Palette, Activity, Sparkles, Mic, Camera } from 'lucide-react';
import SkillNetwork from './SkillNetwork';
import SkillConnections from './SkillConnections';
import SkillCategory from './SkillCategory';
import SkillSynergyCard from './SkillSynergyCard';
import SocialReaction from './SocialReaction';
import FollowerCounter from './FollowerCounter';
import { useParallaxMouse } from './useParallaxMouse';

const SKILL_ITEMS = [
  {
    id: 'art',
    title: 'Art & Design',
    subtitle: 'Learn • Share • Grow',
    icon: <Palette size={16} />,
    desktopPos: { left: '3%', top: '23%' },
    tabletPos: { left: '1%', top: '20%' },
  },
  {
    id: 'fitness',
    title: 'Fitness & Health',
    subtitle: 'Learn • Share • Grow',
    icon: <Activity size={16} />,
    desktopPos: { left: '20%', top: '10%' },
    tabletPos: { left: '16%', top: '8%' },
  },
  {
    id: 'social',
    title: 'Psychology',
    subtitle: 'Learn • Share • Grow',
    icon: <Sparkles size={16} />,
    desktopPos: { left: '50%', top: '2%', transform: 'translateX(-50%)' },
    tabletPos: { left: '50%', top: '2%', transform: 'translateX(-50%)' },
  },
  {
    id: 'audio',
    title: 'Philosophy',
    subtitle: 'Learn • Share • Grow',
    icon: <Mic size={16} />,
    desktopPos: { right: '20%', top: '10%' },
    tabletPos: { right: '16%', top: '8%' },
  },
  {
    id: 'photo',
    title: 'Photography',
    subtitle: 'Learn • Share • Grow',
    icon: <Camera size={16} />,
    desktopPos: { right: '3%', top: '23%' },
    tabletPos: { right: '1%', top: '20%' },
  },
];

const DISCOVERY_CYCLE = ['art', 'photo', 'audio', 'fitness', 'social'];

export default function HeroIllustration() {
  const containerRef = useRef(null);
  // Trigger viewport entrance once
  const isInView = useInView(containerRef, { once: true, amount: 0.2 });

  // Layered mouse parallax (0px, 1-3px, 2-4px, 4-6px, 5-7px)
  const parallax = useParallaxMouse(containerRef);
  // Mobile: keep the desktop design (1020x530) and scale it down to fit
  const DESIGN_W = 1020;
  const DESIGN_H = 530;
  const [isMobile, setIsMobile] = useState(false);
  const [scale, setScale] = useState(1);

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const update = () => {
      const mobile = window.matchMedia('(max-width: 640px)').matches;
      setIsMobile(mobile);
      setScale(mobile ? el.clientWidth / DESIGN_W : 1);
    };

    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    window.addEventListener('resize', update);

    return () => {
      ro.disconnect();
      window.removeEventListener('resize', update);
    };
  }, []);

  // Intelligent active skill management (hover takes priority, fallback to slow discovery)
  const [activeSkill, setActiveSkill] = useState(null);
  const [userHoveredSkill, setUserHoveredSkill] = useState(null);

  useEffect(() => {
    const prefersReduced =
      window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;

    let cycleIndex = 0;
    // Section 11: Slow discovery effect (6-8 seconds cycle)
    const discoveryInterval = setInterval(() => {
      if (!userHoveredSkill) {
        const next = DISCOVERY_CYCLE[cycleIndex % DISCOVERY_CYCLE.length];
        setActiveSkill(next);
        cycleIndex++;

        // Brief active pulse for 3 seconds then return to calm
        setTimeout(() => {
          setActiveSkill((curr) => (curr === next && !userHoveredSkill ? null : curr));
        }, 3000);
      }
    }, 7000);

    return () => clearInterval(discoveryInterval);
  }, [userHoveredSkill]);

  const handleSkillHoverStart = (id) => {
    setUserHoveredSkill(id);
    setActiveSkill(id);
  };

  const handleSkillHoverEnd = () => {
    setUserHoveredSkill(null);
    setActiveSkill(null);
  };

  return (
    <motion.div
      ref={containerRef}
      className="hero-skill-system"
      role="region"
      aria-label="Skill Network Ecosystem Visualization"
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
    >
      {/* ── DESKTOP & TABLET ILLUSTRATION STAGE ── */}
      {/* ── DESKTOP, TABLET & MOBILE (scaled) ── */}
      <div
        className="hero-stage-scaler"
        style={isMobile ? { height: DESIGN_H * scale } : undefined}
      >
        <div
          className="hero-desktop-stage"
          style={
            isMobile
              ? {
                width: DESIGN_W,
                height: DESIGN_H,
                aspectRatio: 'auto',
                transform: `scale(${scale})`,
                transformOrigin: 'top left',
              }
              : undefined
          }
        >
          {/* SVG LAYER: Background (Layer 1) & People/Connections (Layer 3) */}
          <div
            className="stage-svg-wrapper"
            style={{
              transform: `translate3d(${parallax.layer3.x}px, ${parallax.layer3.y}px, 0)`,
            }}
          >
            <svg
              className="hero-main-svg"
              viewBox="0 0 1020 540"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              preserveAspectRatio="xMidYMid meet"
              aria-hidden="true"
            >
              {/* Background & Characters (Mostly static after 1.0s entrance) */}
              <SkillNetwork activeSkill={activeSkill} />

              {/* Connection Lines (Draw at 1.15s, highlight active connection) */}
              <SkillConnections activeSkill={activeSkill} />
            </svg>
          </div>

          {/* LAYER 4: Central Skill Synergy Card (Easel Mounted) */}
          <div
            className="stage-center-card-anchor"
            style={{
              transform: `translate3d(calc(-50% + ${parallax.layer4.x}px), calc(-50% + ${parallax.layer4.y}px), 0)`,
            }}
          >
            <SkillSynergyCard
              onCardHover={(hovered) => {
                if (hovered && !userHoveredSkill) setActiveSkill('social');
                else if (!hovered && !userHoveredSkill) setActiveSkill(null);
              }}
            />
          </div>

          {/* LAYER 2: Intelligent Skill Labels (Directional entrance, 1-3px parallax) */}
          <div
            className="stage-labels-layer"
            style={{
              transform: `translate3d(${parallax.layer2.x}px, ${parallax.layer2.y}px, 0)`,
            }}
          >
            {SKILL_ITEMS.map((item) => (
              <div
                key={item.id}
                className={`stage-label-anchor stage-label-${item.id}`}
                style={{
                  position: 'absolute',
                  ...item.desktopPos,
                  zIndex: 30,
                }}
              >
                <SkillCategory
                  id={item.id}
                  title={item.title}
                  subtitle={item.subtitle}
                  icon={item.icon}
                  isActive={activeSkill === item.id}
                  onHoverStart={() => handleSkillHoverStart(item.id)}
                  onHoverEnd={handleSkillHoverEnd}
                />
              </div>
            ))}
          </div>

          {/* LAYER 5: Social Reactions & Follower Counters (5-7px parallax) */}
          <div
            className="stage-social-layer"
            style={{
              transform: `translate3d(${parallax.layer5.x}px, ${parallax.layer5.y}px, 0)`,
            }}
          >
            <div className="stage-reaction-anchor stage-reaction-left">
              <FollowerCounter />
            </div>
            <div className="stage-reaction-anchor stage-reaction-right">
              <SocialReaction />
            </div>
          </div>
        </div>
      </div>

      <style>{`

        .hero-skill-system {
  width: 100%;
  max-width: 1060px;
  margin: 0 auto;
  position: relative;
}

.hero-stage-scaler {
  width: 100%;
  position: relative;
}

.hero-desktop-stage {
  position: relative;
  width: 100%;
  aspect-ratio: 1020 / 530;
  display: block;
}

.stage-svg-wrapper {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  will-change: transform;
}

.hero-main-svg {
  width: 100%;
  height: 100%;
  overflow: visible;
  display: block;
}

.stage-center-card-anchor {
  position: absolute;
  left: 54%;
  top: 50%;
  z-index: 25;
  pointer-events: auto;
  will-change: transform;
}

.stage-labels-layer {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 30;
  will-change: transform;
  margin-bottom:10px;
}

.stage-label-anchor { pointer-events: auto; }

.stage-social-layer {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 35;
  will-change: transform;
}

.stage-reaction-anchor { position: absolute; pointer-events: auto; }
.stage-reaction-left  { left: 4%;  bottom: 24%; }
.stage-reaction-right { right: 4%; bottom: 24%; }

/* Tablet (641px - 1024px) */
@media (max-width: 1024px) and (min-width: 641px) {
  .stage-label-art     { left: 1% !important;  top: 20% !important; }
  .stage-label-fitness { left: 16% !important; top: 6% !important; }
  .stage-label-audio   { right: 16% !important; top: 6% !important; }
  .stage-label-photo   { right: 1% !important;  top: 20% !important; }
  .stage-reaction-left  { left: 2%;  bottom: 18%; }
  .stage-reaction-right { right: 2%; bottom: 18%; }
}

/* Mobile (<= 640px): stage is scaled by JS, so lock its inner sizes */
@media (max-width: 640px) {
  .hero-stage-scaler { overflow: hidden; }

  .hero-desktop-stage .stage-svg-wrapper {
    left: 0 !important;
    top: 0 !important;
    width: 1020px !important;
    height: 530px !important;
  }

  .hero-desktop-stage .hero-main-svg {
    width: 1020px !important;
    height: 530px !important;
    max-width: none !important;
  }
}
      `}</style>
    </motion.div>
  );
}
