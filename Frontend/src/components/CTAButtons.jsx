import React from 'react';
import { ArrowUpRight } from 'lucide-react';
import { navigate } from '../utils/navigate.js';
const openVideo = ()=>{
  // <Video/>
}

export default function CTAButtons() {
  return (
    <div className="cta-wrapper anim-fade-up-3" role="group" aria-label="Call to action buttons">
      <a
        href="/learn-more"
        id="cta-learn-more"
        className="btn btn-primary"
        onClick={()=>openVideo()}
        aria-label="Learn more about Stormlikes"
      >
        <span>See How Evolve Works</span>
        <ArrowUpRight size={18} aria-hidden="true" />
      </a>
      <a
         href="/signup"
        id="cta-buy-now"
        onClick={(e) => { e.preventDefault(); navigate('/signup'); }}
        className="btn btn-secondary"
        aria-label="Buy followers, likes or views now"
      >
        <span>Join Evolve</span>
        <ArrowUpRight size={18} aria-hidden="true" />
      </a>

      <style>{`
        .cta-wrapper {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          flex-wrap: wrap;
        }

        .btn {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 13px 26px;
          border-radius: var(--border-radius-btn);
          font-family: var(--font-body);
          font-size: 0.95rem;
          font-weight: 700;
          cursor: pointer;
          border: var(--border-width) solid var(--color-border);
          transition: transform 220ms ease, box-shadow 220ms ease, background 220ms ease;
          text-decoration: none;
          letter-spacing: 0.01em;
          white-space: nowrap;
        }

        .btn:active {
          transform: scale(0.97) !important;
        }

        .btn-primary {
          background: var(--color-dark);
          color: var(--color-white);
          box-shadow: 3px 3px 0 rgba(9,3,15,0.3);
        }

        .btn-primary:hover {
          transform: translateY(-2px) scale(1.02);
          box-shadow: 5px 5px 0 rgba(9,3,15,0.3);
          background: #1a0d2e;
        }

        .btn-secondary {
          background: rgba(255, 255, 255, 0.15);
          color: var(--color-white);
          border-color: rgba(255,255,255,0.6);
          box-shadow: 3px 3px 0 rgba(255,255,255,0.1);
        }

        .btn-secondary:hover {
          transform: translateY(-2px) scale(1.02);
          background: rgba(255, 255, 255, 0.25);
          box-shadow: 5px 5px 0 rgba(255,255,255,0.15);
        }

        @media (max-width: 400px) {
          .btn {
            padding: 11px 20px;
            font-size: 0.88rem;
          }
        }
      `}</style>
    </div>
  );
}
