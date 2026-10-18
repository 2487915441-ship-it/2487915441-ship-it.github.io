import { useEffect, useRef, useState } from 'react';
import SplitText from '../components/SplitText';
import { useI18n } from '../i18n';

export default function OriginSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);
  const { lang, t } = useI18n();

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      id="origin"
      ref={sectionRef}
      className="relative w-full bg-obsidian py-32 lg:py-48"
    >
      {/* Decorative line */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-24 bg-gradient-to-b from-bronze/30 to-transparent" />

      <div className="max-w-[1400px] mx-auto px-8 lg:px-16">
        {/* Section header */}
        <div
          className={`mb-20 transition-all duration-1000 ${
            visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          <span className="font-accent text-[13px] text-bronze tracking-[0.3em] uppercase block mb-4">
            {t.origin.eyebrow}
          </span>
          <SplitText
            key={lang}
            text={t.origin.title}
            delay={150}
            stagger={lang === 'zh' ? 45 : 35}
            className="font-display text-[clamp(2rem,5vw,3.5rem)] text-bone leading-tight tracking-[0.02em]"
          />
        </div>

        {/* Content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          {/* Image area - 60% */}
          <div
            className={`lg:col-span-7 transition-all duration-1000 delay-200 ${
              visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
            }`}
          >
            <div className="relative overflow-hidden group">
              <img
                src="/images/user/field-04.jpg"
                alt={t.origin.mainAlt}
                className="w-full h-auto object-cover grayscale-[20%] group-hover:grayscale-0 transition-all duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#030303]/60 via-transparent to-transparent" />
              <div className="absolute bottom-6 left-6 right-6">
                <p className="font-ui text-[11px] text-bone/50 tracking-wider">
                  {t.origin.mainCaption}
                </p>
              </div>
            </div>

            {/* Secondary image below */}
            <div className="mt-6 grid grid-cols-2 gap-4">
              <div className="relative overflow-hidden group">
                <img
                  src="/images/user/field-02.jpg"
                  alt={t.origin.subAlt1}
                  className="w-full h-48 object-cover grayscale-[30%] group-hover:grayscale-0 transition-all duration-700 group-hover:scale-105"
                />
              </div>
              <div className="relative overflow-hidden group">
                <img
                  src="/images/user/field-03.jpg"
                  alt={t.origin.subAlt2}
                  className="w-full h-48 object-cover grayscale-[30%] group-hover:grayscale-0 transition-all duration-700 group-hover:scale-105"
                />
              </div>
            </div>
          </div>

          {/* Text area - 40% */}
          <div
            className={`lg:col-span-5 transition-all duration-1000 delay-400 ${
              visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
            }`}
          >
            <div className="lg:sticky lg:top-32">
              {/* The Six Bells Legend */}
              <div className="mb-12">
                <h3 className="font-display text-[28px] text-bone mb-6 leading-relaxed">
                  {t.origin.storyTitle}
                </h3>
                <div className="w-12 h-px bg-bronze/50 mb-8" />
                <p className="font-ui text-[15px] text-bone/70 leading-[1.9] mb-6">
                  {t.origin.storyP1}
                </p>
                <p className="font-ui text-[15px] text-bone/70 leading-[1.9] mb-6">
                  {t.origin.storyP2}
                </p>
                <div className="border-l-2 border-bronze/40 pl-5 py-2 my-8">
                  <p className="font-display text-[17px] text-bone/90 leading-[1.9] tracking-[0.04em]">
                    {t.origin.quote}
                  </p>
                </div>
              </div>

              {/* Brand Mission */}
              <div>
                <h3 className="font-display text-[22px] text-bone mb-4">
                  {t.origin.missionTitle}
                </h3>
                <p className="font-ui text-[15px] text-bone/70 leading-[1.9]">
                  {t.origin.missionText}
                </p>
              </div>

              {/* Brand values */}
              <div className="mt-10 grid grid-cols-3 gap-4">
                {t.origin.values.map((item) => (
                  <div key={item.word} className="text-center">
                    <span className="font-display text-[24px] text-bone block mb-1">
                      {item.word}
                    </span>
                    <span className="font-accent text-[11px] text-bronze/70 tracking-[0.15em] uppercase">
                      {item.sub}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
