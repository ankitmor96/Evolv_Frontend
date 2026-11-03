import { useEffect, useRef, useState } from 'react';
import { learningTrackingService, newProgressId } from '../../services/learningTrackingService.js';

const FLUSH_EVERY_SECONDS = 3;

/**
 * Returns [ref, inView]. Works for tall posts too: counts as "in view"
 * when at least `threshold` of the post OR of the screen height is visible.
 */
export function useInView(threshold = 0.5) {
  const [node, setNode] = useState(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    if (!node) return undefined;
    const io = new IntersectionObserver(
      ([e]) => {
        const tallEnough = e.intersectionRect.height >= window.innerHeight * threshold;
        setInView(e.isIntersecting && (e.intersectionRatio >= threshold || tallEnough));
      },
      { threshold: [0, 0.25, 0.5, 0.75, 1] }
    );
    io.observe(node);
    return () => io.disconnect();
  }, [node, threshold]);

  return [setNode, inView];
}

/**
 * Tracks ACTIVE time only.
 *  - counts a second only if: post visible + isPlaying + browser tab visible
 *  - sends progress every 3s (each batch has its own progressId, retried safely)
 *  - ends the session when the post leaves the screen / unmounts / page closes
 *
 * @param {object}  p
 * @param {number|string} p.postId
 * @param {'image'|'text'|'video'|'document'} p.contentType
 * @param {boolean} p.isVisible       post is on screen
 * @param {boolean} [p.isPlaying]     false while a video is paused (default true)
 * @param {number}  [p.completion]    0-100. Defaults: 100 for image/text, 0 otherwise
 */
export function useLearningTracker({
  postId,
  contentType,
  isVisible = true,
  isPlaying = true,
  completion = null,
  getCompletion = null,     
}) {
  const playingRef = useRef(isPlaying);
  const completionRef = useRef(completion);
  const getCompletionRef = useRef(getCompletion);
  playingRef.current = isPlaying;
  completionRef.current = completion;
  getCompletionRef.current = getCompletion;

  useEffect(() => {
    if (!postId || !contentType || !isVisible) return undefined;

    const s = { id: null, seconds: 0, batch: null, ended: false, notified: false };
    const defaultPct = ['image', 'text'].includes(String(contentType).toLowerCase()) ? 100 : 0;

    // Keep the highest completion seen (video resets to 0 when it scrolls away)
    let best = 0;
    const pct = () => {
      const raw = getCompletionRef.current
        ? getCompletionRef.current()
        : completionRef.current ?? defaultPct;
      const n = Number(raw);
      if (Number.isFinite(n)) best = Math.max(best, n);
      return best;
    };
    const activeNow = () => playingRef.current && document.visibilityState === 'visible';
    const ready = learningTrackingService
      .start({ postId, contentType })
      .then((r) => { s.id = r?.sessionId ?? null; })
      .catch((e) => console.warn('[learning] start failed:', e.message));

    // All requests run one after another so seconds are never sent out of order.
    let queue = ready;
    const flush = (keepalive = false) => {
      queue = queue.then(async () => {
        if (!s.id) return;
        if (!s.batch && s.seconds > 0) {
          s.batch = { id: newProgressId(), seconds: s.seconds };
          s.seconds = 0;
        }
        if (!s.batch) return;
        try {
          const res = await learningTrackingService.progress({
            sessionId: s.id,
            progressId: s.batch.id,
            activeSeconds: s.batch.seconds,
            completionPercentage: pct(),
            isActive: activeNow(),
            keepalive,
          });
          s.batch = null;
          if (res?.explorationCounted && !s.notified) {
            s.notified = true;
            window.dispatchEvent(new Event('learning-updated'));
          }
        } catch (e) {
          // 4xx = bad data, drop it. Network/5xx = keep same batch + progressId and retry.
          if (e.status >= 400 && e.status < 500) s.batch = null;
        }
      });
      return queue;
    };

    const timer = setInterval(() => {
      if (!activeNow()) return;
      s.seconds += 1;
      if (s.seconds >= FLUSH_EVERY_SECONDS) flush();
    }, 1000);

    const finish = async (keepalive = false) => {
      if (s.ended) return;
      s.ended = true;
      clearInterval(timer);
      await flush(keepalive);
      await flush(keepalive); // second pass sends seconds counted while the first was in flight
      if (s.id) {
        try { await learningTrackingService.end({ sessionId: s.id, keepalive }); } catch { /* ignore */ }
      }
    };

    const onVisibility = () => { if (document.visibilityState === 'hidden') flush(true); };
    const onPageHide = () => { finish(true); };

    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('pagehide', onPageHide);

    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pagehide', onPageHide);
      finish();
    };
  }, [postId, contentType, isVisible]);
}

export default useLearningTracker;