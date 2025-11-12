// app/components/Header.tsx
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
// 💡 Importamos la función de sincronización y el evento
import { getCurrentUser, logout, syncNextAuthUser, AUTH_EVENT } from "../lib/auth";

// --- Función auxiliar para los enlaces de navegación ---
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

// --- Componente del menú del usuario ---
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
  const name = user.name ?? "Usuario";
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
                setOpen(false); // Cierra el menú después del logout
              }}
              className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition"
            >
              🚪 Cerrar sesión
            </button>
          </div>
        </>
      )}
    </>
  );
}

// --- HEADER PRINCIPAL ---
export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session, status } = useSession();

  // Estado que almacena el usuario local (sincronizado)
  const [syncedUser, setSyncedUser] = useState(getCurrentUser());

  const isLoading = status === "loading";
  const isSSO = !!session?.user;
  const user = session?.user || syncedUser;

  // Lógica central: Sincronización y Redirección
  useEffect(() => {
    if (isLoading) return;

    let currentUser = getCurrentUser();

    // 1. SINCRONIZACIÓN SSO -> LOCAL STORAGE
    if (isSSO && session.user.email && session.user.name) {
        // ✅ Escribe el ID de Google en localStorage
        const newSyncedUser = syncNextAuthUser(session.user);
        if (newSyncedUser && newSyncedUser.id !== currentUser?.id) {
            setSyncedUser(newSyncedUser);
            currentUser = newSyncedUser;
        }
    } 
    
    // 2. Escucha el evento AUTH_EVENT para actualizar el estado sin bucles
    const handleAuthChange = () => {
        setSyncedUser(getCurrentUser());
    };

    window.addEventListener(AUTH_EVENT, handleAuthChange);


    // 3. REDIRECCIÓN
    if (!user && pathname !== "/login") {
      router.push("/login");
    }
    
    return () => {
        window.removeEventListener(AUTH_EVENT, handleAuthChange);
    };
    
    // El eslint-disable se mantiene, pero la lógica de evento lo mejora
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
          <div className="text-sm text-gray-500">Cargando...</div>
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
          <NavLink href="/">Inicio</NavLink>
          <NavLink href="/habits">Hábitos</NavLink>
          <NavLink href="/finance">Finanzas</NavLink>
          <NavLink href="/dashboard">Dashboard</NavLink>
        </nav>

        <div className="relative">
          {user && (
            <UserMenu 
                user={{ ...user, image: session?.user?.image }} // Pasamos la URL de la imagen de Google
                isSSO={isSSO} 
                onLogout={handleLogout} 
            />
          )}
        </div>
      </div>
    </header>
  );
}