
'use client';

import { useEffect, useMemo, useState } from 'react';
import { listHabits, listLogs, todayISO } from '../lib/storage';
import type { Habit } from '../lib/storage';

type DayCell = { date: string; label: string; done: boolean; value?: number };

function isoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

function lastNDays(n: number): { date: string; label: string }[] {
  const out: { date: string; label: string }[] = [];
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const label = d.toLocaleDateString(undefined, { weekday: 'short' }); // lun, mar...
    out.push({ date: isoDate(d), label });
  }
  return out;
}

function calcStreak(days: DayCell[]): number {
  // racha contando desde el final (hoy) hacia atrás
  let c = 0;
  for (let i = days.length - 1; i >= 0; i--) {
    if (days[i].done) c++;
    else break;
  }
  return c;
}

export default function DashboardPage() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setHabits(listHabits());
    setReady(true);
  }, []);

  const logs = useMemo(() => listLogs(), [ready]); // se lee cuando ready cambia

  const week = useMemo(() => lastNDays(7), []);

  const rows = useMemo(() => {
    return habits.map((h) => {
      // construir celdas por día
      const cells: DayCell[] = week.map((d) => {
        const log = logs.find((l) => l.habitId === h.id && l.date === d.date);
        const done = h.type === 'check' ? Boolean(log?.done) : (typeof log?.value === 'number' && log.value > 0);
        const value = typeof log?.value === 'number' ? log!.value : undefined;
        return { date: d.date, label: d.label, done, value };
      });

      // progreso semanal
      const hits = cells.filter((c) => c.done).length;
      const pct = Math.min(100, Math.round((hits / Math.max(1, h.goalPerWeek)) * 100));

      // suma semanal para "number"
      const sum = cells.reduce((acc, c) => acc + (c.value ?? 0), 0);

      // streak
      const streak = calcStreak(cells);

      return { habit: h, cells, hits, pct, sum, streak };
    });
  }, [habits, logs, week]);

  if (!ready) return null;

  return (
    <main className="py-4">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <p className="text-gray-600 mt-1">Resumen de los últimos 7 días.</p>

      {rows.length === 0 ? (
        <div className="mt-6 text-sm text-gray-500 bg-white border border-gray-200 rounded-xl p-4">
          Aún no tienes hábitos. Crea alguno en <a href="/habits" className="underline text-indigo-600">Hábitos</a>.
        </div>
      ) : (
        <div className="mt-6 grid gap-4">
          {rows.map((row) => (
            <section key={row.habit.id} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{row.habit.title}</h3>
                  <p className="text-xs text-gray-500">
                    Meta: {row.habit.goalPerWeek}/sem · Tipo:{' '}
                    {row.habit.type === 'check' ? 'Hábito' : 'Cantidad'}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-800">{row.hits}/{row.habit.goalPerWeek}</div>
                  <div className="w-40 h-2 bg-gray-200 rounded overflow-hidden mt-1">
                    <div
                      className="h-full bg-indigo-600"
                      style={{ width: `${row.pct}%` }}
                      aria-label={`Progreso ${row.pct}%`}
                    />
                  </div>
                  <div className="text-xs text-gray-500 mt-1">Streak: {row.streak} 🔥</div>
                  {row.habit.type === 'number' && (
                    <div className="text-xs text-gray-500">Suma semana: {row.sum}</div>
                  )}
                </div>
              </div>

              {/* Tira de 7 días */}
              <div className="mt-4 flex gap-2">
                {row.cells.map((c) => (
                  <div
                    key={c.date}
                    className={`flex flex-col items-center w-12`}
                    title={c.date}
                  >
                    <span className="text-xs text-gray-500">{c.label}</span>
                    <div
                      className={`mt-1 h-8 w-8 rounded-full border flex items-center justify-center text-xs
                      ${c.done ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-gray-50 text-gray-400 border-gray-300'}
                      `}
                    >
                      {c.done ? (typeof c.value === 'number' ? c.value : '✔') : '—'}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </main>
  );
}
