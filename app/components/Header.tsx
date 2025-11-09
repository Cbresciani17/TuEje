
// app/components/Header.tsx
'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

function NavLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const active =
    href === '/'
      ? pathname === '/'
      : pathname.startsWith(href) && href !== '/';

  return (
    <Link
      href={href}
      className={`px-3 py-2 rounded-md text-sm font-medium ${
        active ? 'bg-violet-600 text-white' : 'text-gray-700 hover:bg-gray-200'
      }`}
    >
      {children}
    </Link>
  );
}

export default function Header() {
  const [lang, setLang] = useState<'es' | 'en'>('es');

  useEffect(() => {
    const saved = (typeof window !== 'undefined' &&
      (localStorage.getItem('tueje_lang') as 'es' | 'en' | null)) || 'es';
    setLang(saved);
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('tueje_lang', lang);
    }
  }, [lang]);

  return (
    <header className="border-b bg-white/80 backdrop-blur sticky top-0 z-40">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="font-semibold text-lg">
          Tu<span className="text-violet-600">Eje</span>
        </Link>

        <nav className="flex items-center gap-2">
          <NavLink href="/">Inicio</NavLink>
          <NavLink href="/habits">Hábitos</NavLink>
          <NavLink href="/finance">Finanzas</NavLink>
          <NavLink href="/dashboard">Dashboard</NavLink>
        </nav>

        <div className="flex items-center gap-2">
          <label htmlFor="lang" className="text-sm text-gray-600">
            Idioma:
          </label>
          <select
            id="lang"
            value={lang}
            onChange={(e) => setLang(e.target.value as 'es' | 'en')}
            className="border rounded-md px-2 py-1 text-sm"
          >
            <option value="es">ES</option>
            <option value="en">EN</option>
          </select>
        </div>
      </div>
    </header>
  );
}
