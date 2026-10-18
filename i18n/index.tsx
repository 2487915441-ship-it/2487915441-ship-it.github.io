import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { zh, type Messages } from './zh';
import { en } from './en';

export type Lang = 'zh' | 'en';

interface I18nContextValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: Messages;
}

const I18nContext = createContext<I18nContextValue>({ lang: 'zh', setLang: () => {}, t: zh });

const STORAGE_KEY = 'lingma-lang';

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved === 'en' ? 'en' : 'zh';
  });

  const setLang = (l: Lang) => {
    setLangState(l);
    localStorage.setItem(STORAGE_KEY, l);
  };

  useEffect(() => {
    document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';
  }, [lang]);

  return (
    <I18nContext.Provider value={{ lang, setLang, t: lang === 'zh' ? zh : en }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}
