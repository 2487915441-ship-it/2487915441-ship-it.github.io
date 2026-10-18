import { useEffect, useRef, useState, type ReactNode } from 'react';

interface RevealProps {
  children: ReactNode;
  className?: string;
  /** 延迟（ms） */
  delay?: number;
  /** 初始位移（px） */
  y?: number;
}

/**
 * 通用入场容器 — 进入视口时淡入并上浮归位，只触发一次。
 * 统一使用 cubic-bezier(0.22,1,0.36,1) 缓动。
 */
export default function Reveal({ children, className = '', delay = 0, y = 28 }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [on, setOn] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ob = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setOn(true);
          ob.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    ob.observe(el);
    return () => ob.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`reveal-base transition-all duration-[900ms] [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] ${
        on ? 'opacity-100' : 'opacity-0'
      } ${className}`}
      style={{
        transform: on ? 'none' : `translateY(${y}px)`,
        transitionDelay: `${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}
