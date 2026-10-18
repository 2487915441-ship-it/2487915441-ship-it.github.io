import { useState, useEffect, useCallback, useRef } from 'react';
import Navbar from '../components/Navbar';
import { useI18n } from '../i18n';

const viPageSrcs = [
  '/images/user/vi-01-cover.jpg',
  '/images/user/vi-02-toc.jpg',
  '/images/user/vi-03-brand-story.jpg',
  '/images/user/vi-04-logo-structure.jpg',
  '/images/user/vi-05-logo-variations.jpg',
  '/images/user/vi-06-color-system.jpg',
  '/images/user/vi-07-usage-guidelines.jpg',
  '/images/user/vi-08-application-examples.jpg',
  '/images/user/vi-09-back-cover.jpg',
];

export default function VIGallery() {
  const [current, setCurrent] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [direction, setDirection] = useState<'left' | 'right'>('right');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { t } = useI18n();
  const viPages = viPageSrcs.map((src, i) => ({ src, title: t.vi.pages[i] }));

  const goTo = useCallback((index: number) => {
    if (isTransitioning || index === current) return;
    setIsTransitioning(true);
    setDirection(index > current ? 'right' : 'left');
    setCurrent(index);
    setTimeout(() => setIsTransitioning(false), 500);
  }, [current, isTransitioning]);

  const next = useCallback(() => {
    if (current < viPages.length - 1) goTo(current + 1);
  }, [current, goTo]);

  const prev = useCallback(() => {
    if (current > 0) goTo(current - 1);
  }, [current, goTo]);

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') next();
      if (e.key === 'ArrowLeft') prev();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [next, prev]);

  // Touch/swipe support
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart.current) return;
    const dx = e.changedTouches[0].clientX - touchStart.current.x;
    const dy = e.changedTouches[0].clientY - touchStart.current.y;
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 50) {
      if (dx > 0) prev();
      else next();
    }
    touchStart.current = null;
  };

  useEffect(() => {
    const timer = setTimeout(() => setLoaded(true), 300);
    return () => clearTimeout(timer);
  }, []);

  // Preload adjacent images
  useEffect(() => {
    [-1, 0, 1].forEach((offset) => {
      const idx = current + offset;
      if (idx >= 0 && idx < viPages.length) {
        const img = new Image();
        img.src = viPages[idx].src;
      }
    });
  }, [current]);

  const page = viPages[current];

  return (
    <div className="relative min-h-screen bg-obsidian">
      {/* Loading */}
      <div
        className={`fixed inset-0 z-[200] bg-obsidian flex items-center justify-center transition-opacity duration-700 pointer-events-none ${
          loaded ? 'opacity-0' : 'opacity-100'
        }`}
      >
        <div className="text-center">
          <h1 className="font-display text-[24px] text-bone mb-2 tracking-widest">{t.vi.loadingTitle}</h1>
          <span className="font-accent text-[11px] text-bronze/60 tracking-[0.4em] uppercase">
            {t.vi.loadingAccent}
          </span>
        </div>
      </div>

      <Navbar />

      {/* Main Gallery Area */}
      <div
        ref={containerRef}
        className="pt-20 pb-8 px-4 lg:px-8 h-screen flex flex-col"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Top bar: title + page counter */}
        <div className="flex items-center justify-between mb-4 px-2">
          <div>
            <span className="font-accent text-[11px] text-bronze tracking-[0.2em] uppercase">
              {t.vi.eyebrow}
            </span>
            <h1 className="font-display text-[18px] lg:text-[22px] text-bone">
              {page.title}
            </h1>
          </div>
          <div className="text-right">
            <span className="font-accent text-[28px] lg:text-[36px] text-bronze leading-none">
              {String(current + 1).padStart(2, '0')}
            </span>
            <span className="font-accent text-[14px] text-bone/30 ml-1">
              / {String(viPages.length).padStart(2, '0')}
            </span>
          </div>
        </div>

        {/* Image viewer */}
        <div className="flex-1 relative flex items-center justify-center overflow-hidden">
          {/* Main image */}
          <div
            key={current}
            className="relative w-full h-full flex items-center justify-center"
            style={{
              animation: `slideIn${direction === 'right' ? 'Right' : 'Left'} 0.5s ease-out`,
            }}
          >
            <img
              src={page.src}
              alt={page.title}
              className="max-w-full max-h-full object-contain shadow-2xl"
              draggable={false}
            />
          </div>

          {/* Left arrow */}
          {current > 0 && (
            <button
              onClick={prev}
              className="absolute left-2 lg:left-6 top-1/2 -translate-y-1/2 w-12 h-12 lg:w-14 lg:h-14 rounded-full bg-[#0a0a0a]/80 backdrop-blur-sm border border-bone/10 flex items-center justify-center text-bone/60 hover:text-bone hover:border-bronze/40 transition-all duration-300 z-10"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M12 4L6 10L12 16" />
              </svg>
            </button>
          )}

          {/* Right arrow */}
          {current < viPages.length - 1 && (
            <button
              onClick={next}
              className="absolute right-2 lg:right-6 top-1/2 -translate-y-1/2 w-12 h-12 lg:w-14 lg:h-14 rounded-full bg-[#0a0a0a]/80 backdrop-blur-sm border border-bone/10 flex items-center justify-center text-bone/60 hover:text-bone hover:border-bronze/40 transition-all duration-300 z-10"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M8 4L14 10L8 16" />
              </svg>
            </button>
          )}
        </div>

        {/* Thumbnail strip */}
        <div className="mt-4 flex items-center justify-center gap-2 lg:gap-3 overflow-x-auto px-2 py-2">
          {viPages.map((p, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className={`relative shrink-0 transition-all duration-300 overflow-hidden ${
                i === current
                  ? 'w-16 h-16 lg:w-20 lg:h-20 ring-2 ring-bronze opacity-100'
                  : 'w-12 h-12 lg:w-14 lg:h-14 opacity-40 hover:opacity-70'
              }`}
            >
              <img
                src={p.src}
                alt={p.title}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </button>
          ))}
        </div>

        {/* Bottom hint */}
        <div className="text-center mt-2">
          <span className="font-ui text-[11px] text-bone/30 tracking-wider">
            {t.vi.hint}
          </span>
        </div>
      </div>

      {/* Slide animations */}
      <style>{`
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(60px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes slideInLeft {
          from { opacity: 0; transform: translateX(-60px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}
