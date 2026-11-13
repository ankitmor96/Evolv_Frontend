import React from 'react';
import { motion } from 'framer-motion';

const loopSteps = [
  {
    num: '01',
    title: 'DISCOVER',
    desc: 'Find ideas and people.',
  },
  {
    num: '02',
    title: 'CREATE',
    desc: 'Share what you know.',
  },
  {
    num: '03',
    title: 'CONNECT',
    desc: 'Build meaningful relationships.',
  },
  {
    num: '04',
    title: 'GROW',
    desc: 'Keep evolving.',
  },
];

export default function TrustCard() {
  return (
    <motion.div
      className="trust-card evolv-loop-card"
      role="region"
      aria-label="The Evolv Loop"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, delay: 0.7, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -2 }}
    >
      <h2 className="loop-card-title">
        THE EVOLV LOOP
      </h2>

      <div className="loop-steps-list">
        {loopSteps.map((step, idx) => (
          <motion.div
            key={step.num}
            className="loop-step-item"
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{
              duration: 0.4,
              delay: 0.75 + idx * 0.12,
              ease: [0.16, 1, 0.3, 1],
            }}
          >
            {/* Left timeline connector column */}
            <div className="step-track" aria-hidden="true">
              <span className="step-dot" />
              {idx < loopSteps.length - 1 && <span className="step-connector-line" />}
            </div>

            {/* Right step details */}
            <div className="step-content">
              <div className="step-header">
                <span className="step-number">{step.num}</span>
                <span className="step-divider">─</span>
                <span className="step-title">{step.title}</span>
              </div>
              <p className="step-desc">{step.desc}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <style>{`
        .evolv-loop-card {
  background: #FFFFFF;
  border: 2px solid rgba(9, 3, 15, 0.12);
  border-radius: var(--border-radius-card, 18px);
  padding: 16px 20px 18px;
  color: #1A0A2E;
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 0;
  width: 100%;
  max-width: 285px;
  margin-left: auto;
  margin-top: 15px;
  box-sizing: border-box;
  box-shadow: 4px 4px 0 rgba(9, 3, 15, 0.12);
  transition: border-color 200ms ease, box-shadow 200ms ease;
  user-select: none;
}

.evolv-loop-card:hover {
  border-color: rgba(169, 67, 245, 0.45);
  box-shadow: 5px 6px 0 rgba(169, 67, 245, 0.2);
}

        .loop-card-title {
          font-family: var(--font-body, 'Inter', sans-serif);
          font-size: 14px;
          font-weight: 800;
          line-height: 1.2;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          color: #FFFFFF;
          margin: 0;
          padding-bottom: 2px;
        }

        .loop-steps-list {
          display: flex;
          flex-direction: column;
          gap: 0;
        }

        .loop-step-item {
          display: flex;
          gap: 10px;
          position: relative;
        }

        /* Left vertical timeline track */
        .step-track {
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 8px;
          padding-top: 5px;
          flex-shrink: 0;
        }

        .step-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #A943F5;
          box-shadow: 0 0 5px rgba(169, 67, 245, 0.6);
          flex-shrink: 0;
        }

        .step-connector-line {
          width: 1.5px;
          flex: 1;
          min-height: 22px;
          background: rgba(169, 67, 245, 0.35);
          margin: 3px 0;
        }

        /* Right step content */
        .step-content {
          display: flex;
          flex-direction: column;
          gap: 2px;
          padding-bottom: 10px;
        }

        .loop-step-item:last-child .step-content {
          padding-bottom: 0;
        }

        .step-header {
          display: flex;
          align-items: center;
          gap: 5px;
          line-height: 1;
        }

        .step-number {
          font-family: var(--font-body, 'Inter', sans-serif);
          font-size: 11px;
          font-weight: 800;
          color: #A943F5;
          letter-spacing: 0.02em;
        }

        .step-divider {
          color: rgba(169, 67, 245, 0.6);
          font-size: 11px;
          line-height: 1;
        }

        .step-title {
          font-family: var(--font-body, 'Inter', sans-serif);
          font-size: 12px;
          font-weight: 800;
          color: #FFFFFF;
          letter-spacing: 0.05em;
          text-transform: uppercase;
        }

        .step-desc {
          font-family: var(--font-body, 'Inter', sans-serif);
          font-size: 11.5px;
          line-height: 1.4;
          color: rgba(255, 255, 255, 0.78);
          margin: 0;
        }

        @media (max-width: 1024px) {
          .evolv-loop-card {
            min-width: 235px;
            max-width: 260px;
            padding: 14px 16px;
          }

          .loop-card-title {
            font-size: 13px;
          }

          .step-desc {
            font-size: 11px;
          }
        }

       @media (max-width: 768px) {
  .evolv-loop-card {
    width: 100%;
    min-width: 0;
    max-width: 100%;
    margin: 0;
    box-sizing: border-box;
  }
}

@media (max-width: 360px) {
  .evolv-loop-card {
    padding: 12px;
    gap: 10px;
  }
}
  .trust-card.evolv-loop-card {
  background: #FFFFFF !important;
  color: #000000 !important;
}

.trust-card.evolv-loop-card .loop-card-title,
.trust-card.evolv-loop-card .step-title {
  color: #000000 !important;
}

.trust-card.evolv-loop-card .step-desc {
  color: #222222 !important;
}

/* keep the purple accents */
.trust-card.evolv-loop-card .step-number,
.trust-card.evolv-loop-card .step-divider {
  color: #A943F5 !important;
}
  .review-card.feed-interests-card {
  background: #FFFFFF !important;
  color: #000000 !important;
  border-color: rgba(9, 3, 15, 0.12) !important;
  box-shadow: 4px 4px 0 rgba(9, 3, 15, 0.12) !important;
}

.review-card.feed-interests-card h1,
.review-card.feed-interests-card h2,
.review-card.feed-interests-card h3,
.review-card.feed-interests-card p,
.review-card.feed-interests-card span {
  color: #000000 !important;
}
        }
      `}</style>
    </motion.div>
  );
}
