import { useEffect, useRef, useState } from 'react';

/**
 * Milliseconds left until `endsAt`, ticking every second. `clockOffset` corrects for a wrong
 * device clock using the server's time. `onExpire` fires once when the deadline passes.
 */
export function useCountdown(endsAt: string | undefined, clockOffset: number, onExpire?: () => void) {
  const target = endsAt ? Date.parse(endsAt) : NaN;
  const [now, setNow] = useState(() => Date.now() + clockOffset);
  const onExpireRef = useRef(onExpire);
  useEffect(() => {
    onExpireRef.current = onExpire;
  });

  useEffect(() => {
    if (Number.isNaN(target)) return;
    let fired = false;
    const tick = () => {
      const t = Date.now() + clockOffset;
      setNow(t);
      if (t >= target && !fired) {
        fired = true;
        onExpireRef.current?.();
      }
    };
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [target, clockOffset]);

  return Number.isNaN(target) ? 0 : Math.max(0, target - now);
}
