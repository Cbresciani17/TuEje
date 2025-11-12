// app/components/Header.tsx
'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { getCurrentUser, logout } from '../lib/auth';

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
      className={`px-3 py-2 rounded-md text-sm font-medium transition ${
        active ? 'bg-violet-600 text-white' : 'text-gray-700 hover:bg-gray-200'
      }`}
    >
      {children}
    </Link>
  );
}

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);

  useEffect(() => {
    // Cargar usuario actual
    const currentUser = getCurrentUser();
    setUser(currentUser);

    // Si no hay usuario y no está en login, redirigir
    if (!currentUser && pathname !== '/login') {
      router.push('/login');
    }
  }, [pathname, router]);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  // No mostrar header en página de login
  if (pathname === '/login') {
    return null;
  }

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

        {/* Menú de usuario */}
        <div className="relative">
          {user && (
            <>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-gray-100 transition"
              >
                <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white font-medium text-sm">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <span className="hidden sm:block text-sm font-medium text-gray-700">
                  {user.name}
                </span>
              </button>

              {showUserMenu && (
                <>
                  {/* Overlay para cerrar menú */}
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowUserMenu(false)}
                  />

                  {/* Menú desplegable */}
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900">{user.name}</p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition"
                    >
                      🚪 Cerrar sesión
                    </button>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </header>
  );
}