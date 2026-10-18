import { useEffect, useState } from 'react';
import SplitText from '../components/SplitText';
import { useI18n } from '../i18n';

export default function HeroSection() {
  const [loaded, setLoaded] = useState(false);
  const { lang, t } = useI18n();

  useEffect(() => {
    const timer = setTimeout(() => setLoaded(true), 400);
    return () => clearTimeout(timer);
  }, []);

  return (
    <section className="relative w-full h-screen overflow-hidden bg-obsidian">
      {/* Background - brand core ink horse painting */}
      <div className="absolute inset-0 z-[1]">
        <img
          src="/images/user/poster-ink.webp"
          alt={t.hero.bgAlt}
          className="w-full h-full object-cover opacity-40"
        />
        {/* Gradient overlays for depth */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#030303] via-transparent to-[#030303]" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#030303]/70 via-transparent to-[#030303]/70" />
      </div>

      {/* Animated particles effect - subtle floating golden dots */}
      <div className="absolute inset-0 z-[2] overflow-hidden pointer-events-none">
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-bronze/30 animate-float"
            style={{
              left: `${10 + Math.random() * 80}%`,
              top: `${10 + Math.random() * 80}%`,
              animationDelay: `${i * 0.5}s`,
              animationDuration: `${3 + Math.random() * 4}s`,
            }}
          />
        ))}
      </div>

      {/* Center content - Logo showcase */}
      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center">
        {/* Logo container */}
        <div
          className={`transition-all duration-1200 ${
            loaded ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-8 scale-95'
          }`}
        >
          <div className="relative">
            {/* Logo container - elegant floating frame */}
            <div className="relative px-12 py-10 md:px-20 md:py-14 bg-gradient-radial from-bone/[0.06] via-transparent to-transparent backdrop-blur-[2px]">
              {/* Decorative corner elements */}
              <div className="absolute top-3 left-3 w-6 h-6 border-t border-l border-bronze/60" />
              <div className="absolute top-3 right-3 w-6 h-6 border-t border-r border-bronze/60" />
              <div className="absolute bottom-3 left-3 w-6 h-6 border-b border-l border-bronze/60" />
              <div className="absolute bottom-3 right-3 w-6 h-6 border-b border-r border-bronze/60" />

              {/* Logo image - transparent background */}
              <img
                src="/images/user/logo-transparent.webp"
                alt={t.hero.logoAlt}
                className="w-[220px] md:w-[320px] h-auto relative z-10"
                style={{
                  filter: 'brightness(0.95) drop-shadow(0 0 20px rgba(212, 175, 55, 0.15)) drop-shadow(0 0 60px rgba(245, 230, 211, 0.08))',
                }}
              />
            </div>

            {/* Glow effect behind logo */}
            <div className="absolute inset-0 -z-10 bg-bronze/10 blur-3xl scale-110" />
          </div>
        </div>

        {/* Brand tagline */}
        <div
          className={`mt-10 text-center transition-all duration-1000 delay-500 ${
            loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
          }`}
        >
          <SplitText
            key={lang}
            as="h1"
            text={t.hero.title}
            delay={700}
            stagger={lang === 'zh' ? 60 : 30}
            className={`font-display text-[clamp(1.2rem,3vw,2rem)] text-bone mb-3 ${
              lang === 'zh' ? 'tracking-[0.3em]' : 'tracking-[0.06em]'
            }`}
          />
          <p className="font-accent text-[13px] text-bronze/70 tracking-[0.25em] uppercase">
            {t.hero.accent}
          </p>
        </div>

        {/* Mission statement */}
        <div
          className={`mt-6 max-w-lg text-center transition-all duration-1000 delay-700 ${
            loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
          }`}
        >
          <p className="font-ui text-[13px] text-bone/50 leading-relaxed tracking-wider">
            {t.hero.mission}
          </p>
        </div>
      </div>

      {/* Bottom scroll hint */}
      <div
        className={`absolute bottom-10 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2 transition-all duration-1000 delay-1000 ${
          loaded ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <span className="font-ui text-[10px] text-bone/40 tracking-[0.4em] uppercase">
          {t.hero.scroll}
        </span>
        <div className="animate-float">
          <svg width="16" height="24" viewBox="0 0 16 24" fill="none" className="text-bone/40">
            <path
              d="M8 4V20M8 20L2 14M8 20L14 14"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>

      {/* Side decorative text */}
      <div
        className={`absolute left-8 lg:left-16 top-1/2 -translate-y-1/2 z-10 transition-all duration-1000 delay-300 ${
          loaded ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div className="flex flex-col items-center gap-3">
          <div className="w-px h-20 bg-gradient-to-b from-transparent via-bronze/30 to-transparent" />
          <span
            className="font-accent text-[10px] text-bone/30 tracking-[0.5em] uppercase"
            style={{ writingMode: 'vertical-rl' }}
          >
            Ling Ma
          </span>
          <div className="w-px h-20 bg-gradient-to-b from-transparent via-bronze/30 to-transparent" />
        </div>
      </div>

      {/* Right side - origin label */}
      <div
        className={`absolute right-8 lg:right-16 top-1/2 -translate-y-1/2 z-10 transition-all duration-1000 delay-400 ${
          loaded ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div className="flex flex-col items-center gap-3">
          <div className="w-px h-20 bg-gradient-to-b from-transparent via-bronze/30 to-transparent" />
          <span
            className="font-ui text-[10px] text-bone/30 tracking-[0.3em]"
            style={{ writingMode: 'vertical-rl' }}
          >
            {t.hero.sideOrigin}
          </span>          <div className="w-px h-20 bg-gradient-to-b from-transparent via-bronze/30 to-transparent" />
        </div>
      </div>
    </section>
  );
}
