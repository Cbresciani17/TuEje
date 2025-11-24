"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { getCurrentUser, logout, syncNextAuthUser, AUTH_EVENT } from "../lib/auth";
import { useI18n } from "../lib/i18n";
import LanguageSwitcher from "./LanguageSwitcher";

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const active =
    href === "/" ? pathname === "/" : pathname.startsWith(href) && href !== "/";
  return (
    <Link
      href={href}
      className={`px-3 py-2 rounded-md text-sm font-medium transition ${
        active ? "bg-violet-600 text-white" : "text-gray-700 hover:bg-gray-200"
      }`}
    >
      {children}
    </Link>
  );
}

function UserMenu({
  user,
  isSSO,
  onLogout,
}: {
  user: { name?: string | null; email?: string | null; image?: string | null };
  isSSO: boolean;
  onLogout: () => void;
}) {
  const [open, setOpen] = useState(false);
  const { t } = useI18n();
  const name = user.name ?? t('common.user');
  const email = user.email ?? "";

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-gray-100 transition"
      >
        {user.image ? (
          <img src={user.image} alt={name} className="w-8 h-8 rounded-full" />
        ) : (
          <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white font-medium text-sm">
            {name.charAt(0).toUpperCase()}
          </div>
        )}
        <span className="hidden sm:block text-sm font-medium text-gray-700">
          {name}
        </span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
            <div className="px-4 py-2 border-b border-gray-100">
              <p className="text-sm font-medium text-gray-900">{name}</p>
              <p className="text-xs text-gray-500">{email}</p>
              <p className="text-xs text-gray-400 mt-1">
                {isSSO ? "Google" : "Local"}
              </p>
            </div>
            <button
              onClick={() => {
                onLogout();
                setOpen(false);
              }}
              className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition"
            >
              🚪 {t('common.logout')}
            </button>
          </div>
        </>
      )}
    </>
  );
}

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const { t } = useI18n();

  const [syncedUser, setSyncedUser] = useState(getCurrentUser());

  const isLoading = status === "loading";
  const isSSO = !!session?.user;
  const user = session?.user || syncedUser;

  useEffect(() => {
    if (isLoading) return;

    let currentUser = getCurrentUser();

    if (isSSO && session.user.email && session.user.name) {
      const newSyncedUser = syncNextAuthUser(session.user);
      if (newSyncedUser && newSyncedUser.id !== currentUser?.id) {
        setSyncedUser(newSyncedUser);
        currentUser = newSyncedUser;
      }
    }

    const handleAuthChange = () => {
      setSyncedUser(getCurrentUser());
    };

    window.addEventListener(AUTH_EVENT, handleAuthChange);
    window.addEventListener('storage', handleAuthChange);
    window.addEventListener('focus', handleAuthChange);

    if (!user && pathname !== "/login") {
      router.push("/login");
    }

    return () => {
      window.removeEventListener(AUTH_EVENT, handleAuthChange);
      window.removeEventListener('storage', handleAuthChange);
      window.removeEventListener('focus', handleAuthChange);
    };
  }, [isLoading, session, pathname, router, isSSO, user]);

  const handleLogout = async () => {
    if (isSSO) {
      await signOut({ callbackUrl: "/login", redirect: false });
    }

    logout();
    setSyncedUser(null);
    router.push("/login");
  };

  if (pathname === "/login") return null;

  if (isLoading)
    return (
      <header className="border-b bg-white/80 backdrop-blur sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="font-semibold text-lg">
            Tu<span className="text-violet-600">Eje</span>
          </Link>
          <div className="text-sm text-gray-500">{t('common.loading')}</div>
        </div>
      </header>
    );

  return (
    <header className="border-b bg-white/80 backdrop-blur sticky top-0 z-40">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="font-semibold text-lg">
          Tu<span className="text-violet-600">Eje</span>
        </Link>

        <nav className="flex items-center gap-2">
          <NavLink href="/">{t('nav.home')}</NavLink>
          <NavLink href="/habits">{t('nav.habits')}</NavLink>
          <NavLink href="/finance">{t('nav.finance')}</NavLink>
          <NavLink href="/dashboard">{t('nav.dashboard')}</NavLink>
        </nav>

        <div className="flex items-center gap-3">
          <LanguageSwitcher />
          <div className="relative">
            {user && (
              <UserMenu
                user={{ ...user, image: session?.user?.image }}
                isSSO={isSSO}
                onLogout={handleLogout}
              />
            )}
          </div>
        </div>
      </div>
    </header>
  );
}