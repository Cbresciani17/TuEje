'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import es from '../../locales/es.json';
import en from '../../locales/en.json';

type Lang = 'es' | 'en';
type Dict = typeof es;

type I18nCtx = {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string) => string;
};

const I18nContext = createContext<I18nCtx>({
  lang: 'es',
  setLang: () => {},
  t: (k: string) => k
});

const DICTS: Record<Lang, Dict> = { es, en };

function getFromDict(dict: Dict, key: string): string {
  // Permite keys tipo "nav.home"
  return key.split('.').reduce((acc: any, cur) => (acc && acc[cur] !== undefined ? acc[cur] : undefined), dict) ?? key;
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Lang>('es');

  // leer preferencia guardada
  useEffect(() => {
    const saved = (typeof window !== 'undefined' && window.localStorage.getItem('tueje_lang')) as Lang | null;
    if (saved === 'es' || saved === 'en') setLang(saved);
  }, []);

  // guardar cuando cambie
  useEffect(() => {
    if (typeof window !== 'undefined') window.localStorage.setItem('tueje_lang', lang);
  }, [lang]);

  const t = useMemo(() => {
    const dict = DICTS[lang];
    return (key: string) => getFromDict(dict, key);
  }, [lang]);

  const value: I18nCtx = { lang, setLang, t };
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  return useContext(I18nContext);
}
