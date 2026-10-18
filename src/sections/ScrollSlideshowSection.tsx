import { useEffect, useRef, useState } from 'react';
import SplitText from '../components/SplitText';
import Reveal from '../components/Reveal';
import { useI18n } from '../i18n';

const slideImages = [
  '/images/user/faqi-bell-horse.jpg',
  '/images/gen-horse-bell.jpg',
  '/images/user/ritual-horse.jpg',
];

export default function ScrollSlideshowSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const slideRefs = useRef<(HTMLDivElement | null)[]>([]);
  const { lang, t } = useI18n();
  const slides = t.slideshow.slides.map((s, i) => ({ ...s, image: slideImages[i] }));

  useEffect(() => {
    const observers: IntersectionObserver[] = [];

    slideRefs.current.forEach((slide, index) => {
      if (!slide) return;
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting && entry.intersectionRatio > 0.4) {
            setActiveIndex(index);
          }
        },
        { threshold: [0.3, 0.5, 0.7] }
      );
      observer.observe(slide);
      observers.push(observer);
    });

    return () => observers.forEach((o) => o.disconnect());
  }, []);

  return (
    <section ref={sectionRef} className="relative w-full bg-obsidian">
      {/* Section header */}
      <div className="py-24 lg:py-32 px-8 lg:px-16 max-w-[1400px] mx-auto">
        <Reveal>
          <span className="font-accent text-[13px] text-bronze tracking-[0.3em] uppercase block mb-4">
            {t.slideshow.eyebrow}
          </span>
        </Reveal>
        <SplitText
          key={lang}
          text={t.slideshow.title}
          delay={120}
          stagger={lang === 'zh' ? 45 : 35}
          className="font-display text-[clamp(2rem,5vw,3.5rem)] text-bone leading-tight mb-6 tracking-[0.02em]"
        />
        <Reveal delay={250}>
          <p className="font-ui text-[15px] text-bone/60 max-w-2xl leading-[1.8]">
            {t.slideshow.desc}
          </p>
        </Reveal>
      </div>

      {/* Slides */}
      <div className="relative">
        {slides.map((slide, index) => (
          <div
            key={index}
            ref={(el) => { slideRefs.current[index] = el; }}
            className="min-h-[85vh] flex items-center justify-center py-12 px-8 lg:px-16"
          >
            <div className="max-w-[1400px] w-full grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
              {/* Image */}
              <div
                className={`relative overflow-hidden transition-all duration-1000 ${
                  activeIndex === index
                    ? 'opacity-100 translate-x-0'
                    : index % 2 === 0
                    ? 'opacity-60 -translate-x-4'
                    : 'opacity-60 translate-x-4'
                }`}
                style={{
                  order: index % 2 === 0 ? 1 : 2,
                }}
              >
                <div className="relative aspect-[4/3] overflow-hidden">
                  <img
                    src={slide.image}
                    alt={slide.title}
                    className="w-full h-full object-cover transition-transform duration-1000 hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#030303]/40 to-transparent" />
                </div>
                {/* Slide number */}
                <div className="absolute -bottom-4 -right-4 font-accent text-[120px] text-bone/[0.03] leading-none select-none pointer-events-none">
                  0{index + 1}
                </div>
              </div>

              {/* Text */}
              <div
                className={`transition-all duration-1000 delay-200 ${
                  activeIndex === index
                    ? 'opacity-100 translate-y-0'
                    : 'opacity-60 translate-y-4'
                }`}
                style={{
                  order: index % 2 === 0 ? 2 : 1,
                }}
              >
                <span className="font-accent text-[12px] text-bronze/70 tracking-[0.3em] uppercase block mb-4">
                  {slide.subtitle}
                </span>
                <h3 className="font-display text-[clamp(1.8rem,4vw,3rem)] text-bone mb-8 leading-tight">
                  {slide.title}
                </h3>
                <div className="w-16 h-px bg-bronze/40 mb-8" />
                <p className="font-ui text-[15px] text-bone/70 leading-[1.9]">
                  {slide.description}
                </p>

                {/* Progress indicator */}
                <div className="flex gap-3 mt-12">
                  {slides.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        slideRefs.current[i]?.scrollIntoView({
                          behavior: 'smooth',
                          block: 'center',
                        });
                      }}
                      className={`h-[2px] transition-all duration-500 ${
                        i === activeIndex
                          ? 'w-12 bg-bronze'
                          : 'w-6 bg-bone/20 hover:bg-bone/40'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
