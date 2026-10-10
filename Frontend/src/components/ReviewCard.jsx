import React from 'react';
import { motion } from 'framer-motion';

export default function ReviewCard() {
  return (
    <motion.div
      className="review-card feed-interests-card"
      role="region"
      aria-label="Your Feed, Your Interests"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, delay: 0.65, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -2 }}
    >
      <h2 className="card-heading">
        YOUR FEED. YOUR INTERESTS.
      </h2>
      <p className="card-description">
        A social experience shaped around what you want to learn, create and explore.
      </p>

      <style>{`
        .feed-interests-card {
          background: #0A0612;
          border: 2px solid rgba(255, 255, 255, 0.12);
          border-radius: var(--border-radius-card, 18px);
          padding: 18px 20px;
          color: #FFFFFF;
          display: flex;
          flex-direction: column;
          gap: 8px;
          min-width: 0;
          width: 100%;
          max-width: 250px;
          margin-top: 15px;
          box-sizing: border-box;
          box-shadow: 4px 4px 0 rgba(9, 3, 15, 0.4);
          transition: border-color 200ms ease, box-shadow 200ms ease;
          user-select: none;
        }

        .feed-interests-card:hover {
          border-color: rgba(169, 67, 245, 0.45);
          box-shadow: 5px 6px 0 rgba(9, 3, 15, 0.5);
        }

        .card-heading {
          font-family: var(--font-body, 'Inter', sans-serif);
          font-size: 15px;
          font-weight: 800;
          line-height: 1.35;
          letter-spacing: 0.03em;
          text-transform: uppercase;
          color: #FFFFFF;
          margin: 0;
        }

        .card-description {
          font-family: var(--font-body, 'Inter', sans-serif);
          font-size: 13px;
          line-height: 1.55;
          color: rgba(255, 255, 255, 0.85);
          max-width: 235px;
          margin: 0;
        }

        @media (max-width: 1024px) {
          .feed-interests-card {
            max-width: 230px;
            padding: 16px 18px;
          }

          .card-heading {
            font-size: 14px;
          }

          .card-description {
            font-size: 12.5px;
          }
        }

        @media (max-width: 768px) {
  .feed-interests-card {
    width: 100%;
    min-width: 0;
    max-width: 100%;
    margin: 0;
    box-sizing: border-box;
  }

  .card-description {
    max-width: 100%;
    overflow-wrap: anywhere;
  }
}

@media (max-width: 360px) {
  .feed-interests-card {
    padding: 14px;
  }

  .card-heading {
    font-size: 13px;
  }
}
      `}</style>
    </motion.div>
  );
}
