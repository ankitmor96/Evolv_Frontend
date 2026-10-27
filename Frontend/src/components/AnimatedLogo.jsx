import React from 'react';

/**
 * AnimatedLogo component using existing animated MP4 logo.
 * Must stay visually and mathematically centered in the navbar.
 */
export default function AnimatedLogo({ className = '' }) {
  return (
    <>
       <a href="/" className="logo">
        <img src="/logo.png" alt="Logo" />
      </a>
      <style>{`
        .animated-logo-link {
          display: flex;
          align-items: center;
          justify-content: center;
          text-decoration: none;
          height: 100%;
          line-height: 0;
          cursor: pointer;
        }

        // .animated-logo-video {
        //   width: 130px;
        //   height: 44px;
        //   object-fit: contain;
        //   display: block;
        //   filter: drop-shadow(0 2px 4px rgba(9, 3, 15, 0.08));
        //   transition: transform 200ms cubic-bezier(0.16, 1, 0.3, 1);
        // }

        // .animated-logo-link:hover .animated-logo-video {
        //   transform: scale(1.02);
        // }
        .logo img {
  width: 120px;
  height: auto;
  display: block;
}

        @media (max-width: 768px) {
          .animated-logo-video {
            width: 110px;
            height: 38px;
          }
        }
          .logo img {
  width: 100px;
}

        @media (max-width: 390px) {
          .animated-logo-video {
            width: 95px;
            height: 34px;
          }
        }
      `}</style>
    
    </>
  );
}
