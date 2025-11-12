// app/lib/storage.ts
// Sistema de almacenamiento con datos separados por usuario

import { getCurrentUser, AUTH_EVENT } from './auth'; 

export type Habit = {
  id: string;
  title: string;
  goalPerWeek: number;
  type: 'check' | 'number';
  createdAt: string;
  userId: string; // ← Asociar al usuario
};

export type HabitLog = {
  id: string;
  habitId: string;
  date: string;
  value?: number;
  done?: boolean;
  userId: string; // ← Asociar al usuario
};

export type TransactionType = 'income' | 'expense';

export type TransactionCategory = 
  | 'salary' | 'freelance' | 'investment' | 'other-income'
  | 'food' | 'transport' | 'housing' | 'entertainment' 
  | 'health' | 'education' | 'shopping' | 'other-expense';

export type Transaction = {
  id: string;
  type: TransactionType;
  category: TransactionCategory;
  amount: number;
  description: string;
  date: string;
  createdAt: string;
  userId: string; // ← Asociar al usuario
};

// Claves de localStorage
const HABITS_KEY = 'tueje_habits';
const LOGS_KEY = 'tueje_habit_logs';
const TRANSACTIONS_KEY = 'tueje_transactions';

// 💡 Nueva utilidad para notificar a toda la aplicación
function notifyDataChanged() {
  if (typeof window !== 'undefined') {
    // Usamos el evento AUTH_EVENT para señalizar cambios de datos
    window.dispatchEvent(new Event(AUTH_EVENT)); 
  }
}

// Obtener ID del usuario actual
function getCurrentUserId(): string | null {
  const user = getCurrentUser();
  return user?.id || null;
}

// Funciones auxiliares (loadJSON, saveJSON, uid, todayISO, etc.)
function loadJSON<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function saveJSON<T>(key: string, data: T) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(data));
}

export function todayISO(): string {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

export function uid(): string {
  return Math.random().toString(36).slice(2, 10);
}


// ===== FUNCIONES DE HÁBITOS =====

export function listHabits(): Habit[] {
  const userId = getCurrentUserId();
  if (!userId) return [];
  
  const allHabits = loadJSON<Habit[]>(HABITS_KEY, []);
  return allHabits.filter(h => h.userId === userId);
}

export function saveHabit(habit: Habit) {
  const userId = getCurrentUserId();
  if (!userId) return;

  habit.userId = userId;

  const allHabits = loadJSON<Habit[]>(HABITS_KEY, []);
  const otherHabits = allHabits.filter(h => h.id !== habit.id);
  saveJSON(HABITS_KEY, [habit, ...otherHabits]);
  
  notifyDataChanged(); 
}

export function deleteHabit(id: string) {
  const userId = getCurrentUserId();
  if (!userId) return;

  const allHabits = loadJSON<Habit[]>(HABITS_KEY, []);
  const updated = allHabits.filter(h => !(h.id === id && h.userId === userId));
  saveJSON(HABITS_KEY, updated);

  const allLogs = loadJSON<HabitLog[]>(LOGS_KEY, []);
  const updatedLogs = allLogs.filter(l => !(l.habitId === id && l.userId === userId));
  saveJSON(LOGS_KEY, updatedLogs);
  
  notifyDataChanged(); 
}

// ===== FUNCIONES DE LOGS =====

export function listLogs(): HabitLog[] {
  const userId = getCurrentUserId();
  if (!userId) return [];

  const allLogs = loadJSON<HabitLog[]>(LOGS_KEY, []);
  return allLogs.filter(l => l.userId === userId);
}

export function saveLog(log: HabitLog) {
  const userId = getCurrentUserId();
  if (!userId) return;

  log.userId = userId;

  const allLogs = loadJSON<HabitLog[]>(LOGS_KEY, []);
  const withoutCurrent = allLogs.filter(
    l => !(l.habitId === log.habitId && l.date === log.date && l.userId === userId)
  );
  saveJSON(LOGS_KEY, [log, ...withoutCurrent]);
  
  notifyDataChanged();
}

// ===== FUNCIONES DE FINANZAS =====

export function listTransactions(): Transaction[] {
  const userId = getCurrentUserId();
  if (!userId) return [];

  // ✅ FIX: Se define la variable local allTransactions
  const allTransactions = loadJSON<Transaction[]>(TRANSACTIONS_KEY, []); 
  return allTransactions.filter(t => t.userId === userId);
}

export function saveTransaction(transaction: Transaction) {
  const userId = getCurrentUserId();
  if (!userId) return;

  transaction.userId = userId;

  const allTransactions = loadJSON<Transaction[]>(TRANSACTIONS_KEY, []); 
  saveJSON(TRANSACTIONS_KEY, [transaction, ...allTransactions]);
  notifyDataChanged();
}

export function updateTransaction(transaction: Transaction) {
  const userId = getCurrentUserId();
  if (!userId) return;

  transaction.userId = userId;

  const allTransactions = loadJSON<Transaction[]>(TRANSACTIONS_KEY, []); 
  const updated = allTransactions.map(t => 
    (t.id === transaction.id && t.userId === userId) ? transaction : t
  );
  saveJSON(TRANSACTIONS_KEY, updated);
  notifyDataChanged();
}

export function deleteTransaction(id: string) {
  const userId = getCurrentUserId();
  if (!userId) return;

  const allTransactions = loadJSON<Transaction[]>(TRANSACTIONS_KEY, []); 
  const updated = allTransactions.filter(t => !(t.id === id && t.userId === userId));
  saveJSON(TRANSACTIONS_KEY, updated);
  notifyDataChanged();
}


// ===== UTILIDADES Y CATEGORÍAS (Se mantienen igual) =====

export const INCOME_CATEGORIES = [
  { value: 'salary', label: 'Salario' },
  { value: 'freelance', label: 'Freelance' },
  { value: 'investment', label: 'Inversiones' },
  { value: 'other-income', label: 'Otros ingresos' },
] as const;

export const EXPENSE_CATEGORIES = [
  { value: 'food', label: 'Comida' },
  { value: 'transport', label: 'Transporte' },
  { value: 'housing', label: 'Vivienda' },
  { value: 'entertainment', label: 'Entretenimiento' },
  { value: 'health', label: 'Salud' },
  { value: 'education', label: 'Educación' },
  { value: 'shopping', label: 'Compras' },
  { value: 'other-expense', label: 'Otros gastos' },
] as const;

export function getCategoryLabel(category: TransactionCategory): string {
  const allCategories = [...INCOME_CATEGORIES, ...EXPENSE_CATEGORIES];
  return allCategories.find(c => c.value === category)?.label || category;
}