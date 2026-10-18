import { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import SplitText from '../components/SplitText';
import { useI18n } from '../i18n';
import { thesisZh } from '../i18n/thesisZh';
import { thesisEn } from '../i18n/thesisEn';

const scoreValues = [95, 92, 90, 88, 85, 87];

export default function ThesisPage() {
  const [loaded, setLoaded] = useState(false);
  const [activeChapter, setActiveChapter] = useState(0);
  const { lang, t } = useI18n();
  const th = t.thesis;
  const chapters = lang === 'zh' ? thesisZh : thesisEn;

  useEffect(() => {
    const timer = setTimeout(() => setLoaded(true), 300);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="relative min-h-screen bg-obsidian">
      {/* Loading screen */}
      <div
        className={`fixed inset-0 z-[200] bg-obsidian flex items-center justify-center transition-opacity duration-700 pointer-events-none ${
          loaded ? 'opacity-0' : 'opacity-100'
        }`}
      >
        <div className="text-center">
          <h1 className="font-display text-[24px] text-bone mb-2 tracking-widest">{th.loadingTitle}</h1>
          <span className="font-accent text-[11px] text-bronze/60 tracking-[0.4em] uppercase">
            {th.loadingAccent}
          </span>
        </div>
      </div>

      {/* Navigation */}
      <Navbar />

      {/* Hero header */}
      <header className="pt-32 pb-16 px-8 lg:px-16 max-w-[1000px] mx-auto">
        <span className="font-accent text-[12px] text-bronze tracking-[0.3em] uppercase block mb-4">
          {th.eyebrow}
        </span>
        <SplitText
          key={lang}
          as="h1"
          text={th.title}
          stagger={lang === 'zh' ? 28 : 12}
          className="font-display text-[clamp(1.6rem,4vw,2.4rem)] text-bone leading-tight mb-6 tracking-[0.02em]"
        />
        <p className="font-ui text-[14px] text-bone/50 leading-relaxed mb-8 max-w-2xl">
          {th.intro}
        </p>
        <div className="flex flex-wrap gap-6 text-[12px] text-bone/40 font-ui">
          {th.meta.map((m) => (
            <span key={m}>{m}</span>
          ))}
        </div>
      </header>

      {/* Score visualization */}
      <section className="px-8 lg:px-16 max-w-[1000px] mx-auto pb-16">
        <div className="border border-bone/10 p-6 lg:p-8">
          <h3 className="font-display text-[18px] text-bone mb-6">{th.scoreTitle}</h3>
          <div className="space-y-4">
            {th.scoreData.map((item, i) => (
              <div key={item.dimension} className="flex items-center gap-4">
                <span className="font-ui text-[13px] text-bone/70 w-28 lg:w-32 text-right shrink-0">
                  {item.dimension}
                </span>
                <div className="flex-1 h-8 bg-[#0a0a0a] relative overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-bronze/70 to-bronze/40 transition-all duration-1000"
                    style={{ width: `${scoreValues[i]}%` }}
                  />
                  <span className="absolute inset-0 flex items-center px-3 font-accent text-[14px] text-bone">
                    {scoreValues[i]}
                  </span>
                </div>
                <span className="font-ui text-[11px] text-bone/40 w-24 lg:w-28 shrink-0">
                  {item.desc}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-6 pt-4 border-t border-bone/10 flex items-center justify-between">
            <span className="font-ui text-[13px] text-bone/60">{th.totalLabel}</span>
            <span className="font-accent text-[28px] text-bronze">90<span className="text-[14px] text-bone/40 ml-1">/ 100</span></span>
          </div>
        </div>
      </section>

      {/* Chapter sidebar + content */}
      <div className="px-8 lg:px-16 max-w-[1000px] mx-auto pb-32">
        <div className="flex flex-col lg:flex-row gap-12">
          {/* Sidebar nav */}
          <aside className="lg:w-64 shrink-0">
            <div className="lg:sticky lg:top-28">
              <h3 className="font-ui text-[11px] text-bone/30 tracking-[0.3em] uppercase mb-4">
                {th.tocTitle}
              </h3>
              <nav className="space-y-1">
                {chapters.map((ch, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setActiveChapter(i);
                      document.getElementById(`chapter-${i}`)?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className={`block w-full text-left font-ui text-[13px] px-3 py-2 transition-all duration-300 border-l-2 ${
                      activeChapter === i
                        ? 'border-bronze text-bone bg-bronze/5'
                        : 'border-transparent text-bone/50 hover:text-bone/70 hover:border-bone/20'
                    }`}
                  >
                    {ch.title}
                  </button>
                ))}
              </nav>
            </div>
          </aside>

          {/* Content */}
          <div className="flex-1 space-y-16">
            {chapters.map((chapter, i) => (
              <article
                key={i}
                id={`chapter-${i}`}
                className="scroll-mt-32"
              >
                <h2 className="font-display text-[22px] text-bone mb-6 pb-3 border-b border-bone/10">
                  {chapter.title}
                </h2>

                {/* Direct content */}
                {chapter.content?.map((p, pi) => (
                  <p
                    key={pi}
                    className="font-ui text-[15px] text-bone/65 leading-[1.9] mb-4"
                  >
                    {p}
                  </p>
                ))}

                {/* Subsections */}
                {chapter.subsections?.map((sub, si) => (
                  <div key={si} className="mb-8">
                    <h3 className="font-display text-[17px] text-bone/85 mb-4 mt-8">
                      {sub.subtitle}
                    </h3>
                    {sub.content.map((p, pi) => (
                      <p
                        key={pi}
                        className="font-ui text-[15px] text-bone/65 leading-[1.9] mb-4"
                      >
                        {p}
                      </p>
                    ))}
                  </div>
                ))}
              </article>
            ))}

            {/* Conclusion */}
            <article className="pt-8 border-t-2 border-bronze/30">
              <h2 className="font-display text-[22px] text-bone mb-6">{th.conclusionTitle}</h2>
              <div className="border-l-2 border-bronze/40 pl-5 py-2 mb-6">
                <p className="font-display text-[16px] text-bone/90 leading-[1.8] tracking-[0.02em]">
                  {th.conclusionQuote}
                </p>
              </div>
              <p className="font-ui text-[15px] text-bone/65 leading-[1.9] mb-4">
                {th.conclusionP1}
              </p>
              <p className="font-ui text-[15px] text-bone/65 leading-[1.9] mb-4">
                {th.conclusionP2}
              </p>
            </article>
          </div>
        </div>
      </div>
    </div>
  );
}
