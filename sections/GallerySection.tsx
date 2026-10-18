import { useEffect, useRef, useState } from 'react';
import SplitText from '../components/SplitText';
import { useI18n } from '../i18n';

const productImages = [
  '/images/user/product-ink-sculpture.webp',
  '/images/user/product-ink-gallop.webp',
  '/images/user/product-ink-souvenir.webp',
  '/images/user/product-q-figure.webp',
  '/images/user/product-q-box.webp',
  '/images/user/product-q-souvenir.webp',
  '/images/user/product-bracelet.webp',
  '/images/user/poster-ink.webp',
  '/images/user/poster-culture.webp',
];

// 产品线索引：0=全部 1=水墨艺术线 2=Q版萌趣线 3=非遗复刻线 4=品牌视觉
const productLineIdx = [1, 1, 1, 2, 2, 2, 3, 4, 4];

export default function GallerySection() {
  const sectionRef = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);
  const [activeLine, setActiveLine] = useState(0);
  const { lang, t } = useI18n();
  const products = t.gallery.products.map((p, i) => ({
    ...p,
    image: productImages[i],
    lineIdx: productLineIdx[i],
  }));

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

  const filteredProducts =
    activeLine === 0 ? products : products.filter((p) => p.lineIdx === activeLine);

  return (
    <section
      id="gallery"
      ref={sectionRef}
      className="relative w-full bg-obsidian py-32 lg:py-48"
    >
      {/* Decorative line */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-24 bg-gradient-to-b from-bronze/30 to-transparent" />

      <div className="max-w-[1400px] mx-auto px-8 lg:px-16">
        {/* Section header */}
        <div
          className={`mb-16 transition-all duration-1000 ${
            visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          <span className="font-accent text-[13px] text-bronze tracking-[0.3em] uppercase block mb-4">
            {t.gallery.eyebrow}
          </span>
          <SplitText
            key={lang}
            text={t.gallery.title}
            delay={150}
            stagger={lang === 'zh' ? 45 : 30}
            className="font-display text-[clamp(2rem,5vw,3.5rem)] text-bone leading-tight mb-6 tracking-[0.02em]"
          />
          <p className="font-ui text-[15px] text-bone/60 max-w-2xl leading-[1.8] mb-10">
            {t.gallery.desc}
          </p>

          {/* Filter tabs — 背景填充扫入 */}
          <div className="flex flex-wrap gap-4">
            {t.gallery.lines.map((line, i) => (
              <button
                key={line}
                onClick={() => setActiveLine(i)}
                className={`relative isolate overflow-hidden font-ui text-[13px] tracking-wider px-5 py-2 border transition-all duration-500 [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] before:absolute before:inset-0 before:-z-10 before:bg-bronze/10 before:scale-x-0 before:origin-left before:transition-transform before:duration-500 before:[transition-timing-function:cubic-bezier(0.22,1,0.36,1)] hover:before:scale-x-100 ${
                  activeLine === i
                    ? 'border-bronze text-bronze before:scale-x-100'
                    : 'border-bone/20 text-bone/50 hover:border-bronze/50 hover:text-bone/80'
                }`}
              >
                {line}
              </button>
            ))}
          </div>
        </div>

        {/* Product grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredProducts.map((product, index) => (
            <div
              key={product.name}
              className={`group transition-all duration-700 ${
                visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
              }`}
              style={{ transitionDelay: `${200 + index * 100}ms` }}
            >
              {/* Product image */}
              <div className="relative aspect-square overflow-hidden bg-[#0a0a0a] mb-5">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-contain p-6 transition-all duration-700 group-hover:scale-105"
                  loading="lazy"
                />
                {/* Hover glow */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(212,175,55,0.08),transparent_70%)]" />
                </div>
                {/* Line badge */}
                <div className="absolute top-4 left-4">
                  <span className="font-ui text-[10px] text-bone/50 tracking-wider border border-bone/20 px-2 py-1">
                    {t.gallery.lines[product.lineIdx]}
                  </span>
                </div>
              </div>

              {/* Product info */}
              <div>
                <h4 className="font-display text-[18px] text-bone mb-1 group-hover:text-bronze transition-colors duration-500">
                  <span className="link-sweep inline-block">{product.name}</span>
                </h4>
                <span className="font-accent text-[11px] text-bone/40 tracking-[0.15em] uppercase block mb-3">
                  {product.subtitle}
                </span>
                <p className="font-ui text-[13px] text-bone/50 leading-[1.7]">
                  {product.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
