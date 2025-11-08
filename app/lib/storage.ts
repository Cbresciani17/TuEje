// app/lib/storage.ts
export type Habit = {
  id: string;
  title: string;
  goalPerWeek: number; // p.ej. 3 veces/semana
  type: 'check' | 'number'; // check = hecho/no hecho; number = cantidad (horas, min)
  createdAt: string; // ISO
};

export type HabitLog = {
  id: string;
  habitId: string;
  date: string; // yyyy-mm-dd
  value?: number; // para type "number"
  done?: boolean; // para type "check"
};

const HABITS_KEY = 'tueje_habits';
const LOGS_KEY = 'tueje_habit_logs';

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
  // borrar logs asociados
  const logs = listLogs().filter(l => l.habitId !== id);
  saveJSON(LOGS_KEY, logs);
}

export function listLogs(): HabitLog[] {
  return loadJSON<HabitLog[]>(LOGS_KEY, []);
}

export function saveLog(log: HabitLog) {
  const current = listLogs();
  // si ya existe un log para el mismo día y hábito, lo reemplazamos
  const without = current.filter(l => !(l.habitId === log.habitId && l.date === log.date));
  const updated = [log, ...without];
  saveJSON(LOGS_KEY, updated);
}

export function todayISO(): string {
  const d = new Date();
  return d.toISOString().slice(0, 10); // yyyy-mm-dd
}

export function uid(): string {
  return Math.random().toString(36).slice(2, 10);
}
