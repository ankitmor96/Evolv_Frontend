import React from 'react';
import { motion } from 'framer-motion';
import HeroHeader from './HeroHeader';
import CTAButtons from './CTAButtons';
import HeroIllustration from './HeroIllustration';
import ReviewCard from './ReviewCard';
import TrustCard from './TrustCard';
import {
  headingVariants,
  descriptionVariants,
  ctaVariants,
} from './motionVariants';

export default function Hero() {
  return (
    <main className="page-outer" role="main">
      <section className="hero-container" aria-label="Hero section">
        {/* 0.15s Navbar inside the purple hero with mathematical center logo */}
        <HeroHeader />

        {/* Hero content with staged cubic-bezier entrance */}
        <div className="hero-content">
          {/* 0.30s Heading */}
          <motion.h1
            className="hero-heading"
            variants={headingVariants}
            initial="hidden"
            animate="visible"
          >
            Less Scrolling. More Evolving.
          </motion.h1>
          

          {/* 0.55s CTA Buttons */}
          <motion.div
            variants={ctaVariants}
            initial="hidden"
            animate="visible"
          >
            <CTAButtons />
          </motion.div>
        </div>

        {/* 0.70s - 1.5s Living Skill Network Illustration Area */}
        <div className="hero-illustration-area">
          <HeroIllustration />

          {/* Bottom verified trust cards row */}
          <div className="hero-cards-row">
            <ReviewCard />
            <TrustCard />
          </div>
        </div>
      </section>

      <style>{`
        /* ─── Outer background ─── */
        .page-outer {
          // min-height: 100vh;
          background: var(--color-outer-bg, #F4F3FA);
          display: flex;
          align-items: flex-start;
          justify-content: center;
          padding: 20px;
        }

        /* ─── 0.0s Purple hero container ─── */
        .hero-container {
          width: 100%;
          max-width: 1280px;
          background: var(--purple, #AA45F5);
          border: var(--border-width, 2.5px) solid var(--border, #09030F);
          border-radius: var(--border-radius-hero, 32px);
          padding: 20px 24px 36px;
          position: relative;
          overflow: hidden;
          box-shadow:
            inset 0 0 0 6px rgba(9, 3, 15, 0.06),
            6px 8px 0 rgba(9, 3, 15, 0.14);
        }

        /* ─── Hero content (heading / subtitle / CTAs) ─── */
        .hero-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 20px;
          padding: 36px 20px 16px;
          position: relative;
          z-index: 10;
        }

        .hero-heading {
          font-family: var(--font-heading, 'Anton', sans-serif);
          font-size: clamp(2.4rem, 5.5vw, 4.8rem);
          line-height: 1.05;
          letter-spacing: 0.01em;
          text-transform: uppercase;
          color: var(--white, #FFFFFF);
          max-width: 920px;
          margin: 0;
        }

        .hero-subtitle {
          font-family: var(--font-body, 'Inter', sans-serif);
          font-size: clamp(0.9rem, 1.6vw, 1.05rem);
          line-height: 1.65;
          color: rgba(255, 255, 255, 0.9);
          max-width: 600px;
          margin: 0;
        }

        /* ─── Illustration area ─── */
        .hero-illustration-area {
          position: relative;
          margin-top: 12px;
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 100%;
        }

        /* ─── Cards row ─── */
        /* Cards row */
.hero-cards-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 16px;
  width: 100%;
  min-width: 0;
  padding: 0 12px;
  margin-top: -65px;
  position: relative;
  z-index: 40;
  box-sizing: border-box;
  pointer-events: none;
}

.hero-cards-row > * {
  pointer-events: auto;
  box-sizing: border-box;
  min-width: 0;
} 

        /* ─── Responsive Adjustments ─── */
        @media (max-width: 1024px) {
          .hero-heading {
            font-size: clamp(2.2rem, 5vw, 3.8rem);
          }
          .hero-cards-row {
            margin-top: -30px;
          }
        }

        @media (max-width: 768px) {
          .page-outer {
            padding: 12px;
          }

          .hero-container {
            padding: 16px 14px 28px;
            border-radius: 24px;
          }

          .hero-content {
            padding: 24px 8px 12px;
            gap: 16px;
          }

          .hero-heading {
            font-size: clamp(2rem, 8vw, 3rem);
            br { display: none; }
          }

          .hero-subtitle {
            font-size: 0.88rem;
          }

          .hero-cards-row {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    justify-content: flex-start;
    gap: 12px;
    width: 100%;
    padding: 0;
    margin-top: 20px;
    position: relative;
  }

  .hero-cards-row > .review-card,
  .hero-cards-row > .trust-card {
    position: relative;
    inset: auto;
    transform: none;
    flex: 0 0 auto;
    width: 100%;
    max-width: 100%;
    min-width: 0;
    margin: 0;
    box-sizing: border-box;
  }
        }

        @media (max-width: 480px) {
          .hero-heading {
            font-size: clamp(1.9rem, 9.5vw, 2.6rem);
          }

          .hero-container {
            border-radius: 20px;
          }
        }
      `}</style>
    </main>
  );
}
