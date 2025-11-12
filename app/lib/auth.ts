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

// Función simple de hash (cifrado básico)
// Nota: En producción se usaría bcrypt o similar
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
  
  // Verificar si el email ya existe
  if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
    return { success: false, error: 'Este email ya está registrado' };
  }

  // Crear nuevo usuario
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

  if (!user) {
    return { success: false, error: 'Email o contraseña incorrectos' };
  }

  const passwordHash = simpleHash(password);
  if (user.passwordHash !== passwordHash) {
    return { success: false, error: 'Email o contraseña incorrectos' };
  }

  // Guardar usuario actual (sin la contraseña)
  const currentUser = { id: user.id, email: user.email, name: user.name };
  if (typeof window !== 'undefined') {
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(currentUser));
  }

  return { success: true, user };
}

// Cerrar sesión
export function logout(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(CURRENT_USER_KEY);
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

// Verificar si hay sesión activa
export function isAuthenticated(): boolean {
  return getCurrentUser() !== null;
}