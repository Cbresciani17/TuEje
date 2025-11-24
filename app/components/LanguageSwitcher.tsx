'use client';

import { useI18n } from '../lib/i18n';

export default function LanguageSwitcher() {
  const { lang, setLang } = useI18n();

  return (
    <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
      <button
        onClick={() => setLang('es')}
        className={`px-3 py-1 rounded-md text-sm font-medium transition ${
          lang === 'es'
            ? 'bg-white text-indigo-600 shadow-sm'
            : 'text-gray-600 hover:text-gray-900'
        }`}
      >
        🇪🇸 ES
      </button>
      <button
        onClick={() => setLang('en')}
        className={`px-3 py-1 rounded-md text-sm font-medium transition ${
          lang === 'en'
            ? 'bg-white text-indigo-600 shadow-sm'
            : 'text-gray-600 hover:text-gray-900'
        }`}
      >
        🇺🇸 EN
      </button>
    </div>
  );
}