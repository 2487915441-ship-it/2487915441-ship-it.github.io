import { useEffect, useRef, useState } from 'react';
import SplitText from '../components/SplitText';
import { useI18n } from '../i18n';

const fieldImageSrcs = [
  '/images/user/field-01.jpg',
  '/images/user/field-05.jpg',
  '/images/user/field-07.jpg',
  '/images/user/field-08.jpg',
  '/images/user/field-03.jpg',
  '/images/user/field-06.jpg',
];

export default function FieldSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);
  const [activeVideo, setActiveVideo] = useState<'dance' | 'ritual' | null>(null);
  const { lang, t } = useI18n();
  const fieldImages = fieldImageSrcs.map((src, i) => ({ src, caption: t.field.captions[i] }));

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
      id="field"
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
            {t.field.eyebrow}
          </span>
          <SplitText
            key={lang}
            text={t.field.title}
            delay={150}
            stagger={lang === 'zh' ? 45 : 30}
            className="font-display text-[clamp(2rem,5vw,3.5rem)] text-bone leading-tight mb-6 tracking-[0.02em]"
          />
          <p className="font-ui text-[15px] text-bone/60 max-w-2xl leading-[1.8]">
            {t.field.desc}
          </p>
        </div>

        {/* Video showcase */}
        <div
          className={`mb-20 transition-all duration-1000 delay-200 ${
            visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
          }`}
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Video 1 - Dance */}
            <div
              className="relative group cursor-pointer"
              onClick={() => setActiveVideo('dance')}
            >
              <div className="relative aspect-video overflow-hidden bg-[#0a0a0a]">
                <video
                  src="/images/user/field-dance.mp4"
                  className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-500"
                  muted
                  loop
                  playsInline
                  preload="metadata"
                  onMouseEnter={(e) => e.currentTarget.play()}
                  onMouseLeave={(e) => e.currentTarget.pause()}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#030303]/70 via-transparent to-transparent" />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="w-16 h-16 rounded-full border border-bone/40 flex items-center justify-center backdrop-blur-sm">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="text-bone ml-1">
                      <path d="M6 4L16 10L6 16V4Z" fill="currentColor" />
                    </svg>
                  </div>
                </div>
              </div>
              <div className="mt-4">
                <h4 className="font-display text-[18px] text-bone mb-1">{t.field.video1Title}</h4>
                <p className="font-ui text-[12px] text-bone/50">
                  {t.field.video1Desc}
                </p>
              </div>
            </div>

            {/* Video 2 - Ritual */}
            <div
              className="relative group cursor-pointer"
              onClick={() => setActiveVideo('ritual')}
            >
              <div className="relative aspect-video overflow-hidden bg-[#0a0a0a]">
                <video
                  src="/images/user/field-ritual.mp4"
                  className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-500"
                  muted
                  loop
                  playsInline
                  preload="metadata"
                  onMouseEnter={(e) => e.currentTarget.play()}
                  onMouseLeave={(e) => e.currentTarget.pause()}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#030303]/70 via-transparent to-transparent" />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="w-16 h-16 rounded-full border border-bone/40 flex items-center justify-center backdrop-blur-sm">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="text-bone ml-1">
                      <path d="M6 4L16 10L6 16V4Z" fill="currentColor" />
                    </svg>
                  </div>
                </div>
              </div>
              <div className="mt-4">
                <h4 className="font-display text-[18px] text-bone mb-1">{t.field.video2Title}</h4>
                <p className="font-ui text-[12px] text-bone/50">
                  {t.field.video2Desc}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Photo grid */}
        <div
          className={`transition-all duration-1000 delay-400 ${
            visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
          }`}
        >
          <h3 className="font-display text-[20px] text-bone mb-8">{t.field.archiveTitle}</h3>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {fieldImages.map((img, index) => (
              <div
                key={index}
                className="relative group overflow-hidden"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="aspect-[4/3] overflow-hidden">
                  <img
                    src={img.src}
                    alt={img.caption}
                    className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110"
                    loading="lazy"
                  />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-[#030303]/80 via-[#030303]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-500">
                  <p className="font-ui text-[11px] text-bone/80 leading-relaxed">
                    {img.caption}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Research attribution */}
        <div
          className={`mt-16 pt-10 border-t border-bone/10 transition-all duration-1000 delay-600 ${
            visible ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <p className="font-ui text-[13px] text-bone/60">
                {t.field.sourceLine}
              </p>
              <p className="font-ui text-[12px] text-bone/40 mt-1">
                {t.field.sourcePlace}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-bronze/60" />
              <span className="font-ui text-[11px] text-bone/40 tracking-wider">
                {t.field.copyrightNote}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Video modal */}
      {activeVideo && (
        <div
          className="fixed inset-0 z-[100] bg-[#030303]/95 flex items-center justify-center p-8"
          onClick={() => setActiveVideo(null)}
        >
          <div className="relative max-w-5xl w-full" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setActiveVideo(null)}
              className="absolute -top-12 right-0 text-bone/60 hover:text-bone transition-colors"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
            <video
              src={`/images/user/field-${activeVideo}.mp4`}
              className="w-full max-h-[80vh] object-contain"
              controls
              autoPlay
            />
          </div>
        </div>
      )}
    </section>
  );
}
