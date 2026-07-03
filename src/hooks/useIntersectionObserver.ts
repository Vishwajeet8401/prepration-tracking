import { useEffect, useRef } from 'react';

interface UseIntersectionObserverProps {
  onIntersect: () => void;
  enabled: boolean;
  rootMargin?: string;
  threshold?: number;
}

export function useIntersectionObserver({
  onIntersect,
  enabled,
  rootMargin = '200px',
  threshold = 0.1,
}: UseIntersectionObserverProps) {
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry && entry.isIntersecting) {
          onIntersect();
        }
      },
      {
        rootMargin,
        threshold,
      }
    );

    const currentSentinel = sentinelRef.current;
    if (currentSentinel) {
      observer.observe(currentSentinel);
    }

    return () => {
      if (currentSentinel) {
        observer.unobserve(currentSentinel);
      }
      observer.disconnect();
    };
  }, [onIntersect, enabled, rootMargin, threshold]);

  return sentinelRef;
}
