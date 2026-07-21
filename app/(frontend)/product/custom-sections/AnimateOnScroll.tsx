'use client';
import { useEffect, useRef, useState, ReactNode, CSSProperties } from 'react';

type Direction = 'up' | 'left' | 'right';

interface AnimateOnScrollProps {
  children: ReactNode;
  direction?: Direction;
  delay?: number;
  className?: string;
}

const hiddenTransform: Record<Direction, string> = {
  up:    'translateY(48px)',
  left:  'translateX(-60px)',
  right: 'translateX(60px)',
};

export default function AnimateOnScroll({
  children,
  direction = 'up',
  delay = 0,
  className = '',
}: AnimateOnScrollProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let timer: ReturnType<typeof setTimeout>;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          timer = setTimeout(() => setVisible(true), delay);
        } else {
          clearTimeout(timer);
          setVisible(false);
        }
      },
      { threshold: 0.08 }
    );
    observer.observe(el);
    return () => { observer.disconnect(); clearTimeout(timer); };
  }, [delay]);

  const style: CSSProperties = {
    opacity: visible ? 1 : 0,
    transform: visible ? 'translate(0, 0)' : hiddenTransform[direction],
    transition: 'opacity 0.7s ease-out, transform 0.7s ease-out',
    transitionDelay: `${delay}ms`,
  };

  return (
    <div ref={ref} style={style} className={className}>
      {children}
    </div>
  );
}
