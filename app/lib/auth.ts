// app/lib/auth.ts
// Sistema de autenticación básico con cifrado de contraseñas

export type User = {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  createdAt: string;
};

const USERS_KEY = 'tueje_users';
const CURRENT_USER_KEY = 'tueje_current_user';

// ✅ NUEVO: Evento global para notificar cambios de sesión en el cliente
export const AUTH_EVENT = 'tueje:auth-changed';
function notifyAuthChanged() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(AUTH_EVENT));
  }
}

// Función simple de hash (cifrado básico)
function simpleHash(password: string): string {
  let hash = 0;
  const salt = 'tueje_salt_2025'; // Salt para más seguridad
  const textToHash = password + salt;
  
  for (let i = 0; i < textToHash.length; i++) {
    const char = textToHash.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  
  // Convertir a string hexadecimal
  return Math.abs(hash).toString(16);
}

// Cargar usuarios desde localStorage
function loadUsers(): User[] {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(USERS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

// Guardar usuarios en localStorage
function saveUsers(users: User[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

// Registrar nuevo usuario
export function register(email: string, password: string, name: string): { success: boolean; error?: string } {
  if (!email || !password || !name) {
    return { success: false, error: 'Todos los campos son obligatorios' };
  }
  if (password.length < 6) {
    return { success: false, error: 'La contraseña debe tener al menos 6 caracteres' };
  }

  const users = loadUsers();
  if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
    return { success: false, error: 'Este email ya está registrado' };
  }

  const newUser: User = {
    id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    email: email.toLowerCase(),
    passwordHash: simpleHash(password),
    name,
    createdAt: new Date().toISOString(),
  };

  users.push(newUser);
  saveUsers(users);
  return { success: true };
}

// Iniciar sesión
export function login(email: string, password: string): { success: boolean; error?: string; user?: User } {
  if (!email || !password) {
    return { success: false, error: 'Email y contraseña son obligatorios' };
  }

  const users = loadUsers();
  const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (!user) return { success: false, error: 'Email o contraseña incorrectos' };

  const passwordHash = simpleHash(password);
  if (user.passwordHash !== passwordHash) {
    return { success: false, error: 'Email o contraseña incorrectos' };
  }

  const currentUser = { id: user.id, email: user.email, name: user.name };
  if (typeof window !== 'undefined') {
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(currentUser));
    notifyAuthChanged(); // 👈 notificar
  }
  return { success: true, user };
}

// Cerrar sesión
export function logout(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(CURRENT_USER_KEY);
    notifyAuthChanged(); // 👈 notificar
  }
}

// Obtener usuario actual
export function getCurrentUser(): { id: string; email: string; name: string } | null {
  if (typeof window === 'undefined') return null;
  try {
    const data = localStorage.getItem(CURRENT_USER_KEY);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

export function isAuthenticated(): boolean {
  return getCurrentUser() !== null;
}

// ===== LÓGICA DE SINCRONIZACIÓN NEXTAUTH/SSO (Fija la persistencia) =====
export function syncNextAuthUser(sessionUser: { email: string; name?: string | null; image?: string | null }): { id: string; email: string; name: string } | null {
  if (typeof window === 'undefined' || !sessionUser.email || !sessionUser.name) return null;

  const users = loadUsers();
  const lowerEmail = sessionUser.email.toLowerCase();
  let user = users.find(u => u.email.toLowerCase() === lowerEmail);

  if (!user) {
    user = {
      id: `oauth_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      email: lowerEmail,
      passwordHash: 'oauth_user_no_password',
      name: sessionUser.name,
      createdAt: new Date().toISOString(),
    };
    users.push(user);
    saveUsers(users);
  } else {
    if (user.name !== sessionUser.name) {
      user.name = sessionUser.name;
      saveUsers(users);
    }
  }

  const currentUser = { id: user.id, email: user.email, name: user.name };
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(currentUser));
  notifyAuthChanged(); // 👈 notificar la actualización

  return currentUser;
}