import { useState, useEffect, useRef } from 'react';

/**
 * Hook for subtle layered mouse parallax.
 * Strictly throttled and smoothed via requestAnimationFrame.
 * 
 * Layer Depths:
 * Layer 1 (Background): 0px
 * Layer 2 (Skill labels): 1–3px
 * Layer 3 (People): 2–4px
 * Layer 4 (Central card): 4–6px
 * Layer 5 (Small reactions): 5–7px
 * 
 * Disabled automatically on touch devices and if prefers-reduced-motion is true.
 */
export function useParallaxMouse(containerRef) {
  const [offsets, setOffsets] = useState({
    layer1: { x: 0, y: 0 },
    layer2: { x: 0, y: 0 },
    layer3: { x: 0, y: 0 },
    layer4: { x: 0, y: 0 },
    layer5: { x: 0, y: 0 },
  });

  const mouseTargetRef = useRef({ x: 0, y: 0 });
  const currentPosRef = useRef({ x: 0, y: 0 });
  const animFrameId = useRef(null);

  useEffect(() => {
    // Check if hover is supported and reduced motion is NOT preferred
    const hasFinePointer = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    const prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (!hasFinePointer || prefersReducedMotion) {
      return;
    }


    const handleMouseMove = (e) => {
      let rect;
      if (containerRef?.current) {
        rect = containerRef.current.getBoundingClientRect();
      } else {
        rect = { left: 0, top: 0, width: window.innerWidth, height: window.innerHeight };
      }

      const clientX = e.clientX - rect.left;
      const clientY = e.clientY - rect.top;

      // Normalized coordinates from -1 to 1 centered
      const nx = Math.max(-1, Math.min(1, ((clientX / rect.width) - 0.5) * 2));
      const ny = Math.max(-1, Math.min(1, ((clientY / rect.height) - 0.5) * 2));

      mouseTargetRef.current = { x: nx, y: ny };
    };

    const handleMouseLeave = () => {
      mouseTargetRef.current = { x: 0, y: 0 };
    };

    // Smooth animation loop using lerp (factor 0.05 for extremely smooth, slow movement)
    const animate = () => {
      const target = mouseTargetRef.current;
      const current = currentPosRef.current;

      current.x += (target.x - current.x) * 0.06;
      current.y += (target.y - current.y) * 0.06;

      setOffsets({
        layer1: { x: 0, y: 0 },
        layer2: { x: Number((current.x * 2.2).toFixed(2)), y: Number((current.y * 2.2).toFixed(2)) },
        layer3: { x: Number((current.x * 3.4).toFixed(2)), y: Number((current.y * 3.4).toFixed(2)) },
        layer4: { x: Number((current.x * 5.0).toFixed(2)), y: Number((current.y * 5.0).toFixed(2)) },
        layer5: { x: Number((current.x * 6.5).toFixed(2)), y: Number((current.y * 6.5).toFixed(2)) },
      });

      animFrameId.current = requestAnimationFrame(animate);
    };

    const targetEl = containerRef?.current || window;
    targetEl.addEventListener('mousemove', handleMouseMove, { passive: true });
    targetEl.addEventListener('mouseleave', handleMouseLeave, { passive: true });
    animFrameId.current = requestAnimationFrame(animate);

    return () => {
      targetEl.removeEventListener('mousemove', handleMouseMove);
      targetEl.removeEventListener('mouseleave', handleMouseLeave);
      if (animFrameId.current) {
        cancelAnimationFrame(animFrameId.current);
      }
    };
  }, [containerRef]);

  return offsets;
}
