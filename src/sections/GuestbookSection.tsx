import { useEffect, useRef, useState } from 'react';
import SplitText from '../components/SplitText';
import Reveal from '../components/Reveal';
import { useI18n } from '../i18n';
import { trpc } from '@/providers/trpc';

type FormState = 'idle' | 'submitting' | 'success' | 'error';

export default function GuestbookSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);
  const { lang, t } = useI18n();
  const g = t.guestbook;

  const [name, setName] = useState('');
  const [content, setContent] = useState('');
  const [website, setWebsite] = useState(''); // 蜜罐字段，正常用户不可见
  const [formState, setFormState] = useState<FormState>('idle');
  const [rateLimited, setRateLimited] = useState(false);

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

  const listQuery = trpc.message.list.useQuery(undefined, {
    refetchOnWindowFocus: false,
    retry: 1,
  });

  const createMutation = trpc.message.create.useMutation({
    onSuccess: () => {
      setFormState('success');
      setName('');
      setContent('');
    },
    onError: (err) => {
      setRateLimited(err.data?.code === 'TOO_MANY_REQUESTS');
      setFormState('error');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !content.trim() || formState === 'submitting') return;
    setRateLimited(false);
    setFormState('submitting');
    createMutation.mutate({ name: name.trim(), content: content.trim(), website });
  };

  const formatDate = (d: Date) =>
    new Date(d).toLocaleDateString(lang === 'zh' ? 'zh-CN' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

  return (
    <section
      id="guestbook"
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
            {g.eyebrow}
          </span>
          <SplitText
            key={lang}
            text={g.title}
            delay={150}
            stagger={lang === 'zh' ? 45 : 35}
            className="font-display text-[clamp(2rem,5vw,3.5rem)] text-bone leading-tight mb-6 tracking-[0.02em]"
          />
          <p className="font-ui text-[15px] text-bone/60 max-w-2xl leading-[1.8]">
            {g.desc}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          {/* 留言表单 */}
          <Reveal className="lg:col-span-5" delay={200}>
            <div className="border border-bone/10 p-8 lg:p-10">
              <h3 className="font-display text-[20px] text-bone mb-8">{g.formTitle}</h3>

              {formState === 'success' ? (
                <div className="py-8">
                  <div className="w-10 h-10 border border-bronze/50 flex items-center justify-center mb-6">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-bronze">
                      <path d="M2.5 8.5L6 12L13.5 4" />
                    </svg>
                  </div>
                  <p className="font-display text-[17px] text-bone mb-2">{g.successTitle}</p>
                  <p className="font-ui text-[13px] text-bone/50 leading-relaxed">{g.successText}</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label htmlFor="gb-name" className="font-ui text-[12px] text-bone/40 tracking-[0.2em] uppercase block mb-2">
                      {g.nameLabel}
                    </label>
                    <input
                      id="gb-name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder={g.namePlaceholder}
                      maxLength={24}
                      required
                      className="w-full bg-transparent border-b border-bone/15 focus:border-bronze/60 outline-none font-ui text-[15px] text-bone placeholder:text-bone/25 py-2.5 transition-colors duration-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="gb-content" className="font-ui text-[12px] text-bone/40 tracking-[0.2em] uppercase block mb-2">
                      {g.contentLabel}
                    </label>
                    <textarea
                      id="gb-content"
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder={g.contentPlaceholder}
                      maxLength={300}
                      required
                      rows={4}
                      className="w-full bg-transparent border-b border-bone/15 focus:border-bronze/60 outline-none font-ui text-[15px] text-bone placeholder:text-bone/25 py-2.5 resize-none transition-colors duration-500"
                    />
                    <p className="font-ui text-[11px] text-bone/25 text-right mt-1.5">
                      {g.charCount(content.length)}
                    </p>
                  </div>

                  {/* 蜜罐：对正常用户不可见 */}
                  <input
                    type="text"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    tabIndex={-1}
                    autoComplete="off"
                    aria-hidden="true"
                    className="absolute opacity-0 pointer-events-none h-0 w-0"
                    name="website"
                  />

                  {formState === 'error' && (
                    <p className="font-ui text-[13px] text-[#c0694a]">
                      {rateLimited ? g.rateLimited : g.errorText}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={formState === 'submitting'}
                    className="relative isolate overflow-hidden font-ui text-[13px] tracking-[0.2em] px-8 py-3 border border-bronze/60 text-bronze transition-all duration-500 [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] before:absolute before:inset-0 before:-z-10 before:bg-bronze before:scale-x-0 before:origin-left before:transition-transform before:duration-500 hover:before:scale-x-100 hover:text-[#030303] disabled:opacity-40 disabled:pointer-events-none"
                  >
                    {formState === 'submitting' ? g.submitting : g.submit}
                  </button>
                </form>
              )}
            </div>
          </Reveal>

          {/* 留言列表 */}
          <Reveal className="lg:col-span-7" delay={350}>
            <div className="flex items-baseline justify-between mb-8">
              <h3 className="font-display text-[20px] text-bone">{g.listTitle}</h3>
              <span className="font-ui text-[11px] text-bone/30 tracking-wider">{g.approvedNote}</span>
            </div>

            {listQuery.isLoading ? (
              <div className="space-y-6">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-3 w-24 bg-bone/10 mb-3" />
                    <div className="h-3 w-full bg-bone/5 mb-2" />
                    <div className="h-3 w-2/3 bg-bone/5" />
                  </div>
                ))}
              </div>
            ) : !listQuery.data || listQuery.data.length === 0 ? (
              <p className="font-ui text-[14px] text-bone/40 py-8">{g.empty}</p>
            ) : (
              <ul className="divide-y divide-bone/8">
                {listQuery.data.map((msg) => (
                  <li key={msg.id} className="py-6 first:pt-0">
                    <div className="flex items-baseline gap-4 mb-2.5">
                      <span className="font-display text-[15px] text-bone">{msg.name}</span>
                      <span className="font-ui text-[11px] text-bronze/50 tracking-wider">
                        {formatDate(msg.createdAt)}
                      </span>
                    </div>
                    <p className="font-ui text-[14px] text-bone/65 leading-[1.85] whitespace-pre-wrap">
                      {msg.content}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </Reveal>
        </div>
      </div>
    </section>
  );
}
