// app/lib/storage.ts
export type Habit = {
  id: string;
  title: string;
  goalPerWeek: number;
  type: 'check' | 'number';
  createdAt: string;
};

export type HabitLog = {
  id: string;
  habitId: string;
  date: string;
  value?: number;
  done?: boolean;
};

// ===== NUEVOS TIPOS PARA FINANZAS =====
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
  date: string; // yyyy-mm-dd
  createdAt: string;
};

const HABITS_KEY = 'tueje_habits';
const LOGS_KEY = 'tueje_habit_logs';
const TRANSACTIONS_KEY = 'tueje_transactions';

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

// ===== FUNCIONES DE HÁBITOS (sin cambios) =====
export function listHabits(): Habit[] {
  return loadJSON<Habit[]>(HABITS_KEY, []);
}

export function saveHabit(habit: Habit) {
  const current = listHabits();
  const updated = [habit, ...current];
  saveJSON(HABITS_KEY, updated);
}

export function deleteHabit(id: string) {
  const updated = listHabits().filter(h => h.id !== id);
  saveJSON(HABITS_KEY, updated);
  const logs = listLogs().filter(l => l.habitId !== id);
  saveJSON(LOGS_KEY, logs);
}

export function listLogs(): HabitLog[] {
  return loadJSON<HabitLog[]>(LOGS_KEY, []);
}

export function saveLog(log: HabitLog) {
  const current = listLogs();
  const without = current.filter(l => !(l.habitId === log.habitId && l.date === log.date));
  const updated = [log, ...without];
  saveJSON(LOGS_KEY, updated);
}

// ===== NUEVAS FUNCIONES PARA FINANZAS =====
export function listTransactions(): Transaction[] {
  return loadJSON<Transaction[]>(TRANSACTIONS_KEY, []);
}

export function saveTransaction(transaction: Transaction) {
  const current = listTransactions();
  const updated = [transaction, ...current];
  saveJSON(TRANSACTIONS_KEY, updated);
}

export function updateTransaction(transaction: Transaction) {
  const current = listTransactions();
  const updated = current.map(t => t.id === transaction.id ? transaction : t);
  saveJSON(TRANSACTIONS_KEY, updated);
}

export function deleteTransaction(id: string) {
  const updated = listTransactions().filter(t => t.id !== id);
  saveJSON(TRANSACTIONS_KEY, updated);
}

// ===== UTILIDADES =====
export function todayISO(): string {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

export function uid(): string {
  return Math.random().toString(36).slice(2, 10);
}

// ===== CATEGORÍAS CON LABELS =====
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




// // app/lib/storage.ts
// export type Habit = {
//   id: string;
//   title: string;
//   goalPerWeek: number; // p.ej. 3 veces/semana
//   type: 'check' | 'number'; // check = hecho/no hecho; number = cantidad (horas, min)
//   createdAt: string; // ISO
// };

// export type HabitLog = {
//   id: string;
//   habitId: string;
//   date: string; // yyyy-mm-dd
//   value?: number; // para type "number"
//   done?: boolean; // para type "check"
// };

// const HABITS_KEY = 'tueje_habits';
// const LOGS_KEY = 'tueje_habit_logs';

// function loadJSON<T>(key: string, fallback: T): T {
//   if (typeof window === 'undefined') return fallback;
//   try {
//     const raw = localStorage.getItem(key);
//     return raw ? (JSON.parse(raw) as T) : fallback;
//   } catch {
//     return fallback;
//   }
// }

// function saveJSON<T>(key: string, data: T) {
//   if (typeof window === 'undefined') return;
//   localStorage.setItem(key, JSON.stringify(data));
// }

// export function listHabits(): Habit[] {
//   return loadJSON<Habit[]>(HABITS_KEY, []);
// }

// export function saveHabit(habit: Habit) {
//   const current = listHabits();
//   const updated = [habit, ...current];
//   saveJSON(HABITS_KEY, updated);
// }

// export function deleteHabit(id: string) {
//   const updated = listHabits().filter(h => h.id !== id);
//   saveJSON(HABITS_KEY, updated);
//   // borrar logs asociados
//   const logs = listLogs().filter(l => l.habitId !== id);
//   saveJSON(LOGS_KEY, logs);
// }

// export function listLogs(): HabitLog[] {
//   return loadJSON<HabitLog[]>(LOGS_KEY, []);
// }

// export function saveLog(log: HabitLog) {
//   const current = listLogs();
//   // si ya existe un log para el mismo día y hábito, lo reemplazamos
//   const without = current.filter(l => !(l.habitId === log.habitId && l.date === log.date));
//   const updated = [log, ...without];
//   saveJSON(LOGS_KEY, updated);
// }

// export function todayISO(): string {
//   const d = new Date();
//   return d.toISOString().slice(0, 10); // yyyy-mm-dd
// }

// export function uid(): string {
//   return Math.random().toString(36).slice(2, 10);
// }
