import { useEffect, useRef, useState, Suspense, lazy } from 'react';
import { useI18n } from '../i18n';

// 图腾着色器组件（含 three.js）按需加载，避免拖累首屏
const ShaderImageZoom = lazy(() => import('../components/ShaderImageZoom'));

export default function TotemSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);
  const { t } = useI18n();
  const scoreValues = ['95', '92', '90', '88', '85', '90'];

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      id="totem"
      ref={sectionRef}
      className="relative w-full bg-obsidian"
    >
      {/* Section label */}
      <div className="py-16 px-8 lg:px-16 max-w-[1400px] mx-auto">
        <span className="font-accent text-[13px] text-bronze tracking-[0.3em] uppercase block mb-4">
          {t.totem.eyebrow}
        </span>
        <h2 className="font-display text-[clamp(2rem,5vw,3.5rem)] text-bone leading-tight">
          {t.totem.title}
        </h2>
      </div>

      {/* Full-screen shader image */}
      <div
        className={`relative w-full h-[80vh] lg:h-screen transition-all duration-1000 ${
          visible ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <Suspense
          fallback={
            <img
              src="/images/user/field-06.jpg"
              alt={t.totem.imgAlt}
              className="w-full h-full object-cover"
            />
          }
        >
          <ShaderImageZoom imageUrl="/images/user/field-06.jpg" />
        </Suspense>

        {/* Overlay text */}
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center pointer-events-none">
          <h3
            className={`font-display text-[clamp(2rem,7vw,4.5rem)] text-bone text-center leading-tight mb-6 transition-all duration-1000 delay-300 ${
              visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
            style={{ textShadow: '0 4px 30px rgba(0,0,0,0.8)' }}
          >
            {t.totem.overlayTitle}
          </h3>
          <p
            className={`font-accent text-[14px] text-bone/60 tracking-[0.2em] uppercase transition-all duration-1000 delay-500 ${
              visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
          >
            {t.totem.overlayAccent}
          </p>
          <div
            className={`mt-8 transition-all duration-1000 delay-700 ${
              visible ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <a
              href="#field"
              onClick={(e) => {
                e.preventDefault();
                document.getElementById('field')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="link-sweep pointer-events-auto inline-block font-ui text-[13px] text-bone/70 hover:text-bronze tracking-[0.15em] hover:tracking-[0.28em] pb-1 transition-all duration-700 [transition-timing-function:cubic-bezier(0.22,1,0.36,1)]"
            >
              {t.totem.cta}
            </a>
          </div>
        </div>
      </div>

      {/* Academic insight below */}
      <div className="py-24 lg:py-32 px-8 lg:px-16 max-w-[1400px] mx-auto">
        <div
          className={`grid grid-cols-1 lg:grid-cols-3 gap-12 transition-all duration-1000 delay-200 ${
            visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          <div className="lg:col-span-1">
            <h4 className="font-display text-[22px] text-bone mb-4">
              {t.totem.insightTitle}
            </h4>
            <p className="font-ui text-[13px] text-bone/50 leading-relaxed">
              {t.totem.insightText}
            </p>
          </div>
          <div className="lg:col-span-2 grid grid-cols-2 lg:grid-cols-3 gap-8">
            {t.totem.scores.map((label, i) => (
              <div key={label} className="text-center lg:text-left">
                <span className="font-accent text-[42px] text-bronze leading-none block mb-2">
                  {scoreValues[i]}
                </span>
                <span className="font-ui text-[12px] text-bone/50 tracking-wider">
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
