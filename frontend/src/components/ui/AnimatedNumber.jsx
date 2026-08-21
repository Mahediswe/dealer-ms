import { useEffect, useRef } from 'react';
import { useMotionValue, useSpring, useInView } from 'framer-motion';

export default function AnimatedNumber({ value, formatter = (v) => Math.round(v).toLocaleString(), className }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-10px' });
  const motionValue = useMotionValue(0);
  const spring = useSpring(motionValue, { damping: 24, stiffness: 90, mass: 1 });

  useEffect(() => {
    if (inView) motionValue.set(Number(value) || 0);
  }, [inView, value]);

  const displayRef = useRef(null);

  useEffect(() => {
    const unsub = spring.on('change', (v) => {
      if (displayRef.current) displayRef.current.textContent = formatter(v);
    });
    return unsub;
  }, [spring, formatter]);

  return (
    <span ref={ref} className={className}>
      <span ref={displayRef}>{formatter(0)}</span>
    </span>
  );
}
