import { useEffect, useRef, useState } from 'react';
import { learningTrackingService, newProgressId } from '../../services/learningTrackingService.js';

const TICK_MS = 500;
const FLUSH_MS = 3000;

/** True while the element is at least `threshold` visible on screen. */
export function useInView(threshold = 0.6) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => setInView(e.isIntersecting && e.intersectionRatio >= threshold),
      { threshold: [0, threshold, 1] },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);
  return [ref, inView];
}

/**
 * Tracks one post.
 * @param postId
 * @param contentType  'image' | 'text' | 'video' | 'document'
 * @param isVisible    post is on screen (use useInView)
 * @param isPlaying    for video: true only while playing. Images/text: leave true.
 * @param getCompletion  () => 0..100  (video: currentTime/duration; image/text: 100)
 */
export function useLearningTracker({
  postId,
  contentType,
  isVisible,
  isPlaying = true,
  getCompletion = () => 100,
}) {
  const playingRef = useRef(isPlaying);
  const completionRef = useRef(getCompletion);
  playingRef.current = isPlaying;
  completionRef.current = getCompletion;

  const [status, setStatus] = useState({ qualified: false, counted: false });

  useEffect(() => {
    if (!postId || !isVisible) return undefined;

    let sessionId = null;
    let accMs = 0;
    let last = performance.now();
    let pending = null; // { progressId, seconds } — kept until it succeeds
    let queue = Promise.resolve();
    let finished = false;

    const startPromise = learningTrackingService
      .start({ postId, contentType })
      .then((r) => { sessionId = r?.sessionId ?? null; })
      .catch(() => { sessionId = null; });

    const eligible = () => document.visibilityState === 'visible' && playingRef.current;

    const tick = () => {
      const now = performance.now();
      if (eligible()) accMs += now - last;
      last = now;
    };

    const doFlush = async () => {
      await startPromise;
      if (!sessionId) return;
      if (!pending) {
        const secs = Math.round(accMs / 1000);
        if (secs < 1) return;
        accMs -= secs * 1000;
        pending = { progressId: newProgressId(), seconds: secs };
      }
      try {
        const res = await learningTrackingService.progress({
          sessionId,
          progressId: pending.progressId,
          activeSeconds: pending.seconds,
          completionPercentage: completionRef.current(),
          isActive: true,
        });
        pending = null;
        if (res?.qualified) {
          setStatus({ qualified: true, counted: !!res.explorationCounted });
        }
      } catch {
        /* keep `pending` → retried next flush with the SAME progressId */
      }
    };

    const flush = () => { queue = queue.then(doFlush); return queue; };

    const timer = setInterval(tick, TICK_MS);
    const flushTimer = setInterval(() => { tick(); flush(); }, FLUSH_MS);

    const onVis = () => { tick(); if (document.visibilityState === 'hidden') flush(); };
    document.addEventListener('visibilitychange', onVis);

    const finish = (keepalive = false) => {
      if (finished) return;
      finished = true;
      tick();
      flush().then(() => {
        if (sessionId) learningTrackingService.end({ sessionId, keepalive }).catch(() => {});
      });
    };
    const onPageHide = () => finish(true);
    window.addEventListener('pagehide', onPageHide);

    return () => {
      clearInterval(timer);
      clearInterval(flushTimer);
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('pagehide', onPageHide);
      finish(false); // post scrolled away / unmounted
    };
  }, [postId, contentType, isVisible]);

  return status;
}