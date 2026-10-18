import { useEffect, useRef, useState } from 'react';

interface SplitTextProps {
  text: string;
  className?: string;
  as?: 'h1' | 'h2' | 'h3' | 'span';
  /** 首个字符延迟（ms） */
  delay?: number;
  /** 相邻字符间隔（ms） */
  stagger?: number;
}

/**
 * 逐字遮罩上浮标题 — 进入视口时每个字符从下方遮罩内滑出，
 * 使用统一的奢侈品缓动 cubic-bezier(0.22,1,0.36,1)。
 * 尊重 prefers-reduced-motion：由 CSS 强制立即显示。
 */
export default function SplitText({
  text,
  className = '',
  as: Tag = 'h2',
  delay = 0,
  stagger = 45,
}: SplitTextProps) {
  const ref = useRef<HTMLHeadingElement>(null);
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
      { threshold: 0.4 }
    );
    ob.observe(el);
    return () => ob.disconnect();
  }, []);

  return (
    <Tag ref={ref as never} className={className} aria-label={text}>
      {text.split('').map((ch, i) => (
        <span
          key={i}
          aria-hidden="true"
          className="split-char inline-block overflow-hidden align-bottom"
        >
          <span
            className="inline-block will-change-transform transition-all duration-[900ms] [transition-timing-function:cubic-bezier(0.22,1,0.36,1)]"
            style={{
              transform: on ? 'translateY(0)' : 'translateY(110%)',
              opacity: on ? 1 : 0,
              transitionDelay: `${delay + i * stagger}ms`,
            }}
          >
            {ch === ' ' ? ' ' : ch}
          </span>
        </span>
      ))}
    </Tag>
  );
}
