import { useEffect, useRef } from 'react';

interface StackedPanelHistoryOptions {
  active: boolean;
  key: string;
  onBack: () => void;
}

export function useStackedPanelHistory({ active, key, onBack }: StackedPanelHistoryOptions) {
  const pushedRef = useRef(false);
  const onBackRef = useRef(onBack);

  useEffect(() => {
    onBackRef.current = onBack;
  }, [onBack]);

  useEffect(() => {
    if (!active || pushedRef.current) return;

    const currentState = window.history.state || {};
    window.history.pushState(
      {
        ...currentState,
        prepTrackerPanel: key,
      },
      '',
      window.location.href,
    );
    pushedRef.current = true;
  }, [active, key]);

  useEffect(() => {
    if (!active) {
      pushedRef.current = false;
      return;
    }

    const handlePopState = (event: PopStateEvent) => {
      if (pushedRef.current && event.state?.prepTrackerPanel !== key) {
        pushedRef.current = false;
        onBackRef.current();
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [active, key]);
}
